'use strict';
/* ==========================================================================
 * 五子棋单文件回归测试（tools/test-gomoku.cjs）
 *
 * 用内置 http 服务器加载 src/games/gomoku.html（唯一源码），用 Chrome
 * （puppeteer-core + 系统 Chrome，不使用 Edge）在真实页面里跑引擎与交互：
 *   1. 增量估值 == 全量重算（封堵敌方窗口）
 *   2. 简化禁手：假三/长连四不计，AI 每个落点都通过同一条禁手校验
 *   3. 人机模式存档恢复后重新调度 AI
 *   4. 隐藏页面 / 复盘期间计时暂停，返回不补扣
 *   5. 右键/中键不落子、方向键按翻转状态换算
 *   6. window.GAME_HOST（setTheme / pause / resume），存档键名不变
 *   7. 玩法回归：悔棋、交换黑白、提示、复制棋谱、禁手提示、人机对局、
 *      一手成五必吃必挡、迭代加深真的跑起来且时延达标
 *
 * 运行：node tools/test-gomoku.cjs
 *   可选 --target=<html 路径>：改测另一份副本（例如把六条修复逐项退回的「故意回退版」），
 *   用来验证断言确实抓得到缺陷；仓库内的源码不受影响。
 * ========================================================================== */
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const puppeteer = require('puppeteer-core');

const CHROME = process.env.GOMOKU_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const GAME_URL_PATH = '/src/games/gomoku.html';
const ROOT = path.resolve(__dirname, '..');
/* 默认测源码；--target=<file> 可指向一份「故意回退」的副本，用来确认断言真能抓到缺陷 */
const argTarget = (process.argv.find((a) => a.startsWith('--target=')) || '').slice(9);
const PRO_FILE = argTarget ? path.resolve(argTarget) : path.join(ROOT, 'src/games/gomoku.html');

const results = [];
let failures = 0;
function ok(name, pass, detail) {
  results.push({ name, pass: !!pass, detail: detail == null ? '' : String(detail) });
  if (!pass) failures++;
  console.log((pass ? '  PASS  ' : '  FAIL  ') + name + (detail != null && detail !== '' ? '  [' + detail + ']' : ''));
}
function section(t) { console.log('\n=== ' + t + ' ==='); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- 内置静态服务器：只提供本仓库文件，绝不读取 archive/ ---------- */
function startServer() {
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let pathname;
      try { pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname); }
      catch (e) { res.writeHead(400); res.end('bad'); return; }
      const file = pathname === GAME_URL_PATH ? PRO_FILE : path.resolve(ROOT, '.' + pathname);
      const rel = path.relative(ROOT, file);
      if (file !== PRO_FILE && (rel.startsWith('..') || path.isAbsolute(rel) || rel.startsWith('archive'))) { res.writeHead(403); res.end('forbidden'); return; }
      if (!fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end('missing'); return; }
      res.writeHead(200, { 'Content-Type': pathname === GAME_URL_PATH ? 'text/html; charset=utf-8' : (types[path.extname(file)] || 'application/octet-stream'), 'Cache-Control': 'no-store' });
      fs.createReadStream(file).pipe(res);
    });
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

/* ---------- 页面助手 ---------- */
async function openPage(browser, url, opts) {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console.error: ' + m.text()); });
  await page.setViewport({ width: (opts && opts.width) || 1280, height: (opts && opts.height) || 1000 });
  await page.goto(url, { waitUntil: 'load' });
  await waitFor(page, () => !!(window.GomokuEngine && window.GAME_HOST), 5000, '引擎与 GAME_HOST 未暴露');
  page.__errors = errors;
  return page;
}
async function waitFor(page, fnPage, timeout, what) {
  const t0 = Date.now();
  for (;;) {
    let v = false;
    try { v = await page.evaluate(fnPage); } catch (e) { v = false; }
    if (v) return true;
    if (Date.now() - t0 > timeout) throw new Error('超时等待：' + (what || 'condition'));
    await sleep(50);
  }
}
/* 交叉点 → 视口坐标（按页面自身的几何公式换算，顺带校验映射） */
async function cellPoint(page, x, y) {
  return page.evaluate((x, y) => {
    const cvs = document.getElementById('board');
    const r = cvs.getBoundingClientRect();
    const css = r.width;
    const label = Math.max(20, css * 0.042);
    const cell = (css - label * 2) / 14;
    const flip = document.getElementById('btnFlip').getAttribute('aria-pressed') === 'true';
    return { x: r.left + label + (flip ? 14 - x : x) * cell, y: r.top + label + (flip ? y : 14 - y) * cell };
  }, x, y);
}
async function clickCell(page, x, y, button) {
  const p = await cellPoint(page, x, y);
  await page.mouse.click(p.x, p.y, button ? { button } : undefined);
  return p;
}
const moveCount = (page) => page.evaluate(() => document.querySelectorAll('#moves .move').length);
const clockText = (page) => page.evaluate(() => document.getElementById('chipClock').textContent.trim());
const statusTitle = (page) => page.evaluate(() => document.getElementById('statusTitle').textContent.trim());
const noticeText = (page) => page.evaluate(() => {
  const n = document.getElementById('notice');
  return n.hidden ? '' : n.textContent.trim();
});

/* ==========================================================================
 * 1. 增量估值必须等于全量重算（缺陷 1）
 * ========================================================================== */
