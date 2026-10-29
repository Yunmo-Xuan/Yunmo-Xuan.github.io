# Yunmo-Xuan.github.io

云陌轩的个人站点，发布于 https://yunmo-xuan.github.io/ 。

根目录的五个 HTML 文件是可直接部署的独立页面，包含首页、项目、文章、关于和 404。样式、JavaScript 与 SVG 图标全部内联，无外部运行时依赖，支持深浅主题及四种界面语言。文章正文缺少当前语言时回退到简体中文。

## 维护与预览

- `src/core.css`、`src/core.js`：共享样式与交互。
- `src/pages/`：各页内容、文案、项目和文章数据。
- `src/extra/`：robots.txt、sitemap.xml 与 .nojekyll。

需要 Node.js；以下命令在仓库根目录运行：

```sh
node src/build.js
node tools/check.js site
node tools/serve.js 8777
```

打开 http://127.0.0.1:8777/ 预览。另开终端执行 `node tools/probe.js 8777`，通过本机 Google Chrome 检查布局和交互；不会自动切换到 Edge。

## 更新线上版本

GitHub Pages 使用 `main` 分支根目录。构建输出位于 `site/`，确认通过检查后，将生成的五个 HTML 文件、robots.txt、sitemap.xml 和 .nojekyll 复制到仓库根目录，再提交并推送。不要上传浏览器用户目录、截图、登录凭据或其他临时文件。

修改内容优先编辑 `src/` 再构建；直接修改根目录 HTML 的内容会在下次构建覆盖时丢失。404 页使用根绝对链接，以便在任意错误路径下返回正常页面。