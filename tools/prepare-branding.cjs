'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const puppeteer = require('puppeteer-core');
(async () => {
  const root = path.resolve(__dirname, '..');
  const input = path.resolve(root, '../archive/media');
  const out = path.join(root, 'assets');
  fs.mkdirSync(out, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const page = await browser.newPage();
    const data = 'data:image/png;base64,' + fs.readFileSync(path.join(input, 'Start Page(Logo).png')).toString('base64');
    const images = await page.evaluate(async src => {
      const img = new Image(); img.src = src; await img.decode();
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
      const ctx = canvas.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 128, 128);
      ctx.drawImage(img, 265, 235, 750, 510, 5, 24, 118, 80);
      const icon = canvas.toDataURL('image/png').split(',')[1];
      canvas.width = canvas.height = 480;
      canvas.getContext('2d').drawImage(img, 140, 130, 1000, 1000, 0, 0, 480, 480);
      return { icon, logo: canvas.toDataURL('image/webp', .9).split(',')[1] };
    }, data);
    fs.writeFileSync(path.join(out, 'favicon.png'), Buffer.from(images.icon, 'base64'));
    fs.writeFileSync(path.join(out, 'logo.webp'), Buffer.from(images.logo, 'base64'));
    fs.copyFileSync(path.join(input, 'Start video.mp4'), path.join(out, 'intro.mp4'));
    /* 导出的 mp4 通常把 moov 放在文件尾，浏览器必须整段下完才开播；就地重排成 faststart */
    const { execFileSync } = require('node:child_process');
    execFileSync(process.execPath, [path.join(__dirname, 'mp4-faststart.cjs'), path.join(out, 'intro.mp4')], { stdio: 'inherit' });
    await page.goto(pathToFileURL(path.join(out, 'intro.mp4')).href);
    const meta = await page.evaluate(async () => { const v = document.querySelector('video'); if (v.readyState < 1) await new Promise(r => v.addEventListener('loadedmetadata', r, { once: true })); return { duration: v.duration, width: v.videoWidth, height: v.videoHeight }; });
    console.log(JSON.stringify({ ...meta, assets: fs.readdirSync(out).map(name => ({ name, bytes: fs.statSync(path.join(out, name)).size })) }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
