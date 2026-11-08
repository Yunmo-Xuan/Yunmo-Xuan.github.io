/* 把 MediaRecorder 产出的 fragmented MP4 合成单个 progressive 文件。
   为什么要做：分片文件让 Chrome 发 4 次 Range 请求才起播（线上实测首帧 1.8~2.5 秒），
   单段 faststart 一次顺序读就够。这里不重新编码，只把样本表与样本数据搬平。
   用法：node tools/mp4-toprogressive.cjs <文件> [--dry]
   已知取舍：不生成 stss（省略即"全部样本可同步"）。开场动画永远从 0 播，不做随机跳转，
   所以这个省略是安全的；若将来要加可拖动进度条，需要另做关键帧表。 */
'use strict';

const fs = require('node:fs');

const CONTAINERS = new Set(['moov', 'trak', 'mdia', 'minf', 'stbl', 'dinf', 'edts', 'udta', 'mvex', 'moof', 'traf']);

function boxes(buf, start, end) {
  const out = [];
  let off = start;
  while (off + 8 <= end) {
    let size = buf.readUInt32BE(off);
    const type = buf.toString('latin1', off + 4, off + 8);
    let header = 8;
    if (size === 1) { size = Number(buf.readBigUInt64BE(off + 8)); header = 16; }
    else if (size === 0) { size = end - off; }
    if (size < header || off + size > end) break;
    out.push({ type, start: off, size, header, body: off + header });
    off += size;
  }
  return out;
}

function find(buf, start, end, type) {
  for (const b of boxes(buf, start, end)) {
    if (b.type === type) return b;
    if (CONTAINERS.has(b.type)) { const hit = find(buf, b.body, b.start + b.size, type); if (hit) return hit; }
  }
  return null;
}

const u32 = (buf, at) => buf.readUInt32BE(at);
const flagsOf = (buf, b) => (buf[b.body + 1] << 16) | (buf[b.body + 2] << 8) | buf[b.body + 3];
/* mvhd / mdhd：v0 是 4 字节时间戳，v1 是 8 字节 */
const timescaleAt = (buf, b) => b.body + (buf[b.body] === 1 ? 20 : 12);
const durAt = (buf, b) => b.type === 'tkhd' ? b.body + (buf[b.body] === 1 ? 28 : 20) : b.body + (buf[b.body] === 1 ? 24 : 16);

function box(type, payload) {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(8 + payload.length, 0);
  head.write(type, 4, 'latin1');
  return Buffer.concat([head, payload]);
}
function fullBox(type, version, flags, payload) {
  const head = Buffer.alloc(4);
  head[0] = version;
  head.writeUIntBE(flags, 1, 3);
  return box(type, Buffer.concat([head, payload]));
}
const list = items => Buffer.concat(items.filter(Boolean));

function sttsBox(samples) {
  const runs = [];
  for (const s of samples) {
    const last = runs[runs.length - 1];
    if (last && last.d === s.d) last.n++; else runs.push({ n: 1, d: s.d });
  }
  const body = Buffer.alloc(4 + runs.length * 8);
  body.writeUInt32BE(runs.length, 0);
  runs.forEach((r, i) => { body.writeUInt32BE(r.n, 4 + i * 8); body.writeUInt32BE(r.d, 8 + i * 8); });
  return fullBox('stts', 0, 0, body);
}

function stszBox(samples) {
  const body = Buffer.alloc(8 + samples.length * 4);
  body.writeUInt32BE(0, 0);
  body.writeUInt32BE(samples.length, 4);
  samples.forEach((s, i) => body.writeUInt32BE(s.size, 8 + i * 4));
  return fullBox('stsz', 0, 0, body);
}

function stscBox(count) {
  const body = Buffer.alloc(16);
  body.writeUInt32BE(1, 0);
  body.writeUInt32BE(1, 4); body.writeUInt32BE(count, 8); body.writeUInt32BE(1, 12);
  return fullBox('stsc', 0, 0, body);
}

function stcoBox(offset) {
  const body = Buffer.alloc(8);
  body.writeUInt32BE(1, 0); body.writeUInt32BE(offset, 4);
  return fullBox('stco', 0, 0, body);
}

