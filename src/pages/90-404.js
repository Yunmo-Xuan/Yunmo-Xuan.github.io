/* 404 页
   注意：GitHub Pages 会在任意错误路径下渲染本文件，
   例如 /blog/2024/old-post —— 此时相对链接会指向不存在的深层路径。
   所以本页所有站内链接必须是根绝对路径（prefix 设为 '/'）。 */
'use strict';

const PAGES = [
    { key: 'home', href: '/index.html', zh: '首页', en: 'Home' },
    { key: 'projects', href: '/projects.html', zh: '项目', en: 'Projects' },
    { key: 'blog', href: '/blog.html', zh: '文章', en: 'Writing' },
    { key: 'about', href: '/about.html', zh: '关于', en: 'About' }
];

module.exports = {
    file: '404.html',
    path: '/404.html',
    active: '',
    prefix: '/',
    noindex: true,

    title: {
        'zh-CN': '页面未找到 · 云陌轩',
        'zh-TW': '頁面未找到 · 雲陌軒',
        'en': 'Page not found · Yunmo-Xuan',
        'ja': 'ページが見つかりません · 雲陌軒'
    },
    desc: {
        'zh-CN': '这个地址在站点里没有对应的页面 —— 下面列出了站内所有可去的地方。',
        'en': 'This address has no page on the site. Everything that does exist is listed below.'
    },

    styles: `
        .notfound { padding: 74px 0 40px; text-align: center; }
        .big {
            font-size: clamp(4.5rem, 18vw, 9rem); font-weight: 800; letter-spacing: -.06em; line-height: .9;
            background: var(--grad-text);
            -webkit-background-clip: text; background-clip: text;
            -webkit-text-fill-color: transparent; color: transparent;
        }
        .big-eyebrow {
            display: block; font-family: var(--mono); font-size: .8rem; letter-spacing: .22em;
            color: var(--faint); margin-bottom: 16px; text-transform: uppercase;
        }
        .notfound h1 { font-size: clamp(1.5rem, 3.6vw, 2.1rem); font-weight: 780; letter-spacing: -.025em; margin: 26px 0 12px; }
        .notfound .lead { color: var(--muted); max-width: 54ch; margin: 0 auto 26px; }
        .path-box {
            display: inline-flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 8px;
            margin-bottom: 30px; padding: 9px 16px; border-radius: 10px;
            background: var(--surface-2); border: 1px solid var(--line);
            font-family: var(--mono); font-size: .88rem; color: var(--muted); max-width: 100%;
        }
        .path-box b { color: var(--text); font-weight: 600; word-break: break-all; }
        .path-box .hint { font-family: var(--font); color: var(--faint); font-size: .82rem; }
        .cta-row { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; margin-bottom: 12px; }
        .map { margin-top: 56px; text-align: left; }
        .map-title { font-size: .82rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--faint); margin-bottom: 16px; text-align: center; }
        .map .card-grid { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
        .map .card { padding: 20px; }
        .map .card h3 { font-size: 1.04rem; }
        .map .card p { font-size: .88rem; }
        .report { margin-top: 30px; font-size: .88rem; color: var(--faint); text-align: center; }
    `,

    body: `        <section class="notfound">
            <div class="container">
                <span class="big-eyebrow" data-i18n="eyebrow">route not found</span>
                <div class="big" aria-hidden="true">404</div>
                <h1 data-i18n="title">这个地址上没有页面</h1>
                <p class="lead" data-i18n="lead">
                    页面不存在，或者已经被移走。不是你的错 —— 站内的链接我这边的都过了一遍。
                </p>

                <div class="path-box">
                    <span class="hint" data-i18n="you_asked">你找的是</span>
                    <b id="badPath">/</b>
                </div>

                <div class="cta-row">
                    <a class="btn btn-primary" href="/index.html">
                        <svg class="icon" aria-hidden="true"><use href="#i-home" /></svg>
                        <span data-i18n="go_home">返回首页</span>
                    </a>
                    <a class="btn btn-ghost" href="/blog.html">
                        <svg class="icon" aria-hidden="true"><use href="#i-book" /></svg>
                        <span data-i18n="go_blog">去翻文章</span>
                    </a>
                    <button type="button" class="btn btn-ghost" id="copyPath">
                        <svg class="icon" aria-hidden="true"><use href="#i-external" /></svg>
                        <span data-i18n="report">报告这个坏链接</span>
                    </button>
                </div>

                <div class="map">
                    <div class="map-title" data-i18n="map_title">站内地图</div>
                    <div class="card-grid" id="pageMap"></div>
                </div>

                <p class="report" data-i18n="report_hint">从别处的旧链接过来的？告诉我原本是哪一条，我去把跳转补上。</p>
            </div>
        </section>
`,

    i18n: {
        'zh-CN': {
            meta_description: '这个地址在站点里没有对应的页面 —— 下面列出了站内所有可去的地方。',
            eyebrow: 'route not found',
            title: '这个地址上没有页面',
            lead: '页面不存在，或者已经被移走。不是你的错 —— 站内的链接我这边的都过了一遍。',
            you_asked: '你找的是',
            go_home: '返回首页', go_blog: '去翻文章', report: '报告这个坏链接',
            map_title: '站内地图',
            report_hint: '从别处的旧链接过来的？告诉我原本是哪一条，我去把跳转补上。',
            copied: '链接已复制',
            map_desc_home: '一句话说明我是谁、这个站是什么。',
            map_desc_projects: '做过的东西，附上它们解决的问题。',
            map_desc_blog: '技术笔记和踩坑记录，可按标签筛选。',
            map_desc_about: '站点自身的来龙去脉，以及怎么找到我。'
        },
        'zh-TW': {
            meta_description: '這個網址在網站裡沒有對應的頁面 —— 下面列出了站內所有可去的地方。',
            eyebrow: 'route not found',
            title: '這個網址上沒有頁面',
            lead: '頁面不存在，或者已經被移走。不是你的錯 —— 站內的連結我這邊都過了一遍。',
            you_asked: '你找的是',
            go_home: '返回首頁', go_blog: '去翻文章', report: '反應這個壞連結',
            map_title: '站內地圖',
            report_hint: '從別處的舊連結過來的？告訴我原本是哪一條，我去把跳轉補上。',
            copied: '連結已複製',
            map_desc_home: '一句話說明我是誰、這個站是什麼。',
            map_desc_projects: '做過的東西，附上它們解決的問題。',
            map_desc_blog: '技術筆記和踩坑記錄，可按標籤篩選。',
            map_desc_about: '站點自身的來龍去脈，以及怎麼找到我。'
        },
        'en': {
            meta_description: 'This address has no page on the site. Everything that does exist is listed below.',
            eyebrow: 'route not found',
            title: 'There is no page at this address',
            lead: 'The page is missing or has been moved. Not your fault — I did walk the internal links.',
            you_asked: 'You asked for',
            go_home: 'Go home', go_blog: 'Browse the writing', report: 'Report this link',
            map_title: 'Site map',
            report_hint: 'Arrived from an old link somewhere else? Tell me which one and I will add a redirect.',
            copied: 'Link copied',
            map_desc_home: 'Who I am and what this site is, in one screen.',
            map_desc_projects: 'What I have built, and the problem each one solved.',
            map_desc_blog: 'Technical notes and traps, filterable by tag.',
            map_desc_about: 'How this site came to be, and how to reach me.'
        },
        'ja': {
            meta_description: 'このアドレスに対応するページはありません。下にサイトのすべてのページを並べています。',
            eyebrow: 'route not found',
            title: 'このアドレスにページはありません',
            lead: 'ページが存在しないか、移されました。あなたのミスではありません —— サイト内のリンクは一通り確認しています。',
            you_asked: '要求されたのは',
            go_home: 'ホームへ', go_blog: 'ノートへ', report: 'この壊れたリンクを報告',
            map_title: 'サイトマップ',
            report_hint: '他所の古いリンクから来たなら、どのリンクか教えてください。リダイレクトを足します。',
            copied: 'リンクをコピーしました',
            map_desc_home: '自分が誰で、このサイトが何かを一文で。',
            map_desc_projects: '作ったものと、それぞれが解決した問題。',
            map_desc_blog: '技術ノートと落とし穴の記録。タグで絞り込めます。',
            map_desc_about: 'このサイトの経緯と、連絡のつき方。'
        }
    },

    render: function render(ctx) {
        var site = window.SITE || {};
        var path = location.pathname + location.search;
        var bad = document.getElementById('badPath');
        if (bad) bad.textContent = path.length > 96 ? path.slice(0, 96) + '…' : path;

        /* 站内地图：把确实存在的四个页面都列出来，比一句「返回首页」有用 */
        var map = document.getElementById('pageMap');
        if (map) {
            var iconOf = { home: 'i-home', projects: 'i-folder', blog: 'i-book', about: 'i-user' };
            map.innerHTML = window.PAGE_DATA.map(function (p) {
                return '<a class="tile-link reveal" href="' + safeUrl(p.href) + '">' +
                    '<div class="card">' +
                    '<div class="card-icon"><svg class="icon" aria-hidden="true"><use href="#' + iconOf[p.key] + '" /></svg></div>' +
                    '<h3>' + escHtml(ctx.lang().indexOf('zh') === 0 ? p.zh : p.en) + '</h3>' +
                    '<p>' + escHtml(ctx.t('map_desc_' + p.key)) + '</p>' +
                    '</div></a>';
            }).join('\n');
        }

        /* 报告坏链接：开一个预填好路径的 issue，比让访客自己复述省事 */
        var report = document.getElementById('copyPath');
        if (report) {
            report.addEventListener('click', function () {
                var title = '[404] ' + path;
                var body = '从别处点进来的，这个地址没有页面：\n\n`' + path + '`\n\n期望它指向：';
                var url = (site.issues || site.repo) + '/new?title=' + encodeURIComponent(title) + '&body=' + encodeURIComponent(body);
                window.open(url, '_blank', 'noopener');
            });
        }
    },

    data: PAGES
};
