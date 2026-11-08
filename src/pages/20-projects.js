/* 项目页 */
'use strict';

/* 项目数据：这是整页唯一需要改的地方，复制一条对象即可新增项目 */
const PROJECTS = [
    {
        slug: 'pdf-tools',
        name: { 'zh-CN': 'PDF 工具箱', 'zh-TW': 'PDF 工具箱', en: 'PDF Toolbox', ja: 'PDF ツールボックス' },
        url: 'https://github.com/Yunmo-Xuan/PDF-Tools-Update',
        kind: 'documentation',
        version: '6.0.4',
        verifiedOn: '2026-10-29',
        status: 'released',
        featured: true,
        tags: ['PDF', 'Windows', 'Python', 'pywebview'],
        desc: {
            'zh-CN': '把常用 PDF 操作放进一个 Windows 桌面工具：从阅读、整理页面，到签名、水印与格式转换。公开仓库提供使用说明和版本信息，并非软件源码。',
            'zh-TW': '把常用 PDF 操作整合到一個 Windows 桌面工具：從閱讀、整理頁面，到簽名、浮水印與格式轉換。公開倉庫提供使用說明和版本資訊，並非軟體原始碼。',
            en: 'A Windows desktop toolkit for reading and organizing PDFs, adding signatures and watermarks, and converting documents. The public repository contains documentation and update metadata, not the application source.',
            ja: 'PDF の閲覧・ページ整理から署名、透かし、形式変換までをまとめた Windows デスクトップツール。公開リポジトリは説明書と更新情報であり、アプリのソースコードではありません。'
        },
        features: {
            'zh-CN': ['阅读与页面管理', '拆分与合并', '印章、签名与水印', '文件压缩', '加密与解密', 'Word / Excel / PPT / 图片转换'],
            'zh-TW': ['閱讀與頁面管理', '分割與合併', '印章、簽名與浮水印', '檔案壓縮', '加密與解密', 'Word / Excel / PPT / 圖片轉換'],
            en: ['Viewing & page management', 'Split & merge', 'Stamps, signatures & watermarks', 'File compression', 'Encryption & decryption', 'Word / Excel / PPT / image conversion'],
            ja: ['閲覧とページ管理', '分割と結合', '印章・署名・透かし', 'ファイル圧縮', '暗号化と復号', 'Word・Excel・PPT・画像への変換']
        },
        requirements: {
            'zh-CN': 'Windows 10 / 11 · 64 位 · 需要 Microsoft WebView2 运行时',
            'zh-TW': 'Windows 10 / 11 · 64 位元 · 需要 Microsoft WebView2 執行階段',
            en: 'Windows 10 / 11 · 64-bit · Microsoft WebView2 Runtime required',
            ja: 'Windows 10 / 11 · 64-bit · Microsoft WebView2 ランタイムが必要'
        },
        usage: {
            'zh-CN': ['个人使用免费，采用非开源许可。商业销售、捆绑推广或收费分发需要开发者书面授权。', '据项目文档，PDF 处理在本地完成；更新检查等功能会联网。处理前建议备份原文件。', 'PPT 转换为图片型幻灯片，复杂文档转换可能出现排版偏差，请核对输出结果。'],
            'zh-TW': ['個人使用免費，採用非開源授權。商業銷售、捆綁推廣或收費分發需要開發者書面授權。', '依專案文件，PDF 處理在本機完成；更新檢查等功能會連網。處理前建議備份原始檔案。', 'PPT 轉換為圖片型投影片，複雜文件轉換可能出現排版偏差，請核對輸出結果。'],
            en: ['Free for personal use under a proprietary license. Commercial sales, bundled promotion and paid distribution require written permission.', 'According to the documentation, PDFs are processed locally; update checks and certain other features access the network. Back up originals before processing.', 'PPT exports use image-based slides. Complex document conversions may alter formatting; check the output.'],
            ja: ['個人利用は無料ですが、オープンソースではありません。商業販売、バンドル宣伝、有料配布には開発者の書面による許可が必要です。', '説明書によると PDF はローカルで処理されますが、更新確認などは通信します。処理前に原本をバックアップしてください。', 'PPT 出力は画像ベースのスライドです。複雑な文書ではレイアウトが変わる場合があるため、出力を確認してください。']
        },
        downloadUrl: 'https://pan.baidu.com/s/15RhbPNt1BiRUj0FDz3Bd7A?pwd=2dca',
        licenseUrl: 'https://github.com/Yunmo-Xuan/PDF-Tools-Update/blob/main/LICENSE.md'
    },
    {
        slug: 'yunmo-xuan-github-io',
        name: 'Yunmo-Xuan.github.io',
        url: 'https://github.com/Yunmo-Xuan/Yunmo-Xuan.github.io',
        year: '2026',
        status: 'active',
        featured: false,
        tags: ['HTML', 'CSS', 'JavaScript', 'GitHub Pages'],
        desc: {
            'zh-CN': '你正在看的个人站：展示实用工具、项目与六款小游戏。页面自包含，支持深浅色与四语言界面，不加载外部字体、图标或运行时脚本。',
            'zh-TW': '你正在看的個人站：展示實用工具、項目與六款小遊戲。頁面自包含，支援深淺色與四語言介面，不載入外部字型、圖示或執行階段腳本。',
            en: 'This personal site showcases practical tools, projects and six games. Self-contained pages with light and dark themes, four interface languages and no external fonts, icons or runtime scripts.',
            ja: '実用ツール、プロジェクト、6つのミニゲームを紹介するこの個人サイト。自己完結したページ、明暗テーマ、4言語の UI を備え、外部フォント・アイコン・実行用スクリプトは読み込みません。'
        },
        blocks: {
            'zh-CN': [
                { p: '这个站集中展示实用项目与小游戏。项目页介绍工具和使用方式，[游戏中心](games.html)汇集六款作品的入口。' },
                { h: '结构' },
                { p: '首页、项目、游戏中心、游戏详情、关于与 404 各有对应页面。每个页面带着自己的样式与脚本，源码与产物分开。' },
                { p: '公共部分（配色、导航、页脚、多语言、主题切换）在 `src/` 里维护一份，构建时展开进各个页面。' },
                { h: '界面' },
                { ul: [
                    '浅色与深色两套主题，跟随系统偏好，也可以手动固定，选择记在 localStorage 里',
                    '简体中文、繁體中文、English、日本語四套界面文案',
                    '图标是内联 SVG，字体使用系统字体栈',
                    '尊重 `prefers-reduced-motion`，也保留无 JS 时的降级表现'
                ] },
                { h: '项目与游戏' },
                { p: '项目资料在 `src/pages/20-projects.js` 的 `PROJECTS` 数组中维护；游戏中心与各游戏页面分别维护。' },
                { p: '六款游戏：[2048](2048.html)、[星核合成](planet-merge.html)、[象棋](xiangqi.html)、[五子棋](gomoku.html)、[扫雷](minesweeper.html)、[股市模拟](simdesk.html)。' }
            ],
            'zh-TW': [
                { p: '這個站集中展示實用項目與小遊戲。項目頁介紹工具和使用方式，[遊戲中心](games.html)匯集六款作品的入口。' },
                { h: '結構' },
                { p: '首頁、項目、遊戲中心、遊戲詳情、關於與 404 各有對應頁面。每個頁面帶著自己的樣式與腳本，原始碼與產物分開。' },
                { p: '公共部分（配色、導覽、頁尾、多語言、主題切換）在 `src/` 裡維護一份，建置時展開進各個頁面。' },
                { h: '介面' },
                { ul: [
                    '淺色與深色兩套主題，跟隨系統偏好，也可以手動固定，選擇記在 localStorage 裡',
                    '簡體中文、繁體中文、English、日本語四套介面文案',
                    '圖示是行內 SVG，字型使用系統字型堆疊',
                    '尊重 `prefers-reduced-motion`，也保留無 JS 時的降級表現'
                ] },
                { h: '項目與遊戲' },
                { p: '項目資料在 `src/pages/20-projects.js` 的 `PROJECTS` 陣列中維護；遊戲中心與各遊戲頁面分別維護。' },
                { p: '六款遊戲：[2048](2048.html)、[星核合成](planet-merge.html)、[象棋](xiangqi.html)、[五子棋](gomoku.html)、[踩地雷](minesweeper.html)、[股市模擬](simdesk.html)。' }
            ],
            en: [
                { p: 'This site brings together practical projects and games. The projects page explains the tools and how to use them; the [games hub](games.html) links to six games.' },
                { h: 'Structure' },
                { p: 'Home, projects, the games hub, individual games, about and 404 each have their own pages. Each page includes its styles and scripts, with source files separate from generated output.' },
                { p: 'Shared colors, navigation, footer, translations and theme switching are maintained once in `src/` and included in each page at build time.' },
                { h: 'Interface' },
                { ul: [
                    'Light and dark themes follow the system preference or a manual choice saved in localStorage',
                    'Interface copy in Simplified Chinese, Traditional Chinese, English and Japanese',
                    'Inline SVG icons and a system font stack',
                    'Respects `prefers-reduced-motion` and retains fallbacks when JavaScript is unavailable'
                ] },
                { h: 'Projects and games' },
                { p: 'Project information is maintained in the `PROJECTS` array in `src/pages/20-projects.js`; the games hub and individual game pages are maintained separately.' },
                { p: 'Six games: [2048](2048.html), [Planet Merge](planet-merge.html), [Xiangqi](xiangqi.html), [Gomoku](gomoku.html), [Minesweeper](minesweeper.html) and [Stock Market Simulator](simdesk.html).' }
            ],
            ja: [
                { p: '実用的なプロジェクトとミニゲームをまとめたサイトです。プロジェクトページではツールと使い方を紹介し、[ゲーム一覧](games.html)には6作品への入口をまとめています。' },
                { h: '構成' },
                { p: 'ホーム、プロジェクト、ゲーム一覧、個別ゲーム、概要、404 にそれぞれページがあります。各ページにスタイルとスクリプトを含め、ソースと生成物を分けています。' },
                { p: '共通の配色・ナビゲーション・フッター・翻訳・テーマ切替は `src/` で一元管理し、ビルド時に各ページへ展開します。' },
                { h: 'インターフェース' },
                { ul: [
                    '明暗テーマはシステム設定に従い、手動で選んだ設定は localStorage に保存',
                    '簡体字中国語・繁体字中国語・英語・日本語の4言語の UI',
                    'インライン SVG アイコンとシステムフォント',
                    '`prefers-reduced-motion` に対応し、JavaScript が使えない場合の代替表示も維持'
                ] },
                { h: 'プロジェクトとゲーム' },
                { p: 'プロジェクト情報は `src/pages/20-projects.js` の `PROJECTS` 配列で管理し、ゲーム一覧と個別ゲームのページは分けて管理しています。' },
                { p: '6つのゲーム：[2048](2048.html)、[星核合成](planet-merge.html)、[シャンチー](xiangqi.html)、[五目並べ](gomoku.html)、[マインスイーパー](minesweeper.html)、[株式市場シミュレーター](simdesk.html)。' }
            ]
        }
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
        .stack-note { margin-top: 34px; display: flex; align-items: center; gap: 8px; color: var(--muted); font-size: .88rem; }
        .project { scroll-margin-top: calc(var(--nav-h) + 24px); min-width: 0; }
        .project h2 { overflow-wrap: anywhere; }
        .version { font: 600 .8rem var(--mono); color: var(--accent-ink); background: var(--accent-soft); padding: 4px 10px; border-radius: 8px; }
        .project-platform { color: var(--muted); font-size: .88rem; }
        .project-features { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px 22px; list-style: none; padding: 18px 0; border-block: 1px solid var(--line); }
        .project-features li { display: flex; align-items: flex-start; gap: 9px; font-size: .93rem; }
        .project-features .icon { color: var(--accent-ink); margin-top: 5px; }
        .project-usage { background: var(--surface-2); border: 1px solid var(--line); border-radius: 12px; padding: 12px 16px; }
        .project-usage summary { cursor: pointer; font-weight: 600; font-size: .9rem; }
        .project-usage ul { padding: 4px 0 2px 20px; color: var(--muted); font-size: .88rem; }
        .project-usage li { margin-top: 10px; }
        .project .project-notice, .project .project-verified { color: var(--muted); font-size: .82rem; line-height: 1.65; }
        .project .project-verified { padding-top: 12px; border-top: 1px solid var(--line); }
        .project-links .btn { white-space: normal; text-align: center; }
        @media (max-width: 700px) {
            .project-features { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .project { padding: 22px 18px; }
            .project-links .btn { flex: 1 1 auto; }
        }
        @media (max-width: 400px) {
            .project-features { grid-template-columns: 1fr; gap: 10px; }
        }
    `,

    body: `        <section class="page-head">
            <div class="container">
                <span class="eyebrow" data-i18n="eyebrow">项目</span>
                <h1 data-i18n="title">做过的事</h1>
                <p class="lead" data-i18n="lead">
                    从桌面文档工具到静态个人站，这里收录我的公开项目。查看功能、运行要求与使用说明，找到适合你的工具。
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
                    <span data-i18n="source_note">项目文档与下载地址以对应仓库最新说明为准。</span>
                </aside>
            </div>
        </section>
`,

    i18n: {
        'zh-CN': {
            meta_description: '云陌轩做过的东西：站点、工具与小实验，连同它们踩过的坑一起留档。',
            eyebrow: '项目',
            title: '做过的事',
            lead: '从桌面文档工具到静态个人站，这里收录我的公开项目。查看功能、运行要求与使用说明，找到适合你的工具。',
            featured: '代表作',
            view_source: '查看源码',
            visit: '访问',
            no_match: '没有匹配这个标签的项目。',
            placeholder: '下一个项目的位置。在页面顶部的 <code>PROJECTS</code> 数组里复制一条，填上名字、链接和说明就能出现。',
            more_on_github: '更多在 GitHub',
            source_note: '项目文档与下载地址以对应仓库最新说明为准。',
            count_label: '共 %d 个项目',
            status_active: '维护中',
            status_archived: '已归档',
            status_released: '已发布',
            view_docs: '使用说明与更新',
            usage_title: '使用要求、许可与转换限制',
            download_baidu: '前往百度网盘下载',
            view_license: '阅读使用条款',
            download_notice: '下载入口来自项目仓库，指向第三方网盘；安装包未做独立安全验证，下载前请阅读使用条款。',
            verified_on: '资料核对日期',
            version_snapshot: '版本与功能以仓库说明为准'
        },
        'zh-TW': {
            meta_description: '雲陌軒做過的东西：站點、工具與小實驗，連同它們踩過的坑一起留檔。',
            eyebrow: '項目',
            title: '做過的事',
            lead: '從桌面文件工具到靜態個人站，這裡收錄我的公開專案。查看功能、執行需求與使用說明，找到適合你的工具。',
            featured: '代表作',
            view_source: '檢視原始碼',
            visit: '造訪',
            no_match: '沒有符合這個標籤的項目。',
            placeholder: '下一個項目的位置。在頁面頂部的 <code>PROJECTS</code> 陣列裡複製一條，填上名稱、連結和說明就會出現。',
            more_on_github: '更多在 GitHub',
            source_note: '專案文件與下載位址以對應倉庫最新說明為準。',
            count_label: '共 %d 個項目',
            status_active: '維護中',
            status_archived: '已封存',
            status_released: '已發布',
            view_docs: '使用說明與更新',
            usage_title: '使用需求、授權與轉換限制',
            download_baidu: '前往百度網盤下載',
            view_license: '閱讀使用條款',
            download_notice: '下載入口來自專案倉庫，指向第三方網盤；安裝程式未經獨立安全驗證，下載前請閱讀使用條款。',
            verified_on: '資料核對日期',
            version_snapshot: '版本與功能以倉庫說明為準'
        },
        'en': {
            meta_description: 'Things Yunmo-Xuan has built: the site, small tools and experiments, kept together with the mistakes behind them.',
            eyebrow: 'Projects',
            title: 'What I have built',
            lead: 'From a desktop document toolkit to a static personal site: browse my public projects, their features, system requirements and documentation.',
            featured: 'Featured',
            view_source: 'Source',
            visit: 'Visit',
            no_match: 'No projects match this tag.',
            placeholder: 'Room for the next one. Copy an entry in the <code>PROJECTS</code> array at the top of this page, add a name, a link and a line about it.',
            more_on_github: 'More on GitHub',
            source_note: 'Refer to each repository for current documentation and download information.',
            count_label: '%d project(s)',
            status_active: 'Maintained',
            status_archived: 'Archived',
            status_released: 'Released',
            view_docs: 'Documentation & updates',
            usage_title: 'Requirements, license & conversion limits',
            download_baidu: 'Download via Baidu Netdisk',
            view_license: 'Read the terms',
            download_notice: 'The repository links to a third-party file host. The installer has not been independently security-verified; read the terms before downloading.',
            verified_on: 'Information checked',
            version_snapshot: 'Version and features follow the repository documentation'
        },
        'ja': {
            meta_description: '雲陌軒が作ったもの。サイト、小さなツール、小さな実験。そこに至った失敗といっしょに記録しています。',
            eyebrow: 'プロジェクト',
            title: '作ったもの',
            lead: 'デスクトップの文書ツールから静的な個人サイトまで、公開プロジェクトを紹介しています。機能や動作要件、使い方を確認して、目的に合うツールを見つけてください。',
            featured: '主力',
            view_source: 'ソース',
            visit: '開く',
            no_match: 'このタグに該当するプロジェクトはありません。',
            placeholder: '次の1件用の空き枠です。ページ上部の <code>PROJECTS</code> 配列を1つ複製し、名前・リンク・説明を入れると表示されます。',
            more_on_github: 'GitHub でも',
            source_note: '最新の説明書とダウンロード情報は、各リポジトリをご確認ください。',
            count_label: '%d 件',
            status_active: 'メンテナンス中',
            status_archived: 'アーカイブ済み',
            status_released: '公開済み',
            view_docs: '使い方と更新情報',
            usage_title: '動作要件・ライセンス・変換の制限',
            download_baidu: '百度網盤でダウンロード',
            view_license: '利用規約を読む',
            download_notice: 'リポジトリ記載の第三者ファイル共有サービスへのリンクです。インストーラーの独立した安全性検証は行っていません。事前に利用規約をご確認ください。',
            verified_on: '情報確認日',
            version_snapshot: 'バージョンと機能はリポジトリの説明に基づきます'
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
            var label = p.kind === 'documentation' ? ctx.t('view_docs') : ctx.t(external ? 'view_source' : 'visit');
            var mark = external ? '<svg class="icon" aria-hidden="true"><use href="#i-external" /></svg>' : '';
            var status = '<span class="status ' + (p.status === 'archived' ? 'status-archived' : 'status-active') + '"><i aria-hidden="true"></i>' + escHtml(ctx.t('status_' + p.status)) + '</span>';
            var stars = p.featured ? '<span class="featured-badge">' + ctx.t('featured') + '</span>' : '';
            var features = p.features ? '<ul class="project-features">' + ctx.pick(p.features).map(function (feature) {
                return '<li><svg class="icon" aria-hidden="true"><use href="#i-check" /></svg><span>' + escHtml(feature) + '</span></li>';
            }).join('') + '</ul>' : '';
            var usage = p.usage ? '<details class="project-usage"><summary>' + escHtml(ctx.t('usage_title')) + '</summary><ul>' + ctx.pick(p.usage).map(function (item) {
                return '<li>' + escHtml(item) + '</li>';
            }).join('') + '</ul></details>' : '';
            var download = p.downloadUrl ? '<a class="btn btn-primary btn-sm" href="' + safeUrl(p.downloadUrl) + '" target="_blank" rel="noopener noreferrer">' + ctx.t('download_baidu') + mark + '</a>' : '';
            var license = p.licenseUrl ? '<a class="btn btn-ghost btn-sm" href="' + safeUrl(p.licenseUrl) + '" target="_blank" rel="noopener noreferrer">' + ctx.t('view_license') + '</a>' : '';
            return '<article id="' + escHtml(p.slug) + '" class="project reveal' + (p.featured ? ' is-featured' : '') + '">' +
                '<div class="project-top">' +
                '<h2><a href="' + safeUrl(p.url) + '"' + (external ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' + escHtml(ctx.pick(p.name)) + '</a></h2>' +
                (p.version ? '<span class="version">v' + escHtml(p.version) + '</span>' : '<span class="year">' + escHtml(p.year || '') + '</span>') + status + stars +
                '</div>' +
                '<p class="summary">' + inline(ctx.pick(p.desc) || '') + '</p>' +
                (p.requirements ? '<p class="project-platform">' + escHtml(ctx.pick(p.requirements)) + '</p>' : '') +
                features +
                '<ul class="tag-list">' + (p.tags || []).map(function (tg) { return '<li><span class="tag">' + escHtml(tg) + '</span></li>'; }).join('') + '</ul>' +
                usage +
                '<div class="project-links">' + download + '<a class="btn btn-ghost btn-sm" href="' + safeUrl(p.url) + '"' +
                (external ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' + mark + '<span>' + label + '</span></a>' + license + '</div>' +
                (p.downloadUrl ? '<p class="project-notice">' + escHtml(ctx.t('download_notice')) + '</p>' : '') +
                (p.verifiedOn ? '<p class="project-verified">' + escHtml(ctx.t('verified_on')) + ' <time datetime="' + escHtml(p.verifiedOn) + '">' + escHtml(p.verifiedOn) + '</time> · ' + escHtml(ctx.t('version_snapshot')) + '</p>' : '') +
                '</article>';
        }

        function paint() {
            var items = PROJECTS.filter(function (p) {
                return !active || (p.tags || []).indexOf(active) >= 0;
            });
            list.innerHTML = items.map(card).join('\n');
            empty.hidden = items.length !== 0;
            if (count) count.textContent = ctx.t('count_label').replace('%d', items.length);
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
