/* 首页 */
'use strict';

module.exports = {
    file: 'index.html',
    path: '/',
    active: 'home',

    title: {
        'zh-CN': '云陌轩 · 个人空间',
        'zh-TW': '雲陌軒 · 個人空間',
        'en': 'Yunmo-Xuan · Personal Site',
        'ja': '雲陌軒 · パーソナルサイト'
    },
    desc: {
        'zh-CN': '云陌轩的个人空间：纯手写的静态小站，记录做过的项目与笔记。零框架、零依赖、零外部请求。',
        'en': 'Yunmo-Xuan\'s corner of the internet: a hand-written static site with projects and notes. No framework, no dependencies, no external requests.'
    },

    styles: `
        /* ---------- Hero ---------- */
        .hero { position: relative; padding: 76px 0 72px; overflow: hidden; }
        .hero-bg { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
        .hero-bg::before {
            content: ''; position: absolute; top: -260px; right: -160px;
            width: 720px; height: 720px; border-radius: 50%;
            background: radial-gradient(circle, var(--accent-soft) 0%, transparent 68%);
        }
        .hero-bg::after {
            content: ''; position: absolute; inset: 0;
            background-image: linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px);
            background-size: 56px 56px;
            -webkit-mask-image: radial-gradient(circle at 78% 8%, #000 0%, transparent 62%);
            mask-image: radial-gradient(circle at 78% 8%, #000 0%, transparent 62%);
            opacity: .6;
        }
        .hero-grid { position: relative; z-index: 1; display: grid; grid-template-columns: 1.15fr .85fr; gap: 56px; align-items: center; }
        .hero h1 {
            font-size: clamp(2.4rem, 5.6vw, 3.9rem); font-weight: 800;
            line-height: 1.1; letter-spacing: -.035em; margin: 18px 0 20px;
        }
        .hero h1 .grad {
            background: var(--grad-text);
            -webkit-background-clip: text; background-clip: text;
            -webkit-text-fill-color: transparent; color: transparent;
        }
        .hero .lead { font-size: 1.13rem; color: var(--muted); max-width: 52ch; margin-bottom: 30px; }
        .hero .lead strong { color: var(--text); font-weight: 650; }

        /* 站点自检面板 */
        .panel {
            background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-lg);
            box-shadow: var(--shadow-2); padding: 24px; max-width: 460px;
        }
        .panel-head { display: flex; align-items: center; gap: 8px; margin-bottom: 20px; }
        .panel-head .dots { display: flex; gap: 6px; }
        .panel-head .dots i { width: 11px; height: 11px; border-radius: 50%; background: var(--line-strong); }
        .panel-title { margin-left: auto; font-family: var(--mono); font-size: .78rem; color: var(--faint); }
        .stat-row { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; padding: 13px 0; border-top: 1px dashed var(--line); }
        .stat-row:first-of-type { border-top: 0; }
        .stat-row .k { font-size: .92rem; color: var(--muted); }
        .stat-row .v { font-family: var(--mono); font-size: 1.5rem; font-weight: 700; letter-spacing: -.03em; color: var(--text); }
        .panel-note { margin-top: 18px; font-size: .84rem; color: var(--faint); display: flex; align-items: center; gap: 7px; }
        .panel-note .icon { color: var(--accent); }

        .principle { display: flex; gap: 16px; align-items: flex-start; }
        .principle .num {
            font-family: var(--mono); font-size: .8rem; font-weight: 700; color: var(--accent-ink);
            background: var(--accent-soft); border-radius: 9px; padding: 5px 9px; flex-shrink: 0; margin-top: 3px;
        }
        .grid-3 { margin-top: 34px; }

        @media (max-width: 980px) {
            .hero-grid { grid-template-columns: 1fr; gap: 40px; }
            .panel { max-width: none; }
        }
        @media (max-width: 620px) {
            .hero { padding: 48px 0 54px; }
            .hero-actions .btn { flex: 1 1 auto; }
        }
    `,

    body: `        <section class="hero">
            <div class="hero-bg" aria-hidden="true"></div>
            <div class="container hero-grid">
                <div>
                    <span class="chip reveal"><span class="dot" aria-hidden="true"></span><span data-i18n="hero_badge">在线维护中</span></span>
                    <h1 class="reveal d1">
                        <span data-i18n="hero_title_1">你好，我是</span><br />
                        <span class="grad" data-i18n="hero_title_2">云陌轩</span>
                    </h1>
                    <p class="lead reveal d2" data-i18n="hero_desc">
                        这里是我的数字角落 —— 用来放做过的项目、写下的笔记和一些还没成形的想法。
                        整站由手写 <strong>HTML、CSS 和少量 JavaScript</strong> 构成，托管在 GitHub Pages。
                    </p>
                    <div class="hero-actions btn-row reveal d3">
                        <a class="btn btn-primary" href="projects.html">
                            <svg class="icon" aria-hidden="true"><use href="#i-folder" /></svg>
                            <span data-i18n="cta_projects">看看项目</span>
                        </a>
                        <a class="btn btn-ghost" href="blog.html">
                            <svg class="icon" aria-hidden="true"><use href="#i-book" /></svg>
                            <span data-i18n="cta_blog">读读文章</span>
                        </a>
                        <a class="btn btn-ghost" href="https://github.com/Yunmo-Xuan" target="_blank" rel="noopener noreferrer">
                            <svg class="icon" aria-hidden="true"><use href="#i-github" /></svg>
                            GitHub
                        </a>
                    </div>
                </div>

                <aside class="panel reveal d2" aria-labelledby="panelTitle">
                    <div class="panel-head">
                        <span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>
                        <span class="panel-title" id="panelTitle">site.report</span>
                    </div>
                    <div class="stat-row"><span class="k" data-i18n="stat_deps">外部依赖</span><span class="v">0</span></div>
                    <div class="stat-row"><span class="k" data-i18n="stat_requests">外部请求</span><span class="v">0</span></div>
                    <div class="stat-row"><span class="k" data-i18n="stat_langs">界面语言</span><span class="v">4</span></div>
                    <div class="stat-row"><span class="k" data-i18n="stat_themes">配色主题</span><span class="v">2</span></div>
                    <div class="stat-row"><span class="k" data-i18n="stat_pages">站点页面</span><span class="v">5</span></div>
                    <p class="panel-note">
                        <svg class="icon" aria-hidden="true"><use href="#i-zap" /></svg>
                        <span data-i18n="stat_note">无需构建，每个页面都是独立单文件。</span>
                    </p>
                </aside>
            </div>
        </section>

        <section class="section">
            <div class="container">
                <div class="reveal">
                    <span class="eyebrow" data-i18n="guide_eyebrow">导览</span>
                    <h2 class="section-title" data-i18n="guide_title">想去哪儿？</h2>
                    <p class="section-sub" data-i18n="guide_sub">站点目前只有三个去处，都已就绪 —— 没有点了会 404 的按钮。</p>
                </div>

                <div class="card-grid grid-3">
                    <a class="tile-link reveal" href="projects.html">
                        <div class="card">
                            <div class="card-icon"><svg class="icon" aria-hidden="true"><use href="#i-code" /></svg></div>
                            <h3 data-i18n="card_projects_t">项目</h3>
                            <p data-i18n="card_projects_d">动手做出来的东西，连同它们踩过的坑一起留档。</p>
                            <span class="more"><span data-i18n="card_view_projects">查看</span><svg class="icon" aria-hidden="true"><use href="#i-arrow-right" /></svg></span>
                        </div>
                    </a>
                    <a class="tile-link reveal d1" href="blog.html">
                        <div class="card">
                            <div class="card-icon"><svg class="icon" aria-hidden="true"><use href="#i-book" /></svg></div>
                            <h3 data-i18n="card_blog_t">文章</h3>
                            <p data-i18n="card_blog_d">技术笔记与零散思考，按时间倒序排列，可按标签筛选。</p>
                            <span class="more"><span data-i18n="card_view_blog">阅读</span><svg class="icon" aria-hidden="true"><use href="#i-arrow-right" /></svg></span>
                        </div>
                    </a>
                    <a class="tile-link reveal d2" href="about.html">
                        <div class="card">
                            <div class="card-icon"><svg class="icon" aria-hidden="true"><use href="#i-user" /></svg></div>
                            <h3 data-i18n="card_about_t">关于</h3>
                            <p data-i18n="card_about_d">我是谁、在做什么，以及这个站为什么长这个样子。</p>
                            <span class="more"><span data-i18n="card_view_about">了解</span><svg class="icon" aria-hidden="true"><use href="#i-arrow-right" /></svg></span>
                        </div>
                    </a>
                </div>
            </div>
        </section>

        <section class="section">
            <div class="container">
                <div class="reveal">
                    <span class="eyebrow" data-i18n="principle_eyebrow">原则</span>
                    <h2 class="section-title" data-i18n="principle_title">这个站坚持的几件事</h2>
                </div>
                <div class="card-grid grid-3">
                    <div class="card reveal">
                        <div class="principle">
                            <span class="num">01</span>
                            <div>
                                <h3 data-i18n="p1_t">能少则少</h3>
                                <p data-i18n="p1_d">不引框架、不接统计、不从 CDN 拉字体和图标。页面打开即是全部内容。</p>
                            </div>
                        </div>
                    </div>
                    <div class="card reveal d1">
                        <div class="principle">
                            <span class="num">02</span>
                            <div>
                                <h3 data-i18n="p2_t">读得舒服</h3>
                                <p data-i18n="p2_d">中文优先的字体栈、克制的行宽与字号，深浅色都保证足够的对比度。</p>
                            </div>
                        </div>
                    </div>
                    <div class="card reveal d2">
                        <div class="principle">
                            <span class="num">03</span>
                            <div>
                                <h3 data-i18n="p3_t">可持续更新</h3>
                                <p data-i18n="p3_d">文章和项目各集中在页面里的一个数组，加一条内容不必改布局。</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
`,

    i18n: {
        'zh-CN': {
            meta_description: '云陌轩的个人空间：纯手写的静态小站，记录做过的项目与笔记。零框架、零依赖、零外部请求。',
            hero_badge: '在线维护中',
            hero_title_1: '你好，我是', hero_title_2: '云陌轩',
            hero_desc: '这里是我的数字角落 —— 用来放做过的项目、写下的笔记和一些还没成形的想法。整站由手写 <strong>HTML、CSS 和少量 JavaScript</strong> 构成，托管在 GitHub Pages。',
            cta_projects: '看看项目', cta_blog: '读读文章',
            stat_deps: '外部依赖', stat_requests: '外部请求', stat_langs: '界面语言', stat_themes: '配色主题', stat_pages: '站点页面',
            stat_note: '无需构建，每个页面都是独立单文件。',
            guide_eyebrow: '导览', guide_title: '想去哪儿？',
            guide_sub: '站点目前只有三个去处，都已就绪 —— 没有点了会 404 的按钮。',
            card_projects_t: '项目', card_projects_d: '动手做出来的东西，连同它们踩过的坑一起留档。',
            card_blog_t: '文章', card_blog_d: '技术笔记与零散思考，按时间倒序排列，可按标签筛选。',
            card_about_t: '关于', card_about_d: '我是谁、在做什么，以及这个站为什么长这个样子。',
            card_view_projects: '查看', card_view_blog: '阅读', card_view_about: '了解',
            principle_eyebrow: '原则', principle_title: '这个站坚持的几件事',
            p1_t: '能少则少', p1_d: '不引框架、不接统计、不从 CDN 拉字体和图标。页面打开即是全部内容。',
            p2_t: '读得舒服', p2_d: '中文优先的字体栈、克制的行宽与字号，深浅色都保证足够的对比度。',
            p3_t: '可持续更新', p3_d: '文章和项目各集中在页面里的一个数组，加一条内容不必改布局。'
        },
        'zh-TW': {
            meta_description: '雲陌軒的個人空間：純手寫的靜態小站，記錄做過的項目與筆記。零框架、零相依、零外部請求。',
            hero_badge: '線上維護中',
            hero_title_1: '你好，我是', hero_title_2: '雲陌軒',
            hero_desc: '這裡是我的數位角落 —— 用來放做過的項目、寫下的筆記和一些還沒成形的想法。整站用手寫 <strong>HTML、CSS 和少量 JavaScript</strong> 構成，託架在 GitHub Pages。',
            cta_projects: '看看項目', cta_blog: '讀讀文章',
            stat_deps: '外部相依', stat_requests: '外部請求', stat_langs: '介面語言', stat_themes: '配色主題', stat_pages: '網站頁面',
            stat_note: '無需建置，每個頁面都是獨立單檔。',
            guide_eyebrow: '導覽', guide_title: '想去哪裡？',
            guide_sub: '網站目前只有三個去處，都已就緒 —— 沒有點了會 404 的按鈕。',
            card_projects_t: '項目', card_projects_d: '動手做出來的東西，連同途中踩過的坑一起留檔。',
            card_blog_t: '文章', card_blog_d: '技術筆記與零散思考，按時間倒序排列，可按標籤篩選。',
            card_about_t: '關於', card_about_d: '我是誰、在做什麼，以及這個站為什麼長這個樣子。',
            card_view_projects: '查看', card_view_blog: '閱讀', card_view_about: '認識',
            principle_eyebrow: '原則', principle_title: '這個站堅持的幾件事',
            p1_t: '能少則少', p1_d: '不引框架、不接統計、不從 CDN 拉字型與圖示。頁面開啟即是全部內容。',
            p2_t: '讀得舒服', p2_d: '中文優先的字型堆疊、克制的行寬與字號，深淺色都保證足夠的對比度。',
            p3_t: '可持續更新', p3_d: '文章和項目各集中在頁面裡的一個陣列，加一條內容不必改佈局。'
        },
        'en': {
            meta_description: 'Yunmo-Xuan\'s corner of the internet: a hand-written static site with projects and notes. No framework, no dependencies, no external requests.',
            hero_badge: 'Actively maintained',
            hero_title_1: 'Hi, I\'m', hero_title_2: 'Yunmo-Xuan',
            hero_desc: 'This is my little corner of the internet — a place for the things I build, the notes I take and the ideas that are not finished yet. The whole site is hand-written <strong>HTML, CSS and a little JavaScript</strong>, hosted on GitHub Pages.',
            cta_projects: 'See projects', cta_blog: 'Read the notes',
            stat_deps: 'Dependencies', stat_requests: 'Network requests', stat_langs: 'Languages', stat_themes: 'Colour themes', stat_pages: 'Pages',
            stat_note: 'No build step. Every page is a standalone file.',
            guide_eyebrow: 'Navigate', guide_title: 'Where to next?',
            guide_sub: 'Three destinations, all of them real — nothing here 404s on you.',
            card_projects_t: 'Projects', card_projects_d: 'Things I actually built, kept together with the mistakes they came from.',
            card_blog_t: 'Writing', card_blog_d: 'Notes and half-formed thoughts, newest first, filterable by tag.',
            card_about_t: 'About', card_about_d: 'Who I am, what I work on, and why this site looks the way it does.',
            card_view_projects: 'Browse', card_view_blog: 'Read', card_view_about: 'Meet',
            principle_eyebrow: 'Principles', principle_title: 'What this site sticks to',
            p1_t: 'As little as possible', p1_d: 'No framework, no analytics, no fonts or icons from a CDN. Opening the page is the whole thing.',
            p2_t: 'Comfortable to read', p2_d: 'A CJK-first type stack, a restrained measure and size, enough contrast in both themes.',
            p3_t: 'Easy to keep alive', p3_d: 'Posts and projects each live in one array inside the page — adding an entry never touches the layout.'
        },
        'ja': {
            meta_description: '雲陌軒の個人空間。手書きの静的サイトで、作ったものとノートを記録しています。フレームワークなし、依存なし、外部リクエストなし。',
            hero_badge: '更新中',
            hero_title_1: 'こんにちは、', hero_title_2: '雲陌軒です',
            hero_desc: 'ここは私の小さなデジタル空間です。作ったもの、書き留めたノート、まだ形になっていないアイデアを置く場所。サイト全体を手書きの <strong>HTML・CSS・少しの JavaScript</strong> で構成し、GitHub Pages で公開しています。',
            cta_projects: 'プロジェクトを見る', cta_blog: 'ノートを読む',
            stat_deps: '外部依存', stat_requests: '外部リクエスト', stat_langs: '表示言語', stat_themes: 'カラーテーマ', stat_pages: 'ページ数',
            stat_note: 'ビルド不要。各ページが独立した単一ファイルです。',
            guide_eyebrow: 'ガイド', guide_title: 'どこへ行く？',
            guide_sub: '行き先は3つ、いずれも準備済み。押しても 404 になるボタンはありません。',
            card_projects_t: 'プロジェクト', card_projects_d: '実際に作ったものと、そこで踏んだ失敗を一緒に記録しています。',
            card_blog_t: 'ノート', card_blog_d: '技術ノートと思いつき。新しい順、タグで絞り込めます。',
            card_about_t: '概要', card_about_d: '私自身と、このサイトがこの形をしている理由について。',
            card_view_projects: '見る', card_view_blog: '読む', card_view_about: '知る',
            principle_eyebrow: '方針', principle_title: 'このサイトが守っていること',
            p1_t: '少ないほどよい', p1_d: 'フレームワークも解析も、CDN からのフォントやアイコンも使いません。開いた瞬間が中身のすべてです。',
            p2_t: '読みやすさ', p2_d: 'CJK を優先したフォント構成、控えめな行幅と字号、どちらのテーマでも十分なコントラスト。',
            p3_t: '続けやすい更新', p3_d: 'ノートもプロジェクトもページ内の一つの配列に集約。追加でレイアウトは変わりません。'
        }
    },

    render: function render(ctx) {
        /* 首页内容为静态标记 + data-i18n，无需动态渲染 */
    }
};
