/* 差分调试：用另一套独立实现的走法生成 + 由“敌方可吃帅”反推合法性，与 engine.js 对比 */
const XQ = require('../src/js/engine.js');

const FILES = 9, RANKS = 10;
const rc = (b, r, c) => b[r * 9 + c];
const ty = pc => pc & 7, co = pc => pc >> 3;
const PAL = (r, c, color) => c >= 3 && c <= 5 && (color === 0 ? r >= 7 && r <= 9 : r >= 0 && r <= 2);
const CROSS = (r, color) => (color === 0 ? r <= 4 : r >= 5);

// 独立实现：逐条规则陈述，不复用 engine.js 的任何代码
function naiveMoves(b, color) {
  const out = [];
  const enemy = color ^ 1;
  const add = (f, t) => out.push([f, t]);
  const goalOk = (f, t) => { const p = rc(b, (t / 9) | 0, t % 9); return p === 0 || co(p) !== color; };

  for (let f = 0; f < 90; f++) {
    const pc = rc(b, (f / 9) | 0, f % 9);
    if (!pc || co(pc) !== color) continue;
    const r = (f / 9) | 0, c = f % 9, t = ty(pc);

    if (t === 1) {                                    // 帅/将
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dr, dc]) => {
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nr > 9 || nc < 0 || nc > 8) return;
        if (!PAL(nr, nc, color)) return;
        if (goalOk(f, nr * 9 + nc)) add(f, nr * 9 + nc);
      });
    } else if (t === 2) {                              // 仕/士
      [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([dr, dc]) => {
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nr > 9 || nc < 0 || nc > 8) return;
        if (!PAL(nr, nc, color)) return;
        if (goalOk(f, nr * 9 + nc)) add(f, nr * 9 + nc);
      });
    } else if (t === 3) {                              // 相/象
      [[2, 2], [2, -2], [-2, 2], [-2, -2]].forEach(([dr, dc]) => {
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nr > 9 || nc < 0 || nc > 8) return;
        if (color === 0 && nr < 5) return;
        if (color === 1 && nr > 4) return;
        if (rc(b, (r + dr / 2), (c + dc / 2)) !== 0) return;   // 象眼
        if (goalOk(f, nr * 9 + nc)) add(f, nr * 9 + nc);
      });
    } else if (t === 4) {                              // 马
      [[-2, -1], [-2, 1], [2, -1], [2, 1], [-1, -2], [1, -2], [-1, 2], [1, 2]].forEach(([dr, dc]) => {
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nr > 9 || nc < 0 || nc > 8) return;
        const legR = Math.abs(dr) === 2 ? r + dr / 2 : r;
        const legC = Math.abs(dc) === 2 ? c + dc / 2 : c;
        if (rc(b, legR, legC) !== 0) return;                    // 蹩马腿
        if (goalOk(f, nr * 9 + nc)) add(f, nr * 9 + nc);
      });
    } else if (t === 5) {                              // 车
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dr, dc]) => {
        let nr = r + dr, nc = c + dc;
        while (nr >= 0 && nr <= 9 && nc >= 0 && nc <= 8) {
          const tt = nr * 9 + nc, p = rc(b, nr, nc);
          if (p === 0) add(f, tt);
          else { if (co(p) === enemy) add(f, tt); break; }
          nr += dr; nc += dc;
        }
      });
    } else if (t === 6) {                              // 炮
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dr, dc]) => {
        let nr = r + dr, nc = c + dc,架 = 0;
        while (nr >= 0 && nr <= 9 && nc >= 0 && nc <= 8) {
          const tt = nr * 9 + nc, p = rc(b, nr, nc);
          if (架 === 0) {
            if (p === 0) add(f, tt); else 架 = 1;
          } else if (p !== 0) {
            if (co(p) === enemy) add(f, tt);
            break;
          }
          nr += dr; nc += dc;
        }
      });
    } else {                                           // 兵/卒
      const fwd = color === 0 ? -1 : 1;
      const step = (nr, nc) => {
        if (nr < 0 || nr > 9 || nc < 0 || nc > 8) return;
        if (goalOk(f, nr * 9 + nc)) add(f, nr * 9 + nc);
      };
      step(r + fwd, c);
      if (CROSS(r, color)) { step(r, c - 1); step(r, c + 1); }
    }
  }
  return out;
}

function kingsFace(b) {
  let rk = -1, bk = -1;
  for (let s = 0; s < 90; s++) {
    const p = rc(b, (s / 9) | 0, s % 9);
    if (p === 1) rk = s; else if (p === 9) bk = s;
  }
  if (rk < 0 || bk < 0 || rk % 9 !== bk % 9) return false;
  const lo = Math.min((rk / 9) | 0, (bk / 9) | 0), hi = Math.max((rk / 9) | 0, (bk / 9) | 0);
  for (let r = lo + 1; r < hi; r++) if (rc(b, r, rk % 9) !== 0) return false;
  return true;
}

function naiveInCheck(b, color) {           // color 的帅是否被对方攻击
  const enemy = color ^ 1;
  let ks = -1;
  for (let s = 0; s < 90; s++) if (rc(b, (s / 9) | 0, s % 9) === (color === 0 ? 1 : 9)) ks = s;
  if (ks < 0) return true;
  if (kingsFace(b)) return true;
  return naiveMoves(b, enemy).some(([, t]) => t === ks);
}

function naiveLegal(b, color) {
  const res = [];
  for (const [f, t] of naiveMoves(b, color)) {
    const p = b[t], pc = b[f];
    b[t] = pc; b[f] = 0;
    if (!naiveInCheck(b, color)) res.push([f, t]);
    b[f] = pc; b[t] = p;
  }
  return res;
}

// 深搜对比：找出 engine 与 naive 判定不一致的局面
const st = XQ.fromFEN(XQ.START_FEN);
let mismatches = 0, checked = 0;
const stack = [];

function walk(depth) {
  const b = Array.from(st.board);
  const color = st.turn;
  checked++;
  const mine = XQ.legalMoves(st, color).map(m => XQ.fromOf(m) * 100 + XQ.toOf(m)).sort((x, y) => x - y);
  const theirs = naiveLegal(b, color).map(([f, t]) => f * 100 + t).sort((x, y) => x - y);
  if (mine.join(',') !== theirs.join(',')) {
    mismatches++;
    if (mismatches <= 6) {
      const setA = new Set(mine), setB = new Set(theirs);
      const onlyMine = mine.filter(x => !setB.has(x));
      const onlyTheirs = theirs.filter(x => !setA.has(x));
      console.log('\n不一致局面 ply=' + st.ply + ' 轮=' + (color ? '黑' : '红'));
      console.log('  FEN: ' + XQ.toFEN(st));
      console.log('  仅 engine 认为合法: ' + onlyMine.map(x => '[' + ((x / 100) | 0) + ',' + x % 100 + '→' + (((x % 100) / 9) | 0) + ',' + x % 100 % 9 + ']').join(' '));
      console.log('  仅 naive 认为合法: ' + onlyTheirs.map(x => '[' + ((x / 100) | 0) + ',' + x % 100 + ']').join(' '));
    }
  }
  if (depth === 0) return;
  const list = XQ.legalMoves(st);
  for (const m of list) { XQ.makeMove(st, m); walk(depth - 1); XQ.unmakeMove(st); }
}

const target = +(process.argv[2] || 3);
const t0 = Date.now();
walk(target);
console.log('\n对比局面数 ' + checked + '，不一致 ' + mismatches + '，耗时 ' + (Date.now() - t0) + 'ms');
