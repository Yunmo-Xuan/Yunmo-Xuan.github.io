/* 项目页 */
'use strict';

/* 项目数据：这是整页唯一需要改的地方，复制一条对象即可新增项目 */
const PROJECTS = [
    {
        slug: 'yunmo-xuan-github-io',
        name: 'Yunmo-Xuan.github.io',
        url: 'https://github.com/Yunmo-Xuan/Yunmo-Xuan.github.io',
        year: '2026',
        status: 'active',
        featured: true,
        tags: ['HTML', 'CSS', 'JavaScript', 'GitHub Pages'],
        desc: {
            'zh-CN': '你正在看的这个站点。整站由五个自包含的 HTML 文件组成：没有框架、没有构建步骤，也不向 CDN 发起任何请求。',
            en: 'The site you are looking at. Five self-contained HTML files: no framework, no build step in production, and not a single request to a CDN.'
        },
        blocks: [
            {
                p: '这个站点原先是几个手写页面，改着改着开始出现三类问题：导航指向了并不存在的 `blog.html`、文章与首页互不相干、新增一条内容要同时改五处版式。现在这几件事都被收拾干净了。'
            },
            { h: '结构' },
            {
                p: '五个页面各自独立：首页、项目、文章、关于、404。每个文件里都带着自己的样式与脚本，**上传单个文件就等于上线一次改动**，不存在改一处忘一处的共享资源。'
            },
            {
                p: '公共部分（配色、导航、页脚、多语言、主题切换）在 `src/` 里维护一份，由 [build.js](https://github.com/Yunmo-Xuan/Yunmo-Xuan.github.io) 展开进每个页面。源码与产物分开，产物彼此独立。'
            },
            { h: '界面' },
            {
                ul: [
                    '浅色与深色两套主题，跟随系统偏好，也可以手动固定，选择记在 localStorage 里',
                    '简体中文、繁體中文、English、日本語四套界面文案',
                    '图标是内联 SVG，字体用系统字体栈 —— 页面打开后不再有任何网络请求',
                    '尊重 `prefers-reduced-motion`，也保留了无 JS 时的降级表现'
                ]
            },
            { h: '想改内容' },
            {
                p: '文章写在 `blog.html` 顶部的 `POSTS` 数组里，项目写在本页顶部的 `PROJECTS` 数组里。列表、标签筛选、阅读时长、上下一篇文章这些都会自动生成。'
            }
        ]
    }
];

