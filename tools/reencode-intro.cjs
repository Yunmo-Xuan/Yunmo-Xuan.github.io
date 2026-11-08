/* 用 Chrome 自带的编码器把开场视频压小：源片 23Mbps / 14.4MB，慢网下根本等不到首帧。
   做法：本地起一个只监听 127.0.0.1 的小页面放源片 → 逐帧画进 canvas → captureStream 交给
   MediaRecorder（H.264/MP4）→ 落盘后再过一道 faststart。不装 ffmpeg、不经过任何外部服务。
   用法：node tools/reencode-intro.cjs [源文件] [输出文件]
   环境变量：INTRO_SIZE（默认 720）、INTRO_KBPS（默认 1100）。真实时间采集，会跑满一遍视频时长。 */
'use strict';

const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const puppeteer = require('puppeteer-core');

const SRC = path.resolve(process.argv[2] || path.join(__dirname, '../../archive/media/Start video.mp4'));
const OUT = path.resolve(process.argv[3] || path.join(__dirname, '../assets/intro.mp4'));
const SIZE = Number(process.env.INTRO_SIZE || 720);
const KBPS = Number(process.env.INTRO_KBPS || 1100);
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';

if (!fs.existsSync(SRC)) { console.error('✗ 找不到源视频：' + SRC); process.exit(1); }

function serve(file) {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      if (req.url.startsWith('/source')) {
        const buf = fs.readFileSync(file);
        res.writeHead(200, { 'content-type': 'video/mp4', 'content-length': buf.length });
        res.end(buf);
        return;
      }
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      res.end('<!doctype html><meta charset="utf-8"><title>reencode</title>' +
        '<video id="v" muted playsinline preload="auto" src="/source"></video>' +
        `<canvas id="c" width="${SIZE}" height="${SIZE}"></canvas>`);
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}

(async () => {
  const srv = await serve(SRC);
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: true,
    args: ['--no-first-run', '--autoplay-policy=no-user-gesture-required',
      '--user-data-dir=' + path.join(os.tmpdir(), 'yunmo-reencode-' + Date.now())]
  });
  try {
    const page = await browser.newPage();
    page.on('pageerror', e => console.error('  [页面异常] ' + e.message));
    await page.goto('http://127.0.0.1:' + srv.address().port + '/', { waitUntil: 'load' });
    const out = await page.evaluate(async (cfg) => {
      const v = document.getElementById('v'), c = document.getElementById('c'), ctx = c.getContext('2d');
      if (v.readyState < 1) await new Promise((res, rej) => {
        v.addEventListener('loadedmetadata', res, { once: true });
        v.addEventListener('error', () => rej(new Error('源视频读不出来')), { once: true });
      });
      const src = { dur: v.duration, w: v.videoWidth, h: v.videoHeight };
      const stream = c.captureStream(24);
      const mime = ['video/mp4;codecs=avc1.42E01E', 'video/mp4', 'video/webm;codecs=vp9']
        .find(m => MediaRecorder.isTypeSupported(m));
      if (!mime) throw new Error('这台 Chrome 不能录 MP4，也录不了 WebM');
      const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: cfg.kbps * 1000 });
      const chunks = [];
      rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
      const stopped = new Promise(res => { rec.onstop = res; });
      rec.start();
      let frames = 0;
      await v.play();
      await new Promise(res => {
        let done = false;
        const finish = () => { if (!done) { done = true; res(); } };
        const loop = () => { if (done) return; ctx.drawImage(v, 0, 0, c.width, c.height); frames++; if (v.ended) return finish(); requestAnimationFrame(loop); };
        loop();
        v.addEventListener('ended', finish, { once: true });
        /* 卡住也不能无限跑：按源片真实时长多给 4 秒余量（不能用传进来的参数，那是 0） */
        setTimeout(finish, (v.duration + 4) * 1000);
      });
      await new Promise(r => setTimeout(r, 350));
      rec.stop();
      await stopped;
      stream.getTracks().forEach(t => t.stop());
      const bytes = new Uint8Array(await new Blob(chunks).arrayBuffer());
      let s = '';
      for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
      return { src, mime, frames, b64: btoa(s), bytes: bytes.length };
    }, { kbps: KBPS });

    fs.writeFileSync(OUT, Buffer.from(out.b64, 'base64'));
    console.log(`  · 源 ${out.src.w}x${out.src.h} ${out.src.dur.toFixed(2)}s → ${SIZE}px @${KBPS}kbps（${out.mime.split(';')[0]}）`);
    console.log(`  · 采集 ${out.frames} 帧，写出 ${(fs.statSync(OUT).size / 1048576).toFixed(2)}MB`);
    execFileSync(process.execPath, [path.join(__dirname, 'mp4-faststart.cjs'), OUT, '--strip-mfra'], { stdio: 'inherit' });
  } finally {
    await browser.close();
    srv.close();
  }
})().catch(e => { console.error('✗ 重编码失败：', e.message); process.exit(1); });
