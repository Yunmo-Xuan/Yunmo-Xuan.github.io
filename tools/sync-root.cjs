/* 把构建产物 site/ 同步到仓库根目录（GitHub Pages 读根目录）。
   用法：node tools/sync-root.cjs [--dry]
   顺带清理根目录里已经不在产物中的旧页面，避免线上留下构建机之外的残留文件。 */
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const site = path.join(root, 'site');
const dry = process.argv.includes('--dry');
const copied = [];
const removed = [];

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function copyTree(from, to) {
  ensureDir(to);
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dst = path.join(to, entry.name);
    if (entry.isDirectory()) copyTree(src, dst);
    else {
      const same = fs.existsSync(dst) &&
        fs.statSync(src).size === fs.statSync(dst).size &&
        fs.readFileSync(src).equals(fs.readFileSync(dst));
      if (!same) {
        if (!dry) fs.copyFileSync(src, dst);
        copied.push(path.relative(root, dst));
      }
    }
  }
}

if (!fs.existsSync(site)) {
  console.error('✗ 没有 site/ 构建产物，请先 npm run build');
  process.exit(1);
}

/* 探针一类的临时页只在本地存在，绝不能被带进部署目录 */
const isTemp = f => /^__/.test(f);

/* 页面与静态文件 */
for (const f of fs.readdirSync(site)) {
  if (isTemp(f)) continue;
  const src = path.join(site, f);
  if (fs.statSync(src).isDirectory()) continue;
  const dst = path.join(root, f);
  if (fs.existsSync(dst) && fs.readFileSync(src).equals(fs.readFileSync(dst))) continue;
  if (!dry) fs.copyFileSync(src, dst);
  copied.push(f);
}

/* 素材（assets/ 整棵树） */
copyTree(path.join(site, 'assets'), path.join(root, 'assets'));

/* 根目录里多出来的构建页面：产物已经没有它，说明这一页被下线了 */
const lower = new Set(fs.readdirSync(site).filter(f => !isTemp(f)).map(s => s.toLowerCase()));
for (const f of fs.readdirSync(root)) {
  if (!/\.html$/.test(f) || lower.has(f.toLowerCase())) continue;
  if (!dry) fs.rmSync(path.join(root, f));
  removed.push(f);
}

for (const f of copied) console.log('  + ' + f);
for (const f of removed) console.log('  − ' + f + '（产物中已不存在）');
console.log(`\n  ${dry ? '将会' : '已'}同步 ${copied.length} 个文件` +
  (removed.length ? `，清理 ${removed.length} 个旧页面` : '，根目录没有多余页面'));
if (!dry) console.log('  下一步：git add -A 后提交推送');
