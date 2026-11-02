/* 文章页 */
'use strict';

/* 6.0.4 主界面截图：构建时内联为 data URI，保持单文件与零外部请求 */
const UI_SHOT = require('../assets/pdf-toolbox-ui.js');

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
    },
    {
        slug: 'pdf-toolbox-6-0-4',
        date: '2026-10-19',
        tags: ['PDF 工具箱', '发布记录', '性能'],
        title: {
            'zh-CN': '6.0.4：改很多次，只存一个文件',
            en: '6.0.4: edit many times, write one file'
        },
        summary: {
            'zh-CN': '页面管理推倒重做，所有修改先留在内存里，点保存时一次写盘。顺带把主题色加到八套，也把 32 位留在了上一版。',
            en: 'Page management rebuilt: every edit stays in memory until a single save. Plus eight theme colours — and 32-bit support left behind on the previous release.'
        },
        body: {
            'zh-CN': [
                { p: '两个月前第一次公开 5.0.2 时，页面管理的逻辑是“每改一次就写一个临时文件”。转一页生成一个 `_rotated`，删一页生成一个 `_deleted`，整理完一本书，文件夹里能多出十几个中间产物。' },
                { img: { src: UI_SHOT.src, w: UI_SHOT.w, h: UI_SHOT.h, alt: UI_SHOT.alt['zh-CN'], cap: UI_SHOT.cap['zh-CN'] } },
                { h: '先还债，再做新功能' },
                { p: '6.0.2 修的是重构留下的致命问题：接口报错、保存对话框静默失败、水印角度和字体渲染。6.0.3 补上 32 位安装包，把缩略图改成网格并支持拖拽排序。到 6.0.4，才有余力动页面管理的底层。' },
                { ul: [
                    '6.0.1：弃用 Tkinter，界面换成 HTML + CSS + JS + pywebview；',
                    '6.0.2：修重构留下的致命 Bug、保存对话框、水印角度与字体渲染；',
                    '6.0.3：32/64 位双安装包、缩略图网格与拖拽排序、修深色模式主题色；',
                    '6.0.4：页面管理内存化、8 套主题色、性能与内存优化、移除 32 位。'
                ] },
                { h: '改很多次，存一次' },
                { p: '现在转页、删页、抽页、拖拽排序全部在内存里完成；状态栏一直提示「有未保存的改动」；只有点「保存为新文件」时才写入一次，而且原文件永远不动。' },
                { p: '代价是没保存就关窗口会丢改动。这一点没有做自动恢复——与其悄悄写一个临时文件，不如把提示放在显眼的位置。' },
                { h: '数字' },
                { ul: [
                    '1200 页文档，0.47 秒出清单和第一批缩略图；',
                    '第一批 24 张缩略图 0.6–0.7 秒到场；',
                    '跳到 1000 页之后，1.6–2.1 秒画出当前屏；',
                    '3000 页里乱跳 6 次，每次 0.18–2.64 秒；',
                    '1200 页改完保存一次，1.75–2.5 秒。'
                ] },
                { p: '内存的做法是只保留离当前页最近的几批缩略图，滚远了的交出去，滚回来再画。所以 3000 页和 300 页的占用差不多。' },
                { h: '这一版的其他变化' },
                { ul: [
                    '8 套主题色：蓝、绿、青、蓝绿、紫、粉、红、橙，启动画面、主界面和设置窗口同步；',
                    '放大预览与右键菜单；',
                    '只提供 64 位安装包，32 位留在 6.0.3。'
                ] },
                { h: '八套主题色怎么不打架' },
                { p: '启动画面、主界面、设置窗口读同一份本机配置；改完立刻写回，其余窗口在下一次绘制时同步换色。不会出现「主界面换了、设置窗口还是旧的」这种半截状态——5.0.x 时代真的出现过。' },
                { h: '还没做的' },
                { p: '缩略图固定 64 DPI、放大预览一次一页、没有快捷键、不支持把文件拖进窗口、PPT 导出是图片型、暂存改动不落盘。这些都在 README 的未来计划里，什么时候做完什么时候算。' },
                { note: '安装包 82 MB，装完约 256 MB；Windows 10/11 64 位，需要 WebView2 运行时。' }
            ],
            en: [
                { p: 'When 5.0.2 first went public two months ago, page management worked by writing a temporary file after every edit: rotate a page and get a `_rotated`, delete a page and get a `_deleted`. By the end of one book the folder could hold a dozen leftovers.' },
                { img: { src: UI_SHOT.src, w: UI_SHOT.w, h: UI_SHOT.h, alt: UI_SHOT.alt.en, cap: UI_SHOT.cap.en } },
                { h: 'Pay the debt first' },
                { p: '6.0.2 fixed the fatal problems left by the re-layer: interface errors, the save dialog failing silently, watermark angles and font rendering. 6.0.3 added a 32-bit installer and turned thumbnails into a draggable grid. Only with 6.0.4 was there room to touch the core of page management.' },
                { ul: [
                    '6.0.1: Tkinter dropped, interface rebuilt on HTML + CSS + JS + pywebview;',
                    '6.0.2: fatal re-layer bugs, the save dialog, watermark angles and font rendering;',
                    '6.0.3: dual 32/64-bit installers, thumbnail grid with drag reorder, dark-mode theme colours;',
                    '6.0.4: in-memory page management, eight theme colours, performance and memory work, 32-bit removed.'
                ] },
                { h: 'Edit many times, save once' },
                { p: 'Rotating, deleting, extracting and reordering now all happen in memory. The status bar keeps saying there are unsaved changes; a single write happens when «Save as new file» is clicked, and the original is never touched.' },
                { p: 'The trade-off: closing the window without saving loses the edits. There is no automatic recovery on purpose — rather than quietly writing a temporary file, the warning stays visible.' },
                { h: 'Numbers' },
                { ul: [
                    '1,200-page document: list and first thumbnails in 0.47 s;',
                    'first 24 thumbnails in 0.6–0.7 s;',
                    'jumping past page 1,000: 1.6–2.1 s to draw the screen;',
                    'six random jumps in a 3,000-page book: 0.18–2.64 s each;',
                    'saving 1,200 edited pages: 1.75–2.5 s.'
                ] },
                { p: 'Memory works by keeping only the thumbnail batches nearest the current page, releasing the distant ones and redrawing them on return. A 3,000-page book and a 300-page one use roughly the same amount.' },
                { h: 'Other changes in this release' },
                { ul: [
                    'Eight theme colours — blue, green, cyan, teal, purple, pink, red, orange — synchronised across splash, main window and settings;',
                    'zoom preview and a context menu;',
                    '64-bit installer only, with 32-bit staying on 6.0.3.'
                ] },
                { h: 'How eight theme colours stay consistent' },
                { p: 'The splash screen, the main window and the settings window all read the same local config; a change is written back immediately and every other window picks it up on its next paint. There is no half-switched state where the main window is recoloured but settings are not — which genuinely happened in the 5.0.x days.' },
                { h: 'Still missing' },
                { p: 'Thumbnails are fixed at 64 DPI, zoom preview shows one page at a time, there are no keyboard shortcuts or drag-and-drop, PPT export is image-based, and pending edits are not persisted. All of it is in the README roadmap; it ships when it ships.' },
                { note: 'The installer is 82 MB and installs to about 256 MB. Windows 10/11 64-bit with the WebView2 runtime.' }
            ]
        }
    },
    {
        slug: 'pdf-toolbox-6-0-1',
        date: '2026-09-13',
        tags: ['PDF 工具箱', '开发日志', 'pywebview'],
        title: {
            'zh-CN': '把 Tkinter 换掉：v6.0.1 的一次重构',
            en: 'Replacing Tkinter: the v6.0.1 re-layer'
        },
        summary: {
            'zh-CN': '5.0.2 发布不到一个月，我做了一个不太划算的决定：把界面层整个推倒，换成 pywebview。',
            en: 'Less than a month after 5.0.2, I made a questionable decision: tear out the entire UI layer and rebuild it on pywebview.'
        },
        body: {
            'zh-CN': [
                { p: '5.0.2 发出去之后，反馈里最多的一句是“打开大文件会卡”。卡的不是 PDF 处理，是 Tkinter：缩略图在主线程里一张张画，窗口就跟着假死。' },
                { p: '修了两次之后我确认，问题不在某一行代码，在界面层选错了。于是有了 6.0.1：保留 Python 的处理逻辑，把界面换成 HTML + CSS + JavaScript，用 pywebview 装进桌面窗口。' },
                { h: '重构不是重写' },
                { p: '底层的 PyMuPDF、pypdf、pdf2docx 都没有换。变的是界面与逻辑的边界：前端只负责显示和交互，后端通过接口接活；缩略图渲染挪到后台线程，主界面不再等它。' },
                { p: '结果是界面终于能做毛玻璃、过渡动画和主题同步，也终于能在翻三千页的时候不假死。' },
                { h: 'pywebview 负责什么' },
                { p: '一个桌面窗口里跑网页：界面是 HTML + CSS + JavaScript，Python 在窗口后面接活。JS 通过 `pywebview.api` 调 Python 的方法，文件对话框、保存、后台线程都留在 Python 侧，界面只拿结果。' },
                { code: '# Python 侧：把系统对话框暴露给界面\nclass Api:\n    def pick_file(self):\n        return webview.windows[0].create_file_dialog(webview.OPEN_DIALOG)\n\n// 界面侧：像调本地函数一样调用\nconst picked = await pywebview.api.pick_file();' },
                { p: '这套边界一旦立住，界面想换风格、加动画都不用碰处理逻辑；反过来换处理引擎也不用碰界面。5.0.x 时代这两层是搅在一起的。' },
                { h: '付出的代价' },
                { ul: [
                    '多了一个 WebView2 依赖：Windows 11 自带，Windows 10 多数随 Edge 装过，但安装器必须检查并提示；',
                    '文件对话框要经过 pywebview 桥接，第一版偶尔弹不出来；',
                    '重构初期的接口问题比预想多，有些 Bug 直接让程序起不来。'
                ] },
                { h: '还没修完的' },
                { ul: [
                    '保存对话框偶发不弹、静默失败——已定位到桥接线程的问题；',
                    '水印倾斜角度算错、字体渲染发虚；',
                    '启动第一帧是白窗，没有骨架屏和进度提示。'
                ] },
                { p: '这三条都会进 6.0.2。重构的账单通常不在重构那一版付，而在接下来两版慢慢还。' },
                { h: '值得吗' },
                { p: '只看 6.0.1 本身，不值得：它比 5.0.2 更容易崩。但界面层换掉之后，后面每一版都能在同一个地基上加东西，而不是继续跟 Tkinter 的布局和线程较劲。' },
                { note: '6.0.1 是重构后的第一个版本。如果你要用它处理重要文件，建议等 6.0.2。' }
            ],
            en: [
                { p: 'After 5.0.2 went out, the most common feedback was «it stutters on large files». The PDF work was not the bottleneck — Tkinter was: thumbnails were drawn one by one on the main thread, and the window froze with them.' },
                { p: 'After two rounds of fixes I accepted that the problem was not a line of code but the choice of UI layer. That led to 6.0.1: keep the Python processing logic, replace the interface with HTML + CSS + JavaScript, and put it in a desktop window with pywebview.' },
                { h: 'A re-layer, not a rewrite' },
                { p: 'The engines underneath — PyMuPDF, pypdf, pdf2docx — stayed. What changed is the boundary between UI and logic: the front end only displays and handles input, the back end takes jobs over an interface, and thumbnail rendering moved to background threads so the main window no longer waits.' },
                { p: 'The result: frosted glass, transitions and synchronised themes became possible, and paging through three thousand pages no longer freezes the app.' },
                { h: 'What pywebview does' },
                { p: 'A desktop window running a web page: the interface is HTML + CSS + JavaScript, with Python taking the jobs behind it. JavaScript calls Python methods through `pywebview.api`; file dialogs, saving and background threads stay on the Python side and the interface only receives results.' },
                { code: '# Python side: expose the system dialog to the UI\nclass Api:\n    def pick_file(self):\n        return webview.windows[0].create_file_dialog(webview.OPEN_DIALOG)\n\n// UI side: call it like a local function\nconst picked = await pywebview.api.pick_file();' },
                { p: 'Once that boundary holds, restyling or animating the interface never touches the processing logic, and swapping an engine never touches the interface. In the 5.0.x days the two layers were tangled together.' },
                { h: 'The bill' },
                { ul: [
                    'A new WebView2 dependency: bundled with Windows 11 and usually present on Windows 10 through Edge, but the installer has to check and explain;',
                    'file dialogs now cross the pywebview bridge and occasionally failed to open in the first build;',
                    'early interface bugs were more numerous than expected, some of them fatal at launch.'
                ] },
                { h: 'Still broken' },
                { ul: [
                    'the save dialog occasionally fails to open and fails silently — traced to the bridge threading;',
                    'watermark tilt angles computed wrong, fonts rendered blurry;',
                    'the first frame after launch is a blank window, with no skeleton or progress hint.'
                ] },
                { p: 'All three go into 6.0.2. A re-layer\'s bill is rarely paid in the re-layer release; it is settled over the next two.' },
                { h: 'Was it worth it' },
                { p: 'Looking only at 6.0.1, no: it crashes more easily than 5.0.2. But with the UI layer replaced, every later release can build on the same foundation instead of fighting Tkinter\'s layout and threading.' },
                { note: '6.0.1 is the first release after the re-layer. For important documents, wait for 6.0.2.' }
            ]
        }
    },
    {
        slug: 'pdf-toolbox-5-0-2',
        date: '2026-08-17',
        tags: ['PDF 工具箱', '发布记录', 'Tkinter'],
        title: {
            'zh-CN': '5.0.2 发布：第一次把软件交给别人',
            en: '5.0.2: handing the software to someone else for the first time'
        },
        summary: {
            'zh-CN': '从三月到八月，版本号在本地走到 5.0.2。今天第一次把包传上网盘，反而比写代码还紧张。',
            en: 'From March to August the version number reached 5.0.2 locally. Uploading the build today was more nerve-racking than writing the code.'
        },
        body: {
            'zh-CN': [
                { p: '今天下午把 5.0.2 的绿色包传到了网盘。这是 PDF 工具箱第一个公开版本——在此之前，它只在我自己的电脑上运行过。' },
                { h: '为什么第一个版本是 5.0.2' },
                { p: '版本号不是从 1.0.0 开始包装出来的。三月写第一行代码时它是 0.0.1，之后每修一个 Bug、每加一个模块就往前走一格。到八月，本地已经滚过二十多个版本，没有一个发出去过。' },
                { p: '所以第一个公开版本就是 5.0.2。它不完美，但每一个功能都真的跑过。' },
                { h: 'GitHub 是这个月才有的' },
                { p: '七月二十三日我才注册 GitHub 账号，八月十四日建了 `PDF-Tools-Update` 仓库。在此之前，所有版本只存在于本地文件夹和移动硬盘里，没有任何公开记录——连更新日志都只写在一个 txt 里。' },
                { p: '所以这篇发布记录顺便做一件事：把从 v0.0.1 到 v5.0.2 的完整历史一次写清楚。仓库 README 里的更新日志就是同一份。' },
                { h: '完整版本记录（v0.0.1 → v5.0.2）' },
                { code: 'v0.0.1  命令行雏形，只能合并\nv1.0.1  第一个图形界面（Tkinter）：合并 + 按页码拆分\nv1.1.x  查看 PDF、印章/签名、PDF 转 PNG\nv2.0.x  侧边栏 + 卡片式 UI；修大文件内存溢出闪退\nv2.1.x  文字水印、压缩（初步）\nv3.0.x  页面管理、加密解密、文档信息编辑\nv3.1.x  批量处理雏形、最近打开、版本更新检查\nv4.0.x  深色模式、四语言界面（简/繁/英/日）\nv4.1-4.3 批量转换、多选操作、压缩三档、水印对角平铺\nv5.0.0  页面管理/水印/压缩/批量/加密齐备，卡片式首页\nv5.0.1  修启动崩溃、水印颜色解析、压缩导致损坏\nv5.0.2  修批量异常、精简合并、水印与压缩提速 ← 第一个公开版本' },
                { p: '二十多个版本里，大半是在修自己上一版挖的坑。版本号诚实，比宣传语有用。' },
                { h: '这个版本里有什么' },
                { ul: [
                    '页面管理：提取、删除、旋转、排序；',
                    '文字水印、印章与签名；',
                    '压缩三档：轻度、中度、重度；',
                    '拆分、合并、批量处理；',
                    '加密解密与文档信息编辑；',
                    '卡片式首页、深色模式、四种界面语言。'
                ] },
                { p: 'PDF 的读写、渲染、压缩、转换都在本机完成。只有检查更新、拉取许可协议和更新日志三处联网；断网时除了看不到新版本，其他功能照常。' },
                { h: '为什么是绿色包' },
                { p: '这一版不做安装器：PyInstaller 打出来的目录压成 zip，解压就能跑。少一层安装逻辑，就少一类「装不上」的反馈；也顺便避开管理员权限的问题。安装器、32/64 位双包，都是后面 6.0.x 才补的。' },
                { h: '发布前补的三件事' },
                { ol: [
                    '打包：用 PyInstaller 做成绿色免安装版，解压就能用；',
                    '许可：写清楚免费使用，禁止商业售卖和未经授权的二次分发；',
                    '说明：把系统要求、已知限制和常见问题写进 README，而不是让用户猜。'
                ] },
                { h: '比写代码更紧张' },
                { p: '写代码时出错，浪费的是自己的时间；发出去之后出错，动的是别人的文件。所以发布前拿整本书反复测：一千多页的文档打开、翻页、改页、保存，确认原文件永远不会被覆盖。' },
                { p: '现在还没人下载。但版本号第一次从「我这儿的 5.0.2」变成了「别人可以拿到的 5.0.2」。' },
                { note: '这一版基于 Tkinter。小文件够用，但大文件打开时的卡顿已经藏不住了——下一个大版本会动这一层。' }
            ],
            en: [
                { p: 'This afternoon I uploaded the portable 5.0.2 build to the file host. It is the first public release of the PDF Toolbox — until today it had only ever run on my own machine.' },
                { h: 'Why the first release is 5.0.2' },
                { p: 'The version number was not dressed up from 1.0.0. When I wrote the first line in March it was 0.0.1, and it moved forward one notch for every bug fixed and every module added. By August it had rolled past twenty versions locally, none of them published.' },
                { p: 'So the first public version is 5.0.2. It is not perfect, but every feature in it has actually been used.' },
                { h: 'GitHub only arrived this month' },
                { p: 'I registered the GitHub account on 23 July and created the `PDF-Tools-Update` repository on 14 August. Before that, every version lived only in local folders and on an external drive — the changelog was a text file nobody could read.' },
                { p: 'So this release note does one extra job: write down the complete history from v0.0.1 to v5.0.2 in one place. The README in the repository carries the same list.' },
                { h: 'Complete version history (v0.0.1 → v5.0.2)' },
                { code: 'v0.0.1  command-line prototype, merge only\nv1.0.1  first GUI (Tkinter): merge + split by page range\nv1.1.x  PDF viewing, stamps/signatures, PDF to PNG\nv2.0.x  sidebar + card UI; fixed out-of-memory crashes on large files\nv2.1.x  text watermarks, compression (first pass)\nv3.0.x  page management, encryption/decryption, document metadata\nv3.1.x  batch prototype, recent files, update checking\nv4.0.x  dark mode, four UI languages (zh-CN/zh-TW/en/ja)\nv4.1-4.3 batch conversion, multi-select, three compression levels, tiled watermark\nv5.0.0  page management/watermark/compression/batch/encryption complete, card home\nv5.0.1  fixed launch crashes, watermark colour parsing, corruption on compress\nv5.0.2  fixed batch errors, simplified merge, faster watermark and compression <- first public release' },
                { p: 'Of the twenty-plus versions, most were repairs to holes dug by the version before. An honest version number beats a slogan.' },
                { h: 'What is inside' },
                { ul: [
                    'Page management: extract, delete, rotate, reorder;',
                    'text watermarks, stamps and signatures;',
                    'three compression levels: light, medium, heavy;',
                    'split, merge and batch processing;',
                    'encryption/decryption and document metadata;',
                    'a card-based home screen, dark mode and four UI languages.'
                ] },
                { p: 'PDF reading, rendering, compression and conversion all happen locally. Only three things reach the network: update checks, the license text and the changelog. Offline, everything works except seeing a new version.' },
                { h: 'Why a portable build' },
                { p: 'This release ships no installer: the PyInstaller output is zipped and runs from wherever it is unpacked. One less layer of install logic means one less class of «it will not install» reports — and no administrator rights involved. Installers and dual 32/64-bit packages came later, with 6.0.x.' },
                { h: 'Three things added before release' },
                { ol: [
                    'Packaging: a portable build with PyInstaller, unzip and run;',
                    'licensing: free to use, no commercial sale or unauthorised redistribution;',
                    'documentation: system requirements, known limits and FAQ in the README instead of leaving users to guess.'
                ] },
                { h: 'More nerve-racking than writing code' },
                { p: 'A mistake while coding costs my own time; a mistake after release touches someone else\'s files. So I tested with whole books: opened a thousand-page document, paged through it, edited pages, saved, and confirmed the original is never overwritten.' },
                { p: 'Nobody has downloaded it yet. But the version number has changed from «5.0.2 on my machine» to «5.0.2 someone else can get».' },
                { note: 'This release is built on Tkinter. It is fine for small files, but the stutter on large documents is no longer hideable — the next major version will change that layer.' }
            ]
        }
    },
    {
        slug: 'pdf-toolbox-start',
        date: '2026-03-15',
        tags: ['PDF 工具箱', '开发日志', 'Python'],
        title: {
            'zh-CN': 'PDF 工具箱的起点：一个只会合并的命令行脚本',
            en: 'Where the PDF Toolbox started: a command-line script that only merged files'
        },
        summary: {
            'zh-CN': '三月中旬的一个周末，我受够了一堆扫描版 PDF，决定自己写个工具。第一版没有窗口，只能手输路径和页码。',
            en: 'One weekend in mid-March, tired of wrestling with scanned PDFs, I decided to write my own tool. The first version had no window — just typed paths and page numbers.'
        },
        body: {
            'zh-CN': [
                { p: '三月中旬的一个周末，手上堆了一批扫描版 PDF：封面是广告、有几页扫歪了、章节还散在几个文件里。找现成工具，要么把文件传到网站换免费额度，要么在三个软件之间来回倒。' },
                { p: '于是打开编辑器，写了第一个脚本：Python + pypdf，命令行运行，只做两件事——合并、按页码范围拆分。' },
                { code: 'python pdf_tool.py merge a.pdf b.pdf -o out.pdf\npython pdf_tool.py split book.pdf 1-20,21-64' },
                { h: '第一版的三个毛病' },
                { ul: [
                    '改一次参数就要回去翻代码；',
                    '中文路径和带空格的路径经常读不出来；',
                    '没有预览，拆完才发现页码写反了。'
                ] },
                { h: '为什么不用现成的工具' },
                { ul: [
                    '在线工具要把文件传上去，换几分钟的免费额度——扫描版整本书动辄上百 MB；',
                    '桌面软件要开三四个：一个转正、一个合并、一个加水印，中间文件堆一地；',
                    '广告、弹窗和「升级会员」的按钮比功能按钮还多。'
                ] },
                { p: '我要的不是「更好的 PDF 软件」，是「把我手上这堆文件整理完」。这两件事差别很大。' },
                { h: '当时定下的三条' },
                { ul: [
                    '不做云存储，文件只在本地；',
                    '不做账号和会员，打开就能用；',
                    '一次只干一件事，产物只有一个文件。'
                ] },
                { p: '这三条后来一直没有变。页面管理、印章、水印、压缩，都是在这个约束里慢慢加上的。' },
                { h: '接下来想做的' },
                { ul: [
                    '给它套一个窗口，至少别再手打路径；',
                    '中文路径和带空格的路径要能稳定读出来；',
                    '拆分之前能看到页码对应的页面，别拆完才发现写反了。'
                ] },
                { note: '补记（2026-08-17）：窗口在几天后就有了（Tkinter，v1.0.1）；之后五个月版本号在本地滚到 5.0.2，八月十七日发了第一个公开版本，见 [5.0.2 发布记录](blog.html#/post/pdf-toolbox-5-0-2)。' }
            ],
            en: [
                { p: 'One weekend in mid-March I had a pile of scanned PDFs: ad pages at the front, a few crooked scans, chapters spread across several files. Existing tools either wanted the file uploaded in exchange for a free quota, or required hopping between three applications.' },
                { p: 'So I opened an editor and wrote the first script: Python + pypdf, run from the command line, doing exactly two things — merge, and split by page ranges.' },
                { code: 'python pdf_tool.py merge a.pdf b.pdf -o out.pdf\npython pdf_tool.py split book.pdf 1-20,21-64' },
                { h: 'Three problems with v0' },
                { ul: [
                    'Changing an argument meant editing the script;',
                    'Chinese paths and paths with spaces failed constantly;',
                    'no preview, so a reversed page range was only discovered after the split.'
                ] },
                { h: 'Why not an existing tool' },
                { ul: [
                    'Online tools want the file uploaded in exchange for a few free minutes — a scanned book is easily a hundred megabytes;',
                    'desktop tools mean three or four apps at once: one to straighten, one to merge, one to watermark, with leftovers everywhere;',
                    'ads, pop-ups and «upgrade to premium» buttons outnumber the feature buttons.'
                ] },
                { p: 'What I needed was not «a better PDF app» but «get this pile of files sorted». Those are very different jobs.' },
                { h: 'Three rules from that weekend' },
                { ul: [
                    'No cloud: files stay local;',
                    'no account and no membership — open and use;',
                    'one task at a time, one output file.'
                ] },
                { p: 'Those rules never changed. Page management, stamps, watermarks and compression were added inside them over the following months.' },
                { h: 'What I want next' },
                { ul: [
                    'A window around it, so paths stop being typed by hand;',
                    'Chinese paths and paths with spaces read reliably;',
                    'a preview before splitting, so a reversed range is caught early.'
                ] },
                { note: 'Added 2026-08-17: the window arrived a few days later (Tkinter, v1.0.1); over the next five months the version number rolled to 5.0.2 locally, and the first public release went out on 17 August — see [the 5.0.2 release note](blog.html#/post/pdf-toolbox-5-0-2).' }
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

        /* 文章内插图 */
        .post-figure { margin: 32px 0; }
        .post-figure img {
            display: block; width: 100%; height: auto;
            border-radius: var(--radius); border: 1px solid var(--line);
            box-shadow: var(--shadow-1); background: var(--surface);
        }
        .post-figure figcaption { margin-top: 10px; font-size: .84rem; line-height: 1.6; color: var(--faint); }
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
            { '@type': 'BlogPosting', headline: '让 GitHub Pages 的 404 页真正有用', datePublished: '2026-10-26', url: 'https://yunmo-xuan.github.io/blog.html#/post/404-that-works' },
            { '@type': 'BlogPosting', headline: '6.0.4：改很多次，只存一个文件', datePublished: '2026-10-19', url: 'https://yunmo-xuan.github.io/blog.html#/post/pdf-toolbox-6-0-4' },
            { '@type': 'BlogPosting', headline: '把 Tkinter 换掉：v6.0.1 的一次重构', datePublished: '2026-09-13', url: 'https://yunmo-xuan.github.io/blog.html#/post/pdf-toolbox-6-0-1' },
            { '@type': 'BlogPosting', headline: '5.0.2 发布：第一次把软件交给别人', datePublished: '2026-08-17', url: 'https://yunmo-xuan.github.io/blog.html#/post/pdf-toolbox-5-0-2' },
            { '@type': 'BlogPosting', headline: 'PDF 工具箱的起点：一个只会合并的命令行脚本', datePublished: '2026-03-15', url: 'https://yunmo-xuan.github.io/blog.html#/post/pdf-toolbox-start' }
        ],
        publisher: { '@type': 'Person', name: '云陌轩', url: 'https://yunmo-xuan.github.io/' }
    }
};
