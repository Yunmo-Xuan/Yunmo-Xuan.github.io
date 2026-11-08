/* MP4 faststart 重排：把 moov 从文件尾挪到文件头，并修正 stco/co64 里的绝对偏移。
   没有 faststart 时浏览器必须先把整个文件拿到手才能开播——启动动画因此一直卡在 waiting。
   用法：node tools/mp4-faststart.cjs <文件> [--dry] */
'use strict';

const fs = require('node:fs');

const CONTAINERS = new Set(['moov', 'trak', 'mdia', 'minf', 'stbl', 'dinf', 'edts', 'mvex', 'udta']);

function topLevel(buf) {
  const boxes = [];
  let off = 0;
  while (off + 8 <= buf.length) {
    let size = buf.readUInt32BE(off);
    const type = buf.toString('latin1', off + 4, off + 8);
    let header = 8;
    if (size === 1) { size = Number(buf.readBigUInt64BE(off + 8)); header = 16; }
    else if (size === 0) { size = buf.length - off; }
    if (size < header) throw new Error(`盒 ${type} 长度异常：${size}`);
    boxes.push({ type, start: off, size, header });
    off += size;
  }
  return boxes;
}

/* 递归找出所有 chunk offset 表；stco 是 uint32，co64 是 uint64 */
function offsetTables(buf, start, end, found) {
  let off = start;
  while (off + 8 <= end) {
    let size = buf.readUInt32BE(off);
    const type = buf.toString('latin1', off + 4, off + 8);
    let header = 8;
    if (size === 1) { size = Number(buf.readBigUInt64BE(off + 8)); header = 16; }
    if (size < header) break;
    if (CONTAINERS.has(type)) offsetTables(buf, off + header, off + size, found);
    else if (type === 'stco' || type === 'co64') {
      /* 盒头 8 + version/flags 4 + entry_count 4，条目从 off+16 开始 */
      const count = buf.readUInt32BE(off + header + 4);
      found.push({ type, at: off + header + 8, count });
    }
    off += size;
  }
  return found;
}

function faststart(buf) {
  const boxes = topLevel(buf);
  const moov = boxes.find(b => b.type === 'moov');
  const mdat = boxes.find(b => b.type === 'mdat');
  if (!moov || !mdat) throw new Error('找不到 moov 或 mdat，不是预期的 MP4');
  if (moov.start < mdat.start) return { buf, delta: 0, moved: false };

  /* mdat 会整体后移，chunk 偏移量按新位置修正（不是简单加 moov 长度） */
  const head = buf.subarray(0, mdat.start);              // ftyp + free + …（原本 moov 不在这里）
  const moovBuf = Buffer.from(buf.subarray(moov.start, moov.start + moov.size));
  const after = buf.subarray(moov.start + moov.size);    // 排在 moov 之后的顶层盒（如 mfra）
  const tail = buf.subarray(mdat.start, mdat.start + mdat.size);
  const delta = head.length + moov.size + after.length - mdat.start;

  const tables = offsetTables(moovBuf, 8, moovBuf.length, []);
  if (!tables.length) throw new Error('moov 里没有 stco/co64，无法确认样本偏移');
  for (const table of tables) {
    for (let i = 0; i < table.count; i++) {
      if (table.type === 'stco') {
        const at = table.at + i * 4;
        moovBuf.writeUInt32BE(moovBuf.readUInt32BE(at) + delta, at);
      } else {
        const at = table.at + i * 8;
        moovBuf.writeBigUInt64BE(moovBuf.readBigUInt64BE(at) + BigInt(delta), at);
      }
    }
  }

  const out = Buffer.concat([head, moovBuf, after, tail]);
  /* 自检：修正后的每个样本偏移都必须落在新的 mdat 数据区内 */
  const newMdat = topLevel(out).find(b => b.type === 'mdat');
  const newMoov = topLevel(out).find(b => b.type === 'moov');
  const dataStart = newMdat.start + newMdat.header, dataEnd = newMdat.start + newMdat.size;
  for (const table of offsetTables(out, newMoov.start + 8, newMoov.start + newMoov.size, [])) {
    for (let i = 0; i < table.count; i++) {
      const v = table.type === 'stco' ? out.readUInt32BE(table.at + i * 4) : Number(out.readBigUInt64BE(table.at + i * 8));
      if (v < dataStart || v >= dataEnd) throw new Error(`修正后偏移 ${v} 不在 mdat 数据区 [${dataStart},${dataEnd}) 内`);
    }
  }
  return { buf: out, delta, moved: true };
}

if (require.main === module) {
  const file = process.argv[2];
  const dry = process.argv.includes('--dry');
  if (!file) { console.error('用法：node tools/mp4-faststart.cjs <文件> [--dry]'); process.exit(2); }
  const src = fs.readFileSync(file);
  const out = faststart(src);
  const before = topLevel(src).map(b => b.type).join(' ');
  if (!out.moved) { console.log(`  · ${file} 已经是 faststart（${before}）`); process.exit(0); }
  const afterBoxes = topLevel(out.buf).map(b => b.type).join(' ');
  console.log(`  · ${file}\n    ${before}\n    → ${afterBoxes}\n    偏移整体 +${out.delta} 字节，${(src.length / 1048576).toFixed(1)}MB`);
  if (!dry) fs.writeFileSync(file, out.buf);
  else console.log('    (--dry 未写入)');
}

module.exports = { faststart, topLevel };
