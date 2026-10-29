/* 文章页 */
'use strict';

/* 文章数据：新增一篇 = 在数组开头加一个对象。
   title / summary / body 都按语言存放，取不到当前语言时回退简体中文。 */
const POSTS = [
    {
        slug: 'rewrite-2026',
        date: '2026-10-28',
        tags: ['站点日志', '前端'],
        title: {
            'zh-CN': '把个人站推倒重来：五个单文件、零依赖、四种语言',
            en: 'Rewriting this site: five single files, zero dependencies, four languages'
        },
        summary: {
            'zh-CN': '旧版站点有 4 个页面、1 处写错的链接和一堆没做完的想法。这次重写把它们一次收拾干净。',
            en: 'The old site had four pages, a handful of links that 404\'d, and a to-do list that never got done. This rewrite closes all of it.'
        },
        body: {
            'zh-CN': [
                { p: '旧版站点其实没走多远：导航里的「文章」和「项目」指向两个从未存在的文件，谁点谁吃 404；首页三张卡片又指向 `games.html`、`downloads.html`、`other.html`，同样一个都不在。剩下的页面里还留着 `你的用户名`、`your@email.com` 和一段并不属于这里的自我介绍。' },
                { p: '这些都不是设计问题，是**没做完**。所以这次重写的顺序，是把已经存在的东西先接牢，再谈好看。' },
                { h: '约束先定下来' },
                { ol: [
                    '每个页面是一个自包含的 HTML 文件，可以直接替换上传，不需要构建产物、不需要 `node_modules`',
                    '不向任何 CDN 取字体和图标，也不接统计脚本',
                    '浅色与深色两套主题，简体中文、繁體中文、English、日本語四套文案，两两正交'
                ] },
                { p: '前两条几乎是没有争议的，第三条有。' },
                { h: '共享代码，但产物仍然自包含' },
                { p: '「单文件」和「避免复制粘贴」看起来冲突：五个页面各带一份样式和脚本，改一次配色要动五个地方。' },
                { p: '解决办法是把**源码**和**产物**分开。`src/core.css` 与 `src/core.js` 是唯一的真源，`src/pages/` 下每个文件声明自己那一页的文案、数据和渲染函数，`node src/build.js` 把共享外壳展开进每一页，输出到 `site/`。' },
                { code: 'src/\n  core.css        设计令牌 + 组件样式\n  core.js         多语言 / 主题 / 导航 / 入场动画\n  pages/\n    10-index.js\n    20-projects.js\n    30-blog.js\n    40-about.js\n    90-404.js\n  build.js        组装并写出 site/*.html' },
                { p: '上传的仍然是五个独立的单文件，谁也不会去引用谁；改主题只需要改一处，然后重新生成。' },
                { h: '两个坑' },
                { p: '**FOUC。** 主题在 CSS 加载完、脚本执行前才确定，深色用户会先看到一帧浅色背景。解决办法是把决定主题的三行脚本直接写进 `<head>`，在样式之前执行；`data-theme` 一旦落到 `<html>` 上，后面的脚本只做同步。' },
                { p: '**隐私模式里的 localStorage。** Safari 私密浏览下读写会抛异常，直接调用会让整段脚本挂掉 —— 表现就是语言切换点了没反应。现在所有读写都包在 `try / catch` 里，读失败退回默认值，写失败只是记不住。' },
                { h: '正文只走结构化渲染' },
                { p: '文章正文写成结构化数组：`{p: 段落}`、`{h: 小标题}`、`{code: 代码}`、`{ul: 列表}`，由 `renderBlocks()` 生成 HTML。所有文本先转义再排版，链接再过一遍 `safeUrl()`，`javascript:` 之类的伪协议走不到 `<a href>` 上。写起来像 Markdown，又不用引入解析库。' },
                { h: '还没做' },
                { p: '繁体与日文目前只覆盖界面文案，正文仍然回退到简体中文。补全的方式很简单，把 `POSTS` 里对应语言的 `body` 填上即可，不用碰逻辑。' },
                { note: '这一页本身就是那次重写的产物，包括它自己的源码。' }
            ],
            en: [
                { p: 'The previous version of this site never got far: the nav linked to «Writing» and «Projects», two files that never existed, so every click landed on a 404. Three cards on the home page pointed at `games.html`, `downloads.html` and `other.html` — none of those either. The remaining pages still carried `your-username`, `your@email.com` and a self-introduction that was never mine.' },
                { p: 'None of that was a design problem. It was **unfinished work**. So the rewrite went in order: make what already exists solid, then talk about looks.' },
                { h: 'Constraints first' },
                { ol: [
                    'Every page is a self-contained HTML file — replace one file, ship one change. No build artifacts in production, no `node_modules`',
                    'No fonts or icons from a CDN, no analytics script',
                    'Two colour themes and four UI languages (zh-CN, zh-TW, en, ja), orthogonal to each other'
                ] },
                { p: 'The first two were uncontroversial. The third one was not.' },
                { h: 'Shared source, standalone output' },
                { p: '«Single file» and «avoid copy-paste» seem to contradict each other: five pages carrying five copies of the stylesheet means recolouring takes five edits.' },
                { p: 'The fix is to separate **source** from **output**. `src/core.css` and `src/core.js` are the only truth; each file under `src/pages/` declares its own copy, data and render function; `node src/build.js` expands the shared shell into every page and writes it out to `site/`.' },
                { code: 'src/\n  core.css        design tokens + component styles\n  core.js         i18n / theme / nav / reveal\n  pages/\n    10-index.js\n    20-projects.js\n    30-blog.js\n    40-about.js\n    90-404.js\n  build.js        assembles and writes site/*.html' },
                { p: 'What gets uploaded is still five independent HTML files, none of them referencing each other. Change the palette once, rebuild, done.' },
                { h: 'Two traps' },
                { p: '**FOUC.** If the theme is resolved after CSS lands, dark-mode users get one frame of a light background. The few lines that decide the theme now live in `<head>`, before the stylesheet. Once `data-theme` is on `<html>`, everything later is synchronous.' },
                { p: '**localStorage in private mode.** Safari private browsing throws on read and write. An uncaught throw kills the whole script, which looks exactly like «the language switcher does nothing». Every access is wrapped in `try / catch`: a failed read falls back to the default, a failed write only costs the memory.' },
                { h: 'Structured prose only' },
                { p: 'Article bodies are arrays of blocks — `{p: paragraph}`, `{h: heading}`, `{code: listing}`, `{ul: list}` — turned into HTML by `renderBlocks()`. Text is escaped before any formatting, and links pass through `safeUrl()`, so a `javascript:` pseudo-protocol never reaches an `<a href>`. It reads like Markdown without pulling in a parser.' },
                { h: 'Still missing' },
                { p: 'Traditional Chinese and Japanese currently cover UI strings only; article bodies fall back to Simplified Chinese. Filling the gap is data work: add a `body` for that language to the `POSTS` entry, no logic involved.' },
                { note: 'This page is itself a product of that rewrite, including its own source.' }
            ]
        }
    },
    {
        slug: '404-that-works',
        date: '2026-10-26',
        tags: ['前端', 'GitHub Pages'],
        title: {
            'zh-CN': '让 GitHub Pages 的 404 页真正有用',
            en: 'Making the GitHub Pages 404 page actually useful'
        },
        summary: {
            'zh-CN': '404 页是站点里唯一一个由平台触发的页面。它值得比一句「页面不存在」多做点事。',
            en: 'The 404 is the only page a platform triggers for you. It deserves more than a shrug.'
        },
        body: {
            'zh-CN': [
                { p: 'GitHub Pages 认根目录下的 `404.html`。文件名叫 404，但内容完全是普通 HTML —— 也就是说它可以有导航、有样式、有脚本，跟首页一样体面。' },
                { h: '链接必须是根绝对路径' },
                { p: '这是最容易踩的一条。用户可能访问 `/notes/draft/index.html` 这样多层的错误路径，此时页面里写 `href="index.html"` 会被解析成 `/notes/draft/index.html`，**在 404 页里再触发一个 404**。' },
                { p: '所以这一页上的站内链接一律写成 `/index.html`、`/blog.html`。站点其他页面相反，用相对路径更方便本地双击打开预览。两种写法不矛盾，只是适用场景不同。' },
                { code: '<!-- 只在 404.html 里这么写 -->\n<a href="/index.html">首页</a>\n<a href="/blog.html">文章</a>' },
                { h: '别让访客走进死胡同' },
                { p: '一个有用的 404 至少给出三件事：这是怎么回事（而不是「出错了」）、现在能做什么、以及如果链接本该有效，该反馈给谁。' },
                { ul: [
                    '把用户原本想访问的路径显示出来，他才知道是链接写错了还是页面删了',
                    '直接列出站点现存的全部页面，而不是「返回首页」一条路',
                    '给一个反馈入口。这里指向仓库的新建 Issue 页面，带上前缀参数，正文里已经写好路径'
                ] },
                { h: '状态码不由 HTML 决定' },
                { note: '页面本身写得再像 404，也改不了 HTTP 状态码 —— 那是 Pages 侧的行为。反过来说，只要文件名是 `404.html` 并且放在仓库根目录，浏览器收到的仍然是 404，即使内容做得和首页一样丰富。' },
                { p: '顺手的事：加一个 `noindex` 的 meta，免得搜索引擎把错误页收进索引。这一页本来就不该出现在结果里。' }
            ],
            en: [
                { p: 'GitHub Pages serves whatever sits in `404.html` at the repository root. The name says 404, but the file is ordinary HTML — it can have navigation, styles and scripts, and be as presentable as the home page.' },
                { h: 'Links must be root-absolute' },
                { p: 'This is the easiest one to get wrong. A visitor might hit a nested path like `/notes/draft/index.html`, where `href="index.html"` resolves to `/notes/draft/index.html` — **a 404 page that 404s again**.' },
                { p: 'So every internal link on this page is written as `/index.html`, `/blog.html`. Every other page does the opposite and uses relative links, which preview nicely when opened from disk. Both are correct; they solve for different entry points.' },
                { code: '<!-- only here, in 404.html -->\n<a href="/index.html">Home</a>\n<a href="/blog.html">Writing</a>' },
                { h: 'Do not trap the visitor' },
                { p: 'A useful 404 answers at least three questions: what happened (not just «error»), what to do now, and who to tell if a link should have worked.' },
                { ul: [
                    'Show the path they were after, so they can tell a typo from a deleted page',
                    'List every page the site actually has, instead of offering only «go home»',
                    'Offer a way to report it. Here that opens a new issue with the broken path already filled in'
                ] },
                { h: 'HTML does not pick the status code' },
                { note: 'However much a page looks like a 404, the HTTP status is the platform\'s call. The reverse also holds: as long as the file is named `404.html` at the root, the browser still receives a 404 even when the content is as rich as the home page.' },
                { p: 'Worth adding while you are there: a `noindex` meta, so search engines do not keep error pages in their index. This page has no business showing up in results.' }
            ]
        }
    }
];