async function testEvalConsistency(page, url) {
  section('缺陷 1 · 增量估值与全量重算一致');

  /* 审计复现：白 D8–G8 四连，黑堵 H8（x=7,y=7）。封堵必须让白方窗口失分。 */
  const repro = await page.evaluate(() => {
    const E = window.GomokuEngine, c = (x, y) => y * E.SIZE + x;
    const b = E.createBoard();
    [[3, 7], [4, 7], [5, 7], [6, 7]].forEach(([x, y]) => E.set(b, x, y, E.WHITE));
    [[3, 9], [9, 5], [7, 10]].forEach(([x, y]) => E.set(b, x, y, E.BLACK));
    const seq = [{ c: c(7, 7), p: E.BLACK }];
    return { black: E.evalConsistency(b, seq, E.BLACK), white: E.evalConsistency(b, seq, E.WHITE) };
  });
  ok('1.1 封堵敌方窗口：黑方估值 增量 == 重算', repro.black.inc === repro.black.full,
    'inc=' + repro.black.inc + ' full=' + repro.black.full + ' 差=' + (repro.black.inc - repro.black.full));
  ok('1.2 同一序列对白方口径也一致', repro.white.inc === repro.white.full,
    'inc=' + repro.white.inc + ' full=' + repro.white.full);
  ok('1.3 封堵确实收回了白方四连的分数（重算值上升）', repro.white.full > 8000, 'full=' + repro.white.full);

  /* evaluate() 必须与「零落子序列」的增量口径相同 */
  const idle = await page.evaluate(() => {
    const E = window.GomokuEngine, c = (x, y) => y * E.SIZE + x;
    const b = E.createBoard();
    E.set(b, 7, 7, E.BLACK); E.set(b, 8, 8, E.WHITE); E.set(b, 6, 6, E.WHITE);
    const base = E.evaluate(b, E.BLACK);
    const seq = [{ c: c(9, 9), p: E.BLACK }, { c: c(5, 5), p: E.WHITE }, { c: c(10, 10), p: E.BLACK }];
    const none = E.evalConsistency(b, [], E.BLACK);
    return { sameAsEvaluate: none.inc === base && none.full === base, three: E.evalConsistency(b, seq, E.BLACK), w: E.evalConsistency(b, seq, E.WHITE) };
  });
  ok('1.4 evaluate() 与 evalConsistency 空序列同源', idle.sameAsEvaluate);
  ok('1.5 三连增量子 also 一致（黑方）', idle.three.inc === idle.three.full, 'inc=' + idle.three.inc + ' full=' + idle.three.full);
  ok('1.6 三连增量子 also 一致（白方）', idle.w.inc === idle.w.full, 'inc=' + idle.w.inc + ' full=' + idle.w.full);

  /* 随机棋局扫描：每一步都比对增量与重算（混色窗口最多的场景） */
  const fuzz = await page.evaluate(() => {
    const E = window.GomokuEngine;
    let seed = 20261107;
    const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    let checked = 0, worst = 0, bad = null;
    for (let g = 0; g < 12; g++) {
      const b = E.createBoard();
      const played = [];
      for (let i = 0; i < 40; i++) {
        const cells = [];
        for (let c = 0; c < E.SIZE * E.SIZE; c++) if (b[c] === E.EMPTY) cells.push(c);
        if (!cells.length) break;
        const c = cells[Math.floor(rnd() * cells.length)];
        const p = played.length % 2 === 0 ? E.BLACK : E.WHITE;
        b[c] = p; played.push({ c, p });
        /* base 必须不含 seq 里的子，否则等于把同一颗子摆两次 */
        const cut = Math.max(0, played.length - 6);
        const seq = played.slice(cut);
        const base = E.createBoard();
        played.slice(0, cut).forEach((m) => { base[m.c] = m.p; });
        const side = rnd() < 0.5 ? E.BLACK : E.WHITE;
        const r = E.evalConsistency(base, seq, side);
        checked++;
        const d = Math.abs(r.inc - r.full);
        if (d > worst) worst = d;
        if (d > 0 && !bad) bad = { inc: r.inc, full: r.full, stones: played.length, seqLen: seq.length };
      }
    }
    return { checked, worst, bad };
  });
  ok('1.7 随机 480 步扫描：增量与重算完全相等', fuzz.bad === null && fuzz.worst === 0,
    '样本=' + fuzz.checked + ' 最大偏差=' + fuzz.worst + (fuzz.bad ? ' 首个不符=' + JSON.stringify(fuzz.bad) : ''));
}

/* ==========================================================================
 * 2. 简化禁手：延伸点合法性 + AI 落点合法（缺陷 2）
 * ========================================================================== */
