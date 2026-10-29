/* 关于页 */
'use strict';

/* 站点大事记：新增一条即在数组开头插入 */
const CHANGELOG = [
    { date: '2026-10-28', tag: 'rewrite', text: { 'zh-CN': '整站重写。补齐文章与项目两个页面，清掉所有指向不存在文件的链接。', en: 'Full rewrite. Added the Writing and Projects pages, removed every link that pointed at a file which never existed.' } },
    { date: '2026-10-28', tag: 'i18n', text: { 'zh-CN': '界面文案支持简体中文、繁體中文、English、日本語；主题新增深色并跟随系统偏好。', en: 'UI copy now covers zh-CN, zh-TW, en and ja; a dark theme joined the light one and follows the system preference.' } },
    { date: '2026-10-28', tag: 'a11y', text: { 'zh-CN': '去掉 Font Awesome CDN，图标改为内联 SVG；补上跳转链接、焦点样式与减少动效支持。', en: 'Dropped the Font Awesome CDN for inline SVG; added a skip link, focus styles and reduced-motion support.' } },
    { date: '2026-10-26', tag: '404', text: { 'zh-CN': '404 页改成能真正导航的样子：列出站内全部页面，并把错误路径带进反馈链接。', en: 'The 404 page became useful: it lists every page on the site and carries the broken path into the feedback link.' } }
];

/* 站点取向：会显示成标签，也出现在正文里 */
const STACK = ['HTML', 'CSS', 'JavaScript', 'SVG', 'Git', 'GitHub Pages'];

