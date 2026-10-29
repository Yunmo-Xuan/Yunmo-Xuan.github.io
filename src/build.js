/* ============================================================
   build.js — 把 src/ 里的共享外壳 + 各页面模块组装成独立单文件 HTML
   产物：site/*.html（每个文件都自包含，可直接上传 GitHub Pages）
   用法：node src/build.js
   ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');

const SRC = __dirname;
const OUT = path.join(SRC, '..', 'site');

const coreCss = read('core.css');
const coreJs = read('core.js');

const FAVICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%230b63f6'/%3E%3Cpath d='M16 6.5l2.5 7 7 2.5-7 2.5-2.5 7-2.5-7-7-2.5 7-2.5z' fill='%23fff'/%3E%3C/svg%3E";

const ICONS = `<svg class="sprite" aria-hidden="true" focusable="false"><defs>
        <symbol id="i-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></symbol>
        <symbol id="i-moon" viewBox="0 0 24 24"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></symbol>
        <symbol id="i-globe" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9S14.5 18.3 12 21c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z" /></symbol>
        <symbol id="i-menu" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16" /></symbol>
        <symbol id="i-close" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></symbol>
        <symbol id="i-arrow-right" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></symbol>
        <symbol id="i-arrow-left" viewBox="0 0 24 24"><path d="M19 12H5M11 6l-6 6 6 6" /></symbol>
        <symbol id="i-home" viewBox="0 0 24 24"><path d="M3 11.5L12 4l9 7.5" /><path d="M5.5 10.5V20h13V10.5" /></symbol>
        <symbol id="i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.9-3.9" /></symbol>
        <symbol id="i-github" viewBox="0 0 24 24"><path fill="currentColor" stroke="none" d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2z" /></symbol>
        <symbol id="i-folder" viewBox="0 0 24 24"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></symbol>
        <symbol id="i-book" viewBox="0 0 24 24"><path d="M12 6.5C10.5 5 7.5 4.5 4 5v13c3.5-.5 6.5 0 8 1.5 1.5-1.5 4.5-2 8-1.5V5c-3.5-.5-6.5 0-8 1.5z" /><path d="M12 6.5v13" /></symbol>
        <symbol id="i-user" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-3.9 3.6-6.5 8-6.5s8 2.6 8 6.5" /></symbol>
        <symbol id="i-code" viewBox="0 0 24 24"><path d="M9 17l-5-5 5-5M15 7l5 5-5 5" /></symbol>
        <symbol id="i-terminal" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 10l3 2.5L7 15M12.5 15H17" /></symbol>
        <symbol id="i-layers" viewBox="0 0 24 24"><path d="M12 3l8 4.5-8 4.5-8-4.5z" /><path d="M4 12.5L12 17l8-4.5" /></symbol>
        <symbol id="i-zap" viewBox="0 0 24 24"><path d="M13 2L4 14h7l-1 8 9-12h-7z" /></symbol>
        <symbol id="i-external" viewBox="0 0 24 24"><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" /></symbol>
        <symbol id="i-check" viewBox="0 0 24 24"><path d="M4 12.5l5 5L20 6" /></symbol>
        <symbol id="i-mail" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3.8 7l8.2 6 8.2-6" /></symbol>
        <symbol id="i-issue" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5.5M12 16.4v.2" /></symbol>
        <symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.2 2" /></symbol>
        <symbol id="i-tag" viewBox="0 0 24 24"><path d="M20.5 12.5L12 21l-8.5-8.5V4h8.5z" /><circle cx="8" cy="8" r="1.3" /></symbol>
        <symbol id="i-star" viewBox="0 0 24 24"><path d="M12 4l2.3 5.2 5.7.5-4.3 3.8 1.3 5.5L12 16.9 7 19.8l1.3-5.5L4 10.5l5.7-.5z" /></symbol>
        <symbol id="i-heart" viewBox="0 0 24 24"><path d="M12 20s-7-4.5-7-9.5A3.5 3.5 0 0 1 12 8a3.5 3.5 0 0 1 7 2.5c0 5-7 9.5-7 9.5z" /></symbol>
    </defs></svg>`;

function read(name) {
    return fs.readFileSync(path.join(SRC, name), 'utf8').replace(/\s+$/, '');
}

function icon(id, cls) {
    return `<svg class="icon${cls ? ' ' + cls : ''}" aria-hidden="true"><use href="#${id}" /></svg>`;
}

/* ---------- 外壳 ---------- */
function head(page) {
    const url = SITE_ORIGIN + page.path;
    return `<!DOCTYPE html>
<html lang="zh-CN" data-theme="light">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light dark" />

    <title>${esc(page.title['zh-CN'])}</title>
    <meta name="description" content="${esc(page.desc['zh-CN'])}" id="metaDesc" />
    <link rel="canonical" href="${url}" />
    <meta name="robots" content="${page.noindex ? 'noindex, follow' : 'index, follow'}" />
    <meta name="theme-color" content="#faf9f8" id="metaThemeColor" />
    <link rel="alternate" hreflang="x-default" href="${SITE_ORIGIN + page.path}" />

    <meta property="og:type" content="${page.ogType || 'website'}" />
    <meta property="og:site_name" content="云陌轩" />
    <meta property="og:url" content="${url}" />
    <meta property="og:title" content="${esc(page.title['zh-CN'])}" />
    <meta property="og:description" content="${esc(page.desc['zh-CN'])}" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${esc(page.title['zh-CN'])}" />
    <meta name="twitter:description" content="${esc(page.desc['zh-CN'])}" />

    <link rel="icon" href="${FAVICON}" />

    <script>
        /* 首屏前确定主题与语言，避免闪烁（FOUC） */
        (function () {
            var r = document.documentElement;
            r.className += ' js';
            try {
                var t = localStorage.getItem('preferredTheme');
                if (t !== 'light' && t !== 'dark') {
                    t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                }
                r.setAttribute('data-theme', t);
                var l = localStorage.getItem('preferredLanguage');
                if (l) r.setAttribute('lang', l);
            } catch (e) {
                r.setAttribute('data-theme', window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
            }
        })();
    </script>

    <style>
${coreCss}

/* ---------- 本页专用样式 ---------- */
${page.styles}
    </style>

    <script type="application/ld+json">
${JSON.stringify(page.jsonld, null, 2).replace(/</g, '\\u003c')}
    </script>
</head>`;
}