async function testForbidden(page, url) {
  section('缺陷 2 · 禁手判定与 AI 落点合法性');

  const t = await page.evaluate(() => {
    const E = window.GomokuEngine;
    const board = (black, white) => { const b = E.createBoard(); black.forEach(([x, y]) => E.set(b, x, y, E.BLACK)); (white || []).forEach(([x, y]) => E.set(b, x, y, E.WHITE)); return b; };
    const code = (black, white, x, y) => { const f = E.forbidden(board(black, white), x, y); return f ? f.code : null; };

    /* A. 横向「四」的两端补点都是长连 → 这一向根本没有四，不该与纵向的活四凑成四四 */
    const noRealFour = { black: [[2, 7], [4, 7], [5, 7], [6, 7], [9, 7], [7, 4], [7, 5], [7, 6]], white: [], x: 7, y: 7 };
    const A = code(noRealFour.black, noRealFour.white, noRealFour.x, noRealFour.y);

    /* B. 横向的「三」唯一合法延伸点是长连禁手 → 假三，不与真三凑成三三 */
    const fakeH = { bl: [[8, 7], [9, 7], [10, 5], [10, 6], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6]], wh: [[12, 7]], p: [10, 7] };
    const B = code(fakeH.bl, fakeH.wh, fakeH.p[0], fakeH.p[1]);
    /* C. 同样陷阱放在纵向（延伸点靠 (dx,dy) 换算，写错方向就会漏判） */
    const fakeV = { bl: [[7, 8], [7, 9], [5, 10], [6, 10], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7]], wh: [[7, 12]], p: [7, 10] };
    const C2 = code(fakeV.bl, fakeV.wh, fakeV.p[0], fakeV.p[1]);
    /* D. 同样陷阱放在斜向 */
    const fakeD = { bl: [[6, 4], [7, 3], [8, 3], [8, 4], [8, 5], [8, 6], [8, 7], [3, 3], [4, 4]], wh: [[3, 7]], p: [5, 5] };
    const C3 = code(fakeD.bl, fakeD.wh, fakeD.p[0], fakeD.p[1]);

    /* E. 真三三仍须判禁 */
    const C = code([[8, 7], [9, 7], [10, 6], [10, 5]], [], 10, 7);
    /* F. 真四四仍须判禁 */
    const D = code([[9, 7], [8, 7], [7, 7], [10, 6], [10, 5], [10, 4]], [], 10, 7);
    /* G. 长连不是五：中心补后 6 连 */
    const E6 = code([[5, 7], [6, 7], [8, 7], [9, 7], [10, 7]], [], 7, 7);
    /* H. 成五优先：横向恰五，纵向长连 */
    const fiveFirst = code([[12, 7], [11, 7], [9, 7], [8, 7], [10, 4], [10, 5], [10, 6], [10, 8]], [], 10, 7);
    /* I. 普通跳三不被误判 */
    const G = code([[8, 7], [9, 7]], [], 10, 7);

    /* J. AI：唯一封堵点是自己禁手 → 绝不能交出去 */
    const aiBoard = board([[3, 4], [8, 0], [8, 1], [8, 2], [8, 3], [8, 5]], [[4, 4], [5, 4], [6, 4], [7, 4]]);
    const ai = E.think(aiBoard, E.BLACK, { level: 4, forbid: true });
    const aiCode = ai ? E.forbidden(aiBoard, ai.x, ai.y) : null;
    return { A, B, C2, C3, C, D, E6, fiveFirst, G, ai, aiCode };
  });

  ok('2.1 长连成五点不计为四（不再误判四四）', t.A === null, 'forbidden=' + t.A);
  ok('2.2 横向假三（延伸点是长连）不计入三三', t.B === null, 'forbidden=' + t.B);
  ok('2.3 纵向假三不计入三三（方向向量换算正确）', t.C2 === null, 'forbidden=' + t.C2);
  ok('2.4 斜向假三不计入三三（方向向量换算正确）', t.C3 === null, 'forbidden=' + t.C3);
  ok('2.5 真三三仍判禁', t.C === 'three-three', 'forbidden=' + t.C);
  ok('2.6 真四四仍判禁', t.D === 'four-four', 'forbidden=' + t.D);
  ok('2.7 六连判长连（不算成五）', t.E6 === 'overline', 'forbidden=' + t.E6);
  ok('2.8 成五优先于其它禁手', t.fiveFirst === null, 'forbidden=' + t.fiveFirst);
  ok('2.9 普通两连不构成禁手', t.G === null, 'forbidden=' + t.G);
  ok('2.10 封堵分支不再返回己方禁手点', t.ai && !(t.ai.x === 8 && t.ai.y === 4) && t.aiCode === null,
    t.ai ? '返回 ' + t.ai.x + ',' + t.ai.y + '（' + (t.ai.reason || '') + '）禁手=' + (t.aiCode && t.aiCode.code) : 'think 返回 null');

  /* 随机局面里 AI 的每个落点都得通过 UI 同一条校验 */
  const sweep = await page.evaluate(() => {
    const E = window.GomokuEngine;
    let seed = 991;
    const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    let bad = null, n = 0;
    for (let k = 0; k < 24; k++) {
      const b = E.createBoard();
      const count = 3 + Math.floor(rnd() * 10);
      for (let i = 0; i < count; i++) {
        const x = Math.floor(rnd() * E.SIZE), y = Math.floor(rnd() * E.SIZE);
        if (b[y * E.SIZE + x] !== E.EMPTY) continue;
        E.set(b, x, y, i % 2 === 0 ? E.BLACK : E.WHITE);
      }
      const p = E.think(b, E.BLACK, { level: k % 2 ? 2 : 1, forbid: true });
      if (!p) continue;
      n++;
      if (b[p.y * E.SIZE + p.x] !== E.EMPTY) { bad = { why: '落点已被占', x: p.x, y: p.y }; break; }
      const f = E.forbidden(b, p.x, p.y);
      if (f) { bad = { why: f.label, x: p.x, y: p.y, reason: p.reason }; break; }
    }
    return { n, bad };
  });
  ok('2.9 24 个随机局：AI 交出的黑方落点全部合法', sweep.bad === null, '样本=' + sweep.n + (sweep.bad ? ' 违规=' + JSON.stringify(sweep.bad) : ''));
}

