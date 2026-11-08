/* 中国象棋引擎：局面评估 + 迭代加深负极大搜索（置换表 / 着法排序 / 静态搜索 / 开局库） */
var XQAI = (function () {
  'use strict';

  var E = XQ;
  var MATE = 90000, INF = 99999, MATE_LIMIT = MATE - 2000, MAX_PLY = 80;
  var RED = E.RED;

  var VAL = [0, 0, 160, 160, 440, 950, 470, 100];   // 按子力类型索引：士 相 马 车 炮 兵
  var MVV = [0, 0, 6, 6, 5, 9, 5, 2];

  function flat(rows) {
    var out = [];
    for (var r = 0; r < 10; r++) {
      var cells = rows[r].trim().split(/\s+/);
      for (var c = 0; c < 9; c++) out.push(+cells[c]);
    }
    return out;
  }

  // 位置价值表：红方视角，第 0 行是黑方底线；黑方按行镜像（表本身左右对称）
  var PST = {
    1: flat([                       // 帅/将：坐镇底 line 最稳，露头扣分
      '0 0 0 0 0 0 0 0 0', '0 0 0 0 0 0 0 0 0', '0 0 0 0 0 0 0 0 0', '0 0 0 0 0 0 0 0 0',
      '0 0 0 0 0 0 0 0 0', '0 0 0 0 0 0 0 0 0', '0 0 0 0 0 0 0 0 0',
      '0 0 0 -25 -20 -25 0 0 0', '0 0 0 -12 -8 -12 0 0 0', '0 0 0 2 14 2 0 0 0']),
    2: flat([                       // 仕/士
      '0 0 0 0 0 0 0 0 0', '0 0 0 0 0 0 0 0 0', '0 0 0 0 0 0 0 0 0', '0 0 0 0 0 0 0 0 0',
      '0 0 0 0 0 0 0 0 0', '0 0 0 0 0 0 0 0 0', '0 0 0 0 0 0 0 0 0',
      '0 0 0 6 0 6 0 0 0', '0 0 0 0 10 0 0 0 0', '0 0 0 8 0 8 0 0 0']),
    3: flat([                       // 相/象
      '0 0 0 0 0 0 0 0 0', '0 0 0 0 0 0 0 0 0', '0 0 0 0 0 0 0 0 0', '0 0 0 0 0 0 0 0 0',
      '0 0 0 0 0 0 0 0 0', '2 0 5 0 6 0 5 0 2', '0 0 0 0 0 0 0 0 0',
      '0 0 4 0 8 0 4 0 0', '0 0 0 0 0 0 0 0 0', '0 0 8 0 0 0 8 0 0']),
    4: flat([                       // 马
      '4 8 16 12 4 12 16 8 4', '4 10 28 16 8 16 28 10 4', '12 14 16 20 18 20 16 14 12',
      '8 24 18 24 20 24 18 24 8', '6 16 14 18 16 18 14 16 6', '4 12 16 14 12 14 16 12 4',
      '2 12 8 8 8 8 8 12 2', '4 6 14 12 12 12 14 6 4', '2 6 10 10 10 10 10 6 2',
      '2 2 6 8 10 8 6 2 2']),
    5: flat([                       // 车
      '14 14 12 18 16 18 12 14 14', '16 18 16 22 22 22 16 18 16', '18 20 18 24 24 24 18 20 18',
      '16 18 16 22 22 22 16 18 16', '14 16 14 18 18 18 14 16 14', '10 10 8 14 14 14 8 10 10',
      '6 8 6 10 12 10 6 8 6', '4 8 6 10 12 10 6 8 4', '4 8 6 10 14 10 6 8 4',
      '6 10 8 14 16 14 8 10 6']),
    6: flat([                       // 炮
      '6 4 0 8 14 8 0 4 6', '2 2 0 4 12 4 0 2 2', '2 8 0 8 18 8 0 8 2',
      '4 10 14 14 20 14 14 10 4', '4 10 12 16 18 16 12 10 4', '4 8 10 12 12 12 10 8 4',
      '2 6 8 8 12 8 8 6 2', '2 2 4 6 10 6 4 2 2', '2 2 2 4 6 4 2 2 2', '2 2 2 6 10 6 2 2 2']),
    7: flat([                       // 兵/卒：过河升值，兵临城下最凶，到底线威力回落
      '60 80 100 130 140 130 100 80 60', '180 210 250 290 300 290 250 210 180',
      '150 180 220 250 260 250 220 180 150', '110 140 180 200 210 200 180 140 110',
      '80 100 130 150 160 150 130 100 80', '10 20 30 40 50 40 30 20 10',
      '0 0 6 10 14 10 6 0 0', '0 0 0 0 0 0 0 0 0', '0 0 0 0 0 0 0 0 0', '0 0 0 0 0 0 0 0 0'])
  };

  function mirrorSq(s) { return (9 - ((s / 9) | 0)) * 9 + (s % 9); }

  /* ---------------- 评估 ---------------- */
  function mobility(b, color) {
    var n = 0;
    for (var s = 0; s < 90; s++) {
      var pc = b[s];
      if (!pc || (pc >> 3) !== color) continue;
      var t = pc & 7;
      if (t !== 5 && t !== 6 && t !== 4) continue;
      var r = (s / 9) | 0, c = s % 9, d;
      if (t === 5 || t === 6) {
        for (d = 0; d < 4; d++) {
          var dr = OR_DR[d], dc = OR_DC[d];
          var rr = r + dr, cc = c + dc, jumped = false;
          while (rr >= 0 && rr < 10 && cc >= 0 && cc < 9) {
            var p = b[rr * 9 + cc];
            if (t === 5) { if (p) break; n++; }
            else if (!jumped) { if (!p) n++; else jumped = true; }
            else if (p) break;
            rr += dr; cc += dc;
          }
        }
      } else {
        for (var i = 0; i < 8; i++) {
          var nr = r + HS_DR[i], nc = c + HS_DC[i];
          if (nr < 0 || nr > 9 || nc < 0 || nc > 8) continue;
          var legR = r + (Math.abs(HS_DR[i]) === 2 ? HS_DR[i] / 2 : 0);
          var legC = c + (Math.abs(HS_DC[i]) === 2 ? HS_DC[i] / 2 : 0);
          if (b[legR * 9 + legC]) continue;
          var q = b[nr * 9 + nc];
          if (!q || (q >> 3) !== color) n++;
        }
      }
    }
    return n;
  }
  var OR_DR = [-1, 1, 0, 0], OR_DC = [0, 0, -1, 1];
  var HS_DR = [-2, -2, 2, 2, -1, -1, 1, 1], HS_DC = [-1, 1, -1, 1, -2, 2, 2, -2];

  // 红方为正、黑方为负（厘兵）
  function evaluate(state) {
    var b = state.board, score = 0, s, pc, t, color, r;
    var cnt = [[0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0]];
    for (s = 0; s < 90; s++) {
      pc = b[s];
      if (!pc) continue;
      t = pc & 7; color = pc >> 3;
      score += (color === RED ? 1 : -1) * (VAL[t] + PST[t][color === RED ? s : mirrorSq(s)]);
      cnt[color][t]++;
    }
    for (var side = 0; side < 2; side++) {
      var mine = cnt[side], foe = cnt[side ^ 1], sgn = side === RED ? 1 : -1;
      var threat = (foe[4] + foe[5] + foe[6] + foe[7]) > 0;
      var adv = mine[2], ely = mine[3], k = sgn;
      if (adv === 0 && threat) score += -85 * k;
      else if (adv === 1) score += -28 * k;
      if (ely === 0 && threat) score += -55 * k;
      else if (ely === 1) score += -20 * k;
      if (adv === 2 && ely === 2) score += 24 * k;                       // 士象完整
      if (adv === 0 && foe[5] + foe[6] >= 2) score += -55 * k;           // 无士又遇上车炮
      var heartSq = side === RED ? E.sq(8, 4) : E.sq(1, 4);
      var hp = b[heartSq];
      if (hp && (hp >> 3) === side) {
        if ((hp & 7) === 4) score += -75 * k;                             // 窝心马
        else if ((hp & 7) === 6) score += -40 * k;                        // 窝心炮
      }
    }
    score += (mobility(b, RED) - mobility(b, E.BLACK)) * 3;
    return score;
  }

  function evalSTMS(state) {
    var v = evaluate(state);
    return state.turn === RED ? v : -v;
  }

  /* ---------------- 搜索 ---------------- */
  var tt = new Map(), TT_MAX = 400000;
  var killer = [], history = new Int32Array(8100);
  var nodes = 0, deadline = 0, stopped = false, seldepth = 0;

  function resetSearch(ms, keepTT) {
    if (!keepTT || tt.size > TT_MAX) tt.clear();
    killer = [];
    history = new Int32Array(8100);
    nodes = 0; seldepth = 0; stopped = false;
    deadline = Date.now() + ms;
  }

  function tick() {
    if ((nodes & 1023) === 0 && Date.now() > deadline) stopped = true;
    return stopped;
  }

  function twofold(state) {
    var key = E.keyOf(state);
    for (var i = state.ply - 2; i >= 0; i -= 2) if (state.hashLog[i] === key) return true;
    return false;
  }

  function scoreMoves(state, list, ttMove) {
    var b = state.board, n = list.length, sc = new Int32Array(n);
    var kl = killer[state.ply];
    for (var i = 0; i < n; i++) {
      var m = list[i], from = E.fromOf(m), to = E.toOf(m), cap = b[to];
      if (m === ttMove) sc[i] = 1 << 29;
      else if (cap) sc[i] = (1 << 26) + MVV[cap & 7] * 4096 - MVV[b[from] & 7] * 64;
      else {
        var v = history[from * 90 + to];
        if (kl) { if (kl[0] === m) v += 900000; else if (kl[1] === m) v += 800000; }
        sc[i] = v;
      }
    }
    return sc;
  }

  function pickBest(sc, taken) {
    var best = -1, bv = -2147483647;
    for (var i = 0; i < sc.length; i++) {
      if (taken[i]) continue;
      if (sc[i] > bv) { bv = sc[i]; best = i; }
    }
    return best;
  }

  function quiesce(state, alpha, beta, ply) {
    nodes++;
    if (tick()) return alpha;
    if (ply > MAX_PLY - 2) return evalSTMS(state);
    var color = state.turn;
    var inChk = E.inCheck(state, color);
    var stand = alpha;
    if (!inChk) {
      stand = evalSTMS(state);
      if (stand >= beta) return stand;                                   // 静态分已够：fail-high
      if (stand > alpha) alpha = stand;
    }
    if (ply > seldepth) seldepth = ply;
    // 被将军时禁止 stand-pat：必须枚举全部应将着法（此时生成非吃子的走法用于解将）。
    var list = E.genPseudo(state, color, !inChk, []);
    var sc = scoreMoves(state, list, 0);
    var taken = new Uint8Array(list.length);
    var legal = 0;
    for (var iter = 0; iter < list.length; iter++) {
      var idx = pickBest(sc, taken);
      if (idx < 0) break;
      taken[idx] = 1;
      var m = list[idx], victim = state.board[E.toOf(m)];
      if (!inChk) {
        if (!victim) continue;
        if (stand + VAL[victim & 7] + 180 < alpha) continue;             // delta 剪枝（仅非被将时）
      }
      E.makeMove(state, m);
      if (E.inCheck(state, color)) { E.unmakeMove(state); continue; }    // 送将的应将/吃子一律剔除
      legal++;
      var s = -quiesce(state, -beta, -alpha, ply + 1);
      E.unmakeMove(state);
      if (stopped) return alpha;
      if (s > alpha) alpha = s;
      if (alpha >= beta) break;
    }
    if (inChk && legal === 0) return -MATE + ply;                        // 静态层内被将死（此前会被 stand-pat 掩盖）
    return alpha;
  }

  function search(state, depth, alpha, beta, ply) {
    nodes++;
    if (tick()) return alpha;
    var color = state.turn;
    var inChk = E.inCheck(state, color);
    if (inChk && depth < 10) depth += 2;                                 // 将军延伸
    if (depth <= 0) return quiesce(state, alpha, beta, ply);
    if (ply > MAX_PLY - 4) return evalSTMS(state);
    if (ply > seldepth) seldepth = ply;

    if (ply > 0 && !inChk) {                                             // 杀距剪枝
      var lo = -MATE + ply, hi = MATE - ply - 1;
      if (alpha < lo) alpha = lo;
      if (beta > hi) beta = hi;
      if (alpha >= beta) return alpha;
    }

    var key = E.keyOf(state), hit = tt.get(key), ttMove = 0, alphaOrig = alpha;
    if (hit) {
      ttMove = hit.m;
      if (hit.d >= depth && ply > 0) {
        var v = hit.v;
        if (v > MATE_LIMIT) v -= ply; else if (v < -MATE_LIMIT) v += ply;
        if (hit.f === 2 || (hit.f === 0 && v <= alpha) || (hit.f === 1 && v >= beta)) return v;
      }
    }
    if (ply > 0 && twofold(state)) return 0;

    var list = E.genPseudo(state, color, false, []);
    var sc = scoreMoves(state, list, ttMove);
    var taken = new Uint8Array(list.length);
    var best = -INF, bestMove = 0, legalCount = 0;

    for (var iter = 0; iter < list.length; iter++) {
      var idx = pickBest(sc, taken);
      if (idx < 0) break;
      taken[idx] = 1;
      var m = list[idx], from = E.fromOf(m), to = E.toOf(m);
      var isCap = !!state.board[to];
      E.makeMove(state, m);
      if (E.inCheck(state, color)) { E.unmakeMove(state); continue; }
      legalCount++;
      var s;
      if (legalCount === 1) {
        s = -search(state, depth - 1, -beta, -alpha, ply + 1);
      } else {
        var red = 0;
        if (depth >= 3 && legalCount > 3 && !isCap && !inChk && !E.inCheck(state, color ^ 1)) {
          red = legalCount > 6 ? 2 : 1;
          if (sc[idx] <= 0) red++;
        }
        s = -search(state, depth - 1 - red, -alpha - 1, -alpha, ply + 1);
        if (s > alpha && red > 0) s = -search(state, depth - 1, -alpha - 1, -alpha, ply + 1);
        if (s > alpha && s < beta) s = -search(state, depth - 1, -beta, -alpha, ply + 1);
      }
      E.unmakeMove(state);
      if (stopped) return best > -INF ? best : alpha;
      if (s > best) { best = s; bestMove = m; }
      if (s > alpha) {
        alpha = s;
        if (!isCap) {
          history[from * 90 + to] += depth * depth;
          if (!killer[ply]) killer[ply] = [0, 0];
          if (killer[ply][0] !== m) { killer[ply][1] = killer[ply][0]; killer[ply][0] = m; }
        }
        if (alpha >= beta) {
          if (!isCap) history[from * 90 + to] += depth * depth;
          break;
        }
      }
    }

    if (legalCount === 0) return -MATE + ply;      // 将死或困毙都算输

    var store = best > MATE_LIMIT ? best + ply : (best < -MATE_LIMIT ? best - ply : best);
    var flag = best >= beta ? 1 : (best <= alphaOrig ? 0 : 2);
    if (!stopped) {
      var old = tt.get(key);
      if (!old || old.d <= depth) tt.set(key, { d: depth, f: flag, v: store, m: bestMove });
    }
    return best;
  }

  function pvFromTT(state, maxLen) {
    var line = [], seen = 0;
    for (var i = 0; i < maxLen; i++) {
      var e = tt.get(E.keyOf(state));
      if (!e || !e.m) break;
      var legal = E.legalMoves(state), found = -1;
      for (var j = 0; j < legal.length; j++) if (legal[j] === e.m) { found = e.m; break; }
      if (found < 0) break;
      line.push(found);
      E.makeMove(state, found);
      seen++;
    }
    for (var k = 0; k < seen; k++) E.unmakeMove(state);
    return line;
  }

  /* ---------------- 开局库（用中文着法文本与引擎生成结果比对） ---------------- */
  var BOOK = [
    { name: '中炮对屏风马·过河车', line: ['炮二平五', '马8进7', '马二进三', '卒7进1', '车一平二', '马2进3', '兵七进一', '车9平8', '车二进六', '炮8平9', '车二平三', '炮9退1', '兵五进一', '士4进5'] },
    { name: '中炮对屏风马·直横车', line: ['炮二平五', '马8进7', '马二进三', '车9平8', '车一平二', '马2进3', '兵三进一', '卒3进1', '马八进九', '炮8进4', '兵五进一', '士4进5'] },
    { name: '中炮对反宫马', line: ['炮二平五', '马2进3', '马二进三', '炮8平6', '车一平二', '卒7进1', '兵七进一', '马8进7', '炮八平六', '车9平8'] },
    { name: '中炮对顺手炮', line: ['炮二平五', '炮8平5', '马二进三', '马8进7', '车一平二', '车9平8', '兵七进一', '马2进1', '马八进七', '炮2进4'] },
    { name: '仙人指路对卒底炮', line: ['兵七进一', '炮2平3', '相三进五', '马8进7', '马八进七', '卒7进1', '车九进一', '车9平8'] },
    { name: '飞相局对中炮', line: ['相三进五', '炮8平5', '马二进三', '马8进7', '车一平二', '车9平8', '兵三进一', '卒3进1', '炮二进六', '炮5进4'] },
    { name: '起马局', line: ['马二进三', '卒3进1', '兵三进一', '马2进3', '马八进九', '车1平2', '车一平二', '炮8进4'] }
  ];

  function bookMove(state, playedTexts) {
    if (!playedTexts || playedTexts.length > 12) return null;
    var weights = {}, matched = 0, i, j;
    for (i = 0; i < BOOK.length; i++) {
      var bk = BOOK[i];
      if (bk.line.length <= playedTexts.length) continue;
      var same = true;
      for (j = 0; j < playedTexts.length; j++) if (bk.line[j] !== playedTexts[j]) { same = false; break; }
      if (!same) continue;
      matched++;
      var want = bk.line[playedTexts.length];
      weights[want] = (weights[want] || 0) + 1;
    }
    if (!matched) return null;
    var legal = E.legalMoves(state), pool = [], total = 0;
    for (i = 0; i < legal.length; i++) {
      var text = E.moveToText(state, legal[i]);
      if (weights[text]) { pool.push({ move: legal[i], text: text, w: weights[text] }); total += weights[text]; }
    }
    if (!pool.length) return null;
    var pick = Math.random() * total;
    for (i = 0; i < pool.length; i++) {
      pick -= pool[i].w;
      if (pick <= 0) { pool[i].name = bookName(pool[i].text); return pool[i]; }
    }
    pool[0].name = bookName(pool[0].text);
    return pool[0];
  }

  function bookName(text) {
    for (var i = 0; i < BOOK.length; i++) if (BOOK[i].line.indexOf(text) >= 0) return BOOK[i].name;
    return '';
  }

  /* ---------------- 棋力档位 ---------------- */
  var LEVELS = [
    { id: 0, name: '初学', depth: 2, ms: 260, noise: 130, blunder: 0.35 },
    { id: 1, name: '棋友', depth: 4, ms: 700, noise: 60, blunder: 0.16 },
    { id: 2, name: '高手', depth: 6, ms: 1600, noise: 20, blunder: 0.05 },
    { id: 3, name: '强业', depth: 8, ms: 3000, noise: 0, blunder: 0.02 },
    { id: 4, name: '大师', depth: 12, ms: 6000, noise: 0, blunder: 0 }
  ];

  function nextFrame() {
    return new Promise(function (res) { setTimeout(res, 0); });
  }

  function applyStrength(best, scored, lv) {
    if (!lv.blunder && !lv.noise) return best;
    if (!scored || scored.length < 2) return best;
    var top = scored[0].score;
    if (Math.random() < lv.blunder) {
      var loose = scored.filter(function (x) { return x.score >= top - 240; });
      if (loose.length > 1) return loose[(Math.random() * loose.length) | 0].move;
    }
    if (lv.noise) {
      var near = scored.filter(function (x) { return x.score >= top - lv.noise; });
      if (near.length > 1) return near[(Math.random() * near.length) | 0].move;
    }
    return best;
  }

  /* 迭代加深；根节点每走一步让出主线程，界面保持流畅。
     入口先用 cloneState 拍一张局面快照：搜索期间只改动副本，异步 yield 时对局
     棋盘可被界面安全地修改而不会串台。 */
  function think(state, opts) {
    opts = opts || {};
    state = E.cloneState(state);
    var lv = LEVELS[opts.level === undefined ? 2 : opts.level];
    var maxDepth = opts.depth || lv.depth;
    var budget = Math.round((opts.ms || lv.ms) * (opts.speedFactor || 1));
    var started = Date.now();

    var legal = E.legalMoves(state);
    if (legal.length === 0) {
      return Promise.resolve({ move: 0, score: 0, depth: 0, nodes: 0, ms: 0, pv: [], list: [], mate: false });
    }
    if (opts.book !== false && !opts.pure && state.ply < 12) {
      var bk = bookMove(state, opts.historyTexts || []);
      if (bk) {
        return Promise.resolve({
          move: bk.move, score: 0, depth: 0, nodes: 0, ms: 0, book: bk.name || '开局库',
          pv: [bk.move], list: [{ move: bk.move, score: 0 }]
        });
      }
    }

    resetSearch(budget, opts.keepTT !== false);
    var order = legal.slice();
    var scored = [], bestMove = order[0], bestScore = 0, doneDepth = 0, pv = [];

    return (async function () {
      var lastYield = Date.now();
      for (var depth = 1; depth <= maxDepth; depth++) {
        var alpha = -INF, local = [], localBest = 0;
        for (var i = 0; i < order.length; i++) {
          if (stopped) break;
          var m = order[i];
          E.makeMove(state, m);
          var s = -search(state, depth - 1, -INF, -alpha, 1);   // 根用 β=INF：改进的着法拿到的就是确切分
          E.unmakeMove(state);
          if (stopped) break;
          if (s > alpha) { alpha = s; localBest = m; }
          local.push({ move: m, score: s });
          if (Date.now() - lastYield > 40) { lastYield = Date.now(); await nextFrame(); }
        }
        if (stopped || !localBest) break;
        local.sort(function (a, b) { return b.score - a.score; });
        scored = local;
        bestMove = local[0].move;
        bestScore = local[0].score;
        doneDepth = depth;
        order = scored.map(function (x) { return x.move; });
        pv = pvFromTT(state, 20);
        if (opts.onInfo) {
          // 消费方（界面）若抛错，转成停止信号，避免异步搜索失控，交由界面 token 丢弃结果。
          try {
            opts.onInfo({
              depth: depth, score: bestScore, nodes: nodes, move: bestMove, pv: pv,
              ms: Date.now() - started, list: scored.slice(0, 8), seldepth: seldepth,
              mate: Math.abs(bestScore) > MATE_LIMIT
            });
          } catch (e) { stopped = true; break; }
        }
        if (Math.abs(bestScore) > MATE_LIMIT) break;
        if (Date.now() - started > budget * 0.7) break;
      }
      var chosen = opts.pure ? bestMove : applyStrength(bestMove, scored, lv);
      var ms = Date.now() - started;
      return {
        move: chosen, score: bestScore, depth: doneDepth, nodes: nodes, ms: ms,
        pv: pv, list: scored.slice(0, 8), seldepth: seldepth,
        mate: Math.abs(bestScore) > MATE_LIMIT,
        nps: Math.round(nodes / Math.max(1, ms / 1000))
      };
    })();
  }

  return {
    LEVELS: LEVELS, BOOK: BOOK, MATE: MATE, MATE_LIMIT: MATE_LIMIT,
    evaluate: evaluate, evalSTMS: evalSTMS, mobility: mobility, think: think,
    bookMove: bookMove, clearCache: function () { tt.clear(); },
    valueOf: function (t) { return VAL[t]; }
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = XQAI;
