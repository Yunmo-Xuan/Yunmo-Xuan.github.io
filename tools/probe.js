/* 浏览器实测：把探针页放进站点目录，用本机无头 Chrome 跑五个页面 × 四种视口/主题
   用法：node tools/probe.js [端口]  —— 需要先跑 node tools/serve.js */
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const port = Number(process.argv[2] || 8777);
const root = path.join(__dirname, '..');
const siteDir = path.join(root, 'site');
const probeFile = path.join(siteDir, '__probe.html');

const BROWSERS = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'
];
const bin = BROWSERS.find(b => fs.existsSync(b));
if (!bin) { console.error('未找到 Google Chrome，无法做浏览器实测'); process.exit(2); }

fs.copyFileSync(path.join(__dirname, 'probe.template.html'), probeFile);

let dom = '';
try {
    dom = execFileSync(bin, [
        '--headless=new', '--disable-gpu',
        '--user-data-dir=' + path.join(root, 'tools', '.chrome-probe'),
        '--window-size=1560,1200', '--hide-scrollbars',
        '--virtual-time-budget=30000',
        '--dump-dom', 'http://127.0.0.1:' + port + '/__probe.html'
    ], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
} catch (e) {
    console.error('无头浏览器运行失败：', e.message);
    fs.unlinkSync(probeFile);
    process.exit(2);
}

fs.unlinkSync(probeFile);

const rows = [...dom.matchAll(/\[(PASS|FAIL)\] ([^<]+?)(?=<(?:div|\/div)|TOTAL|$)/g)].map(m => ({
    ok: m[1] === 'PASS', text: m[2].replace(/&quot;/g, '"').trim()
}));
const totalLine = (dom.match(/TOTAL (\d+) checks, (\d+) failed/) || []);

for (const r of rows) console.log((r.ok ? '  ✓ ' : '  ✗ ') + r.text);
if (!rows.length) { console.log('探针没有产出结果，可能页面未能加载。'); process.exit(1); }

const failed = rows.filter(r => !r.ok).length;
console.log(`\n  ${rows.length} 项检查，${failed} 项失败` +
    (totalLine[3] ? `（浏览器汇总：${totalLine[1]} 项 / ${totalLine[2]} 失败）` : ''));
process.exit(failed ? 1 : 0);
