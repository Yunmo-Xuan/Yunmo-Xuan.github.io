/* 中国象棋规则引擎：纯逻辑，无 DOM 依赖，可在浏览器与 Node 中运行。
   规则口径（简化版）：
   - 自然限着：halfmove 统计“距上一次吃子的连续半步数”，兵未吃子的推进只累加不清零；
     halfmove ≥ 120 且局面回合数 > 60 时判和（见 status / toFEN）。
   - 重复局面：同一局面（含轮走方）第三次出现判和，属“简化重复判和”，不逐例裁定长将/长捉。
   - 进攻子力：车/马/炮/兵(卒) 均计入；双方都只剩将帅时判和。 */
var XQ = (function () {
  'use strict';

  var RED = 0, BLACK = 1;
  var KING = 1, ADVISOR = 2, ELEPHANT = 3, HORSE = 4, ROOK = 5, CANNON = 6, PAWN = 7;
  var NAME = [
    { 1: '帅', 2: '仕', 3: '相', 4: '马', 5: '车', 6: '炮', 7: '兵' },
    { 1: '将', 2: '士', 3: '象', 4: '马', 5: '车', 6: '炮', 7: '卒' }
  ];
  var FEN_LETTER = ['', 'k', 'a', 'b', 'n', 'r', 'c', 'p'];
  var LETTER_TYPE = {
    k: KING, g: KING, m: KING, a: ADVISOR, s: ADVISOR, e: ELEPHANT, b: ELEPHANT,
    h: HORSE, n: HORSE, r: ROOK, c: CANNON, p: PAWN, d: PAWN
  };

  var START_FEN = 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1';
  var FILES = 9, RANKS = 10, SQUARES = 90;
  var CN_NUM = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

  function typeOf(pc) { return pc & 7; }
  function colorOf(pc) { return pc >> 3; }
  function piece(type, color) { return type | (color << 3); }
  function rowOf(s) { return (s / FILES) | 0; }
  function colOf(s) { return s % FILES; }
  function sq(r, c) { return r * FILES + c; }
  function onBoard(r, c) { return r >= 0 && r < RANKS && c >= 0 && c < FILES; }
  function inPalace(r, c, color) {
    if (r < 0 || r >= RANKS || c < 3 || c > 5) return false;
    return color === RED ? r >= 7 : r <= 2;
  }
  function crossedRiver(r, color) { return color === RED ? r <= 4 : r >= 5; }

  var OR_DR = [-1, 1, 0, 0], OR_DC = [0, 0, -1, 1];
  var DG_DR = [-1, -1, 1, 1], DG_DC = [-1, 1, -1, 1];
  var HS_DR = [-2, -2, 2, 2, -1, -1, 1, 1], HS_DC = [-1, 1, -1, 1, -2, 2, 2, -2];

  function moveOf(from, to, cap) { return from | (to << 7) | (cap << 14); }
  function fromOf(m) { return m & 127; }
  function toOf(m) { return (m >> 7) & 127; }
  function capOf(m) { return (m >> 14) & 15; }
  function sqName(s) { return String.fromCharCode(97 + colOf(s)) + rowOf(s); }

  /* ---------------- Zobrist ---------------- */
  function mulberry32(seed) {
    return function () {
      seed = (seed + 0x6d2b79f5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return (t ^ (t >>> 14)) | 0;
    };
  }
  var rnd = mulberry32(20261103);
  var ZH = [], ZL = [];
  for (var zp = 0; zp < 16; zp++) {
    ZH[zp] = []; ZL[zp] = [];
    for (var zs = 0; zs < SQUARES; zs++) { ZH[zp][zs] = rnd(); ZL[zp][zs] = rnd(); }
  }
  var Z_TURN_H = rnd(), Z_TURN_L = rnd();

  function keyOf(state) {
    return (state.hashHi >>> 0) * 4294967296 + (state.hashLo >>> 0);
  }

  /* ---------------- 局面 ---------------- */
  // undo / hashLog 是“本局实际走子”的记录容器，按需要动态扩容（见 ensureCap），
  // 因此初始容量只影响内存占用，不再限制对局长度。
  var UNDO_INIT = 256;
  function emptyState() {
    var undoSize = UNDO_INIT;
    return {
      board: new Int8Array(SQUARES),
      turn: RED,
      kingSq: [-1, -1],
      halfmove: 0,      // 自然限着：距上一次“吃子”的连续半步数（兵未吃子的推进不重置它）
      ply: 0,           // 本局面对象上实际走过的步数（加载 FEN 时恒为 0）
      moveNumber: 1,    // 显示/记谱用回合号（来自 FEN，与 ply 解耦）
      hashHi: 0, hashLo: 0,
      undoCap: undoSize,
      hashLog: new Float64Array(undoSize + 1),
      undo: {
        m: new Int32Array(undoSize), cap: new Int32Array(undoSize),
        hm: new Int32Array(undoSize), hh: new Int32Array(undoSize),
        hl: new Int32Array(undoSize), k0: new Int32Array(undoSize),
        k1: new Int32Array(undoSize)
      }
    };
  }

  // 保证索引 p（本局已走步数）落在 undo/hashLog 内，越界时按 2 倍扩容。
  function ensureCap(state, p) {
    if (p < state.undoCap) return;
    var cap = state.undoCap;
    while (cap <= p) cap *= 2;
    var u = state.undo, keys = ['m', 'cap', 'hm', 'hh', 'hl', 'k0', 'k1'];
    var nu = {};
    for (var i = 0; i < keys.length; i++) {
      var arr = new Int32Array(cap);
      arr.set(u[keys[i]]);
      nu[keys[i]] = arr;
    }
    state.undo = nu;
    var nh = new Float64Array(cap + 1);
    nh.set(state.hashLog);
    state.hashLog = nh;
    state.undoCap = cap;
  }

  function fromFEN(fen) {
    var st = emptyState();
    var parts = String(fen || START_FEN).trim().split(/\s+/);
    var rows = parts[0].split('/');
    if (rows.length !== RANKS) throw new Error('FEN 行数应为 10，实际 ' + rows.length);
    var hi = 0, lo = 0;
    var cnt = [[0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0]];
    for (var r = 0; r < RANKS; r++) {
      var c = 0, spec = rows[r];
      for (var i = 0; i < spec.length; i++) {
        var ch = spec[i];
        if (ch >= '1' && ch <= '9') { c += +ch; continue; }
        var lower = ch.toLowerCase();
        var type = LETTER_TYPE[lower];
        if (!type) throw new Error('FEN 含非法字符：' + ch);
        if (c >= FILES) throw new Error('FEN 每行最多 9 列');
        var color = ch === lower ? BLACK : RED;
        if (++cnt[color][type] > (type === PAWN ? 5 : 2))
          throw new Error('FEN 中' + (color === RED ? '红' : '黑') + '方' + NAME[color][type] +
            '数量超过 ' + (type === PAWN ? 5 : 2) + ' 枚');
        var pc = piece(type, color);
        st.board[sq(r, c)] = pc;
        hi ^= ZH[pc][sq(r, c)]; lo ^= ZL[pc][sq(r, c)];
        if (type === KING) {
          if (st.kingSq[color] >= 0) throw new Error('FEN 中' + (color === RED ? '红' : '黑') + '方有两位帅/将');
          st.kingSq[color] = sq(r, c);
        }
        c++;
      }
      if (c !== FILES) throw new Error('FEN 第 ' + (r + 1) + ' 行不是 9 列');
    }
    // 校验回合字段：缺省视为红先，出现非法字符直接拒绝，避免误把脏数据当合法局面。
    var sideTok = parts[1];
    if (sideTok === undefined || sideTok === '') st.turn = RED;
    else {
      var s1 = String(sideTok).toLowerCase();
      if (s1 !== 'w' && s1 !== 'b') throw new Error('FEN 回合字段应为 w 或 b，实际 ' + sideTok);
      st.turn = s1 === 'w' ? RED : BLACK;
    }
    if (st.turn === BLACK) { hi ^= Z_TURN_H; lo ^= Z_TURN_L; }
    st.hashHi = hi; st.hashLo = lo;
    st.halfmove = parts.length > 4 ? Math.max(0, +parts[4] || 0) : 0;
    st.moveNumber = parts.length > 5 && +parts[5] >= 1 ? Math.floor(+parts[5]) : 1;
    // ply 是“本局面对象上实际走了多少步”，加载 FEN 时尚未走子恒为 0，
    // 与展示用的 moveNumber 解耦，杜绝 `... 0 301` 这类 FEN 越界写坏棋盘。
    st.ply = 0;
    if (st.kingSq[RED] < 0) throw new Error('FEN 缺少红帅');
    if (st.kingSq[BLACK] < 0) throw new Error('FEN 缺少黑将');
    ensureCap(st, st.ply);
    st.hashLog[st.ply] = keyOf(st);
    return st;
  }

  function toFEN(state) {
    var out = [];
    for (var r = 0; r < RANKS; r++) {
      var line = '', empty = 0;
      for (var c = 0; c < FILES; c++) {
        var pc = state.board[sq(r, c)];
        if (!pc) { empty++; continue; }
        if (empty) { line += empty; empty = 0; }
        var letter = FEN_LETTER[typeOf(pc)];
        line += colorOf(pc) === RED ? letter.toUpperCase() : letter;
      }
      if (empty) line += empty;
      out.push(line);
    }
    return out.join('/') + ' ' + (state.turn === RED ? 'w' : 'b') + ' - - ' +
      state.halfmove + ' ' + state.moveNumber;
  }

  /* ---------------- 走法生成 ---------------- */
  function genPseudo(state, color, capsOnly, out) {
    var b = state.board;
    for (var s = 0; s < SQUARES; s++) {
      var pc = b[s];
      if (!pc || colorOf(pc) !== color) continue;
      var t = typeOf(pc), r = rowOf(s), c = colOf(s);

      if (t === ROOK) {
        for (var d = 0; d < 4; d++) {
          var rr = r + OR_DR[d], cc = c + OR_DC[d];
          while (onBoard(rr, cc)) {
            var s2 = sq(rr, cc), p2 = b[s2];
            if (!p2) { if (!capsOnly) out.push(moveOf(s, s2, 0)); }
            else { if (colorOf(p2) !== color) out.push(moveOf(s, s2, p2)); break; }
            rr += OR_DR[d]; cc += OR_DC[d];
          }
        }
      } else if (t === CANNON) {
        for (var d2 = 0; d2 < 4; d2++) {
          var r2 = r + OR_DR[d2], c2 = c + OR_DC[d2], jumped = false;
          while (onBoard(r2, c2)) {
            var s3 = sq(r2, c2), p3 = b[s3];
            if (!jumped) {
              if (!p3) { if (!capsOnly) out.push(moveOf(s, s3, 0)); }
              else jumped = true;
            } else if (p3) {
              if (colorOf(p3) !== color) out.push(moveOf(s, s3, p3));
              break;
            }
            r2 += OR_DR[d2]; c2 += OR_DC[d2];
          }
        }
      } else if (t === HORSE) {
        for (var i = 0; i < 8; i++) {
          var nr = r + HS_DR[i], nc = c + HS_DC[i];
          if (!onBoard(nr, nc)) continue;
          var legR = r + (HS_DR[i] % 2 === 0 ? HS_DR[i] / 2 : 0);
          var legC = c + (HS_DC[i] % 2 === 0 ? HS_DC[i] / 2 : 0);
          if (b[sq(legR, legC)]) continue;
          var s4 = sq(nr, nc), p4 = b[s4];
          if (p4 && colorOf(p4) === color) continue;
          if (capsOnly && !p4) continue;
          out.push(moveOf(s, s4, p4));
        }
      } else if (t === ELEPHANT) {
        for (var j = 0; j < 4; j++) {
          var er = r + 2 * DG_DR[j], ec = c + 2 * DG_DC[j];
          if (!onBoard(er, ec)) continue;
          if (color === RED ? er < 5 : er > 4) continue;
          if (b[sq(r + DG_DR[j], c + DG_DC[j])]) continue;
          var s5 = sq(er, ec), p5 = b[s5];
          if (p5 && colorOf(p5) === color) continue;
          if (capsOnly && !p5) continue;
          out.push(moveOf(s, s5, p5));
        }
      } else if (t === ADVISOR) {
        for (var k = 0; k < 4; k++) {
          var ar = r + DG_DR[k], ac = c + DG_DC[k];
          if (!inPalace(ar, ac, color)) continue;
          var s6 = sq(ar, ac), p6 = b[s6];
          if (p6 && colorOf(p6) === color) continue;
          if (capsOnly && !p6) continue;
          out.push(moveOf(s, s6, p6));
        }
      } else if (t === KING) {
        for (var q = 0; q < 4; q++) {
          var kr = r + OR_DR[q], kc = c + OR_DC[q];
          if (!inPalace(kr, kc, color)) continue;
          var s7 = sq(kr, kc), p7 = b[s7];
          if (p7 && colorOf(p7) === color) continue;
          if (capsOnly && !p7) continue;
          out.push(moveOf(s, s7, p7));
        }
      } else { // PAWN
        var fwd = color === RED ? -1 : 1;
        var pr = r + fwd;
        if (pr >= 0 && pr < RANKS) {
          var ps = sq(pr, c), pp = b[ps];
          if (!pp || colorOf(pp) !== color) { if (!capsOnly || pp) out.push(moveOf(s, ps, pp)); }
        }
        if (crossedRiver(r, color)) {
          for (var side = 0; side < 2; side++) {
            var dc2 = side ? 1 : -1, pc2 = c + dc2;
            if (!onBoard(r, pc2)) continue;
            var ts = sq(r, pc2), tp = b[ts];
            if (tp && colorOf(tp) === color) continue;
            if (capsOnly && !tp) continue;
            out.push(moveOf(s, ts, tp));
          }
        }
      }
    }
    return out;
  }

  function inCheck(state, color) {
    var ks = state.kingSq[color];
    if (ks < 0) return true;
    var b = state.board, r = rowOf(ks), c = colOf(ks), enemy = color ^ 1;

    for (var d = 0; d < 4; d++) {
      var rr = r + OR_DR[d], cc = c + OR_DC[d], screen = false;
      while (onBoard(rr, cc)) {
        var p = b[sq(rr, cc)];
        if (p) {
          if (!screen) {
            var t = typeOf(p);
            if (colorOf(p) === enemy && (t === ROOK || t === KING)) return true;
            screen = true;
          } else {
            if (colorOf(p) === enemy && typeOf(p) === CANNON) return true;
            break;
          }
        }
        rr += OR_DR[d]; cc += OR_DC[d];
      }
    }

    for (var i = 0; i < 8; i++) {
      var hr = r + HS_DR[i], hc = c + HS_DC[i];
      if (!onBoard(hr, hc)) continue;
      var hp = b[sq(hr, hc)];
      if (!hp || typeOf(hp) !== HORSE || colorOf(hp) !== enemy) continue;
      var legR = hr + (HS_DR[i] % 2 === 0 ? -HS_DR[i] / 2 : 0);
      var legC = hc + (HS_DC[i] % 2 === 0 ? -HS_DC[i] / 2 : 0);
      if (!b[sq(legR, legC)]) return true;
    }

    var pfwd = enemy === RED ? -1 : 1;
    var attacker = sq(r - pfwd, c);
    if (r - pfwd >= 0 && r - pfwd < RANKS) {
      var ap = b[attacker];
      if (ap && typeOf(ap) === PAWN && colorOf(ap) === enemy) return true;
    }
    for (var s2 = 0; s2 < 2; s2++) {
      var sc = c + (s2 ? 1 : -1);
      if (!onBoard(r, sc)) continue;
      var sp = b[sq(r, sc)];
      if (sp && typeOf(sp) === PAWN && colorOf(sp) === enemy && crossedRiver(r, enemy)) return true;
    }
    return false;
  }

  function makeMove(state, m) {
    var from = fromOf(m), to = toOf(m), pc = state.board[from], cap = state.board[to];
    var p = state.ply, U = state.undo;
    ensureCap(state, p);
    U.m[p] = m; U.cap[p] = cap; U.hm[p] = state.halfmove;
    U.hh[p] = state.hashHi; U.hl[p] = state.hashLo;
    U.k0[p] = state.kingSq[0]; U.k1[p] = state.kingSq[1];

    state.board[to] = pc; state.board[from] = 0;
    state.hashHi ^= ZH[pc][from] ^ ZH[pc][to];
    state.hashLo ^= ZL[pc][from] ^ ZL[pc][to];
    if (cap) { state.hashHi ^= ZH[cap][to]; state.hashLo ^= ZL[cap][to]; }
    if (pc === piece(KING, 0) || pc === piece(KING, 1)) state.kingSq[colorOf(pc)] = to;
    state.turn ^= 1;
    state.hashHi ^= Z_TURN_H; state.hashLo ^= Z_TURN_L;
    // 自然限着口径：只有“吃子”才清零，兵未吃子的推进只累加（与 toFEN/状态文案一致）。
    state.halfmove = cap ? 0 : state.halfmove + 1;
    state.ply++;
    if (state.turn === RED) state.moveNumber++;
    state.hashLog[state.ply] = keyOf(state);
    return cap;
  }

  function unmakeMove(state) {
    var p = state.ply - 1, U = state.undo, m = U.m[p];
    var from = fromOf(m), to = toOf(m), pc = state.board[to], cap = U.cap[p];
    state.board[from] = pc; state.board[to] = cap;
    state.hashHi ^= ZH[pc][from] ^ ZH[pc][to];
    state.hashLo ^= ZL[pc][from] ^ ZL[pc][to];
    if (cap) { state.hashHi ^= ZH[cap][to]; state.hashLo ^= ZL[cap][to]; }
    state.hashHi ^= Z_TURN_H; state.hashLo ^= Z_TURN_L;
    state.turn ^= 1;
    if (pc === piece(KING, 0) || pc === piece(KING, 1)) state.kingSq[colorOf(pc)] = from;
    state.halfmove = U.hm[p];
    state.ply = p;
    if (state.turn === BLACK) state.moveNumber--;
  }

  function legalMoves(state, color) {
    color = color === undefined ? state.turn : color;
    var pseudo = genPseudo(state, color, false, []), legal = [];
    var saveTurn = state.turn;
    for (var i = 0; i < pseudo.length; i++) {
      makeMove(state, pseudo[i]);
      if (!inCheck(state, color)) legal.push(pseudo[i]);
      unmakeMove(state);
    }
    state.turn = saveTurn;
    return legal;
  }

  function perft(state, depth) {
    if (depth === 0) return 1;
    var color = state.turn, list = genPseudo(state, color, false, []), n = 0;
    for (var i = 0; i < list.length; i++) {
      makeMove(state, list[i]);
      if (!inCheck(state, color)) n += depth === 1 ? 1 : perft(state, depth - 1);
      unmakeMove(state);
    }
    return n;
  }

  /* ---------------- 中文记谱 ---------------- */
  function peersOf(state, color, type) {
    var want = piece(type, color), list = [];
    for (var s = 0; s < SQUARES; s++) if (state.board[s] === want) list.push(s);
    return list;
  }

  // 只有同一条路上的同类子才需要“前/中/后”；异路子靠路分即可区分（如相三进五 / 相七进五）
  function labelFor(state, m, color, type, from, peers) {
    var fc = colOf(from), group = [];
    for (var i = 0; i < peers.length; i++) if (colOf(peers[i]) === fc) group.push(peers[i]);
    if (group.length < 2 || group.length > 3) return null;
    group.sort(function (a, b) { return color === RED ? a - b : b - a; }); // 靠近对方战场者为“前”
    var idx = group.indexOf(from);
    return group.length === 2 ? (idx === 0 ? '前' : '后') : ['前', '中', '后'][idx];
  }

  function moveToText(state, m) {
    var from = fromOf(m), to = toOf(m);
    var pc = state.board[from];
    if (!pc) return '——';
    var color = colorOf(pc), type = typeOf(pc);
    var fr = rowOf(from), fc = colOf(from), tr = rowOf(to), tc = colOf(to);
    var dr = tr - fr, dc = tc - fc;
    var fileNow = color === RED ? FILES - fc : fc + 1;
    var fileTo = color === RED ? FILES - tc : tc + 1;
    var verb = dr === 0 ? '平' : ((color === RED ? dr < 0 : dr > 0) ? '进' : '退');

    var steps, target;
    if (dr === 0) { steps = null; target = num(color, fileTo); }
    else if (dc === 0 && (type === ROOK || type === CANNON || type === PAWN || type === KING)) { steps = num(color, Math.abs(dr)); target = null; }
    else { steps = null; target = num(color, fileTo); }

    var peers = peersOf(state, color, type);
    var label = peers.length >= 2 ? labelFor(state, m, color, type, from, peers) : null;
    var head = label ? label + NAME[color][type] : NAME[color][type] + num(color, fileNow);
    return head + verb + (steps !== null ? steps : target);
  }

  function num(color, n) { return color === RED ? CN_NUM[n] : String(n); }

  /* ---------------- 非法着法解释 ---------------- */
  function whyNoMove(state, from, to) {
    var a = state.board[from], b = state.board[to];
    var r = state.turn;
    if (!a) return '这里没有棋子';
    if (colorOf(a) !== r) return '现在轮到' + (r === RED ? '红方' : '黑方') + '走';
    if (b && colorOf(b) === colorOf(a)) return '不能吃自己的棋子';
    var t = typeOf(a), fr = rowOf(from), fc = colOf(from), tr = rowOf(to), tc = colOf(to);
    var dr = tr - fr, dc = tc - fc, adR = Math.abs(dr), adC = Math.abs(dc);
    var diagonal = function () { return (adR === adC) && adR > 0; };
    var straight = function () { return (dr === 0) !== (dc === 0); };

    if (t === KING) {
      if (!straight()) return '帅/将只能沿直线走一格';
      if (adR + adC !== 1) return '帅/将每步只能走一格';
      if (!inPalace(tr, tc, colorOf(a))) return '帅/将不能走出九宫';
    } else if (t === ADVISOR) {
      if (!diagonal()) return '仕/士只能走斜线';
      if (adR !== 1) return '仕/士每步只能走一格';
      if (!inPalace(tr, tc, colorOf(a))) return '仕/士不能走出九宫';
    } else if (t === ELEPHANT) {
      if (!diagonal() || adR !== 2) return '相/象走“田”字';
      if (colorOf(a) === RED ? tr < 5 : tr > 4) return '相/象不能过河';
      if (state.board[sq(fr + dr / 2, fc + dc / 2)]) return '象眼被塞住了';
    } else if (t === HORSE) {
      if (!((adR === 2 && adC === 1) || (adR === 1 && adC === 2))) return '马/馬走“日”字';
      var legR = fr + (adR === 2 ? dr / 2 : 0), legC = fc + (adC === 2 ? dc / 2 : 0);
      if (state.board[sq(legR, legC)]) return '马腿被蹩住了';
    } else if (t === ROOK) {
      if (!straight()) return '车只能走直线';
      for (var s = fr + Math.sign(dr), c2 = fc + Math.sign(dc); s !== tr || c2 !== tc; s += Math.sign(dr), c2 += Math.sign(dc)) {
        if (state.board[sq(s, c2)]) return '车路上有子，不能穿越';
      }
    } else if (t === CANNON) {
      if (!straight()) return '炮只能走直线';
      var screens = 0;
      for (var s3 = fr + Math.sign(dr), c3 = fc + Math.sign(dc); s3 !== tr || c3 !== tc; s3 += Math.sign(dr), c3 += Math.sign(dc)) {
        if (state.board[sq(s3, c3)]) screens++;
      }
      if (!b && screens > 0) return '炮中间隔了子，不能直接落空位';
      if (b && screens === 0) return '炮打子需要恰好一个炮架';
      if (b && screens > 1) return '炮打子只能翻一个炮架';
    } else {
      var fwd = colorOf(a) === RED ? -1 : 1;
      if (dr === fwd && dc === 0) { if (tr < 0 || tr >= RANKS) return '兵/卒已到底线'; }
      else if (dr === 0 && adC === 1) {
        if (!crossedRiver(fr, colorOf(a))) return '兵/卒未过河不能横走';
      } else if (dr !== 0 && Math.sign(dr) !== Math.sign(fwd)) return '兵/卒不能后退';
      else return '兵/卒只能前进一格或过河后横走一格';
    }

    // 几何上合法，则说明是“送将”或“照面”
    var pseudo = genPseudo(state, colorOf(a), false, []), found = false;
    for (var i = 0; i < pseudo.length; i++) if (pseudo[i] === moveOf(from, to, b)) found = true;
    if (!found) return '这样走不通';
    var m2 = moveOf(from, to, b), save = state.turn;
    makeMove(state, m2);
    var bad = inCheck(state, colorOf(a));
    var reason = '走后自己的帅/将正被将军，不能送吃';
    if (bad) {
      var enemyKing = state.kingSq[colorOf(a) ^ 1], myKing = state.kingSq[colorOf(a)];
      if (enemyKing >= 0 && colOf(enemyKing) === colOf(myKing)) {
        var lo = Math.min(rowOf(enemyKing), rowOf(myKing)), hi = Math.max(rowOf(enemyKing), rowOf(myKing)), clear = true;
        for (var rr = lo + 1; rr < hi; rr++) if (state.board[sq(rr, colOf(myKing))]) clear = false;
        if (clear) reason = '将帅不能照面（白脸将）';
      }
    }
    unmakeMove(state);
    state.turn = save;
    return bad ? reason : '这样走不通';
  }

  /* ---------------- 终局判定 ---------------- */
  // “进攻子力”：车 / 马 / 炮 / 兵（卒）都算，过河与否一视同仁。
  // 双方都只剩将帅（无任何进攻子力）时判和。这是简化判定，不区分单马/单象能否杀王。
  function attackingForce(state, color) {
    for (var s = 0; s < SQUARES; s++) {
      var pc = state.board[s];
      if (!pc || colorOf(pc) !== color) continue;
      var t = typeOf(pc);
      if (t === ROOK || t === HORSE || t === CANNON || t === PAWN) return true;
    }
    return false;
  }

  // 简化重复局面计数：统计本局已记录的 hashLog 中，与当前 key（含轮走方）相同的出现次数，
  // 含当前局面本身。仅统计“同一局面重复出现”，不判定长将/长捉的性质。
  function repetitionCount(state) {
    var key = keyOf(state), n = 1;
    for (var i = state.ply - 2; i >= 0; i -= 2) if (state.hashLog[i] === key) n++;
    return n;
  }

  function status(state, legal) {
    legal = legal || legalMoves(state);
    if (legal.length === 0) {
      return inCheck(state, state.turn)
        ? { over: true, winner: state.turn ^ 1, reason: state.turn === RED ? '红方被将死' : '黑方被将死', code: 'mate' }
        : { over: true, winner: state.turn ^ 1, reason: (state.turn === RED ? '红方' : '黑方') + '无着可走（困毙）', code: 'stalemate' };
    }
    if (repetitionCount(state) >= 3)
      return { over: true, winner: -1, reason: '同一局面重复三次（简化判和，未逐例裁定长将/长捉）', code: 'repetition' };
    if (state.halfmove >= 120 && state.moveNumber > 60)
      return { over: true, winner: -1, reason: '自然限着：连续 60 回合未吃子', code: 'limiter' };
    if (!attackingForce(state, RED) && !attackingForce(state, BLACK))
      return { over: true, winner: -1, reason: '双方均无进攻子力（仅剩将帅）', code: 'material' };
    return { over: false, winner: null, reason: '', code: '' };
  }

  // 局面深拷贝：搜索用它隔离对局状态，避免异步搜索与界面走子共享同一块可变棋盘。
  function cloneState(state) {
    var u = state.undo, cap = state.undoCap;
    return {
      board: state.board.slice(),
      turn: state.turn,
      kingSq: [state.kingSq[0], state.kingSq[1]],
      halfmove: state.halfmove,
      ply: state.ply,
      moveNumber: state.moveNumber,
      hashHi: state.hashHi, hashLo: state.hashLo,
      undoCap: cap,
      hashLog: state.hashLog.slice(),
      undo: {
        m: u.m.slice(), cap: u.cap.slice(), hm: u.hm.slice(), hh: u.hh.slice(),
        hl: u.hl.slice(), k0: u.k0.slice(), k1: u.k1.slice()
      }
    };
  }

  function findLegal(state, from, to) {
    var list = legalMoves(state, state.turn);
    for (var i = 0; i < list.length; i++) if (fromOf(list[i]) === from && toOf(list[i]) === to) return list[i];
    return -1;
  }

  function describeMove(state, m) {
    var from = fromOf(m), to = toOf(m), cap = capOf(m);
    return {
      move: m, from: from, to: to, cap: cap,
      san: moveToText(state, m),
      uci: sqName(from) + sqName(to),
      piece: state.board[from]
    };
  }

  return {
    RED: RED, BLACK: BLACK, KING: KING, ADVISOR: ADVISOR, ELEPHANT: ELEPHANT,
    HORSE: HORSE, ROOK: ROOK, CANNON: CANNON, PAWN: PAWN,
    NAME: NAME, START_FEN: START_FEN, SQUARES: SQUARES, FILES: FILES, RANKS: RANKS,
    typeOf: typeOf, colorOf: colorOf, piece: piece, rowOf: rowOf, colOf: colOf, sq: sq,
    onBoard: onBoard, inPalace: inPalace, crossedRiver: crossedRiver,
    moveOf: moveOf, fromOf: fromOf, toOf: toOf, capOf: capOf, sqName: sqName,
    fromFEN: fromFEN, toFEN: toFEN, cloneState: cloneState,
    genPseudo: genPseudo, legalMoves: legalMoves, inCheck: inCheck,
    makeMove: makeMove, unmakeMove: unmakeMove, perft: perft,
    moveToText: moveToText, whyNoMove: whyNoMove, status: status,
    repetitionCount: repetitionCount, findLegal: findLegal, describeMove: describeMove,
    attackingForce: attackingForce, keyOf: keyOf
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = XQ;
