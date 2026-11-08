'use strict';

// Run directly with Node; no build, dependencies, browser or real localStorage.
const assert = require('node:assert/strict');
const test = require('node:test');
const vm = require('node:vm');
const path = require('node:path');
const page = require(path.resolve(__dirname, '../src/pages/51-2048.js'));
const copy = value => JSON.parse(JSON.stringify(value));
const empty = () => Array.from({ length: 4 }, () => [0, 0, 0, 0]);
const rowBoard = row => [row, ...empty().slice(1)];
const save = (board = rowBoard([2, 2, 0, 0]), extra = {}) => ({
    v: 1, board, score: 0, won: board.flat().some(v => v >= 2048), kept: false, over: false, ...extra
});

class Element {
    constructor(tagName = 'DIV') {
        this.tagName = tagName;
        this.className = '';
        this.attributes = {};
        this.children = [];
        this.listeners = {};
        this.hidden = false;
        this.textContent = '';
        this.style = { setProperty(name, value) { this[name] = value; } };
        this.captured = new Set();
        this.released = [];
        this.classList = {
            contains: name => this.className.split(/\s+/).includes(name),
            add: name => { if (!this.classList.contains(name)) this.className += ' ' + name; },
            remove: name => { this.className = this.className.split(/\s+/).filter(c => c !== name).join(' '); },
            toggle: (name, force) => {
                const on = force === undefined ? !this.classList.contains(name) : force;
                this.classList[on ? 'add' : 'remove'](name);
                return on;
            }
        };
    }
    appendChild(el) { el.parentElement = this; this.children.push(el); return el; }
    setAttribute(key, value) { this.attributes[key] = String(value); }
    getAttribute(key) { return this.attributes[key] ?? null; }
    hasAttribute(key) { return Object.hasOwn(this.attributes, key); }
    removeAttribute(key) { delete this.attributes[key]; }
    get isContentEditable() {
        const value = this.getAttribute('contenteditable');
        return value === null ? !!this.parentElement?.isContentEditable : value !== 'false';
    }
    matches(selector) {
        return selector.split(',').some(part => {
            let s = part.trim();
            const not = [...s.matchAll(/:not\(([^)]+)\)/g)];
            if (not.some(m => this.matches(m[1]))) return false;
            s = s.replace(/:not\([^)]+\)/g, '');
            const tag = s.match(/^[a-z]+/i);
            if (tag && this.tagName !== tag[0].toUpperCase()) return false;
            const id = s.match(/#([\w-]+)/);
            if (id && this.id !== id[1]) return false;
            if ([...s.matchAll(/\.([\w-]+)/g)].some(m => !this.classList.contains(m[1]))) return false;
            return [...s.matchAll(/\[([\w-]+)(?:="([^"]*)")?\]/g)].every(m => {
                if (m[1] === 'hidden') return this.hidden;
                if (m[1] === 'inert' && this.inert) return true;
                return m[2] === undefined ? this.hasAttribute(m[1]) : this.getAttribute(m[1]) === m[2];
            });
        });
    }
    closest(selector) {
        for (let el = this; el; el = el.parentElement) if (el.matches(selector)) return el;
        return null;
    }
    querySelector(selector) {
        for (const child of this.children) {
            if (child.matches(selector)) return child;
            const found = child.querySelector(selector);
            if (found) return found;
        }
        return null;
    }
    addEventListener(name, fn) { (this.listeners[name] ||= []).push(fn); }
    fire(name, fields = {}) {
        const event = {
            target: this, key: '', pointerId: 1, isPrimary: true, button: 0,
            clientX: 100, clientY: 100, defaultPrevented: false,
            preventDefault() { this.defaultPrevented = true; }, ...fields
        };
        for (const fn of this.listeners[name] || []) fn(event);
        return event;
    }
    setPointerCapture(id) { this.captured.add(id); }
    hasPointerCapture(id) { return this.captured.has(id); }
    releasePointerCapture(id) {
        this.captured.delete(id);
        this.released.push(id);
        this.fire('lostpointercapture', { pointerId: id });
    }
}