function cttsBox(samples) {
  if (!samples.some(s => s.cts)) return null;             /* 没有 B 帧就不写 */
  const runs = [];
  for (const s of samples) {
    const o = s.cts >>> 0;
    const last = runs[runs.length - 1];
    if (last && last.o === o) last.n++; else runs.push({ n: 1, o });
  }
  const body = Buffer.alloc(4 + runs.length * 8);
  body.writeUInt32BE(runs.length, 0);
  runs.forEach((r, i) => { body.writeUInt32BE(r.n, 4 + i * 8); body.writeUInt32BE(r.o, 8 + i * 8); });
  return fullBox('ctts', 0, 0, body);
}

function withDur(src, b, dur) {
  const one = Buffer.from(src.subarray(b.start, b.start + b.size));
  one.writeUInt32BE(dur >>> 0, durAt(src, b) - b.start);
  return one;
}

function toProgressive(src) {
  const top = boxes(src, 0, src.length);
  const moovBox = top.find(b => b.type === 'moov');
  const ftypBox = top.find(b => b.type === 'ftyp');
  if (!moovBox || !ftypBox) throw new Error('缺少 ftyp 或 moov');
  if (!top.some(b => b.type === 'moof')) return { buf: src, moved: false, why: '本来就不是分片文件' };

  const traks = boxes(src, moovBox.body, moovBox.start + moovBox.size).filter(b => b.type === 'trak');
  if (traks.length !== 1) throw new Error('只处理单轨文件，当前 ' + traks.length + ' 条轨');
  const trak = traks[0];
  const inside = (t) => find(src, trak.start, trak.start + trak.size, t);
  const tkhd = inside('tkhd'), mdhd = inside('mdhd'), stsd = inside('stsd'),
    hdlr = inside('hdlr'), vmhd = inside('vmhd'), smhd = inside('smhd'),
    dinf = inside('dinf'), edts = inside('edts');
  const mvhd = find(src, moovBox.body, moovBox.start + moovBox.size, 'mvhd');
  const trex = find(src, moovBox.body, moovBox.start + moovBox.size, 'trex');
  if (!mdhd || !stsd || !dinf) throw new Error('trak 结构不完整，放弃合并');

  const mediaScale = u32(src, timescaleAt(src, mdhd));
  const movieScale = u32(src, timescaleAt(src, mvhd));
  const defDur = trex ? u32(src, trex.body + 16) : 0;
  const defSize = trex ? u32(src, trex.body + 20) : 0;
  const defFlags = trex ? u32(src, trex.body + 24) : 0;

  const samples = [];
  const payloads = [];
  for (const frag of top) {
    if (frag.type !== 'moof') continue;
    const mdat = top.find(b => b.type === 'mdat' && b.start > frag.start);
    const tfhd = find(src, frag.start, frag.start + frag.size, 'tfhd');
    const trun = find(src, frag.start, frag.start + frag.size, 'trun');
    if (!trun || !tfhd) continue;
    const tf = flagsOf(src, tfhd);
    let tfp = tfhd.body + 4;                                  /* track_ID */
    if (tf & 0x01) tfp += 8;                                  /* reserved+track_Fragments */
    if (tf & 0x02) tfp += 4;                                  /* base_data_offset */
    if (tf & 0x08) tfp += 4;                                  /* sample_description_index */
    const tDur = (tf & 0x10) ? u32(src, tfp) : 0;
    const tSize = (tf & 0x20) ? u32(src, tfp + ((tf & 0x10) ? 4 : 0)) : 0;

    const rf = flagsOf(src, trun);
    const count = u32(src, trun.body + 4);
    let at = trun.body + 8;
    let dataAt = mdat ? mdat.body : 0;
    if (rf & 0x01) { dataAt = frag.start + u32(src, at); at += 4; }
    let firstFlags = 0;
    if (rf & 0x04) { firstFlags = u32(src, at); at += 4; }
    for (let i = 0; i < count; i++) {
      let d = tDur || defDur, sz = tSize || defSize, cts = 0;
      let fl = (i === 0 && (rf & 0x04)) ? firstFlags : defFlags;
      if (rf & 0x100) { d = u32(src, at); at += 4; }
      if (rf & 0x200) { sz = u32(src, at); at += 4; }
      if (rf & 0x800) { fl = u32(src, at); at += 4; }
      if (rf & 0x20) { cts = src.readInt32BE(at); at += 4; }
      if (dataAt + sz > src.length) throw new Error('样本数据越界（分片 ' + i + '）');
      samples.push({ d, size: sz, cts });
      payloads.push(src.subarray(dataAt, dataAt + sz));
      dataAt += sz;
    }
  }
  if (!samples.length) throw new Error('没读到任何样本');

  const data = Buffer.concat(payloads);
  const mediaDur = samples.reduce((a, s) => a + s.d, 0);
  const movieDur = Math.round(mediaDur * movieScale / mediaScale);

  const build = (stcoOffset) => {
    const stbl = box('stbl', list([
      src.slice(stsd.start, stsd.start + stsd.size),
      sttsBox(samples), cttsBox(samples), stscBox(samples.length), stszBox(samples), stcoBox(stcoOffset)
    ]));
    const minf = box('minf', list([
      vmhd ? src.slice(vmhd.start, vmhd.start + vmhd.size) : null,
      smhd ? src.slice(smhd.start, smhd.start + smhd.size) : null,
      src.slice(dinf.start, dinf.start + dinf.size), stbl
    ]));
    const mdia = box('mdia', list([withDur(src, mdhd, mediaDur), src.slice(hdlr.start, hdlr.start + hdlr.size), minf]));
    const trakOut = box('trak', list([withDur(src, tkhd, movieDur), edts ? src.slice(edts.start, edts.start + edts.size) : null, mdia]));
    const others = boxes(src, moovBox.body, moovBox.start + moovBox.size)
      .filter(b => !['mvhd', 'trak', 'mvex'].includes(b.type))
      .map(b => src.slice(b.start, b.start + b.size));
    const moovOut = box('moov', list([withDur(src, mvhd, movieDur), trakOut, ...others]));
    const ftyp = src.slice(ftypBox.start, ftypBox.start + ftypBox.size);
    const mdatHead = Buffer.alloc(8);
    mdatHead.writeUInt32BE(8 + data.length, 0); mdatHead.write('mdat', 4, 'latin1');
    return { buf: Buffer.concat([ftyp, moovOut, mdatHead, data]), moovLen: moovOut.length, ftypLen: ftyp.length };
  };

  /* stco 里写的是绝对偏移，而偏移取决于 moov 长度；stco 定长，所以两趟就能收敛 */
  const pass1 = build(0);
  const want = pass1.ftypLen + pass1.moovLen + 8;
  const pass2 = build(want);
  if (pass2.buf.length !== pass1.buf.length) throw new Error('两趟长度不一致，stco 不是定长');
  /* 回读校验：在 moov 里找到 stco 盒，读它唯一的条目 */
  const stcoAt = pass2.buf.indexOf(Buffer.from('stco', 'latin1'), pass1.ftypLen);
  if (stcoAt < 0) throw new Error('产物里找不到 stco');
  const check = u32(pass2.buf, stcoAt + 4 + 4 + 4);           /* type 之后：ver/flags、entry_count、entry[0] */
  if (check !== want) throw new Error(`stco 回填校验失败：${check} ≠ ${want}`);
  return { buf: pass2.buf, moved: true, samples: samples.length, bytes: pass2.buf.length, offset: want };
}

if (require.main === module) {
  const file = process.argv[2];
  const dry = process.argv.includes('--dry');
  if (!file) { console.error('用法：node tools/mp4-toprogressive.cjs <文件> [--dry]'); process.exit(2); }
  const src = fs.readFileSync(file);
  const res = toProgressive(src);
  if (!res.moved) { console.log('  · ' + file + '：' + res.why); process.exit(0); }
  console.log(`  · ${file}\n    分片 → 单段：${res.samples} 个样本，${(src.length / 1024).toFixed(0)}KB → ${(res.bytes / 1024).toFixed(0)}KB，mdat 数据起于 ${res.offset}`);
  if (!dry) fs.writeFileSync(file, res.buf);
}

module.exports = { toProgressive, boxes, find };
