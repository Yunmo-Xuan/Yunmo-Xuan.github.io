# Yunmo-Xuan.github.io

云陌轩的个人站点，发布于 https://yunmo-xuan.github.io/ 。

根目录的 HTML 是可直接部署的独立页面：首页、项目、游戏（游戏室）、关于、404，
以及 2048 与五款游戏的入口页。界面样式、脚本与 SVG 图标全部内联，
只有 `assets/` 目录里的站点素材（图标、Logo、启动视频）和游戏文件本身需要额外请求，
不引用任何第三方 CDN。支持浅色/深色主题与简体中文、繁體中文、English、日本語四种界面语言。

## 目录

- `src/core.css`、`src/core.js`：共享设计令牌与交互（主题、语言、导航、入场动画、结构化正文渲染）。
- `src/pages/`：各页内容、文案与渲染函数；`src/embed.js` 是游戏嵌入页的共用外壳。
- `src/games/`：五款独立游戏页面源码（象棋为 `src/games/xiangqi/src/` + `build.js`）。
- `src/extra/`：robots.txt、sitemap.xml 与 .nojekyll。
- `assets/`：站点图标、Logo 与启动视频，随产物一起部署。
- `tools/`：构建、质检与浏览器实测脚本；`site/` 为本地构建输出，不提交。

需要 Node.js；以下命令在仓库根目录运行：

```sh
npm install            # 只为浏览器实测装 puppeteer-core（页面本身不依赖任何包）
npm run build          # 构建站点页面 + 生成 site/assets/games/
npm run check          # 静态质检
npm run preview        # http://127.0.0.1:8777/ 本地预览
npm run test:browser   # Chrome 无头实测（先启动 preview）
npm run test:2048      # 2048 规则与存档回归
npm run test:simdesk   # 股市模拟数值回归
npm run test:xiangqi   # 象棋规则引擎与 AI 测试
```

浏览器一律使用本机 Google Chrome，不会回退到 Edge。

## 更新线上版本

GitHub Pages 使用 `main` 分支根目录。构建输出位于 `site/`，确认通过检查后运行
`npm run sync`（先 `node tools/sync-root.cjs --dry` 看一眼计划也可以），
它会把页面、`assets/`、robots.txt、sitemap.xml 与 .nojekyll 同步到仓库根目录，
并删掉产物里已经不存在的旧页面，然后提交并推送。
不要上传 `site/`、`node_modules/`、浏览器用户目录、截图或其他临时文件。

修改内容优先编辑 `src/` 再构建；直接改根目录 HTML 会在下次构建时被覆盖。
404 页使用根绝对链接（`/index.html`），以便在任意错误路径下都能正常返回站内页面；其余页面用相对路径。

## 游戏与存档

游戏进度、最佳纪录与偏好保存在访问者本机的 `localStorage`（象棋等使用各自的既有键），
站点不收集任何数据，也没有账号或统计脚本。启动动画在同一标签页会话内只播放一次，
可点击跳过，`prefers-reduced-motion` 时不播放。
