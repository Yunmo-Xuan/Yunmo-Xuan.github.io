/* 浏览器实测：用本机 Google Chrome 无头加载站点探针页，等它自己报告完成。
   用法：node tools/probe.js [端口]  —— 需要先跑 node tools/serve.js
   说明：探针页会在 <title> 写 PROBE-PASS-n / PROBE-FAIL-n-…，这里轮询真实时间而不是虚拟时间，
   因为游戏页里有持续的动画帧与多层 iframe，虚拟时间模式会误判为"还没跑完"。 */
'use strict';

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const port = Number(process.argv[2] || 8777);
const root = path.resolve(__dirname, '..');
const siteDir = path.join(root, 'site');
const probeFile = path.join(siteDir, '__probe.html');
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(b => fs.existsSync(b));
if (!CHROME) { console.error('未找到 Google Chrome，无法做浏览器实测'); process.exit(2); }

fs.copyFileSync(path.join(__dirname, 'probe.template.html'), probeFile);

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-first-run', '--disable-gpu', '--user-data-dir=' + path.join(root, 'tools', '.chrome-probe')]
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1600, height: 1200 });
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(String(e.message).slice(0, 200)));
    await page.goto('http://127.0.0.1:' + port + '/__probe.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
    const deadline = Date.now() + Number(process.env.PROBE_TIMEOUT || 540000);
    let title = '';
    while (Date.now() < deadline) {
      title = await page.title();
      if (/^PROBE-(PASS|FAIL)/.test(title)) break;
      await new Promise(r => setTimeout(r, 1200));
    }
    if (!/^PROBE-(PASS|FAIL)/.test(title)) {
      console.error('探针超时未给出结果，最后标题：' + (title || '(空)'));
      const partial = await page.evaluate(() => document.getElementById('out').innerText).catch(() => '');
      if (partial) console.error(partial.slice(0, 2000));
      process.exitCode = 1;
      return;
    }
    const rows = await page.evaluate(() =>
      [...document.querySelectorAll('#out div')].map(el => ({
        ok: el.className === 'ok', text: el.textContent
      })));
    for (const r of rows) {
      const m = r.text.match(/^\[(PASS|FAIL)\] ([\s\S]*)/);
      if (!m) { console.log((r.ok ? '  ✓ ' : '  ✗ ') + r.text); continue; }
      console.log((m[1] === 'PASS' ? '  ✓ ' : '  ✗ ') + m[2]);
    }
    const failed = rows.filter(r => !r.ok && !/^TOTAL/.test(r.text)).length;
    const total = rows.filter(r => /^\[(PASS|FAIL)\]/.test(r.text)).length;
    if (pageErrors.length) console.log('  探针页自身异常：' + pageErrors.join(' | '));
    console.log(`\n  ${total} 项检查，${failed} 项失败`);
    process.exitCode = failed ? 1 : 0;
  } finally {
    await browser.close();
    fs.unlinkSync(probeFile);
  }
})().catch(e => { console.error('探针运行失败：', e.message); try { fs.unlinkSync(probeFile); } catch (x) {} process.exit(2); });