module.exports = {
    file: 'about.html',
    path: '/about.html',
    active: 'about',

    title: {
        'zh-CN': '关于 · 云陌轩',
        'zh-TW': '關於 · 雲陌軒',
        'en': 'About · Yunmo-Xuan',
        'ja': '概要 · 雲陌軒'
    },
    desc: {
        'zh-CN': '云陌轩是谁、在做什么，以及这个站点为什么是现在这个样子。',
        'en': 'Who Yunmo-Xuan is, what is going on here, and why this site ended up looking like this.'
    },

    styles: `
        .about-hero { display: grid; grid-template-columns: auto 1fr; gap: 26px 30px; align-items: center; padding: 56px 0 8px; }
        .avatar {
            width: 96px; height: 96px; border-radius: 28px; background: var(--grad);
            display: grid; place-items: center; color: #fff; font-size: 38px;
            box-shadow: 0 14px 34px rgba(11, 99, 246, .28);
        }
        .about-hero h1 { font-size: clamp(1.9rem, 4.2vw, 2.6rem); font-weight: 800; letter-spacing: -.03em; }
        .about-hero .sub { color: var(--accent-ink); font-weight: 620; margin-top: 4px; }
        .about-grid { display: grid; grid-template-columns: 1.35fr 1fr; gap: 46px; align-items: start; }
        .about-grid .prose { max-width: 62ch; }
        .side h3 { font-size: .82rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--faint); margin-bottom: 14px; }
        .side .block + .block { margin-top: 34px; }
        .log { list-style: none; }
        .log li { display: grid; grid-template-columns: auto 1fr; gap: 4px 14px; padding: 12px 0; border-top: 1px solid var(--line); }
        .log li:first-child { border-top: 0; }
        .log time { font-family: var(--mono); font-size: .78rem; color: var(--faint); white-space: nowrap; padding-top: 2px; }
        .log p { grid-column: 2; font-size: .92rem; color: var(--muted); margin: 0; }
        .contact-list { list-style: none; display: grid; gap: 10px; }
        .contact-list a {
            display: flex; align-items: center; gap: 12px; padding: 13px 16px;
            border: 1px solid var(--line); border-radius: var(--radius-sm); background: var(--surface);
            text-decoration: none; color: var(--text); font-size: .94rem; font-weight: 550;
            transition: border-color .2s ease, transform .2s ease, color .2s ease;
        }
        .contact-list a:hover { border-color: var(--accent); color: var(--accent-ink); transform: translateX(3px); }
        .contact-list .icon { font-size: 18px; color: var(--accent-ink); }
        .contact-list small { display: block; color: var(--faint); font-weight: 450; font-size: .8rem; }
        .contact-note { font-size: .84rem; color: var(--faint); margin-top: 12px; }
        @media (max-width: 900px) {
            .about-grid { grid-template-columns: 1fr; gap: 38px; }
        }
        @media (max-width: 620px) {
            .about-hero { grid-template-columns: 1fr; gap: 18px; }
            .avatar { width: 76px; height: 76px; font-size: 30px; border-radius: 22px; }
        }
    `,

    body: `        <div class="container">
            <div class="about-hero">
                <div class="avatar" aria-hidden="true">✦</div>
                <div>
                    <h1 data-i18n="title">关于这个站</h1>
                    <div class="sub" data-i18n="subtitle">一个人的静态小站，慢慢更新</div>
                </div>
            </div>
        </div>

        <section class="section">
            <div class="container about-grid">
                <article class="prose" id="aboutProse"></article>

                <aside class="side">
                    <div class="block">
                        <h3 data-i18n="stack_title">站点的构成</h3>
                        <ul class="tag-list" id="stackTags"></ul>
                    </div>
                    <div class="block">
                        <h3 data-i18n="log_title">大事记</h3>
                        <ul class="log" id="changelog"></ul>
                    </div>
                    <div class="block">
                        <h3 data-i18n="contact_title">找到我</h3>
                        <ul class="contact-list" id="contactList"></ul>
                        <p class="contact-note" data-i18n="contact_note">站点有问题？欢迎直接开一个 Issue。</p>
                    </div>
                </aside>
            </div>
        </section>
`,

    i18n: {
        'zh-CN': {
            meta_description: '云陌轩是谁、在做什么，以及这个站点为什么是现在这个样子。',
            title: '关于这个站',
            subtitle: '一个人的静态小站，慢慢更新',
            stack_title: '站点的构成',
            log_title: '大事记',
            contact_title: '找到我',
            contact_note: '站点有问题？欢迎直接开一个 Issue。',
            contact_github: 'GitHub',
            contact_github_sub: '代码和别的项目',
            contact_repo: '本站源码',
            contact_repo_sub: '这个页面本身也在里面',
            contact_issues: '提一个 Issue',
            contact_issues_sub: '错别字、坏链接、任何建议',
            contact_mail: '发邮件',
            contact_mail_sub: '不公开，仅用于联系',
            bio_1: '我是云陌轩。这个站用来放我自己做出来的东西，和顺手写下的笔记 —— 没有订阅，没有评论区，也没有算法在决定该让你看到什么。',
            bio_2: '我更愿意把一件事做完，而不是一开始做十件。所以站点长成现在这样：五个页面、没有框架，打开之后不再向任何别处请求东西。你摸到的每一个交互都是手写的 JavaScript，包括深色主题和这四种语言。',
            bio_3: '如果你是顺着某个链接误闯进来的，「文章」里记着这些坑是怎么踩的；如果你本来就认识我，直接开个 Issue 告诉我哪里写错了，比什么渠道都快。',
            bio_note: '这个站是开源的，源码地址就在旁边一栏 —— 喜欢这种写法的话，拿去改成你自己的样子。'
        },
        'zh-TW': {
            meta_description: '雲陌軒是誰、在做什麼，以及這個站點為什麼是現在這個樣子。',
            title: '關於這個站',
            subtitle: '一個人的靜態小站，慢慢更新',
            stack_title: '站點的構成',
            log_title: '大事記',
            contact_title: '找到我',
            contact_note: '站點有問題？歡迎直接開一個 Issue。',
            contact_github: 'GitHub',
            contact_github_sub: '程式碼和其他項目',
            contact_repo: '本站原始碼',
            contact_repo_sub: '這個頁面本身也在裡面',
            contact_issues: '提一個 Issue',
            contact_issues_sub: '錯別字、壞連結、任何建議',
            contact_mail: '發郵件',
            contact_mail_sub: '不公開，僅用於聯絡',
            bio_1: '我是雲陌軒。這個站用來放我自己做出來的東西，和順手寫下的筆記 —— 沒有訂閱，沒有留言區，也沒有演算法在決定該讓你看到什麼。',
            bio_2: '我更願意把一件事做完，而不是一開始做十件。所以站點長成現在這樣：五個頁面、沒有框架，開啟之後不再往別處請求任何東西。你摸到的每一個互動都是手寫的 JavaScript，包括深色主題和這四種語言。',
            bio_3: '如果你是順著某個連結誤闖進來的，「文章」裡記著這些坑是怎麼踩的；如果你本來就認識我，直接開一個 Issue 告訴我哪裡寫錯了，比什麼管道都快。',
            bio_note: '這個站是開源的，原始碼位址就在旁邊一欄 —— 喜歡這種寫法的話，拿去改成你自己的樣子。'
        },
        'en': {
            meta_description: 'Who Yunmo-Xuan is, what is going on here, and why this site ended up looking like this.',
            title: 'About this site',
            subtitle: 'A one-person static site, updated slowly',
            stack_title: 'What it is made of',
            log_title: 'Changelog',
            contact_title: 'Find me',
            contact_note: 'Something broken here? An issue is the fastest way to tell me.',
            contact_github: 'GitHub',
            contact_github_sub: 'Code and other things',
            contact_repo: 'Site source',
            contact_repo_sub: 'This page lives in there too',
            contact_issues: 'Open an issue',
            contact_issues_sub: 'Typos, broken links, any suggestion',
            contact_mail: 'Email',
            contact_mail_sub: 'Not published, contact only',
            bio_1: 'I am Yunmo-Xuan. This site holds the things I built and the notes I wrote on the way — no subscription, no comment section, no algorithm deciding what you should look at.',
            bio_2: 'I would rather finish one thing than start ten. That is why the site looks the way it does: five pages, no framework, and nothing fetched from anywhere else once the page is open. Every interaction here is hand-written JavaScript, the dark theme and the four languages included.',
            bio_3: 'If you wandered in from a link, the Writing page records how those traps were stepped in. If you already know me, opening an issue to point out what is wrong is faster than any other channel.',
            bio_note: 'The site is open source — the repository is listed right beside this text. Take it and bend it into your own.'
        },
        'ja': {
            meta_description: '雲陌軒が誰で、何をしていて、このサイトがなぜこの形になったのか。',
            title: 'このサイトについて',
            subtitle: '一人の静的サイト、ゆっくり更新',
            stack_title: 'サイトの構成',
            log_title: '変更履歴',
            contact_title: '連絡先',
            contact_note: '不具合があれば Issue をどうぞ。',
            contact_github: 'GitHub',
            contact_github_sub: 'コードとその他の作品',
            contact_repo: 'サイトのソース',
            contact_repo_sub: 'このページもそこに入っています',
            contact_issues: 'Issue を開く',
            contact_issues_sub: '誤字・壊れたリンク・提案なら何でも',
            contact_mail: 'メール',
            contact_mail_sub: '非公開、連絡用のみ',
            bio_1: '雲陌軒です。このサイトには、自分で作ったものと、作りながら書き留めたノートを入れています。購読もコメント欄もありません。何が目に留まるかを決めるアルゴリズムも。',
            bio_2: '十個始めるより、ひとつ終わらせたい。だからサイトは今の形になりました。5 ページ、フレームワークなし、ページを開いた後に他から何かを取りに行くこともありません。ここに有るインタラクションは全部手書きの JavaScript です。ダークテーマも4言語も含めて。',
            bio_3: 'リンクから迷い込んだなら、ノート側に踏んだ落とし穴の記録があります。知り合いなら、おかしい箇所を Issue で教えてください。いちばん早いのはそれです。',
            bio_note: 'このサイトはオープンソースで、リポジトリはすぐ横に書いてあります。持っていって、自分の形に曲げてください。'
        }
    },

    render: function render(ctx) {
        var DATA = window.PAGE_DATA || { changelog: [], stack: [] };
        var site = window.SITE || {};

        /* ---------- 正文：三到四段，说清楚这是什麼 ---------- */
        var prose = [
            { p: ctx.t('bio_1') },
            { p: ctx.t('bio_2') },
            { p: ctx.t('bio_3') },
            { note: ctx.t('bio_note') }
        ];
        document.getElementById('aboutProse').innerHTML = renderBlocks(prose);

        /* ---------- 侧栏 ---------- */
        var tags = document.getElementById('stackTags');
        tags.innerHTML = (DATA.stack || []).map(function (s) {
            return '<li><span class="tag">' + escHtml(s) + '</span></li>';
        }).join('');

        var log = document.getElementById('changelog');
        log.innerHTML = (DATA.changelog || []).map(function (c) {
            return '<li>' +
                '<time datetime="' + escHtml(c.date) + '">' + escHtml(c.date) + '</time>' +
                '<p>' + escHtml(ctx.pick(c.text)) + '</p>' +
                '</li>';
        }).join('');

        var items = [
            { href: site.github, icon: 'i-github', t: 'contact_github', s: 'contact_github_sub', external: true },
            { href: site.repo, icon: 'i-code', t: 'contact_repo', s: 'contact_repo_sub', external: true },
            { href: site.issues + '/new', icon: 'i-issue', t: 'contact_issues', s: 'contact_issues_sub', external: true }
        ];
        if (site.email) {
            items.unshift({ href: 'mailto:' + site.email, icon: 'i-mail', t: 'contact_mail', s: 'contact_mail_sub', external: false });
        }

        document.getElementById('contactList').innerHTML = items.map(function (it) {
            return '<li><a href="' + safeUrl(it.href) + '"' +
                (it.external ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' +
                '<svg class="icon" aria-hidden="true"><use href="#' + it.icon + '" /></svg>' +
                '<span>' + ctx.t(it.t) + '<small>' + ctx.t(it.s) + '</small></span>' +
                '</a></li>';
        }).join('');
    },

    data: { changelog: CHANGELOG, stack: STACK },

    jsonld: {
        '@context': 'https://schema.org',
        '@type': 'AboutPage',
        name: '关于 · 云陌轩',
        url: 'https://yunmo-xuan.github.io/about.html',
        mainEntity: {
            '@type': 'Person',
            name: '云陌轩',
            alternateName: 'Yunmo-Xuan',
            url: 'https://yunmo-xuan.github.io/',
            sameAs: ['https://github.com/Yunmo-Xuan']
        }
    }
};
