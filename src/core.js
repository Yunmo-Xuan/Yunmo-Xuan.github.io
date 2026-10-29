/* ============================================================
   站点核心运行时：配置 → 多语言 → 主题 → 导航 → 入场动画
   页面脚本需在此之前定义 window.PAGE_I18N 与 window.PAGE_RENDER
   ============================================================ */
(function () {
    'use strict';

    /* ── 1. 站点配置（改这里，5 个页面共用） ─────────────────── */
    var SITE = {
        name: '云陌轩',
        github: 'https://github.com/Yunmo-Xuan',
        repo: 'https://github.com/Yunmo-Xuan/Yunmo-Xuan.github.io',
        issues: 'https://github.com/Yunmo-Xuan/Yunmo-Xuan.github.io/issues',
        origin: 'https://yunmo-xuan.github.io',
        email: '',          /* 想公开邮箱就填在这里，关于页会自动出现邮件按钮 */
        year: 2026
    };

    /* ── 2. 外壳文案（导航、页脚、无障碍标签） ───────────────── */
    /* 兜底语言为 zh-CN：其余语言缺失的键会自动回退到它 */
    var CHROME = {
        'zh-CN': {
            doc_title: '云陌轩',
            brand: '云陌轩',
            nav_home: '首页', nav_projects: '项目', nav_blog: '文章', nav_about: '关于',
            a11y_skip: '跳到主要内容', a11y_theme: '切换深浅色主题', a11y_lang: '选择语言',
            a11y_menu: '打开菜单', a11y_menu_close: '关闭菜单', a11y_footer: '页脚',
            footer_tagline: '一个人的静态小站，慢慢更新。',
            footer_copyright: '© 2026 云陌轩 · 保留所有权利',
            footer_github: 'GitHub 主页', footer_source: '站点源码', footer_feedback: '反馈问题',
            c_github: 'GitHub', c_back_home: '返回首页', c_all: '全部', c_read_more: '继续阅读',
            c_updated: '更新于', c_min_read: '分钟阅读', c_empty: '这里还空着。', c_tags: '标签'
        },
        'zh-TW': {
            doc_title: '雲陌軒',
            brand: '雲陌軒',
            nav_home: '首頁', nav_projects: '項目', nav_blog: '文章', nav_about: '關於',
            a11y_skip: '跳至主要內容', a11y_theme: '切換深淺色主題', a11y_lang: '選擇語言',
            a11y_menu: '開啟選單', a11y_menu_close: '關閉選單', a11y_footer: '頁尾',
            footer_tagline: '一個人的靜態小站，慢慢更新。',
            footer_copyright: '© 2026 雲陌軒 · 保留所有權利',
            footer_github: 'GitHub 主頁', footer_source: '網站原始碼', footer_feedback: '反應問題',
            c_github: 'GitHub', c_back_home: '返回首頁', c_all: '全部', c_read_more: '繼續閱讀',
            c_updated: '更新於', c_min_read: '分鐘閱讀', c_empty: '這裡還空著。', c_tags: '標籤'
        },
        'en': {
            doc_title: 'Yunmo-Xuan',
            brand: 'Yunmo-Xuan',
            nav_home: 'Home', nav_projects: 'Projects', nav_blog: 'Writing', nav_about: 'About',
            a11y_skip: 'Skip to main content', a11y_theme: 'Toggle light and dark theme',
            a11y_lang: 'Choose language', a11y_menu: 'Open menu', a11y_menu_close: 'Close menu',
            a11y_footer: 'Footer',
            footer_tagline: 'A one-person static site, updated slowly.',
            footer_copyright: '© 2026 Yunmo-Xuan · All rights reserved',
            footer_github: 'GitHub profile', footer_source: 'Site source', footer_feedback: 'Report an issue',
            c_github: 'GitHub', c_back_home: 'Back to home', c_all: 'All', c_read_more: 'Keep reading',
            c_updated: 'Updated', c_min_read: 'min read', c_empty: 'Nothing here yet.', c_tags: 'Tags'
        },
        'ja': {
            doc_title: '雲陌軒',
            brand: '雲陌軒',
            nav_home: 'ホーム', nav_projects: 'プロジェクト', nav_blog: 'ノート', nav_about: '概要',
            a11y_skip: '本文へスキップ', a11y_theme: 'ライト／ダークを切替',
            a11y_lang: '言語を選択', a11y_menu: 'メニューを開く', a11y_menu_close: 'メニューを閉じる',
            a11y_footer: 'フッター',
            footer_tagline: '一人分の静的サイト、ゆっくり更新。',
            footer_copyright: '© 2026 雲陌軒 · 無断転載を禁じます',
            footer_github: 'GitHub', footer_source: 'サイトのソース', footer_feedback: '問題を報告',
            c_github: 'GitHub', c_back_home: 'ホームへ', c_all: 'すべて', c_read_more: '続きを読む',
            c_updated: '更新日', c_min_read: '分で読了', c_empty: 'まだ何もありません。', c_tags: 'タグ'
        }
    };
    var LANGS = ['zh-CN', 'zh-TW', 'en', 'ja'];
    var LANG_LABEL = { 'zh-CN': '简体中文', 'zh-TW': '繁體中文', 'en': 'English', 'ja': '日本語' };

    var PAGE = window.PAGE_I18N || {};
    var T = {};
    LANGS.forEach(function (code) {
        T[code] = Object.assign({}, CHROME[code] || {}, PAGE[code] || {});
    });

    /* ── 3. 存储（隐私模式下 localStorage 会抛错） ───────────── */
    function read(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
    function write(key, val) { try { localStorage.setItem(key, val); } catch (e) {} }

    /* ── 4. 多语言 ───────────────────────────────────────────── */
    var root = document.documentElement;
    var lang = read('preferredLanguage');
    if (LANGS.indexOf(lang) < 0) {
        var nav = (navigator.language || 'zh-CN').replace('_', '-');
        if (LANGS.indexOf(nav) >= 0) lang = nav;
        else if (nav.indexOf('zh') === 0) lang = (/(TW|HK|MO)/.test(nav) ? 'zh-TW' : 'zh-CN');
        else if (nav.indexOf('ja') === 0) lang = 'ja';
        else if (nav.indexOf('en') === 0) lang = 'en';
        else lang = 'zh-CN';
    }

    function t(key) {
        var value = T[lang][key];
        if (value === undefined) value = T['zh-CN'][key];
        return value;
    }

    /* 从数据表里取当前语言的文案，取不到则回退 zh-CN 再回退首个可用值 */
    function pick(fields) {
        if (!fields) return '';
        if (typeof fields === 'string') return fields;
        var value = fields[lang];
        if (value === undefined) value = fields['zh-CN'];
        if (value === undefined) {
            var keys = Object.keys(fields);
            value = keys.length ? fields[keys[0]] : '';
        }
        return value;
    }

    /* 字典内容都是本文件内手写的静态文案，不含任何用户输入，
       因此允许 <strong>/<br/> 这类排版标记 */
    function applyText(el, key) {
        var value = t(key);
        if (typeof value === 'string') el.innerHTML = value;
    }

    function applyLang(next) {
        if (LANGS.indexOf(next) >= 0) lang = next;
        write('preferredLanguage', lang);
        root.setAttribute('lang', lang);
        document.title = t('doc_title');

        Array.prototype.forEach.call(document.querySelectorAll('[data-i18n]'), function (el) {
            applyText(el, el.getAttribute('data-i18n'));
        });
        Array.prototype.forEach.call(document.querySelectorAll('[data-i18n-aria]'), function (el) {
            var value = t(el.getAttribute('data-i18n-aria'));
            if (typeof value === 'string') el.setAttribute('aria-label', value);
        });
        Array.prototype.forEach.call(document.querySelectorAll('[data-i18n-title]'), function (el) {
            var value = t(el.getAttribute('data-i18n-title'));
            if (typeof value === 'string') el.setAttribute('title', value);
        });

        var metaDesc = document.getElementById('metaDesc');
        if (metaDesc) {
            var desc = t('meta_description');
            if (typeof desc === 'string') metaDesc.setAttribute('content', desc);
        }

        var label = document.getElementById('currentLangLabel');
        if (label) label.textContent = LANG_LABEL[lang] || lang;
        Array.prototype.forEach.call(document.querySelectorAll('#langDropdown [data-lang]'), function (item) {
            item.setAttribute('aria-checked', String(item.getAttribute('data-lang') === lang));
        });

        document.body.classList.add('lang-ready');
        if (typeof window.PAGE_RENDER === 'function') {
            window.PAGE_RENDER({ lang: function () { return lang; }, t: t, pick: pick, site: SITE });
        }
    }

    var langToggle = document.getElementById('langToggle');
    var langDropdown = document.getElementById('langDropdown');

    function closeLang() {
        langDropdown.classList.remove('show');
        langToggle.setAttribute('aria-expanded', 'false');
    }

    langToggle.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = langDropdown.classList.toggle('show');
        langToggle.setAttribute('aria-expanded', String(open));
        if (open) {
            var first = langDropdown.querySelector('[data-lang]');
            if (first) first.focus();
        }
    });
    Array.prototype.forEach.call(langDropdown.querySelectorAll('[data-lang]'), function (item) {
        item.addEventListener('click', function (e) {
            e.preventDefault();
            applyLang(item.getAttribute('data-lang'));
            closeLang();
            langToggle.focus();
        });
    });
    document.addEventListener('click', function (e) {
        if (!langDropdown.contains(e.target) && e.target !== langToggle) closeLang();
    });

    /* ── 5. 主题 ─────────────────────────────────────────────── */
    var themeToggle = document.getElementById('themeToggle');
    var metaTheme = document.getElementById('metaThemeColor');
    var themeExplicit = read('preferredTheme') === 'light' || read('preferredTheme') === 'dark';

    function applyTheme(mode) {
        root.setAttribute('data-theme', mode);
        if (metaTheme) metaTheme.setAttribute('content', mode === 'dark' ? '#0e1116' : '#faf9f8');
    }
    applyTheme(root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');

    themeToggle.addEventListener('click', function () {
        themeExplicit = true;
        var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        write('preferredTheme', next);
        applyTheme(next);
    });

    /* 未手动选择过主题时跟随系统 */
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    var follow = function (e) { if (!themeExplicit) applyTheme(e.matches ? 'dark' : 'light'); };
    if (mq.addEventListener) mq.addEventListener('change', follow);
    else if (mq.addListener) mq.addListener(follow);

    /* ── 6. 移动端菜单 ───────────────────────────────────────── */
    var navToggle = document.getElementById('navToggle');
    var scrim = document.getElementById('navScrim');

    function setNav(open) {
        document.body.classList.toggle('nav-open', open);
        navToggle.setAttribute('aria-expanded', String(open));
        navToggle.setAttribute('aria-label', t(open ? 'a11y_menu_close' : 'a11y_menu'));
        scrim.hidden = !open;
    }
    navToggle.addEventListener('click', function () {
        setNav(!document.body.classList.contains('nav-open'));
        closeLang();
    });
    scrim.addEventListener('click', function () { setNav(false); });
    Array.prototype.forEach.call(document.querySelectorAll('.nav-links a'), function (a) {
        a.addEventListener('click', function () { setNav(false); });
    });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { closeLang(); setNav(false); }
    });

    /* ── 7. 入场动画 ─────────────────────────────────────────── */
    /* 规则：已经在视口内的元素直接显示，不依赖回调；
       IntersectionObserver 只负责屏外元素，另加两次兜底重扫，
       避免任何调度问题把整页留在 opacity:0 */
    function revealInViewport() {
        var vh = window.innerHeight || root.clientHeight;
        var shown = 0;
        Array.prototype.forEach.call(document.querySelectorAll('.reveal:not(.in)'), function (el) {
            var r = el.getBoundingClientRect();
            if (r.top < vh && r.bottom > 0) { el.classList.add('in'); shown++; }
        });
        return shown;
    }

    function observeReveals() {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
            Array.prototype.forEach.call(document.querySelectorAll('.reveal:not(.in)'), function (el) { el.classList.add('in'); });
            return;
        }
        revealInViewport();
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in');
                    io.unobserve(entry.target);
                }
            });
        }, { rootMargin: '0px 0px -40px 0px', threshold: .08 });
        Array.prototype.forEach.call(document.querySelectorAll('.reveal:not(.in)'), function (el) { io.observe(el); });
        /* 兜底：回调被节流或延迟时，仍在视口内的内容必须出现 */
        setTimeout(revealInViewport, 400);
        window.addEventListener('load', revealInViewport);
    }

    window.SITE = SITE;
    window.SITE_RUNTIME = {
        t: t, pick: pick, lang: function () { return lang; },
        reveal: observeReveals, setLang: applyLang
    };

    applyLang(lang);
    observeReveals();
})();

