/* 产物质检：node tools/check.js site */
const fs = require('fs');
const path = require('path');

const dir = process.argv[2] || 'site';
let bad = 0;
const fail = (f, msg) => { console.log(`  ✗ ${f}: ${msg}`); bad++; };

for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.html'))) {
  const full = fs.readFileSync(path.join(dir, f), 'utf8');

  // 把 <script> 内容单独拿出来，标记部分只查真正的 HTML 属性
  const scripts = [...full.matchAll(/<script(?![^>]*src=)([^>]*)>([\s\S]*?)<\/script>/gi)];
  const markup = full.replace(/<script[\s\S]*?<\/script>/gi, '<script></script>');

  // 1) 内联脚本语法 / JSON-LD
  for (const m of scripts) {
    if (/type\s*=\s*["']application\/ld\+json/.test(m[1])) {
      try { JSON.parse(m[2].replace(/<\\u003c/g, '<')); } catch (e) { fail(f, `JSON-LD 无效 — ${e.message}`); }
      continue;
    }
    try { new Function(m[2]); } catch (e) { fail(f, `JS 语法错误 — ${e.message}`); }
  }

  // 2) 站内链接必须落在真实文件上（404.html 用根绝对路径，其余必须相对）
  for (const l of new Set([...markup.matchAll(/href="([^"]+)"/g)].map(m => m[1]))) {
    if (/^(https?:|mailto:|data:|tel:|#)/i.test(l)) continue;
    if (l.startsWith('/')) {
      if (f !== '404.html') { fail(f, `站内链接 "${l}" 是根绝对路径，本地双击打开会失效`); continue; }
      if (!fs.existsSync(path.join(dir, l))) fail(f, `broken link -> ${l}`);
      continue;
    }
    if (!fs.existsSync(path.join(dir, l))) fail(f, `broken link -> ${l}`);
  }

  // 3) 零外部请求
  for (const ext of ['cdnjs.cloudflare.com', 'fonts.googleapis.com', 'fonts.gstatic.com', 'unpkg.com', 'cdn.jsdelivr.net', 'google-analytics', 'googletagmanager', 'font-awesome']) {
    if (full.includes(ext)) fail(f, `外部依赖 ${ext}`);
  }

  // 4) 占位符只能出现在正文叙述里（文章会引用旧站的坏写法），链接属性里不许有
  for (const m of markup.matchAll(/href="([^"]*)"/g)) {
    if (/你的用户名|your@|example\.com|CHANGE_ME/i.test(m[1])) fail(f, `占位链接 ${m[1]}`);
  }
  for (const ph of ['TODO', 'FIXME', 'lorem ipsum', 'XXX']) {
    if (scripts.map(s => s[2]).join('').includes(ph)) fail(f, `代码里残留 "${ph}"`);
  }

  // 5) 引用的 SVG symbol 必须存在（含脚本里拼出来的名字）
  const jsAll = scripts.map(s => s[2]).join('');
  const used = new Set([
    ...full.matchAll(/href="#(i-[a-z-]+)"/g),
    ...jsAll.matchAll(/#(i-[a-z-]+)/g),
    ...jsAll.matchAll(/'(i-[a-z-]+)'/g)
  ].map(m => m[1]));
  for (const id of used) {
    if (!full.includes(`id="${id}"`)) fail(f, `缺少 SVG symbol #${id}`);
  }

  // 6) head 必备项
  for (const need of ['name="description"', 'rel="canonical"', 'name="viewport"', 'rel="icon"', 'name="theme-color"', 'property="og:title"', 'name="robots"', 'lang="zh-CN"', 'id="main"', '</footer>']) {
    if (!full.includes(need)) fail(f, `缺少 ${need}`);
  }

  // 7) 每个 data-i18n 键都要有词条（外壳字典 + 本页字典）
  const dicts = [
    ...full.matchAll(/var CHROME = ([\s\S]*?);\n    var LANGS/g),
    ...full.matchAll(/window\.PAGE_I18N = ([\s\S]*?);\n\/\* ===/g),
    ...full.matchAll(/window\.PAGE_I18N = ([\s\S]*?);\n/g)
  ];
  let bag = '';
  for (const d of dicts) {
    try { bag += JSON.stringify(eval('(' + d[1] + ')')); } catch (e) { /* 宽松匹配会失败，忽略 */ }
  }
  for (const key of new Set([...markup.matchAll(/data-i18n(?:-aria|-title)?="([^"]+)"/g)].map(m => m[1]))) {
    if (!bag.includes('"' + key + '"')) fail(f, `data-i18n 键 "${key}" 没有词条`);
  }
  // 渲染逻辑里 ctx.t('x') 用到的键
  for (const key of new Set([...scripts.map(s => s[2]).join('').matchAll(/ctx\.t\('([a-z0-9_]+)'\)/g)].map(m => m[1]))) {
    if (!bag.includes('"' + key + '"')) fail(f, `ctx.t 键 "${key}" 没有词条`);
  }

  // 8) zh-CN 必须覆盖本页全部键（其他语言允许缺，会回退）
  for (const d of dicts) {
    let obj;
    try { obj = eval('(' + d[1] + ')'); } catch (e) { continue; }
    const zh = obj['zh-CN'] || {};
    for (const lang of Object.keys(obj)) {
      if (lang === 'zh-CN') continue;
      const missing = Object.keys(zh).filter(k => !(k in obj[lang]));
      if (missing.length) fail(f, `${lang} 缺 ${missing.length} 个键：${missing.slice(0, 6).join(', ')}`);
    }
  }

  console.log(`  · ${f}  ${(full.length / 1024).toFixed(1)} KB  ${scripts.length} 段内联脚本`);
}

console.log(bad === 0 ? '  ✓ 全部通过' : `  ${bad} 处问题`);
process.exit(bad === 0 ? 0 : 1);