const SITE_ORIGIN = 'https://yunmo-xuan.github.io';

function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function header(page) {
    const p = page.prefix; // 404 页用 '/'，其余用 ''
    const item = (key, href, label) =>
        `                    <li><a href="${p}${href}" data-i18n="nav_${key}"${page.active === key ? ' aria-current="page"' : ''}>${label}</a></li>`;

    return `    <header class="site-header">
        <div class="container header-inner">
            <a class="logo" href="${p}index.html">
                <span class="spark" aria-hidden="true">✦</span>
                <span data-i18n="brand">云陌轩</span>
            </a>

            <nav class="nav" id="primaryNav" aria-label="主导航">
                <ul class="nav-links">
${item('home', 'index.html', '首页')}
${item('projects', 'projects.html', '项目')}
${item('blog', 'blog.html', '文章')}
${item('about', 'about.html', '关于')}
                </ul>
            </nav>

            <div class="header-actions">
                <button type="button" class="icon-btn" id="themeToggle" data-i18n-aria="a11y_theme" aria-label="切换深浅色主题">
                    ${icon('i-moon', 'i-moon')}
                    ${icon('i-sun', 'i-sun')}
                </button>

                <div class="lang-switcher">
                    <button type="button" class="icon-btn" id="langToggle" data-i18n-aria="a11y_lang" aria-label="选择语言"
                            aria-haspopup="true" aria-expanded="false" aria-controls="langDropdown">
                        ${icon('i-globe')}
                        <span class="sr-only" id="currentLangLabel">简体中文</span>
                    </button>
                    <ul class="lang-dropdown" id="langDropdown" role="menu" aria-label="选择语言">
                        <li role="none"><a role="menuitemradio" href="#" data-lang="zh-CN" lang="zh-CN">简体中文</a></li>
                        <li role="none"><a role="menuitemradio" href="#" data-lang="zh-TW" lang="zh-TW">繁體中文</a></li>
                        <li role="none"><a role="menuitemradio" href="#" data-lang="en" lang="en">English</a></li>
                        <li role="none"><a role="menuitemradio" href="#" data-lang="ja" lang="ja">日本語</a></li>
                    </ul>
                </div>

                <button type="button" class="icon-btn nav-toggle" id="navToggle" data-i18n-aria="a11y_menu" aria-label="打开菜单" aria-expanded="false" aria-controls="primaryNav">
                    ${icon('i-menu')}
                </button>
            </div>
            <div class="nav-scrim" id="navScrim" hidden></div>
        </div>
    </header>`;
}