/* ============================================================
   内容渲染工具：先转义、再排版
   —— 正文里的 URL 只允许 http/https/mailto 与站内相对路径
   ============================================================ */
function escHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function safeUrl(u) {
    var raw = String(u == null ? '' : u).trim();
    if (!raw) return '#';
    if (/^(https?:|mailto:|tel:)/i.test(raw)) return escHtml(raw);
    if (raw.charAt(0) === '#' || raw.charAt(0) === '/') return escHtml(raw);
    if (/^[\w.-]+\.html(#[\w-]*)?$/i.test(raw)) return escHtml(raw);
    return '#';
}

function inline(s) {
    return escHtml(s)
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (m, text, url) {
            var external = /^(https?:|mailto:)/i.test(url);
            var attrs = external ? ' target="_blank" rel="noopener noreferrer"' : '';
            var arrow = external ? '<span class="ext-mark" aria-hidden="true"> ↗</span>' : '';
            return '<a href="' + safeUrl(url) + '"' + attrs + '>' + text + arrow + '</a>';
        });
}

function isExternal(u) { return /^(https?:|mailto:)/i.test(String(u || '')); }

/* 由结构化段落生成 HTML，供文章与项目描述复用 */
function renderBlocks(blocks) {
    if (!blocks) return '';
    var out = [];
    blocks.forEach(function (b) {
        if (b.h) out.push('<h2' + (b.id ? ' id="' + b.id + '"' : '') + '>' + inline(b.h) + '</h2>');
        else if (b.p) out.push('<p>' + inline(b.p) + '</p>');
        else if (b.quote) out.push('<blockquote>' + inline(b.quote) + '</blockquote>');
        else if (b.code) out.push('<pre class="code" tabindex="0"><code>' + escHtml(b.code) + '</code></pre>');
        else if (b.note) out.push('<aside class="note">' + inline(b.note) + '</aside>');
        else if (b.ul) out.push('<ul>' + b.ul.map(function (i) { return '<li>' + inline(i) + '</li>'; }).join('') + '</ul>');
        else if (b.ol) out.push('<ol>' + b.ol.map(function (i) { return '<li>' + inline(i) + '</li>'; }).join('') + '</ol>');
    });
    return out.join('\n        ');
}