function boot({ saved, best, storage, unavailable = false } = {}) {
    storage ||= new Map();
    if (saved !== undefined) storage.set('g2048save', typeof saved === 'string' ? saved : JSON.stringify(saved));
    if (best !== undefined) storage.set('best2048', String(best));
    const writes = [];
    const document = new Element('DOCUMENT');
    document.documentElement = document.appendChild(new Element('HTML'));
    document.body = document.documentElement.appendChild(new Element('BODY'));
    document.body.classList.add('lang-ready');
    const ids = {};
    for (const id of ['main', 'langToggle', 'navToggle', ...[...page.body.matchAll(/id="([^"]+)"/g)].map(m => m[1])]) {
        const el = new Element(id === 'main' ? 'MAIN' : /^g(New|Retry|Keep|Sound)$/.test(id) ? 'BUTTON' : 'DIV');
        el.id = id;
        ids[id] = el;
        (id === 'main' || /Toggle$/.test(id) ? document.body : ids.main).appendChild(el);
    }
    ids.gRestored.hidden = true;
    ids.gMsg.className = 'g-msg';
    for (const name of ['i-on', 'i-off']) {
        const el = new Element('SVG'); el.className = name; ids.gSound.appendChild(el);
    }
    document.getElementById = id => ids[id] || null;
    document.createElement = tag => new Element(tag.toUpperCase());
    const window = new Element('WINDOW');
    const ctx = { t: key => page.i18n.en[key] || key };
    window.SITE_RUNTIME = ctx;
    window.matchMedia = () => ({ matches: true });
    const sandbox = vm.createContext({
        window, document, ctx, setTimeout: () => 0,
        Math: Object.assign(Object.create(Math), { random: () => 0 }),
        localStorage: {
            getItem(key) { if (unavailable) throw Error('Storage denied'); return storage.get(key) ?? null; },
            setItem(key, value) {
                if (unavailable) throw Error('Storage denied');
                writes.push([key, String(value)]); storage.set(key, String(value));
            }
        }
    });
    const render = () => vm.runInContext('(' + page.render.toString() + ')(ctx)', sandbox);
    render();
    return {
        window, document, ids, storage, writes, render,
        state: window.G2048, api: window.G2048_API,
        snapshot: () => copy({ board: window.G2048.board, score: window.G2048.score, won: window.G2048.won, kept: window.G2048.kept, over: window.G2048.over }),
        key: (key, fields = {}) => document.fire('keydown', { key, target: document.body, ...fields })
    };
}

function spawned(board) {
    const out = copy(board);
    for (const row of out) {
        const i = row.indexOf(0);
        if (i !== -1) { row[i] = 2; break; }
    }
    return out;
}

test('page metadata and four translated return links', () => {
    assert.equal(page.file, '2048.html');
    assert.equal(page.path, '/2048.html');
    assert.equal(page.active, 'games');
    assert.equal(page.jsonld.url, 'https://yunmo-xuan.github.io/2048.html');
    assert.match(page.body, /href="games\.html"[^>]*data-i18n="g_back"/);
    for (const lang of ['zh-CN', 'zh-TW', 'en', 'ja']) assert.ok(page.i18n[lang].g_back);
});

test('layout declares four fixed equal rows as well as columns and board-sized typography', () => {
    assert.match(page.styles, /grid-template-rows:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)/);
    assert.match(page.styles, /container-type:\s*inline-size/);
    assert.match(page.styles, /cqi/);
    assert.doesNotMatch(page.styles, /max\(160px/);
});

for (const [line, expected, gained] of [
    [[2, 2, 2, 2], [4, 4, 0, 0], 8],
    [[2, 2, 4, 0], [4, 4, 0, 0], 4],
    [[4, 4, 8, 8], [8, 16, 0, 0], 24],
    [[2, 0, 2, 2], [4, 2, 0, 0], 4]
]) {
    test('each tile merges at most once: ' + line.join(','), () => {
        const h = boot({ saved: save(rowBoard(line)) });
        assert.equal(h.api.move('left'), true);
        assert.deepEqual(copy(h.api.getBoard()), spawned(rowBoard(expected)));
        assert.equal(h.api.score(), gained);
    });
}

for (const dir of ['left', 'right', 'up', 'down']) {
    test('full board mapping and synchronous persistence: ' + dir, () => {
        const initial = [[0, 2, 2, 0], [4, 0, 0, 4], [0, 8, 8, 0], [16, 0, 0, 16]];
        const expected = {
            left: [[4, 0, 0, 0], [8, 0, 0, 0], [16, 0, 0, 0], [32, 0, 0, 0]],
            right: [[0, 0, 0, 4], [0, 0, 0, 8], [0, 0, 0, 16], [0, 0, 0, 32]],
            up: [[4, 2, 2, 4], [16, 8, 8, 16], [0, 0, 0, 0], [0, 0, 0, 0]],
            down: [[0, 0, 0, 0], [0, 0, 0, 0], [4, 2, 2, 4], [16, 8, 8, 16]]
        }[dir];
        const h = boot({ saved: save(initial) });
        assert.equal(h.api.move(dir), true);
        assert.deepEqual(copy(h.api.getBoard()), spawned(expected));
        assert.equal(h.api.score(), ['left', 'right'].includes(dir) ? 60 : 0);
        assert.deepEqual(JSON.parse(h.storage.get('g2048save')), { v: 1, ...h.snapshot() });
        const reload = boot({ storage: h.storage });
        assert.deepEqual(reload.snapshot(), h.snapshot());
        assert.equal(reload.ids.gRestored.hidden, false);
    });
}

test('invalid move never drops a tile or writes a save', () => {
    const h = boot({ saved: save(rowBoard([2, 4, 0, 0])) });
    const before = h.snapshot(), writes = h.writes.length;
    assert.equal(h.api.move('left'), false);
    assert.deepEqual(h.snapshot(), before);
    assert.equal(h.writes.length, writes);
});

test('win pauses API, keyboard and swipe until Keep; pause and continuation survive reload', () => {
    const h = boot({ saved: save(rowBoard([1024, 1024, 0, 0])) });
    assert.equal(h.api.move('left'), true);
    assert.equal(h.state.won, true);
    assert.equal(h.ids.gKeep.hidden, false);
    const paused = h.snapshot(), writes = h.writes.length;
    assert.equal(h.api.move('right'), false);
    h.key('ArrowDown');
    h.ids.gBoard.fire('pointerdown');
    h.ids.gBoard.fire('pointerup', { clientX: 180 });
    assert.deepEqual(h.snapshot(), paused);
    assert.equal(h.writes.length, writes);
    const reload = boot({ storage: h.storage });
    assert.equal(reload.api.move('right'), false);
    assert.match(reload.ids.gMsg.className, /won/);
    reload.ids.gKeep.fire('click');
    assert.equal(reload.state.kept, true);
    assert.equal(JSON.parse(reload.storage.get('g2048save')).kept, true);
    const keptReload = boot({ storage: reload.storage });
    assert.equal(keptReload.ids.gMsg.classList.contains('show'), false);
    assert.equal(keptReload.api.move('right'), true);
});

const deadWin = [[2048, 2, 4, 8], [2, 4, 8, 16], [4, 8, 16, 32], [8, 16, 32, 64]];
test('win overlay takes precedence over no moves, including language repaint', () => {
    const h = boot({ saved: save(deadWin, { over: true }) });
    assert.equal(h.ids.gMsgText.textContent, 'You win!');
    h.window.SITE_RUNTIME.t = key => page.i18n.ja[key];
    h.render();
    assert.equal(h.ids.gMsgText.textContent, page.i18n.ja.g_win);
    h.ids.gKeep.fire('click');
    assert.equal(h.ids.gMsgText.textContent, page.i18n.ja.g_over);
    assert.equal(h.ids.gKeep.hidden, true);
    assert.equal(h.api.move('up'), false);
});

test('newly winning final move is paused before game-over overlay', () => {
    const board = [[1024, 1024, 4, 8], [4, 8, 16, 32], [8, 16, 32, 64], [16, 32, 64, 128]];
    const h = boot({ saved: save(board) });
    h.api.move('left');
    assert.equal(h.state.won, true);
    assert.equal(h.state.over, true);
    assert.equal(h.ids.gMsgText.textContent, 'You win!');
    h.ids.gKeep.fire('click');
    assert.equal(h.ids.gMsgText.textContent, 'Game over');
});

const corrupt = [
    ['invalid JSON', '{'], ['null', 'null'], ['wrong version', save(undefined, { v: 2 })],
    ['wrong row count', save([[2, 0, 0, 0]])], ['wrong column count', save([[2], ...empty().slice(1)])],
    ['empty board', save(empty())],
    ...[1, -2, 2.5, '2', null, 3, 4294967297, 2 ** 53, 2 ** 52 - 1].map(v => ['tile ' + v, save(rowBoard([v, 2, 0, 0]))]),
    ...[-1, 0.5, null, '4', Number.MAX_SAFE_INTEGER + 1].map(v => ['score ' + v, save(undefined, { score: v })]),
    ['infinite score', JSON.stringify(save()).replace('"score":0', '"score":1e400')],
    ...['won', 'kept', 'over'].flatMap(key => [undefined, null, 0, 'false'].map(v => [key + ' is ' + v, save(undefined, { [key]: v })])),
    ['kept without win', save(undefined, { kept: true })],
    ['false win', save(undefined, { won: true })],
    ['unmarked win', save(rowBoard([2048, 2, 0, 0]), { won: false })],
    ['false game-over', save(undefined, { over: true })],
    ['unmarked game-over', save(deadWin)]
];
for (const [name, saved] of corrupt) {
    test('reject corrupt save: ' + name, () => {
        const h = boot({ saved });
        assert.equal(h.ids.gRestored.hidden, true);
        assert.equal(h.state.score, 0);
        assert.deepEqual(copy(h.api.getBoard()), rowBoard([2, 2, 0, 0]));
    });
}

for (const v of [2, 2 ** 31, 2 ** 32, 2 ** 52]) {
    test('accept safe power of two without 32-bit truncation: ' + v, () => {
        const saved = save(rowBoard([v, 0, 0, 0]), { score: Number.MAX_SAFE_INTEGER });
        const h = boot({ saved });
        assert.equal(h.ids.gRestored.hidden, false);
        assert.deepEqual(copy(h.api.getBoard()), saved.board);
        assert.equal(h.state.best, Number.MAX_SAFE_INTEGER);
    });
}
for (const best of ['Infinity', 'NaN', '-1', '1.5', String(2 ** 53), 'garbage']) {
    test('reject invalid best: ' + best, () => {
        const h = boot({ best });
        assert.equal(h.state.best, 0);
    });
}

test('restart and best persist, hidden Keep cannot corrupt a new game, and prefs stay untouched', () => {
    const prefs = new Map([['preferredLanguage', 'ja'], ['preferredTheme', 'dark'], ['g2048sound', 'off']]);
    const h = boot({ storage: prefs, saved: save(rowBoard([2, 2, 0, 0])), best: 128 });
    h.ids.gKeep.fire('click');
    assert.equal(h.state.kept, false);
    h.api.move('left');
    for (const button of ['gNew', 'gRetry']) {
        h.ids[button].fire('click');
        assert.equal(h.state.score, 0);
        assert.equal(h.state.best, 128);
        assert.deepEqual(JSON.parse(h.storage.get('g2048save')), { v: 1, ...h.snapshot() });
        const reload = boot({ storage: h.storage });
        assert.deepEqual(reload.snapshot(), h.snapshot());
    }
    for (const key of ['preferredLanguage', 'preferredTheme', 'g2048sound']) assert.equal(h.writes.some(([k]) => k === key), false);
    assert.equal(h.storage.get('preferredLanguage'), 'ja');
    assert.equal(h.storage.get('preferredTheme'), 'dark');
    assert.equal(h.storage.get('g2048sound'), 'off');
});

test('closing or hiding an old tab cannot replace a newer save', () => {
    const old = boot();
    const current = boot({ storage: old.storage });
    current.api.move('right');
    const latest = current.storage.get('g2048save');
    old.window.fire('pagehide');
    old.document.visibilityState = 'hidden';
    old.document.fire('visibilitychange');
    assert.equal(old.storage.get('g2048save'), latest);
    assert.deepEqual(boot({ storage: old.storage }).snapshot(), current.snapshot());
});

test('storage-denied mode remains playable', () => {
    const h = boot({ unavailable: true });
    assert.equal(h.api.move('right'), true);
    h.ids.gNew.fire('click');
    assert.equal(h.state.score, 0);
});

test('keyboard ignores editable targets, modifiers, menus, startup and modal layers', () => {
    const h = boot();
    const before = h.snapshot();
    const assertIgnored = fields => {
        assert.equal(h.key('ArrowRight', fields).defaultPrevented, false);
        assert.deepEqual(h.snapshot(), before);
    };
    for (const tag of ['INPUT', 'TEXTAREA', 'SELECT']) assertIgnored({ target: new Element(tag) });
    const editor = new Element(); editor.setAttribute('contenteditable', 'true');
    assertIgnored({ target: editor.appendChild(new Element('SPAN')) });
    editor.setAttribute('contenteditable', 'plaintext-only');
    assertIgnored({ target: editor });
    for (const modifier of ['altKey', 'ctrlKey', 'metaKey', 'isComposing', 'defaultPrevented']) {
        if (modifier === 'defaultPrevented') {
            h.key('ArrowRight', { defaultPrevented: true }); assert.deepEqual(h.snapshot(), before);
        } else assertIgnored({ [modifier]: true });
    }
    h.document.body.classList.add('nav-open'); assertIgnored(); h.document.body.classList.remove('nav-open');
    h.ids.langToggle.setAttribute('aria-expanded', 'true'); assertIgnored(); h.ids.langToggle.setAttribute('aria-expanded', 'false');
    h.document.documentElement.classList.add('booting'); assertIgnored(); h.document.documentElement.classList.remove('booting');
    h.ids.main.inert = true; assertIgnored(); h.ids.main.inert = false;
    const dialog = h.document.body.appendChild(new Element('DIALOG')); dialog.setAttribute('open', '');
    assertIgnored(); dialog.removeAttribute('open');
    assert.equal(h.key('ArrowRight').defaultPrevented, true);
    assert.notDeepEqual(h.snapshot(), before);
});

for (const [key, dir] of Object.entries({ ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', a: 'left', D: 'right', w: 'up', S: 'down' })) {
    test('keyboard mapping: ' + key, () => {
        const initial = save([[0, 2, 0, 0], [4, 0, 0, 0], [0, 0, 8, 0], [0, 0, 0, 16]]);
        const h = boot({ saved: initial }), expected = boot({ saved: initial });
        expected.api.move(dir); h.key(key);
        assert.deepEqual(h.snapshot(), expected.snapshot());
    });
}

test('swipes ignore nonprimary and nonleft pointers and never replace the active pointer', () => {
    const h = boot(), board = h.ids.gBoard;
    const before = h.snapshot();
    for (const fields of [{ isPrimary: false }, { button: 1 }, { button: 2 }]) {
        board.fire('pointerdown', fields); board.fire('pointerup', { ...fields, clientX: 180 });
        assert.deepEqual(h.snapshot(), before);
        assert.equal(board.captured.size, 0);
    }
    board.fire('pointerdown');
    board.fire('pointerdown', { pointerId: 2, isPrimary: false, clientX: 180 });
    board.fire('pointerdown', { pointerId: 3, isPrimary: true, clientX: 180 });
    board.fire('pointerup', { pointerId: 2, isPrimary: false, clientX: 0 });
    board.fire('pointercancel', { pointerId: 2, isPrimary: false });
    assert.deepEqual(h.snapshot(), before);
    board.fire('pointerup', { clientX: 180 });
    assert.notDeepEqual(h.snapshot(), before);
    assert.equal(board.captured.size, 0);
    assert.deepEqual(board.released, [1]);
    const after = h.snapshot();
    board.fire('pointerup', { pointerId: 3, clientX: 0 });
    assert.deepEqual(h.snapshot(), after);
});

test('short gestures, cancel, capture loss and blur never move or leak capture', () => {
    const h = boot(), board = h.ids.gBoard;
    const before = h.snapshot();
    board.fire('pointerdown'); board.fire('pointerup', { clientX: 110 });
    assert.equal(board.captured.size, 0);
    board.fire('pointerdown'); board.fire('pointercancel'); board.fire('pointerup', { clientX: 180 });
    assert.equal(board.captured.size, 0);
    board.fire('pointerdown'); board.releasePointerCapture(1); board.fire('pointerup', { clientX: 180 });
    board.fire('pointerdown'); h.window.fire('blur'); board.fire('pointerup', { clientX: 180 });
    assert.equal(board.captured.size, 0);
    assert.deepEqual(h.snapshot(), before);
    board.fire('pointerdown'); board.fire('pointerup', { clientX: 180 });
    assert.notDeepEqual(h.snapshot(), before);
});

test('overlay buttons retain native pointer/click behavior', () => {
    const h = boot({ saved: save(rowBoard([2048, 2, 0, 0])) });
    const target = h.ids.gMsg.appendChild(new Element('BUTTON'));
    h.ids.gBoard.fire('pointerdown', { target });
    assert.equal(h.ids.gBoard.captured.size, 0);
});

test('language render does not duplicate cells, listeners or save writes', () => {
    const h = boot(), writes = h.writes.length;
    const before = h.snapshot();
    h.render(); h.render();
    assert.equal(h.ids.gGrid.children.length, 16);
    assert.equal(h.document.listeners.keydown.length, 1);
    assert.equal(h.writes.length, writes);
    assert.deepEqual(h.snapshot(), before);
});