module.exports = {
    file: 'projects.html',
    path: '/projects.html',
    active: 'projects',
    ogType: 'website',

    title: {
        'zh-CN': '项目 · 云陌轩',
        'zh-TW': '項目 · 雲陌軒',
        'en': 'Projects · Yunmo-Xuan',
        'ja': 'プロジェクト · 雲陌軒'
    },
    desc: {
        'zh-CN': '云陌轩做过的东西：站点、工具与小实验，连同它们踩过的坑一起留档。',
        'en': 'Things Yunmo-Xuan has built: the site itself, small tools and experiments, kept together with the mistakes behind them.'
    },

    styles: `
        .project-list { display: grid; gap: 20px; margin-top: 34px; }
        .project {
            display: grid; grid-template-columns: 1fr; gap: 14px;
            padding: 26px 24px; border-radius: var(--radius);
            background: var(--surface); border: 1px solid var(--line); box-shadow: var(--shadow-1);
            transition: transform .22s ease, box-shadow .28s ease, border-color .22s ease;
        }
        .project:hover { transform: translateY(-4px); box-shadow: var(--shadow-2); border-color: var(--line-strong); }
        .project.is-featured { border-color: var(--accent); background: linear-gradient(180deg, var(--accent-soft), transparent 60%), var(--surface); }
        .project-top { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
        .project h2 { font-size: 1.28rem; font-weight: 750; letter-spacing: -.02em; margin: 0; }
        .project h2 a { color: inherit; text-decoration: none; }
        .project h2 a:hover { color: var(--accent-ink); }
        .project .year { font-family: var(--mono); font-size: .82rem; color: var(--faint); }
        .project p.summary { color: var(--muted); font-size: .97rem; margin: 0; }
        .status {
            display: inline-flex; align-items: center; gap: 6px;
            padding: 3px 11px; border-radius: 999px; font-size: .76rem; font-weight: 650;
        }
        .status i { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
        .status-active { color: var(--ok); background: rgba(15, 138, 77, .10); }
        .status-archived { color: var(--faint); background: var(--surface-2); }
        .featured-badge { color: var(--accent-ink); font-size: .76rem; font-weight: 700; display: inline-flex; align-items: center; gap: 5px; }
        .project-links { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 2px; }
        .placeholder-card {
            border: 1px dashed var(--line-strong); border-radius: var(--radius);
            padding: 26px 24px; background: var(--surface-2); color: var(--muted);
            display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 14px;
        }
        .placeholder-card p { margin: 0; font-size: .95rem; }
        .placeholder-card code { font-family: var(--mono); font-size: .85em; background: var(--surface); padding: 2px 6px; border-radius: 6px; border: 1px solid var(--line); }
        .filterbar { margin-top: 30px; }
        .stack-note { margin-top: 34px; }
        @media (min-width: 780px) {
            .project { grid-template-columns: 1fr; }
        }
    `,

    body: `        <section class="page-head">
            <div class="container">
                <span class="eyebrow" data-i18n="eyebrow">项目</span>
                <h1 data-i18n="title">做过的事</h1>
                <p class="lead" data-i18n="lead">
                    这里放我亲手做出来、并且愿意一直维护的东西。每一条都写清楚它解决了什么问题 —— 包括还没做的那些。
                </p>
            </div>
        </section>

        <section class="section tight">
            <div class="container">
                <div class="filterbar" id="projFilters" hidden role="group" aria-label="按标签筛选项目"></div>
                <div class="project-list" id="projList"></div>

                <div class="empty" id="projEmpty" hidden>
                    <p data-i18n="no_match">没有匹配这个标签的项目。</p>
                </div>

                <div class="placeholder-card" id="projPlaceholder">
                    <p data-i18n="placeholder">下一个项目的位置。在页面顶部的 <code>PROJECTS</code> 数组里复制一条，填上名字、链接和说明就能出现。</p>
                    <a class="btn btn-ghost btn-sm" href="https://github.com/Yunmo-Xuan" target="_blank" rel="noopener noreferrer">
                        <svg class="icon" aria-hidden="true"><use href="#i-github" /></svg>
                        <span data-i18n="more_on_github">更多在 GitHub</span>
                    </a>
                </div>

                <aside class="panel-note stack-note" id="projNote" hidden>
                    <svg class="icon" aria-hidden="true"><use href="#i-code" /></svg>
                    <span data-i18n="source_note">本页源码就在上面那个仓库里。</span>
                </aside>
            </div>
        </section>
`,

    i18n: {
        'zh-CN': {
            meta_description: '云陌轩做过的东西：站点、工具与小实验，连同它们踩过的坑一起留档。',
            eyebrow: '项目',
            title: '做过的事',
            lead: '这里放我亲手做出来、并且愿意一直维护的东西。每一条都写清楚它解决了什么问题 —— 包括还没做的那些。',
            featured: '代表作',
            view_source: '查看源码',
            visit: '访问',
            no_match: '没有匹配这个标签的项目。',
            placeholder: '下一个项目的位置。在页面顶部的 <code>PROJECTS</code> 数组里复制一条，填上名字、链接和说明就能出现。',
            more_on_github: '更多在 GitHub',
            source_note: '本页源码就在上面那个仓库里。',
            count_label: '共 %d 个项目',
            status_active: '维护中',
            status_archived: '已归档'
        },
        'zh-TW': {
            meta_description: '雲陌軒做過的东西：站點、工具與小實驗，連同它們踩過的坑一起留檔。',
            eyebrow: '項目',
            title: '做過的事',
            lead: '這裡放我親手做出來、而且願意一直維護的東西。每一條都寫清楚它解決了什麼問題 —— 包括還沒做的那些。',
            featured: '代表作',
            view_source: '檢視原始碼',
            visit: '造訪',
            no_match: '沒有符合這個標籤的項目。',
            placeholder: '下一個項目的位置。在頁面頂部的 <code>PROJECTS</code> 陣列裡複製一條，填上名稱、連結和說明就會出現。',
            more_on_github: '更多在 GitHub',
            source_note: '本頁原始碼就在上面那個倉庫裡。',
            count_label: '共 %d 個項目',
            status_active: '維護中',
            status_archived: '已封存'
        },
        'en': {
            meta_description: 'Things Yunmo-Xuan has built: the site, small tools and experiments, kept together with the mistakes behind them.',
            eyebrow: 'Projects',
            title: 'What I have built',
            lead: 'Only things I made by hand and still intend to keep alive. Each entry says what problem it solved — including the ones not started yet.',
            featured: 'Featured',
            view_source: 'Source',
            visit: 'Visit',
            no_match: 'No projects match this tag.',
            placeholder: 'Room for the next one. Copy an entry in the <code>PROJECTS</code> array at the top of this page, add a name, a link and a line about it.',
            more_on_github: 'More on GitHub',
            source_note: 'The source for this page lives in that repository above.',
            count_label: '%d project(s)',
            status_active: 'Maintained',
            status_archived: 'Archived'
        },
        'ja': {
            meta_description: '雲陌軒が作ったもの。サイト、小さなツール、小さな実験。そこに至った失敗といっしょに記録しています。',
            eyebrow: 'プロジェクト',
            title: '作ったもの',
            lead: '自分で作って、今後も維持するつもりがあるものだけを置いています。各項目に「何を解決したか」を書いています —— まだ手をつけていないものも含めて。',
            featured: '主力',
            view_source: 'ソース',
            visit: '開く',
            no_match: 'このタグに該当するプロジェクトはありません。',
            placeholder: '次の1件用の空き枠です。ページ上部の <code>PROJECTS</code> 配列を1つ複製し、名前・リンク・説明を入れると表示されます。',
            more_on_github: 'GitHub でも',
            source_note: 'このページのソースは上のリポジトリにあります。',
            count_label: '%d 件',
            status_active: 'メンテナンス中',
            status_archived: 'アーカイブ済み'
        }
    },

    render: function render(ctx) {
        var PROJECTS = window.PAGE_DATA || [];
        var list = document.getElementById('projList');
        var bar = document.getElementById('projFilters');
        var empty = document.getElementById('projEmpty');
        var placeholder = document.getElementById('projPlaceholder');
        var note = document.getElementById('projNote');
        var count = document.getElementById('projCount');
        if (!list) return;

        var active = '';
        var tags = [];
        PROJECTS.forEach(function (p) {
            (p.tags || []).forEach(function (tag) { if (tags.indexOf(tag) < 0) tags.push(tag); });
        });

        function card(p) {
            var external = isExternal(p.url);
            var label = external ? ctx.t('view_source') : ctx.t('visit');
            var mark = external ? '<svg class="icon" aria-hidden="true"><use href="#i-external" /></svg>' : '';
            var status = p.status === 'archived'
                ? '<span class="status status-archived"><i></i>' + ctx.t('status_archived') + '</span>'
                : '<span class="status status-active"><i></i>' + ctx.t('status_active') + '</span>';
            var stars = p.featured ? '<span class="featured-badge">' + ctx.t('featured') + '</span>' : '';
            return '<article class="project reveal' + (p.featured ? ' is-featured' : '') + '">' +
                '<div class="project-top">' +
                '<h2><a href="' + safeUrl(p.url) + '"' + (external ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' + escHtml(p.name) + '</a></h2>' +
                '<span class="year">' + escHtml(p.year || '') + '</span>' + status + stars +
                '</div>' +
                '<p class="summary">' + inline(ctx.pick(p.desc) || '') + '</p>' +
                '<ul class="tag-list">' + (p.tags || []).map(function (tg) { return '<li><span class="tag">' + escHtml(tg) + '</span></li>'; }).join('') + '</ul>' +
                '<div class="project-links"><a class="btn btn-ghost btn-sm" href="' + safeUrl(p.url) + '"' +
                (external ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' + mark + '<span>' + label + '</span></a></div>' +
                '</article>';
        }

        function paint() {
            var items = PROJECTS.filter(function (p) {
                return !active || (p.tags || []).indexOf(active) >= 0;
            });
            list.innerHTML = items.map(card).join('\n');
            empty.hidden = items.length !== 0;
            if (count) count.textContent = ctx.t('count_label').replace('%d', PROJECTS.length);
            /* 占位卡只在一条项目都没有时提醒作者；有内容就让位给正文 */
            placeholder.hidden = PROJECTS.length > 0;
            note.hidden = PROJECTS.length === 0;
            if (window.SITE_RUNTIME) window.SITE_RUNTIME.reveal();
        }

        if (tags.length > 1) {
            bar.hidden = false;
            bar.innerHTML = '<button type="button" class="pill" aria-pressed="true" data-tag="">' + ctx.t('c_all') + '</button>' +
                tags.map(function (tg) {
                    return '<button type="button" class="pill" aria-pressed="false" data-tag="' + escHtml(tg) + '">' + escHtml(tg) + '</button>';
                }).join('') +
                '<span class="count" id="projCount"></span>';
            Array.prototype.forEach.call(bar.querySelectorAll('.pill'), function (pill) {
                pill.addEventListener('click', function () {
                    active = pill.getAttribute('data-tag');
                    Array.prototype.forEach.call(bar.querySelectorAll('.pill'), function (x) {
                        x.setAttribute('aria-pressed', String(x === pill));
                    });
                    paint();
                });
            });
        } else {
            bar.hidden = true;
            bar.innerHTML = '';
        }

        count = document.getElementById('projCount');
        paint();
    },

    data: PROJECTS,

    jsonld: {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: '项目 · 云陌轩',
        url: 'https://yunmo-xuan.github.io/projects.html',
        isPartOf: { '@type': 'WebSite', name: '云陌轩', url: 'https://yunmo-xuan.github.io/' }
    }
};
