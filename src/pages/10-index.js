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

        .featured-project {
            background: linear-gradient(145deg, var(--accent-soft), var(--surface) 58%);
            border: 1px solid var(--line); border-radius: var(--radius-lg);
            box-shadow: var(--shadow-2); padding: 28px; max-width: 460px; min-width: 0;
        }
        .featured-head { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 28px; }
        .featured-label { font-size: .72rem; font-weight: 750; letter-spacing: .12em; text-transform: uppercase; color: var(--accent-ink); }
        .featured-version { font-family: var(--mono); font-size: .76rem; color: var(--muted); border: 1px solid var(--line); border-radius: 99px; padding: 4px 10px; background: var(--surface); }
        .featured-identity { display: flex; align-items: center; gap: 14px; }
        .featured-icon { display: grid; place-items: center; width: 52px; height: 52px; flex-shrink: 0; border-radius: 15px; background: var(--accent-soft); color: var(--accent-ink); border: 1px solid var(--line); }
        .featured-icon .icon { width: 27px; height: 27px; }
        .featured-project h2 { margin: 0 0 6px; font-size: clamp(1.35rem, 2.5vw, 1.75rem); line-height: 1.25; letter-spacing: -.025em; color: var(--text); }
        .featured-platform { margin: 0; font-family: var(--mono); font-size: .75rem; color: var(--muted); }
        .featured-desc { margin: 22px 0 18px; font-size: .95rem; line-height: 1.75; color: var(--muted); }
        .featured-tags { display: flex; flex-wrap: wrap; gap: 8px; list-style: none; padding: 0; margin: 0 0 24px; }
        .featured-tags li { padding: 6px 10px; border: 1px solid var(--line); border-radius: 8px; background: var(--surface); color: var(--text); font-size: .78rem; }
        .featured-footer { border-top: 1px solid var(--line); padding-top: 20px; }
        .featured-footer .btn { width: 100%; justify-content: space-between; gap: 12px; }
        .featured-footer .icon { flex-shrink: 0; }
        .featured-note { margin: 12px 0 0; font-size: .78rem; line-height: 1.6; color: var(--muted); }

        .principle { display: flex; gap: 16px; align-items: flex-start; }
        .principle .num {
            font-family: var(--mono); font-size: .8rem; font-weight: 700; color: var(--accent-ink);
            background: var(--accent-soft); border-radius: 9px; padding: 5px 9px; flex-shrink: 0; margin-top: 3px;
        }
        .grid-3 { margin-top: 34px; }

        @media (max-width: 980px) {
            .hero-grid { grid-template-columns: 1fr; gap: 40px; }
            .featured-project { max-width: none; }
        }
        @media (max-width: 620px) {
            .hero { padding: 48px 0 54px; }
            .hero-actions .btn { flex: 1 1 auto; }
            .featured-project { padding: 22px; }
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
                        这里展示我做的实用工具与项目；从 PDF 工具箱到个人站，把想法做成能用的东西。
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

                <aside class="featured-project reveal d2" aria-labelledby="featuredProjectTitle">
                    <div class="featured-head">
                        <span class="featured-label" data-i18n="featured_label">精选项目</span>
                        <span class="featured-version">v6.0.4</span>
                    </div>
                    <div class="featured-identity">
                        <span class="featured-icon"><svg class="icon" aria-hidden="true"><use href="#i-book" /></svg></span>
                        <div>
                            <h2 id="featuredProjectTitle" data-i18n="featured_title">PDF 工具箱</h2>
                            <p class="featured-platform">Windows 10/11 · 64-bit</p>
                        </div>
                    </div>
                    <p class="featured-desc" data-i18n="featured_desc">在本地查看、整理与处理 PDF，让常用文档操作集中在一个工具箱里。</p>
                    <ul class="featured-tags" role="list">
                        <li data-i18n="featured_split">拆分合并</li>
                        <li data-i18n="featured_sign">签名水印</li>
                        <li data-i18n="featured_convert">格式转换</li>
                    </ul>
                    <div class="featured-footer">
                        <a class="btn btn-primary" href="projects.html#pdf-tools">
                            <span data-i18n="featured_cta">探索 PDF 工具箱</span>
                            <svg class="icon" aria-hidden="true"><use href="#i-arrow-right" /></svg>
                        </a>
                        <p class="featured-note" data-i18n="featured_note">下载与使用条款见项目页。</p>
                    </div>
                </aside>
            </div>
        </section>

        <section class="section">
            <div class="container">
                <div class="reveal">
                    <span class="eyebrow" data-i18n="guide_eyebrow">导览</span>
                    <h2 class="section-title" data-i18n="guide_title">想去哪儿？</h2>
                    <p class="section-sub" data-i18n="guide_sub">看看做过的项目，读读开发笔记，或了解这个站背后的人。</p>
                </div>

                <div class="card-grid grid-3">
                    <a class="tile-link reveal" href="projects.html">
                        <div class="card">
                            <div class="card-icon"><svg class="icon" aria-hidden="true"><use href="#i-code" /></svg></div>
                            <h3 data-i18n="card_projects_t">项目</h3>
                            <p data-i18n="card_projects_d">从 PDF 工具箱到个人站，了解功能、使用方式与项目进展。</p>
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
                    <a class="tile-link reveal d3" href="games.html">
                        <div class="card">
                            <div class="card-icon"><svg class="icon" aria-hidden="true"><use href="#i-zap" /></svg></div>
                            <h3 data-i18n="card_games_t">小游戏</h3>
                            <p data-i18n="card_games_d">站内写的 2048：方向键或滑动，合并相同数字，跟着站点一起换主题换语言。</p>
                            <span class="more"><span data-i18n="card_view_games">玩一局</span><svg class="icon" aria-hidden="true"><use href="#i-arrow-right" /></svg></span>
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
            hero_desc: '这里展示我做的实用工具与项目；从 PDF 工具箱到个人站，把想法做成能用的东西。',
            cta_projects: '看看项目', cta_blog: '读读文章',
            featured_label: '精选项目', featured_title: 'PDF 工具箱',
            featured_desc: '在本地查看、整理与处理 PDF，让常用文档操作集中在一个工具箱里。',
            featured_split: '拆分合并', featured_sign: '签名水印', featured_convert: '格式转换',
            featured_cta: '探索 PDF 工具箱', featured_note: '下载与使用条款见项目页。',
            guide_eyebrow: '导览', guide_title: '想去哪儿？',
            guide_sub: '看看做过的项目，读读开发笔记，或了解这个站背后的人。',
            card_projects_t: '项目', card_projects_d: '从 PDF 工具箱到个人站，了解功能、使用方式与项目进展。',
            card_blog_t: '文章', card_blog_d: '技术笔记与零散思考，按时间倒序排列，可按标签筛选。',
            card_about_t: '关于', card_about_d: '我是谁、在做什么，以及这个站为什么长这个样子。',
            card_view_projects: '查看', card_view_blog: '阅读', card_view_about: '了解',
            card_games_t: '小游戏', card_games_d: '站内写的 2048：方向键或滑动，合并相同数字，跟着站点一起换主题换语言。',
            card_view_games: '玩一局',
            principle_eyebrow: '原则', principle_title: '这个站坚持的几件事',
            p1_t: '能少则少', p1_d: '不引框架、不接统计、不从 CDN 拉字体和图标。页面打开即是全部内容。',
            p2_t: '读得舒服', p2_d: '中文优先的字体栈、克制的行宽与字号，深浅色都保证足够的对比度。',
            p3_t: '可持续更新', p3_d: '文章和项目各集中在页面里的一个数组，加一条内容不必改布局。'
        },
        'zh-TW': {
            meta_description: '雲陌軒的個人空間：純手寫的靜態小站，記錄做過的項目與筆記。零框架、零相依、零外部請求。',
            hero_badge: '線上維護中',
            hero_title_1: '你好，我是', hero_title_2: '雲陌軒',
            hero_desc: '這裡展示我做的實用工具與項目；從 PDF 工具箱到個人站，把想法做成能用的東西。',
            cta_projects: '看看項目', cta_blog: '讀讀文章',
            featured_label: '精選項目', featured_title: 'PDF 工具箱',
            featured_desc: '在本機檢視、整理與處理 PDF，讓常用文件操作集中在一個工具箱裡。',
            featured_split: '分割合併', featured_sign: '簽名浮水印', featured_convert: '格式轉換',
            featured_cta: '探索 PDF 工具箱', featured_note: '下載與使用條款見項目頁。',
            guide_eyebrow: '導覽', guide_title: '想去哪裡？',
            guide_sub: '看看做過的項目，讀讀開發筆記，或認識這個站背後的人。',
            card_projects_t: '項目', card_projects_d: '從 PDF 工具箱到個人站，了解功能、使用方式與項目進展。',
            card_blog_t: '文章', card_blog_d: '技術筆記與零散思考，按時間倒序排列，可按標籤篩選。',
            card_about_t: '關於', card_about_d: '我是誰、在做什麼，以及這個站為什麼長這個樣子。',
            card_view_projects: '查看', card_view_blog: '閱讀', card_view_about: '認識',
            card_games_t: '小遊戲', card_games_d: '站內寫的 2048：方向鍵或滑動，合併相同數字，跟著網站一起換主題換語言。',
            card_view_games: '玩一局',
            principle_eyebrow: '原則', principle_title: '這個站堅持的幾件事',
            p1_t: '能少則少', p1_d: '不引框架、不接統計、不從 CDN 拉字型與圖示。頁面開啟即是全部內容。',
            p2_t: '讀得舒服', p2_d: '中文優先的字型堆疊、克制的行寬與字號，深淺色都保證足夠的對比度。',
            p3_t: '可持續更新', p3_d: '文章和項目各集中在頁面裡的一個陣列，加一條內容不必改佈局。'
        },
        'en': {
            meta_description: 'Yunmo-Xuan\'s corner of the internet: a hand-written static site with projects and notes. No framework, no dependencies, no external requests.',
            hero_badge: 'Actively maintained',
            hero_title_1: 'Hi, I\'m', hero_title_2: 'Yunmo-Xuan',
            hero_desc: 'Here are the practical tools and projects I build — from PDF Toolbox to this personal site, turning ideas into things you can use.',
            cta_projects: 'See projects', cta_blog: 'Read the notes',
            featured_label: 'SELECTED PROJECT', featured_title: 'PDF Toolbox',
            featured_desc: 'View, organize and process PDFs locally, with everyday document tasks together in one toolbox.',
            featured_split: 'Split & merge', featured_sign: 'Sign & watermark', featured_convert: 'Format conversion',
            featured_cta: 'Explore PDF Toolbox', featured_note: 'Downloads and terms of use are on the project page.',
            guide_eyebrow: 'Navigate', guide_title: 'Where to next?',
            guide_sub: 'Explore my projects, read development notes, or meet the person behind this site.',
            card_projects_t: 'Projects', card_projects_d: 'From PDF Toolbox to this personal site: features, how to use them, and project updates.',
            card_blog_t: 'Writing', card_blog_d: 'Notes and half-formed thoughts, newest first, filterable by tag.',
            card_about_t: 'About', card_about_d: 'Who I am, what I work on, and why this site looks the way it does.',
            card_view_projects: 'Browse', card_view_blog: 'Read', card_view_about: 'Meet',
            card_games_t: 'Mini game', card_games_d: 'A 2048 written for this site: arrows or swipe, merge equal tiles, and it follows the site theme and language.',
            card_view_games: 'Play',
            principle_eyebrow: 'Principles', principle_title: 'What this site sticks to',
            p1_t: 'As little as possible', p1_d: 'No framework, no analytics, no fonts or icons from a CDN. Opening the page is the whole thing.',
            p2_t: 'Comfortable to read', p2_d: 'A CJK-first type stack, a restrained measure and size, enough contrast in both themes.',
            p3_t: 'Easy to keep alive', p3_d: 'Posts and projects each live in one array inside the page — adding an entry never touches the layout.'
        },
        'ja': {
            meta_description: '雲陌軒の個人空間。手書きの静的サイトで、作ったものとノートを記録しています。フレームワークなし、依存なし、外部リクエストなし。',
            hero_badge: '更新中',
            hero_title_1: 'こんにちは、', hero_title_2: '雲陌軒です',
            hero_desc: '自作の実用ツールやプロジェクトを紹介しています。PDF ツールボックスからこの個人サイトまで、アイデアを使えるものに。',
            cta_projects: 'プロジェクトを見る', cta_blog: 'ノートを読む',
            featured_label: '注目のプロジェクト', featured_title: 'PDF ツールボックス',
            featured_desc: 'PDF の閲覧・整理・処理をローカルで。日常の文書作業をひとつのツールボックスにまとめました。',
            featured_split: '分割・結合', featured_sign: '署名・透かし', featured_convert: '形式変換',
            featured_cta: 'PDF ツールボックスを見る', featured_note: 'ダウンロードと利用規約はプロジェクトページをご覧ください。',
            guide_eyebrow: 'ガイド', guide_title: 'どこへ行く？',
            guide_sub: '制作したプロジェクトや開発ノート、このサイトの作者について紹介します。',
            card_projects_t: 'プロジェクト', card_projects_d: 'PDF ツールボックスから個人サイトまで、機能や使い方、進捗を紹介します。',
            card_blog_t: 'ノート', card_blog_d: '技術ノートと思いつき。新しい順、タグで絞り込めます。',
            card_about_t: '概要', card_about_d: '私自身と、このサイトがこの形をしている理由について。',
            card_view_projects: '見る', card_view_blog: '読む', card_view_about: '知る',
            card_games_t: 'ミニゲーム', card_games_d: 'このサイトのために作った 2048。矢印キーかスワイプで同じ数字を合体。サイトのテーマと言語に従います。',
            card_view_games: '遊ぶ',
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