/* ==========================================================================
 * 3. 人机模式：存档恢复后重新调度 AI（缺陷 3）
 * ========================================================================== */
async function testResumeAi(page, url) {
  section('缺陷 3 · 玩家落子后刷新，AI 必须接上');
  await page.evaluate(() => {
    localStorage.setItem('gomoku.pro.v1', JSON.stringify({
      settings: { mode: 'ai', level: 1, human: 1, sound: false, theme: 'dark', flip: false, forbid: false, timer: 0 },
      score: { black: 0, white: 0, draw: 0 },
      game: { moves: [{ x: 7, y: 7, p: 1 }], turn: 2, over: null }
    }));
  });
  await page.goto(url, { waitUntil: 'load' });
  await waitFor(page, () => !!(window.GomokuEngine && window.GAME_HOST), 5000, '重载后引擎未就绪');
  const restored = await moveCount(page);
  ok('3.1 棋谱已恢复（1 手）', restored === 1, 'moves=' + restored);
  let answered = false;
  try { await waitFor(page, () => document.querySelectorAll('#moves .move').length >= 2, 12000, 'AI 未回应'); answered = true; }
  catch (e) { answered = false; }
  ok('3.2 恢复后 AI 自动落子，不再卡在「轮到 AI」', answered, '当前状态：' + (await statusTitle(page)) + ' / ' + (await page.evaluate(() => document.getElementById('chipTurnText').textContent.trim())));
  const secondWhite = await page.evaluate(() => {
    const m = document.querySelectorAll('#moves .move');
    return m.length > 1 && m[1].classList.contains('w');
  });
  ok('3.3 AI 补的是白子', secondWhite);

  /* 反过来：恢复后轮到人，不该抢着替人落子 */
  await page.evaluate(() => {
    localStorage.setItem('gomoku.pro.v1', JSON.stringify({
      settings: { mode: 'ai', level: 1, human: 2, sound: false, theme: 'dark', flip: false, forbid: false, timer: 0 },
      score: { black: 0, white: 0, draw: 0 },
      game: { moves: [{ x: 7, y: 7, p: 1 }], turn: 2, over: null }
    }));
  });
  await page.goto(url, { waitUntil: 'load' });
  await sleep(1200);
  const stillOne = (await moveCount(page)) === 1;
  const title = await statusTitle(page);
  ok('3.4 轮到人时不替人行棋', stillOne, 'moves=' + (await moveCount(page)) + ' 状态=' + title);
  ok('3.5 轮到人显示「轮到你」', title === '轮到你', '状态=' + title);
}

/* ==========================================================================
 * 4. 计时暂停：隐藏页面与复盘都不补扣（缺陷 4）
 * ========================================================================== */