function footer(page) {
    const p = page.prefix;
    return `    <footer class="site-footer" data-i18n-aria="a11y_footer">
        <div class="container">
            <div class="footer-grid">
                <div class="footer-brand">
                    <a class="logo" href="${p}index.html">
                        <span class="spark" aria-hidden="true">✦</span>
                        <span data-i18n="brand">云陌轩</span>
                    </a>
                    <p data-i18n="footer_tagline">一个人的静态小站，慢慢更新。</p>
                </div>
                <ul class="footer-nav">
                    <li><a href="${p}projects.html" data-i18n="nav_projects">项目</a></li>
                    <li><a href="${p}blog.html" data-i18n="nav_blog">文章</a></li>
                    <li><a href="${p}about.html" data-i18n="nav_about">关于</a></li>
                    <li><a href="https://github.com/Yunmo-Xuan" target="_blank" rel="noopener noreferrer" data-i18n="footer_github">GitHub 主页</a></li>
                    <li><a href="https://github.com/Yunmo-Xuan/Yunmo-Xuan.github.io/issues/new" target="_blank" rel="noopener noreferrer" data-i18n="footer_feedback">反馈问题</a></li>
                </ul>
            </div>
            <div class="footer-bottom">
                <span data-i18n="footer_copyright">© 2026 云陌轩 · 保留所有权利</span>
                <span>
                    <a href="https://github.com/Yunmo-Xuan/Yunmo-Xuan.github.io" target="_blank" rel="noopener noreferrer" data-i18n="footer_source">站点源码</a>
                    ·
                    <a href="${p}index.html" data-i18n="c_back_home">返回首页</a>
                </span>
            </div>
        </div>
    </footer>`;
}

function body(page) {
    const skip = `    <a class="skip-link" href="#main" data-i18n="a11y_skip" data-i18n-aria="a11y_skip">跳到主要内容</a>`;
    return `<body>
${skip}

    ${ICONS.replace(/\n/g, '\n    ')}

${header(page)}

    <main id="main">
        <noscript>
            <p class="noscript-note">文章与项目列表由页面内的一段 JavaScript 渲染 —— 关掉脚本后只剩静态文字。
                站点源码公开：<a href="https://github.com/Yunmo-Xuan/Yunmo-Xuan.github.io">Yunmo-Xuan.github.io</a>。</p>
        </noscript>
${page.body}    </main>

${footer(page)}

    <script>
/* ============================================================
   本页文案字典（与共享外壳字典合并）
   ============================================================ */
window.PAGE_I18N = ${JSON.stringify(page.i18n, null, 2).replace(/</g, '\\u003c')};
    </script>

    <script>
/* ============================================================
   本页内容数据 —— 想加一条文章/项目，从这里开始
   ============================================================ */
window.PAGE_DATA = ${page.data === undefined ? '[]' : JSON.stringify(page.data, null, 2).replace(/</g, '\\u003c')};

/* ============================================================
   本页渲染逻辑
   ============================================================ */
window.PAGE_RENDER = ${page.render.toString().replace(/^\s*function\s+render\s*/, 'function')};
    </script>

    <script>
${coreJs}
    </script>
</body>
</html>
`;
}

/* ---------- 产出 ---------- */
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

/* src/extra/ 里的文件原样带进产物目录（robots.txt、sitemap.xml、.nojekyll 等） */
const extraDir = path.join(SRC, 'extra');
if (fs.existsSync(extraDir)) {
    for (const f of fs.readdirSync(extraDir)) {
        const src = path.join(extraDir, f);
        if (fs.statSync(src).isFile()) {
            fs.copyFileSync(src, path.join(OUT, f));
            console.log(`  · ${f}  (原样复制)`);
        }
    }
}

const pageDir = path.join(SRC, 'pages');
const modules = fs.readdirSync(pageDir)
    .filter(f => f.endsWith('.js'))
    .sort()
    .map(f => require(path.join(pageDir, f)));

for (const page of modules) {
    page.prefix = page.prefix || '';
    page.title = page.title || { 'zh-CN': '云陌轩' };
    page.desc = page.desc || { 'zh-CN': '' };
    page.i18n = page.i18n || {};
    /* 每页标题由 page.title 提供，切语言时 document.title 跟着变，
       不会被外壳字典里的品牌名覆盖掉 */
    for (const code of Object.keys(page.title)) {
        page.i18n[code] = Object.assign({}, page.i18n[code]);
        page.i18n[code].doc_title = page.title[code];
        if (page.desc[code]) page.i18n[code].meta_description = page.desc[code];
    }
    page.styles = page.styles || '';
    page.render = page.render || function () {};
    page.jsonld = page.jsonld || {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: '云陌轩',
        url: SITE_ORIGIN + '/',
        sameAs: ['https://github.com/Yunmo-Xuan']
    };

    const html = (head(page) + '\n' + body(page)).replace(/[ \t]+$/gm, '');
    fs.writeFileSync(path.join(OUT, page.file), html, 'utf8');
    console.log(`  ✓ ${page.file}  ${(html.length / 1024).toFixed(1)} KB`);
}

console.log(`built ${modules.length} page(s) → ${path.relative(process.cwd(), OUT)}`);