module.exports = {
    file: 'blog.html',
    path: '/blog.html',
    active: 'blog',
    ogType: 'article',

    title: {
        'zh-CN': '文章 · 云陌轩',
        'zh-TW': '文章 · 雲陌軒',
        'en': 'Writing · Yunmo-Xuan',
        'ja': 'ノート · 雲陌軒'
    },
    desc: {
        'zh-CN': '云陌轩的技术笔记与零散思考：前端、静态站点和顺手记下的小结论。',
        'en': 'Notes and half-formed thoughts from Yunmo-Xuan: front-end, static sites, and small conclusions worth writing down.'
    },

    styles: `
        .post-list { display: grid; gap: 18px; margin-top: 34px; }
        .post-row {
            display: block; text-decoration: none; color: inherit;
            padding: 24px; border-radius: var(--radius);
            background: var(--surface); border: 1px solid var(--line); box-shadow: var(--shadow-1);
            transition: transform .22s ease, box-shadow .28s ease, border-color .22s ease;
        }
        .post-row:hover { transform: translateY(-4px); box-shadow: var(--shadow-2); border-color: var(--line-strong); }
        .post-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 14px; font-size: .84rem; color: var(--faint); }
        .post-meta time { font-family: var(--mono); }
        .post-meta .sep { width: 3px; height: 3px; border-radius: 50%; background: var(--line-strong); }
        .post-row h2 { font-size: 1.32rem; font-weight: 750; letter-spacing: -.02em; line-height: 1.35; margin: 10px 0 8px; }
        .post-row:hover h2 { color: var(--accent-ink); }
        .post-row p { color: var(--muted); font-size: .96rem; margin: 0; }
        .post-row .tag-list { margin-top: 14px; }

        /* 阅读视图 */
        #postView { padding-top: 44px; }
        .back-row { margin-bottom: 26px; }
        .post-head h1 { font-size: clamp(1.85rem, 4.2vw, 2.6rem); font-weight: 800; letter-spacing: -.03em; line-height: 1.22; }
        .post-head .post-meta { margin-top: 14px; }
        .post-body { margin-top: 30px; }
        .post-foot { margin-top: 48px; padding-top: 26px; border-top: 1px solid var(--line); display: grid; gap: 14px; }
        .post-foot .navpair { display: flex; flex-wrap: wrap; gap: 12px; justify-content: space-between; }
        .post-foot .linkcard {
            flex: 1 1 240px; padding: 16px 18px; border-radius: var(--radius-sm);
            border: 1px solid var(--line); background: var(--surface); text-decoration: none; color: inherit;
            transition: border-color .2s ease, transform .2s ease;
        }
        .post-foot .linkcard:hover { border-color: var(--accent); transform: translateY(-2px); }
        .post-foot .linkcard small { display: block; color: var(--faint); font-size: .78rem; margin-bottom: 4px; }
        .post-foot .linkcard span { font-weight: 650; font-size: .95rem; }
        .back-top { font-size: .86rem; color: var(--muted); }
        .divider { border: 0; border-top: 1px solid var(--line); margin: 40px 0; }
    `,

    body: `        <section class="page-head" id="listHead">
            <div class="container">
                <span class="eyebrow" data-i18n="eyebrow">文章</span>
                <h1 data-i18n="title">记下来的东西</h1>
                <p class="lead" data-i18n="lead">
                    技术笔记、踩过的坑，和一些还没成形的判断。写完就发，不攒大系列。
                </p>
            </div>
        </section>

        <section class="section tight" id="listView">
            <div class="container">
                <div class="filterbar" id="postFilters" hidden role="group" aria-label="按标签筛选文章"></div>
                <div class="post-list" id="postList"></div>
                <div class="empty" id="postEmpty" hidden>
                    <p data-i18n="no_match">没有匹配这个标签的文章。</p>
                </div>
            </div>
        </section>

        <section class="section tight" id="postView" hidden>
            <div class="container">
                <div class="back-row">
                    <button type="button" class="btn btn-ghost btn-sm" id="backToList">
                        <svg class="icon" aria-hidden="true"><use href="#i-arrow-left" /></svg>
                        <span data-i18n="back_list">全部文章</span>
                    </button>
                </div>
                <article class="prose" id="postContent"></article>
            </div>
        </section>
`,

    i18n: {
        'zh-CN': {
            meta_description: '云陌轩的技术笔记与零散思考：前端、静态站点和顺手记下的小结论。',
            eyebrow: '文章', title: '记下来的东西',
            lead: '技术笔记、踩过的坑，和一些还没成形的判断。写完就发，不攒大系列。',
            no_match: '没有匹配这个标签的文章。',
            back_list: '全部文章',
            draft: '草稿',
            nav_newer: '下一篇', nav_older: '上一篇',
            back_top: '回到本页顶部',
            count_label: '共 %d 篇',
            published: '发布于'
        },
        'zh-TW': {
            meta_description: '雲陌軒的技術筆記與零散思考：前端、靜態站點和順手記下的小結論。',
            eyebrow: '文章', title: '記下來的東西',
            lead: '技術筆記、踩過的坑，和一些還沒成形的判斷。寫完就發，不攢大系列。',
            no_match: '沒有符合這個標籤的文章。',
            back_list: '全部文章',
            draft: '草稿',
            nav_newer: '下一篇', nav_older: '上一篇',
            back_top: '回到本頁頂端',
            count_label: '共 %d 篇',
            published: '發布於'
        },
        'en': {
            meta_description: 'Notes and half-formed thoughts from Yunmo-Xuan: front-end, static sites, and small conclusions worth writing down.',
            eyebrow: 'Writing', title: 'Things I wrote down',
            lead: 'Technical notes, mistakes, and judgements that are not settled yet. Published as they finish, no grand series.',
            no_match: 'No posts match this tag.',
            back_list: 'All posts',
            draft: 'Draft',
            nav_newer: 'Next', nav_older: 'Previous',
            back_top: 'Back to top of this page',
            count_label: '%d post(s)',
            published: 'Published'
        },
        'ja': {
            meta_description: '雲陌軒の技術ノート。フロントエンド、静的サイト、書き留めた小さな結論。',
            eyebrow: 'ノート', title: '書き留めたこと',
            lead: '技術ノート、失敗、まだ断定できない判断。書けたものから出して、大きな連載にはしません。',
            no_match: 'このタグに該当する記事はありません。',
            back_list: 'すべての記事',
            draft: '下書き',
            nav_newer: '次へ', nav_older: '前へ',
            back_top: 'このページの上へ',
            count_label: '%d 件',
            published: '公開'
        }
    },

    render: function render(ctx) {
        var POSTS = (window.PAGE_DATA || []).slice().sort(function (a, b) {
            return String(b.date).localeCompare(String(a.date));
        });

        var listHead = document.getElementById('listHead');
        var listView = document.getElementById('listView');
        var postView = document.getElementById('postView');
        var listEl = document.getElementById('postList');
        var bar = document.getElementById('postFilters');
        var empty = document.getElementById('postEmpty');
        var content = document.getElementById('postContent');
        var count = document.getElementById('postCount');
        if (!listEl) return;

        var active = '';

        /* 中日文按字符估读取时长，其他语言按词 */
        function minutes(text) {
            var cjk = (text.match(/[㐀-䶿一-鿿぀-ヿ가-힯]/g) || []).length;
            var words = (text.replace(/[㐀-䶿一-鿿぀-ヿ가-힯]/g, '').match(/[A-Za-z0-9']+/g) || []).length;
            return Math.max(1, Math.round((cjk / 320 + words / 220) || 1));
        }

        function plainText(post) {
            var parts = [];
            (ctx.pick(post.body) || []).forEach(function (b) {
                if (b.p) parts.push(b.p);
                if (b.h) parts.push(b.h);
                if (b.note) parts.push(b.note);
                if (b.quote) parts.push(b.quote);
                if (b.ul) parts = parts.concat(b.ul);
                if (b.ol) parts = parts.concat(b.ol);
            });
            return parts.join(' ');
        }

        function meta(post, withTags) {
            var mins = minutes(plainText(post));
            var row = '<div class="post-meta">' +
                '<time datetime="' + escHtml(post.date) + '">' + escHtml(post.date) + '</time>' +
                '<span class="sep" aria-hidden="true"></span>' +
                '<span>' + mins + ' ' + ctx.t('c_min_read') + '</span>' +
                (post.draft ? '<span class="sep" aria-hidden="true"></span><span class="status status-archived">' + ctx.t('draft') + '</span>' : '') +
                '</div>';
            if (withTags) {
                row += '<ul class="tag-list">' + (post.tags || []).map(function (t) {
                    return '<li><span class="tag">' + escHtml(t) + '</span></li>';
                }).join('') + '</ul>';
            }
            return row;
        }

        function renderList() {
            var items = POSTS.filter(function (p) {
                if (p.draft) return false;
                return !active || (p.tags || []).indexOf(active) >= 0;
            });
            listEl.innerHTML = items.map(function (p) {
                return '<a class="post-row reveal" href="#/post/' + encodeURIComponent(p.slug) + '">' +
                    '<h2>' + escHtml(ctx.pick(p.title)) + '</h2>' +
                    meta(p, false) +
                    '<p>' + escHtml(ctx.pick(p.summary)) + '</p>' +
                    (p.tags && p.tags.length ? '<ul class="tag-list">' + p.tags.map(function (t) {
                        return '<li><span class="tag">' + escHtml(t) + '</span></li>';
                    }).join('') + '</ul>' : '') +
                    '</a>';
            }).join('\n');
            empty.hidden = items.length !== 0;
            if (count) count.textContent = ctx.t('count_label').replace('%d', items.length);
            if (window.SITE_RUNTIME) window.SITE_RUNTIME.reveal();
        }

        function renderPost(slug) {
            var idx = POSTS.findIndex(function (p) { return p.slug === slug; });
            if (idx < 0) return false;
            var post = POSTS[idx];
            var blocks = (post.body && (post.body[ctx.lang()] || post.body['zh-CN'] || post.body.en)) || [];

            var prev = POSTS[idx + 1];
            var next = POSTS[idx - 1];
            var nav = '';
            if (prev || next) {
                nav = '<div class="navpair">' +
                    (prev ? '<a class="linkcard" href="#/post/' + encodeURIComponent(prev.slug) + '"><small>← ' + ctx.t('nav_older') + '</small><span>' + escHtml(ctx.pick(prev.title)) + '</span></a>' : '<span class="linkcard" style="visibility:hidden"></span>') +
                    (next ? '<a class="linkcard" href="#/post/' + encodeURIComponent(next.slug) + '" style="text-align:right"><small>' + ctx.t('nav_newer') + ' →</small><span>' + escHtml(ctx.pick(next.title)) + '</span></a>' : '<span class="linkcard" style="visibility:hidden"></span>') +
                    '</div>';
            }

            content.innerHTML =
                '<header class="post-head">' +
                '<h1>' + escHtml(ctx.pick(post.title)) + '</h1>' +
                meta(post, true) +
                '</header>' +
                '<div class="post-body prose">' + renderBlocks(blocks) + '</div>' +
                '<hr class="divider" />' +
                '<footer class="post-foot">' + nav +
                '<button type="button" class="back-top" id="backTop">' + ctx.t('back_top') + '</button>' +
                '</footer>';

            var backTop = document.getElementById('backTop');
            if (backTop) backTop.addEventListener('click', function () {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });

            document.title = ctx.pick(post.title) + ' · ' + ctx.t('brand');
            listHead.hidden = true;
            listView.hidden = true;
            postView.hidden = false;
            return true;
        }

        function showList() {
            listHead.hidden = false;
            listView.hidden = false;
            postView.hidden = true;
            document.title = ctx.t('doc_title');
            renderList();
        }

        function route() {
            var m = location.hash.match(/^#\/post\/([^/?]+)/);
            if (m) {
                var slug;
                try { slug = decodeURIComponent(m[1]); }
                catch (error) { showList(); return; }
                if (renderPost(slug)) {
                    window.scrollTo({ top: 0, behavior: 'auto' });
                    return;
                }
            }
            showList();
        }

        /* 标签筛选 */
        var tags = [];
        POSTS.forEach(function (p) {
            (p.tags || []).forEach(function (t) { if (tags.indexOf(t) < 0) tags.push(t); });
        });
        if (tags.length > 1) {
            bar.hidden = false;
            bar.innerHTML = '<button type="button" class="pill" aria-pressed="true" data-tag="">' + ctx.t('c_all') + '</button>' +
                tags.map(function (t) {
                    return '<button type="button" class="pill" aria-pressed="false" data-tag="' + escHtml(t) + '">' + escHtml(t) + '</button>';
                }).join('') +
                '<span class="count" id="postCount"></span>';
            Array.prototype.forEach.call(bar.querySelectorAll('.pill'), function (pill) {
                pill.addEventListener('click', function () {
                    active = pill.getAttribute('data-tag');
                    Array.prototype.forEach.call(bar.querySelectorAll('.pill'), function (x) {
                        x.setAttribute('aria-pressed', String(x === pill));
                    });
                    if (location.hash) { location.hash = ''; return; }
                    renderList();
                });
            });
        }

        document.getElementById('backToList').onclick = function () {
            if (location.hash) location.hash = '';
            else showList();
        };

        window.onhashchange = route;
        count = document.getElementById('postCount');
        route();
    },

    data: POSTS,

    jsonld: {
        '@context': 'https://schema.org',
        '@type': 'Blog',
        name: '文章 · 云陌轩',
        url: 'https://yunmo-xuan.github.io/blog.html',
        inLanguage: ['zh-CN', 'zh-TW', 'en', 'ja'],
        blogPost: [
            { '@type': 'BlogPosting', headline: '把个人站推倒重来：五个单文件、零依赖、四种语言', datePublished: '2026-10-28', url: 'https://yunmo-xuan.github.io/blog.html#/post/rewrite-2026' },
            { '@type': 'BlogPosting', headline: '让 GitHub Pages 的 404 页真正有用', datePublished: '2026-10-26', url: 'https://yunmo-xuan.github.io/blog.html#/post/404-that-works' }
        ],
        publisher: { '@type': 'Person', name: '云陌轩', url: 'https://yunmo-xuan.github.io/' }
    }
};