async function testClock(page, url) {
  section('缺陷 4 · 隐藏 / 复盘期间的用时基准');
  await page.evaluate(() => localStorage.clear());
  await page.goto(url, { waitUntil: 'load' });
  await waitFor(page, () => !!window.GAME_HOST, 5000, '页面就绪');
  await page.select('#timer', '60');
  await sleep(200);

  /* 复盘：回看期间不计入本步用时 */
  await clickCell(page, 7, 7);
  await sleep(120);
  const beforeReview = await clockText(page);
  await page.evaluate(() => {
    document.querySelector('#moves .move').click();      /* 进入复盘 */
    document.getElementById('board').blur();
  });
  await sleep(2600);
  const duringReview = await clockText(page);
  await page.evaluate(() => document.getElementById('btnExitReview').click());
  await sleep(500);
  const afterReview = await clockText(page);
  const secs = (t) => { const p = t.split(':'); return Number(p[0]) * 60 + Number(p[1]); };
  ok('4.1 复盘期间走时冻结', duringReview === beforeReview, beforeReview + ' → ' + duringReview);
  ok('4.2 复盘返回不补扣（用时几乎不变）', secs(beforeReview) - secs(afterReview) <= 1,
    beforeReview + ' → ' + afterReview + '（回看 2.6s）');

  /* 页面隐藏：把 hidden 的读数换成可切换的假值，走真实 visibilitychange 分支 */
  await page.evaluate(() => {
    const desc = Object.getOwnPropertyDescriptor(Document.prototype, 'hidden');
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get() { return window.__fakeHidden ? true : (desc.get ? desc.get.call(document) : false); }
    });
    window.__fakeHidden = true;
    document.dispatchEvent(new Event('visibilitychange'));
  });
  const hiddenStart = await clockText(page);
  await sleep(2600);
  const hiddenEnd = await clockText(page);
  ok('4.3 页面隐藏后计时不再推进', hiddenStart === hiddenEnd, hiddenStart + ' → ' + hiddenEnd);
  await page.evaluate(() => {
    window.__fakeHidden = false;
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await sleep(400);
  const afterHidden = await clockText(page);
  const title = await statusTitle(page);
  ok('4.4 回到前台不补扣隐藏时间', secs(hiddenStart) - secs(afterHidden) <= 1, hiddenStart + ' → ' + afterHidden + '（隐藏 2.6s）');
  ok('4.5 隐藏期间不判超时', title.indexOf('超时') === -1, '状态=' + title);

  /* 恢复走时：确认暂停不是永久停表 */
  await sleep(1600);
  const later = await clockText(page);
  ok('4.6 恢复后计时继续推进', secs(afterHidden) - secs(later) >= 1, afterHidden + ' → ' + later);
}

/* ==========================================================================
 * 5. 右键不落子 + 方向键按翻转换算（缺陷 5）
 * ========================================================================== */
async function testInput(page, url) {
  section('缺陷 5 · 鼠标按键过滤与方向键映射');
  await page.evaluate(() => localStorage.clear());
  await page.goto(url, { waitUntil: 'load' });
  await waitFor(page, () => !!window.GAME_HOST, 5000, '页面就绪');

  /* 先验键盘与左键（中键会触发 Chrome 的自动滚动、右键会弹原生菜单，
     它们会吞掉紧随其后的输入事件，故放到最后单独验「不落子」）。 */
  const cursor = () => page.evaluate(() => {
    const m = /光标\s+([A-O])(\d+)/.exec(document.getElementById('live').textContent || '');
    return m ? { x: 'ABCDEFGHIJKLMNO'.indexOf(m[1]), y: Number(m[2]) - 1 } : null;
  });
  await page.evaluate(() => document.getElementById('board').focus());
  await sleep(120);
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowUp');
  await sleep(150);
  let c = await cursor();
  ok('5.1 未翻转：↑ 使行号变大（往屏幕上方走）', c && c.x === 7 && c.y === 9, JSON.stringify(c));
  await page.keyboard.press('ArrowRight');
  await sleep(150);
  c = await cursor();
  ok('5.2 未翻转：→ 使列号变大', c && c.x === 8 && c.y === 9, JSON.stringify(c));

  await page.keyboard.press('f');                 /* 翻转坐标 */
  await sleep(200);
  await page.keyboard.press('ArrowUp');
  await sleep(150);
  c = await cursor();
  ok('5.3 翻转后：↑ 仍往屏幕上方走（行号变小）', c && c.x === 8 && c.y === 8, JSON.stringify(c));
  await page.keyboard.press('ArrowLeft');
  await sleep(150);
  c = await cursor();
  ok('5.4 翻转后：← 仍往屏幕左方走（列号变大）', c && c.x === 9 && c.y === 8, JSON.stringify(c));

  /* 键盘落子（回车） */
  await page.keyboard.press('Enter');
  await sleep(250);
  ok('5.5 回车在光标处落子', (await moveCount(page)) === 1, 'moves=' + (await moveCount(page)));

  await page.keyboard.press('f');                 /* 翻回去，用未翻转坐标点 */
  await sleep(200);
  await clickCell(page, 3, 3);
  await sleep(250);
  ok('5.6 左键正常落子', (await moveCount(page)) === 2, 'moves=' + (await moveCount(page)));

  await clickCell(page, 4, 4, 'right');
  await sleep(250);
  ok('5.7 右键不落子', (await moveCount(page)) === 2, 'moves=' + (await moveCount(page)));
  await clickCell(page, 5, 5, 'middle');
  await sleep(300);
  ok('5.8 中键不落子', (await moveCount(page)) === 2, 'moves=' + (await moveCount(page)));
  const afterOdd = await page.evaluate(() => ({
    title: document.getElementById('statusTitle').textContent.trim(),
    notice: document.getElementById('notice').hidden ? '' : document.getElementById('notice').textContent.trim()
  }));
  ok('5.9 右键/中键既不落子也不报误落', afterOdd.title === '轮到黑方' && afterOdd.notice === '', JSON.stringify(afterOdd));
}

/* ==========================================================================
 * 6. GAME_HOST 与站点整合（缺陷 6）
 * ========================================================================== */
async function testGameHost(page, url) {
  section('缺陷 6 · window.GAME_HOST');
  await page.evaluate(() => localStorage.clear());
  await page.goto(url, { waitUntil: 'load' });
  await waitFor(page, () => !!window.GAME_HOST, 5000, '页面就绪');
  await clickCell(page, 7, 7);
  await sleep(150);
  await clickCell(page, 8, 8);
  await sleep(150);

  const api = await page.evaluate(() => {
    const out = {};
    out.has = ['setTheme', 'pause', 'resume'].every((k) => typeof window.GAME_HOST[k] === 'function');
    const before = document.querySelectorAll('#moves .move').length;
    const r = window.GAME_HOST.setTheme('light');
    out.light = { result: r, attr: document.documentElement.getAttribute('data-theme'), mode: document.documentElement.dataset.themeMode, moves: document.querySelectorAll('#moves .move').length, before };
    out.storedTheme = JSON.parse(localStorage.getItem('gomoku.pro.v1') || '{}').settings.theme;
    const d = window.GAME_HOST.setTheme('dark');
    out.dark = { result: d, attr: document.documentElement.getAttribute('data-theme') };
    const bad = window.GAME_HOST.setTheme('sepia');
    out.badMode = { result: bad, attr: document.documentElement.getAttribute('data-theme') };
    const a = window.GAME_HOST.setTheme('auto');
    out.auto = { result: a, mode: document.documentElement.dataset.themeMode, attr: document.documentElement.getAttribute('data-theme') };
    return out;
  });
  ok('6.1 GAME_HOST 暴露 setTheme/pause/resume', api.has);
  ok('6.2 setTheme("light") 走 applyTheme：data-theme=light', api.light.attr === 'light' && api.light.mode === 'light', JSON.stringify(api.light.attr) + '/' + api.light.mode);
  ok('6.3 setTheme 写入既有存档键 gomoku.pro.v1 的 settings.theme', api.storedTheme === 'light', 'stored=' + api.storedTheme);
  ok('6.4 setTheme 不重置棋局', api.light.before === 2 && api.light.moves === 2, 'before=' + api.light.before + ' after=' + api.light.moves);
  ok('6.5 setTheme("dark") 生效', api.dark.attr === 'dark');
  ok('6.6 非法主题被拒绝且不改动现状', api.badMode.result.ok === false && api.badMode.attr === 'dark', JSON.stringify(api.badMode.result));
  ok('6.7 setTheme("auto") 回到跟随系统（解析为 light/dark）', api.auto.mode === 'auto' && (api.auto.attr === 'light' || api.auto.attr === 'dark'), JSON.stringify(api.auto));

  /* pause / resume 复用同一套用时基准，且不重置棋局 */
  await page.select('#timer', '60');
  await sleep(200);
  const step = await page.evaluate(() => {
    const s = {};
    s.movesBefore = document.querySelectorAll('#moves .move').length;
    s.a = document.getElementById('chipClock').textContent.trim();
    const p = window.GAME_HOST.pause();
    s.pauseResult = p;
    s.statePaused = window.GAME_HOST.state.paused;
    return new Promise((res) => setTimeout(() => {
      s.b = document.getElementById('chipClock').textContent.trim();
      s.overDuringPause = document.getElementById('statusTitle').textContent.trim();
      const r = window.GAME_HOST.resume();
      s.resumeResult = r;
      res(s);
    }, 2600));
  });
  await sleep(300);
  const after = await page.evaluate(() => ({
    c: document.getElementById('chipClock').textContent.trim(),
    moves: document.querySelectorAll('#moves .move').length,
    state: window.GAME_HOST.state
  }));
  const secs = (t) => { const p = t.split(':'); return Number(p[0]) * 60 + Number(p[1]); };
  ok('6.8 GAME_HOST.pause() 冻结用时', step.a === step.b, step.a + ' → ' + step.b);
  ok('6.9 state.paused 报告暂停中', step.statePaused === true, JSON.stringify(step.statePaused));
  ok('6.10 resume 后继续走时', secs(step.b) - secs(after.c) >= 0 && secs(step.a) - secs(after.c) <= 2, step.a + ' → ' + after.c);
  ok('6.11 pause/resume 不重置棋局、不动存档键', step.movesBefore === 2 && after.moves === 2 && typeof after.state.theme === 'string',
    'moves=' + after.moves + ' state=' + JSON.stringify(after.state));

  const keys = await page.evaluate(() => {
    window.GAME_HOST.setTheme('auto');
    document.getElementById('btnZoomIn').click();
    return Object.keys(localStorage).sort();
  });
  ok('6.12 存档键仍只有 gomoku.pro.v1 / gomoku.view.v1',
    keys.filter((k) => k.indexOf('gomoku') === 0).join(',') === 'gomoku.pro.v1,gomoku.view.v1', keys.join(' | '));

  /* 主题按钮的 cycleTheme 未被破坏 */
  const cycle = await page.evaluate(() => {
    const before = document.documentElement.dataset.themeMode;
    document.getElementById('btnTheme').click();
    const afterMode = document.documentElement.dataset.themeMode;
    return { before, afterMode, label: document.getElementById('themeText').textContent.trim() };
  });
  ok('6.13 主题按钮 cycleTheme 仍工作', cycle.before !== cycle.afterMode || ['auto', 'dark', 'light'].indexOf(cycle.afterMode) !== -1,
    JSON.stringify(cycle));
}

/* ==========================================================================
 * 7. 玩法回归 + 端到端人机对局
 * ========================================================================== */
async function testGameplay(page, url) {
  section('玩法回归 · 悔棋 / 交换 / 提示 / 复制 / 禁手提示 / 人机对局');
  await page.evaluate(() => localStorage.clear());
  await page.goto(url, { waitUntil: 'load' });
  await waitFor(page, () => !!window.GAME_HOST, 5000, '页面就绪');

  /* 双人：落两子 → 悔棋 → 交换黑白 */
  await clickCell(page, 7, 7);
  await clickCell(page, 8, 8);
  await sleep(150);
  ok('7.1 双人对战落两子', (await moveCount(page)) === 2, 'moves=' + (await moveCount(page)));
  await page.evaluate(() => document.getElementById('btnUndo').click());
  await sleep(150);
  ok('7.2 悔棋退回一手', (await moveCount(page)) === 1, 'moves=' + (await moveCount(page)));
  await page.evaluate(() => document.getElementById('btnSwap').click());
  await sleep(150);
  const swapped = await page.evaluate(() => {
    const m = document.querySelector('#moves .move');
    return { cls: m ? m.className : '', title: document.getElementById('statusTitle').textContent.trim() };
  });
  ok('7.3 交换黑白后子色互换', /w/.test(swapped.cls) && !/\bb\b/.test(swapped.cls), JSON.stringify(swapped));

  /* 提示：仍要给推荐点 */
  await page.evaluate(() => document.getElementById('btnHint').click());
  let hinted = false;
  try { await waitFor(page, () => /推荐/.test(document.getElementById('chipEngine').textContent), 6000, '提示无响应'); hinted = true; } catch (e) {}
  ok('7.4 提示给出推荐点', hinted, await page.evaluate(() => document.getElementById('chipEngine').textContent));

  /* 复制棋谱 */
  await clickCell(page, 6, 6);
  await sleep(150);
  await page.evaluate(() => document.getElementById('btnCopy').click());
  await sleep(400);
  const note = await noticeText(page);
  ok('7.5 复制棋谱有反馈（成功或降级提示）', /棋谱/.test(note), note);

  /* 禁手提示：造一个真三三，开禁手后点该点应被拦 */
  await page.evaluate(() => {
    const btn = document.getElementById('btnForbid');
    if (btn.getAttribute('aria-checked') !== 'true') btn.click();
    document.getElementById('btnNew').click();
  });
  await sleep(200);
  /* 黑：(8,7)(9,7) 与 (10,6)(10,5) 两组；白：散着走，别提前把局走完 */
  const seq = [
    [8, 7], [0, 0], [9, 7], [14, 14], [10, 6], [0, 14], [10, 5], [14, 0], [0, 13], [14, 1]
  ];
  for (const [x, y] of seq) { await clickCell(page, x, y); await sleep(70); }
  await clickCell(page, 10, 7);
  await sleep(250);
  const fbNotice = await noticeText(page);
  ok('7.6 三三禁手被拦并提示', /禁手/.test(fbNotice) && /三三/.test(fbNotice), fbNotice);
  const fbMoves = await moveCount(page);
  ok('7.7 禁手点没有落子', fbMoves === seq.length, 'moves=' + fbMoves);

  /* 人机：执黑点一手，AI 必须回应且落点合法 */
  await page.evaluate(() => localStorage.clear());
  await page.goto(url, { waitUntil: 'load' });
  await waitFor(page, () => !!window.GAME_HOST, 5000, '页面就绪');
  await page.evaluate(() => { document.getElementById('modeAi').click(); document.getElementById('level').value = '2'; document.getElementById('level').dispatchEvent(new Event('change')); });
  await sleep(200);
  const t0 = Date.now();
  await clickCell(page, 7, 7);
  let responded = false;
  try { await waitFor(page, () => document.querySelectorAll('#moves .move').length >= 2, 20000, 'AI 未回应'); responded = true; } catch (e) {}
  const ms = Date.now() - t0;
  ok('7.8 人机模式 AI 回应', responded, '耗时 ' + ms + 'ms');
  const aiLegal = await page.evaluate(() => {
    const E = window.GomokuEngine;
    const m = document.querySelectorAll('#moves .move');
    if (m.length < 2) return { ok: false, why: 'no ai move' };
    const label = /([A-O])(\d+)/.exec(m[1].textContent);
    const x = 'ABCDEFGHIJKLMNO'.indexOf(label[1]), y = Number(label[2]) - 1;
    const b = E.createBoard();
    for (let i = 0; i < m.length; i++) {
      const l = /([A-O])(\d+)/.exec(m[i].textContent);
      E.set(b, 'ABCDEFGHIJKLMNO'.indexOf(l[1]), Number(l[2]) - 1, m[i].classList.contains('b') ? E.BLACK : E.WHITE);
    }
    return { ok: E.findWin(b, x, y) == null || true, x, y, taken: b[y * E.SIZE + x] !== E.EMPTY };
  });
  ok('7.9 AI 落点已记录且落在空位', aiLegal.taken === true, JSON.stringify(aiLegal));

  /* 战术底线（估值口径改了以后仍须成立）：一手成五必下、对方一手成五必挡 */
  const tactics = await page.evaluate(() => {
    const E = window.GomokuEngine;
    const mk = (bl, wh) => { const b = E.createBoard(); bl.forEach(([x, y]) => E.set(b, x, y, E.BLACK)); wh.forEach(([x, y]) => E.set(b, x, y, E.WHITE)); return b; };
    /* 黑 (3,7)-(6,7) 四连，白已占 (2,7) → 唯一胜点 (7,7) */
    const b1 = mk([[3, 7], [4, 7], [5, 7], [6, 7], [0, 0], [1, 1]], [[2, 7], [9, 9], [10, 10], [8, 8]]);
    const r1 = E.think(b1, E.WHITE, { level: 2 });
    /* 白 (10,4)-(13,4) 四连，黑已占 (9,4) → 黑唯一挡点 (14,4) */
    const b2 = mk([[9, 4], [0, 0], [1, 1]], [[10, 4], [11, 4], [12, 4], [13, 4], [7, 7]]);
    const r2 = E.think(b2, E.BLACK, { level: 2 });
    const b3 = mk([[3, 7], [4, 7], [5, 7], [6, 7], [0, 0]], [[2, 7], [9, 9], [10, 10], [8, 8]]);
    const r3 = E.think(b3, E.BLACK, { level: 2 });
    const xy = (r) => (r ? [r.x, r.y] : null);
    return { block: xy(r1), mustBlock: xy(r2), makeFive: xy(r3), reason: r3 && r3.reason };
  });
  ok('7.10 对方一手成五必挡', tactics.block && tactics.block[0] === 7 && tactics.block[1] === 7, JSON.stringify(tactics.block));
  ok('7.11 自己一手成五必下', tactics.makeFive && tactics.makeFive[0] === 7 && tactics.makeFive[1] === 7, JSON.stringify(tactics) + ' ' + tactics.reason);
  ok('7.12 白方挡点同样准确（口径对称）', tactics.mustBlock && tactics.mustBlock[0] === 14 && tactics.mustBlock[1] === 4, JSON.stringify(tactics.mustBlock));

  /* 禁手校验加了递归，确认没把搜索拖死：用没有现成杀形的安静中盘，逼它真跑迭代加深 */
  const perf = await page.evaluate(() => {
    const E = window.GomokuEngine;
    const b = E.createBoard();
    const put = (arr, p) => arr.forEach(([x, y]) => E.set(b, x, y, p));
    put([[7, 7], [8, 7], [6, 8], [9, 6]], E.BLACK);
    put([[8, 8], [7, 8], [6, 7]], E.WHITE);
    const t0 = performance.now();
    const r = E.think(b, E.WHITE, { level: 4, forbid: true });
    return { ms: Math.round(performance.now() - t0), move: r ? r.x + ',' + r.y : null, reason: r && r.reason, depth: r && r.depth, nodes: r && r.nodes, legal: r ? E.forbidden(b, r.x, r.y) === null : false };
  });
  ok('7.13 深搜真的跑起来了（节点/深度非零）', perf.nodes > 1000 && perf.depth >= 2, JSON.stringify(perf));
  ok('7.14 国手档（含禁手递归）一手仍在 6s 预算内', perf.ms <= 6000, perf.ms + 'ms → ' + perf.move + '（' + perf.reason + '，深度 ' + perf.depth + '）');
  ok('7.15 深搜落点合法', perf.legal === true, JSON.stringify(perf));
}

/* ---------- 静态源码检查：不动存档键、不残留旧缺陷写法 ---------- */
function testSourceGuards() {
  section('源码守卫');
  const src = fs.readFileSync(PRO_FILE, 'utf8');
  ok('S.1 存档键名保持原样', /KEY = 'gomoku\.pro\.v1'/.test(src) && /VKEY = 'gomoku\.view\.v1'/.test(src));
  ok('S.2 页面不再自称完整连珠规则', !/连珠规则：/.test(src) && /简化禁手/.test(src));
  ok('S.3 窗口分值双向维护（封堵敌方窗口）', /function shiftWindow\(i, p, d\)/.test(src));
  ok('S.4 AI 落点出口有禁手兜底', /playableCell\(bestMove\.c\)/.test(src));
  ok('S.5 指针事件过滤非主按钮', /ev\.button !== 0/.test(src));
  ok('S.6 方向键走 flip 换算', /function moveCursor\(dc, dr\)/.test(src));
  ok('S.7 恢复后按 turn 调度 AI', /S\.mode === 'ai' && S\.turn !== S\.human\) aiMove\(\);/.test(src));
  ok('S.8 暴露 GAME_HOST 与引擎句柄', /window\.GAME_HOST = \{/.test(src) && /window\.GomokuEngine = GomokuEngine/.test(src));
}

(async function main() {
  console.log('五子棋回归测试 · Chrome 自动化');
  console.log('被测文件：' + PRO_FILE);
  console.log('浏览器：' + CHROME);
  testSourceGuards();
  if (!fs.existsSync(CHROME)) {
    console.error('\n找不到 Chrome：' + CHROME + '（可用 GOMOKU_CHROME 环境变量覆盖）');
    process.exit(2);
  }
  const server = await startServer();
  const addr = server.address();
  const url = 'http://127.0.0.1:' + addr.port + GAME_URL_PATH;
  console.log('本地服务：' + url + '\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    userDataDir: path.join(os.tmpdir(), 'qoder-gomoku-profile'),
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--autoplay-policy=no-user-gesture-required']
  });
  const allErrors = [];
  const pages = [];
  /* 每节各自兜底：一节崩了不拖垮整套，仍能给出其余缺陷的判定 */
  const run = async (label, fn, page) => {
    try { await fn(page, url); }
    catch (e) { ok(label + ' 执行异常', false, e.message); }
    pages.push(page);
  };
  try {
    const p1 = await openPage(browser, url);
    await run('引擎组', testEvalConsistency, p1);
    await run('禁手组', testForbidden, p1);
    allErrors.push(...p1.__errors.map((e) => 'engine页: ' + e));

    const p2 = await openPage(browser, url);
    await run('恢复组', testResumeAi, p2);
    await run('计时组', testClock, p2);
    allErrors.push(...p2.__errors.map((e) => '交互页: ' + e));

    const p3 = await openPage(browser, url);
    await run('输入组', testInput, p3);
    await run('外壳组', testGameHost, p3);
    allErrors.push(...p3.__errors.map((e) => '输入页: ' + e));

    const p4 = await openPage(browser, url);
    await run('玩法组', testGameplay, p4);
    allErrors.push(...p4.__errors.map((e) => '玩法页: ' + e));

    ok('E.1 全程无页面脚本错误', allErrors.length === 0, allErrors.slice(0, 3).join(' || '));
  } catch (err) {
    ok('H.0 测试执行未完成', false, err.message);
  } finally {
    for (const p of pages) { try { await p.close(); } catch (e) { /* 已关闭 */ } }
    await browser.close();
    server.close();
  }

  console.log('\n---------- 汇总 ----------');
  console.log('通过 ' + (results.filter((r) => r.pass).length) + ' / ' + results.length + '，失败 ' + failures);
  results.filter((r) => !r.pass).forEach((r) => console.log('  ✗ ' + r.name + '  ' + r.detail));
  process.exit(failures ? 1 : 0);
})();
