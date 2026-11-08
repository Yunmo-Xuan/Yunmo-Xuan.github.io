/* ===== 界面层：棋盘渲染、走子交互、引擎对局、复盘与棋谱 ===== */
(function () {
  'use strict';
  var E = XQ, AI = XQAI;
  var $ = function (id) { return document.getElementById(id); };
  var NS = 'http://www.w3.org/2000/svg';
  var UNIT_W = 900, UNIT_H = 1000, MARGIN = 50, CELL = 100, PIECE_K = .87;
  var UNDO_MAX = 5;                       // 每局可悔棋次数

  var wrap = $('wrap'), layer = $('layer'), boardSvg = $('board');
  var boardScroll = $('boardScroll'), btnFit = $('btnFit'), btnZoomIn = $('btnZoomIn'),
    btnZoomOut = $('btnZoomOut'), zoomRead = $('zoomRead');

  var G = {
    start: E.START_FEN, st: E.fromFEN(E.START_FEN), hist: [], view: -1,
    mode: 'pve', my: E.RED, level: 2, limit: 0,
    clock: [0, 0], running: false, lastTick: Date.now(),
    flipped: false, sound: true, theme: 'wood', _savedTheme: null,
    picked: -1, legal: [], cursor: 45, dragging: null,
    thinking: false, token: 0, atoken: 0, hintSeq: 0, liveEpoch: 0,
    hostPaused: false, hostWasRunning: false,
    result: null, last: null, hintPair: null, info: null,
    playing: false, playTimer: 0, playSpeed: 1,
    undoLeft: UNDO_MAX,
    fitMode: true, zoomFactor: 1, _zoomUserSet: false
  };

  /* ---------------- 棋盘绘制 ---------------- */
  function el(name, attrs) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }
  function pt(row, col) { return [MARGIN + col * CELL, MARGIN + row * CELL]; }

  function buildBoard() {
    var defs = el('defs');
    var f = el('filter', { id: 'grain', x: '0', y: '0', width: '100%', height: '100%' });
    f.appendChild(el('feTurbulence', {
      type: 'fractalNoise', baseFrequency: '.011 .038', numOctaves: '3', seed: '7', stitchTiles: 'stitch'
    }));
    f.appendChild(el('feColorMatrix', { type: 'saturate', values: '0' }));
    defs.appendChild(f);
    var shade = el('radialGradient', { id: 'shade', cx: '50%', cy: '40%', r: '75%' });
    shade.appendChild(el('stop', { offset: '0%', 'stop-color': '#ffffff', 'stop-opacity': '.26' }));
    shade.appendChild(el('stop', { offset: '72%', 'stop-color': '#000000', 'stop-opacity': '.04' }));
    shade.appendChild(el('stop', { offset: '100%', 'stop-color': '#000000', 'stop-opacity': '.28' }));
    defs.appendChild(shade);
    boardSvg.appendChild(defs);

    boardSvg.appendChild(el('rect', { class: 'face', x: 0, y: 0, width: UNIT_W, height: UNIT_H, rx: 8 }));
    boardSvg.appendChild(el('rect', { class: 'grain', x: 0, y: 0, width: UNIT_W, height: UNIT_H, filter: 'url(#grain)' }));
    boardSvg.appendChild(el('rect', { class: 'sheen', x: 0, y: 0, width: UNIT_W, height: UNIT_H, fill: 'url(#shade)' }));

    var g = el('g'), r, c;
    for (r = 0; r < 10; r++) {
      var a = pt(r, 0), b = pt(r, 8);
      g.appendChild(el('line', { class: 'grid-line', x1: a[0], y1: a[1], x2: b[0], y2: b[1] }));
    }
    for (c = 0; c < 9; c++) {
      var top = pt(0, c), lo = pt(4, c), hi = pt(5, c), bot = pt(9, c);
      if (c === 0 || c === 8) g.appendChild(el('line', { class: 'grid-line', x1: top[0], y1: top[1], x2: bot[0], y2: bot[1] }));
      else {
        g.appendChild(el('line', { class: 'grid-line soft', x1: top[0], y1: top[1], x2: lo[0], y2: lo[1] }));
        g.appendChild(el('line', { class: 'grid-line soft', x1: hi[0], y1: hi[1], x2: bot[0], y2: bot[1] }));
      }
    }
    [[0, 3, 2, 5], [0, 5, 2, 3], [7, 3, 9, 5], [7, 5, 9, 3]].forEach(function (d) {
      var p1 = pt(d[0], d[1]), p2 = pt(d[2], d[3]);
      g.appendChild(el('line', { class: 'palace', x1: p1[0], y1: p1[1], x2: p2[0], y2: p2[1] }));
    });
    [[2, 1], [2, 7], [7, 1], [7, 7],
      [3, 0], [3, 2], [3, 4], [3, 6], [3, 8],
      [6, 0], [6, 2], [6, 4], [6, 6], [6, 8]].forEach(function (m) {
        var x = pt(m[0], m[1])[0], y = pt(m[0], m[1])[1], k = 11, o = 4;
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (s) {
          if (m[1] === 0 && s[0] < 0) return;
          if (m[1] === 8 && s[0] > 0) return;
          g.appendChild(el('path', {
            class: 'mark',
            d: 'M' + (x + s[0] * o) + ' ' + (y + s[1] * k) + 'V' + (y + s[1] * o) + 'H' + (x + s[0] * k)
          }));
        });
      });
    var t1 = el('text', { class: 'river', x: 148, y: 524 }); t1.textContent = '楚  河';
    var t2 = el('text', { class: 'river', x: 556, y: 524 }); t2.textContent = '漢  界';
    g.appendChild(t1); g.appendChild(t2);
    for (var i = 0; i < 9; i++) {
      var tx = el('text', { class: 'coord', x: pt(0, i)[0], y: 26 }); tx.textContent = String(i + 1);
      var bx = el('text', { class: 'coord rednum', x: pt(0, i)[0], y: 990 }); bx.textContent = '九八七六五四三二一'[i];
      g.appendChild(tx); g.appendChild(bx);
    }
    boardSvg.appendChild(g);
    // 外圈双线边框
    boardSvg.appendChild(el('rect', { class: 'border', x: 34, y: 34, width: 832, height: 932, rx: 4 }));
    boardSvg.appendChild(el('rect', { class: 'border inner', x: 42, y: 42, width: 816, height: 916, rx: 3 }));
  }

  /* ---------------- 坐标换算 ---------------- */
  function disp(sq) {
    if (!G.flipped) return sq;
    return E.sq(9 - E.rowOf(sq), 8 - E.colOf(sq));
  }
  function geom() {
    var b = wrap.getBoundingClientRect();
    return { w: b.width, h: b.height, left: b.left, top: b.top, cell: b.width / 9 };
  }
  function xyOf(sq) {
    var gm = geom(), d = disp(sq);
    return {
      x: (MARGIN + E.colOf(d) * CELL) / UNIT_W * gm.w,
      y: (MARGIN + E.rowOf(d) * CELL) / UNIT_H * gm.h,
      size: gm.cell * PIECE_K
    };
  }
  function sqAt(clientX, clientY) {
    var gm = geom();
    var ux = (clientX - gm.left) / gm.w * UNIT_W, uy = (clientY - gm.top) / gm.h * UNIT_H;
    var c = Math.round((ux - MARGIN) / CELL), r = Math.round((uy - MARGIN) / CELL);
    if (c < 0 || c > 8 || r < 0 || r > 9) return -1;
    if (Math.abs(ux - (MARGIN + c * CELL)) > CELL * .47 || Math.abs(uy - (MARGIN + r * CELL)) > CELL * .47) return -1;
    return G.flipped ? E.sq(9 - r, 8 - c) : E.sq(r, c);
  }

  /* ---------------- 棋子与提示层 ---------------- */
  var els = new Map();
  function pieceName(pc) { return E.NAME[E.colorOf(pc)][E.typeOf(pc)]; }
  function makePiece(pc, sq) {
    var d = document.createElement('div');
    d.className = 'piece slide ' + (E.colorOf(pc) === E.RED ? 'r' : 'b');
    d.innerHTML = '<i class="disc"></i><span class="face">' + pieceName(pc) + '</span>';
    layer.appendChild(d);
    place(d, sq);
    return d;
  }
  function place(node, sq) {
    var p = xyOf(sq);
    node.style.width = p.size + 'px';
    node.style.height = p.size + 'px';
    node.style.left = (p.x - p.size / 2) + 'px';
    node.style.top = (p.y - p.size / 2) + 'px';
    node.style.fontSize = (p.size * .55) + 'px';
    node.dataset.sq = sq;
  }
  function syncPieces(st, animate) {
    if (!animate) {
      layer.classList.add('noanim');
      els.forEach(function (n) { n.remove(); });
      els.clear();
      for (var s = 0; s < 90; s++) if (st.board[s]) els.set(s, makePiece(st.board[s], s));
      void layer.offsetWidth;
      layer.classList.remove('noanim');
      return;
    }
    var live = new Set();
    for (var q = 0; q < 90; q++) {
      if (!st.board[q]) continue;
      live.add(q);
      if (!els.has(q)) els.set(q, makePiece(st.board[q], q));
    }
    els.forEach(function (node, key) {
      if (!live.has(key)) {
        node.classList.add('gone');
        setTimeout(function () { node.remove(); }, 220);
        els.delete(key);
      }
    });
  }
  function relocate(from, to) {
    var src = els.get(from);
    els.delete(from);
    var victim = els.get(to);
    if (victim) {
      victim.classList.add('gone');
      setTimeout(function () { victim.remove(); }, 220);
      els.delete(to);
    }
    if (src) { els.set(to, src); place(src, to); }
  }
  function relayout() {
    if (wrap.getBoundingClientRect().width >= 40) els.forEach(function (node, sq) { place(node, sq); });
    paintSpots();
  }

  function spot(sq, cls) {
    var d = document.createElement('div');
    d.className = 'spot ' + cls;
    var p = xyOf(sq);
    d.style.left = (p.x - p.size / 2) + 'px';
    d.style.top = (p.y - p.size / 2) + 'px';
    d.style.width = p.size + 'px';
    d.style.height = p.size + 'px';
    return d;
  }
  function paintSpots() {
    Array.prototype.slice.call(layer.querySelectorAll('.spot')).forEach(function (n) { n.remove(); });
    els.forEach(function (n) { n.classList.remove('in-check'); });
    var st = shownState();
    if (G.last) {
      layer.appendChild(spot(G.last.from, 'last'));
      layer.appendChild(spot(G.last.to, 'last to'));
    }
    if (G.picked >= 0) {
      var ring = spot(G.picked, 'pick');
      ring.innerHTML = '<span class="picked-ring"></span>';
      layer.appendChild(ring);
      G.legal.forEach(function (m) {
        var to = E.toOf(m), s = spot(to, E.capOf(m) ? 'is-take' : 'is-quiet');
        s.innerHTML = E.capOf(m) ? '<span class="take"></span>' : '<span class="dot"></span>';
        layer.appendChild(s);
      });
    }
    if (G.hintPair) G.hintPair.forEach(function (sq) { layer.appendChild(spot(sq, 'hint')); });
    if (document.activeElement === layer) layer.appendChild(spot(G.cursor, 'cursor'));
    if (G.view < 0 && !G.result && E.inCheck(st, st.turn)) {
      var king = els.get(st.kingSq[st.turn]);
      if (king) king.classList.add('in-check');
    }
  }

  /* ---------------- 辅助查询 ---------------- */
  function shownState() {
    if (G.view < 0) return G.st;
    var h = G.hist[G.view];
    return h && h.fen ? E.fromFEN(h.fen) : G.st;
  }
  function rowTag(color) { return color === (G.flipped ? E.BLACK : E.RED) ? 'Bottom' : 'Top'; }
  function canMove() {
    if (G.result || G.view >= 0 || G.thinking) return false;
    if (G.mode === 'pvp') return true;
    if (G.mode === 'demo') return false;
    return G.st.turn === G.my;
  }
  function texts() { return G.hist.map(function (h) { return h.text; }); }
  function lostPieces(color) {
    var st = shownState(), out = [];
    [[E.ROOK, 2], [E.HORSE, 2], [E.CANNON, 2], [E.ADVISOR, 2], [E.ELEPHANT, 2], [E.PAWN, 5]].forEach(function (w) {
      var pc = E.piece(w[0], color), have = 0;
      for (var s = 0; s < 90; s++) if (st.board[s] === pc) have++;
      for (var k = have; k < w[1]; k++) out.push(pc);
    });
    return out;
  }

  /* ---------------- 面板绘制 ---------------- */
  var toastTimer = 0, bannerTimer = 0;
  function toast(msg, ms) {
    var t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, ms || 2400);
  }
  function banner(msg, alert) {
    var b = $('banner');
    b.textContent = msg;
    b.classList.toggle('alert', !!alert);
    b.classList.add('show');
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(function () { b.classList.remove('show'); }, 1700);
  }
  function setStatus(html) { $('status').innerHTML = html; }
  function announce(t) { $('announce').textContent = t; }

  /* ---------------- 全览与缩放 ---------------- */
  var ZOOM_KEY = 'qoder.xiangqi.zoom.v1';
  var ZOOM_MIN = 1, ZOOM_MAX = 2.6, ZOOM_STEP = 0.3;
  function reducedMotion() {
    try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }
    catch (e) { return false; }
  }
  function clampZoom(v) { return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, v)); }
  // 计算当前视口下可完整容纳棋盘（全览）所需的基准宽度
  function zoomMetrics() {
    var availW = boardScroll.clientWidth || wrap.getBoundingClientRect().width || 300;
    var rect = boardScroll.getBoundingClientRect();
    var scrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
    var docTop = rect.top + scrollTop;                        // 棋盘顶部在文档中的位置
    var availH = Math.max(240, window.innerHeight - docTop - 8); // 视口内可用高度
    var wfit = Math.min(availW, availH * 9 / 10);             // 受高/宽约束的全览宽度
    if (!(wfit > 40)) wfit = availW;
    return { availW: availW, availH: availH, wfit: wfit };
  }
  function applyZoom(animate) {
    if (!boardScroll || !wrap) return;
    var m = zoomMetrics();
    var factor = G.fitMode ? 1 : clampZoom(G.zoomFactor);
    var W = Math.max(140, Math.round(m.wfit * factor));
    var instant = reducedMotion() || !animate;
    boardScroll.style.maxHeight = Math.round(m.availH) + 'px';
    if (instant) {
      wrap.style.transition = 'none';
      wrap.style.width = W + 'px';
      void wrap.offsetWidth;                                  // 强制即时生效
      wrap.style.transition = '';
    } else {
      wrap.style.width = W + 'px';                            // 走 CSS 过渡（150-260ms）
    }
    relayout();
    if (btnFit) btnFit.setAttribute('aria-pressed', G.fitMode ? 'true' : 'false');
    if (zoomRead) zoomRead.textContent = Math.round(factor * 100) + '%';
  }
  function saveZoom() {
    G._zoomUserSet = true;
    try { localStorage.setItem(ZOOM_KEY, JSON.stringify({ mode: G.fitMode ? 'fit' : 'zoom', factor: clampZoom(G.zoomFactor) })); }
    catch (e) { /* 隐私模式等场景忽略 */ }
  }
  function loadZoom() {
    var d = null;
    try { var raw = localStorage.getItem(ZOOM_KEY); if (raw) d = JSON.parse(raw); } catch (e) { d = null; }
    if (d && (d.mode === 'fit' || d.mode === 'zoom')) {
      G.zoomFactor = clampZoom(+d.factor || 1);
      G.fitMode = d.mode === 'fit';
      G._zoomUserSet = true;
    } else {
      // 默认跟随视口：窄屏或棋盘放不进可视区进入全览，全览档即整盘可见
      G.zoomFactor = 1; G.fitMode = true; G._zoomUserSet = false;
    }
  }
  function setFit(on, quiet) {
    G.fitMode = !!on;
    applyZoom(true);
    saveZoom();
    if (!quiet) {
      toast(G.fitMode ? '全览：整盘适配屏幕' : '已退出全览');
      announce(G.fitMode ? '全览模式，整盘适配屏幕' : '退出全览，可放大查看');
    }
  }
  function zoomBy(delta) {
    if (G.fitMode) {
      if (delta > 0) { G.fitMode = false; G.zoomFactor = clampZoom(1 + ZOOM_STEP); }
      else { applyZoom(true); return; }                      // 全览下再缩小仍保持全览
    } else {
      G.zoomFactor = clampZoom(G.zoomFactor + delta);
      if (G.zoomFactor <= ZOOM_MIN + 1e-6) G.fitMode = true; // 缩到最小回到全览
    }
    applyZoom(true);
    saveZoom();
    var pct = Math.round((G.fitMode ? 1 : G.zoomFactor) * 100) + '%';
    toast(G.fitMode ? '全览：整盘适配屏幕' : '缩放 ' + pct);
    announce('缩放 ' + pct);
  }
  function toggleOverview() { setFit(!G.fitMode); }

  function sideLabel(color) {
    if (G.mode === 'pvp') return '玩家';
    if (G.mode === 'demo') return '引擎';
    return color === G.my ? '你' : '电脑';
  }
  function playerRows() {
    var st = shownState();
    var topColor = G.flipped ? E.RED : E.BLACK, botColor = topColor ^ 1;
    [[topColor, 'Top'], [botColor, 'Bottom']].forEach(function (pair) {
      var color = pair[0], tag = pair[1];
      $('pav' + tag).textContent = E.NAME[color][E.KING];
      $('pav' + tag).className = 'pav ' + (color === E.RED ? 'r' : 'b');
      $('name' + tag).textContent = (color === E.RED ? '红方' : '黑方') + ' · ' + sideLabel(color);
      $('sub' + tag).textContent = (G.mode === 'pve' && color === G.my) || G.mode === 'pvp'
        ? '人类玩家' : AI.LEVELS[G.level].name + ' 档引擎';
      var row = $('row' + tag);
      row.classList.toggle('active', !G.result && G.view < 0 && st.turn === color && !G.thinking);
      row.classList.toggle('thinking', G.thinking && G.st.turn === color);
      $('tray' + tag).innerHTML = lostPieces(color).map(function (pc) {
        return '<i class="' + (E.colorOf(pc) === E.RED ? 'r' : 'b') + '">' + pieceName(pc) + '</i>';
      }).join('');
      var cl = $('clock' + tag);
      if (!G.limit) cl.textContent = '第 ' + (Math.floor(G.hist.length / 2) + 1) + ' 回合';
      else cl.textContent = clockStr(color);
    });
  }
  function clockStr(color) {
    var s = Math.max(0, G.clock[color]), m = Math.floor(s / 60), sec = Math.floor(s % 60);
    return m + ':' + (sec < 10 ? '0' : '') + sec;
  }

  function evalCp() {
    var i = G.info;
    if (i && typeof i.score === 'number' && Math.abs(i.score) < 80000) return G.st.turn === E.RED ? i.score : -i.score;
    return AI.evaluate(G.st);
  }
  function fmt(n) { return n > 999999 ? (n / 1000000).toFixed(1) + 'M' : n > 999 ? Math.round(n / 1000) + 'k' : String(n); }
  function mateMoves(score) { return Math.max(1, Math.round((AI.MATE - Math.abs(score) + 1) / 2)); }

  function paintEngine() {
    var info = G.info;
    $('engDepth').textContent = info && info.depth ? info.depth : '—';
    $('engNodes').textContent = info ? fmt(info.nodes) : '—';
    $('engMs').textContent = info ? (info.ms / 1000).toFixed(2) + 's' : '—';
    var sc = '—';
    if (info) sc = info.mate ? (info.score > 0 ? '杀' : '被杀') + mateMoves(info.score) : (info.score / 100).toFixed(2);
    $('engScore').textContent = sc;
    $('engTag').textContent = G.thinking ? '思考中' : (info ? (info.analysis ? '分析' : '已出着') : '待机');
    $('engPv').innerHTML = info && info.pv && info.pv.length ? pvText(info.pv) : '等待引擎分析';
    var cp = evalCp();
    $('evalFill').style.width = Math.max(2, Math.min(98, 50 + 50 * Math.tanh(cp / 620))) + '%';
    $('evalText').textContent = Math.abs(cp) > 8000 ? '杀势'
      : cp > 40 ? '红优 +' + (cp / 100).toFixed(1)
        : cp < -40 ? '黑优 ' + (cp / 100).toFixed(1) : '均势';
    var list = info && info.list ? info.list : [];
    $('cands').innerHTML = list.slice(0, 5).map(function (x, i) {
      return '<li><em>' + (i + 1) + '</em><b>' + E.moveToText(G.st, x.move) + '</b><i>' +
        (Math.abs(x.score) > 80000 ? '杀' : (x.score / 100).toFixed(1)) + '</i></li>';
    }).join('');
    paintGraph();
  }
  function pvText(pv) {
    var st = E.fromFEN(E.toFEN(G.st)), out = [];
    for (var i = 0; i < pv.length && i < 14; i++) {
      var legal = E.legalMoves(st), hit = -1;
      for (var j = 0; j < legal.length; j++) if (legal[j] === pv[i]) { hit = pv[i]; break; }
      if (hit < 0) break;
      var red = st.turn === E.RED;
      out.push((red ? '<b>' : '') + E.moveToText(st, hit) + (red ? '</b>' : ''));
      E.makeMove(st, hit);
    }
    return out.join(' ');
  }
  function paintGraph() {
    var svg = $('graph'), W = 300, MID = 31, AMP = 27;
    var pts = [0].concat(G.hist.map(function (h) { return (typeof h.evalR === 'number' ? h.evalR : 0); }));
    var clamp = function (v) { return Math.max(-1400, Math.min(1400, v)); };
    if (pts.length < 2) { svg.innerHTML = '<line class="zero" x1="0" y1="' + MID + '" x2="300" y2="' + MID + '"/>'; return; }
    var step = W / (pts.length - 1);
    var path = pts.map(function (v, i) { return (i * step).toFixed(1) + ',' + (MID - clamp(v) / 1400 * AMP).toFixed(1); });
    var marks = '';
    for (var i = 1; i < pts.length; i++) {
      var cx = i * step, cy = MID - clamp(pts[i]) / 1400 * AMP, on = (G.view === i - 1);
      marks += '<rect class="hit" x="' + (cx - step / 2).toFixed(1) + '" y="0" width="' + step.toFixed(1) + '" height="62" data-i="' + (i - 1) + '"><title>跳到第 ' + i + ' 手</title></rect>';
      marks += '<circle class="ply' + (on ? ' on' : '') + '" cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="' + (on ? 3.6 : 2) + '"/>';
    }
    svg.innerHTML = '<line class="zero" x1="0" y1="' + MID + '" x2="300" y2="' + MID + '"/>' +
      '<polygon class="area" points="0,' + MID + ' ' + path.join(' ') + ' ' + W + ',' + MID + '"/>' +
      '<polyline class="curve" points="' + path.join(' ') + '"/>' +
      marks +
      '<circle class="tip" cx="' + W + '" cy="' + (MID - clamp(pts[pts.length - 1]) / 1400 * AMP).toFixed(1) + '" r="2.8"/>';
  }
  function markOf(h) {
    return (h.check ? '<span class="mk">将</span>' : '') + (h.cap ? '<span class="mk">吃</span>' : '');
  }
  function paintMoves() {
    var rows = [];
    for (var i = 0; i < G.hist.length; i += 2) {
      var r = G.hist[i], b = G.hist[i + 1];
      rows.push('<tr><td class="no">' + (i / 2 + 1) + '</td>' +
        '<td class="r' + (G.view === i ? ' view' : '') + '" data-i="' + i + '">' + r.text + markOf(r) + '</td>' +
        '<td class="b' + (G.view === i + 1 ? ' view' : '') + '"' + (b ? ' data-i="' + (i + 1) + '"' : '') + '>' +
        (b ? b.text + markOf(b) : '') + '</td></tr>');
    }
    $('moves').innerHTML = rows.length ? '<table>' + rows.join('') + '</table>' : '<div class="empty">尚无着法</div>';
    $('plyTag').textContent = G.hist.length + ' 手';
    $('reviewbar').classList.toggle('show', G.view >= 0 && !!G.hist[G.view]);
    if (G.view >= 0 && G.hist[G.view]) $('reviewText').textContent = '复盘：第 ' + (G.view + 1) + ' 手 ' + G.hist[G.view].text;
    var active = $('moves').querySelector('.view');
    if (active) active.scrollIntoView({ block: 'nearest' });
    else if (G.hist.length) $('moves').scrollTop = $('moves').scrollHeight;
  }
  function paintStatusLine() {
    var st = shownState();
    if (G.result) {
      var w = G.result.winner;
      setStatus('<b>' + (w < 0 ? '和棋' : (w === E.RED ? '红方胜' : '黑方胜')) + '</b><span>' + G.result.reason + ' · 点「重新开始」再来一局</span>');
      return;
    }
    if (G.view >= 0) { setStatus('<b>复盘模式</b><span>棋盘只读，点「回到当前」继续对局</span>'); return; }
    if (G.thinking) {
      var i = G.info;
      setStatus('<span class="spin"></span><b>' + (st.turn === E.RED ? '红方' : '黑方') + '（引擎）思考中</b><span>' +
        (i ? '深度 ' + i.depth + ' · ' + fmt(i.nodes) + ' 节点 · ' + (i.ms / 1000).toFixed(1) + 's' : '准备中') + '</span>');
      return;
    }
    var chk = E.inCheck(st, st.turn);
    setStatus('<b>轮到' + (st.turn === E.RED ? '红方' : '黑方') + '（' + sideLabel(st.turn) + '）</b><span>' +
      (chk ? '已被将军，必须应将' : canMove() ? '点击或拖动棋子走棋；按 H 可取建议' : '等待引擎') + '</span>');
  }
  function paintUndoBtn() {
    $('undoCnt').textContent = String(Math.max(0, G.undoLeft));
    $('btnUndo').classList.toggle('spent', G.undoLeft <= 0);
    $('btnUndo').title = G.undoLeft > 0 ? '本局还可悔棋 ' + G.undoLeft + ' 次' : '本局悔棋次数已用完，可点「重新开始」另开一局';
  }
  function render(animate) {
    syncPieces(shownState(), animate);
    paintSpots();
    playerRows();
    paintMoves();
    paintUndoBtn();
    paintStatusLine();
    paintEngine();
  }

  /* ---------------- 走子 ---------------- */
  function pick(sq) {
    unpick();
    G.picked = sq;
    G.legal = E.legalMoves(G.st).filter(function (m) { return E.fromOf(m) === sq; });
    var node = els.get(sq);
    if (node) node.classList.add('picked');
    paintSpots();
    if (!G.legal.length) toast('这枚' + pieceName(G.st.board[sq]) + '无着可走');
  }
  function unpick() {
    if (G.picked >= 0) {
      var node = els.get(G.picked);
      if (node) node.classList.remove('picked');
    }
    G.picked = -1; G.legal = []; G.hintPair = null;
  }
  function shakeNode(sq) {
    var node = els.get(sq);
    if (!node) return;
    node.classList.add('shake');
    setTimeout(function () { node.classList.remove('shake'); }, 360);
  }
  function reject(from, to) {
    shakeNode(from);
    Snd.illegal();
    toast(E.whyNoMove(G.st, from, to));
  }
  function tryMove(from, to) {
    var m = E.findLegal(G.st, from, to);
    if (m < 0) { reject(from, to); return false; }
    commit(m, true);
    return true;
  }
  function commit(m, byHuman) {
    stopPlay();
    G.hintSeq++; G.liveEpoch++;          // 棋盘已变：作废在途的提示与分析
    var st = G.st, desc = E.describeMove(st, m), by = E.colorOf(desc.piece);
    unpick();
    E.makeMove(st, m);
    var checking = E.inCheck(st, st.turn);
    G.hist.push({
      move: m, text: desc.san, cap: desc.cap, by: by, check: checking,
      fen: E.toFEN(st), evalR: AI.evaluate(st)
    });
    G.last = { from: desc.from, to: desc.to };
    G.info = null;
    relocate(desc.from, desc.to);
    syncPieces(st, true);
    if (desc.cap) Snd.capture(); else Snd.move();
    if (checking) { banner('将军', true); setTimeout(Snd.check, 150); }
    announce((by === E.RED ? '红方 ' : '黑方 ') + desc.san + (desc.cap ? ' 吃子' : '') + (checking ? '，将军' : ''));
    var stt = E.status(st);
    render(true);
    if (stt.over) { finish(stt); return; }
    persist();
    maybeAI(byHuman);
    analyze();
  }

  function maybeAI(byHuman) {
    if (G.result || G.view >= 0) return;
    var isAI = G.mode === 'demo' || (G.mode === 'pve' && G.st.turn !== G.my);
    if (!isAI) return;
    var token = ++G.token;
    G.thinking = true;
    render(false);
    var go = function () {
      if (token !== G.token) return;
      var budget = AI.LEVELS[G.level].ms;
      if (G.limit) budget = Math.max(200, Math.min(budget, G.clock[G.st.turn] * 350));
      AI.think(G.st, {
        level: G.level, ms: budget, historyTexts: texts(),
        onInfo: function (info) {
          if (token !== G.token) return;
          G.info = info;
          paintEngine(); paintStatusLine();
        }
      }).then(function (res) {
        if (token !== G.token) return;
        G.thinking = false;
        if (G.result || G.view >= 0) { render(false); return; }
        if (!res.move) { finish(E.status(G.st)); return; }        // 无着可走：将死或困毙
        if (res.book) banner('开局库 · ' + res.book, false);
        commit(res.move, false);
      }).catch(function (err) {
        G.thinking = false;
        toast('引擎异常：' + err.message);
        render(false);
      });
    };
    if (G.mode === 'demo') setTimeout(go, 380); else go();
  }

  // 轮到玩家时做一次轻量分析，让评分条、预测变着与候选始终有内容
  function analyze() {
    if (G.result || G.view >= 0 || G.thinking || !canMove()) return;
    var t = ++G.atoken, rootFen = E.toFEN(G.st);
    AI.think(G.st, {
      level: 1, depth: 6, ms: 420, book: false, keepTT: true,
      onInfo: function (info) {
        if (t !== G.atoken || G.thinking || G.result || G.view >= 0 || E.toFEN(G.st) !== rootFen) return;
        info.analysis = true;
        G.info = info;
        paintEngine();
      }
    }).then(function (res) {
      if (t !== G.atoken || G.thinking || G.result || G.view >= 0 || E.toFEN(G.st) !== rootFen) return;
      G.info = {
        depth: res.depth, score: res.score, nodes: res.nodes, ms: res.ms,
        pv: res.pv, list: res.list, mate: res.mate, analysis: true
      };
      paintEngine();
    }).catch(function () { /* 分析失败不影响对局 */ });
  }

  function showResult(res) {
    $('resTitle').textContent = res.winner < 0 ? '和棋' : (res.winner === E.RED ? '红方胜' : '黑方胜');
    $('resVerdict').textContent = res.reason +
      (G.limit ? ' · 剩余用时 红 ' + clockStr(E.RED) + ' / 黑 ' + clockStr(E.BLACK) : '') +
      ' · 共 ' + G.hist.length + ' 手';
    $('resScore').innerHTML = sheetText().replace(/\n/g, '<br>');
    $('resultModal').hidden = false;
    $('dim').hidden = false;
  }

  function finish(res) {
    G.result = res;
    G.thinking = false;
    G.token++; G.atoken++; G.hintSeq++; G.liveEpoch++;
    G.running = false;
    if (G.mode === 'pve' && res.winner >= 0) Snd[res.winner === G.my ? 'win' : 'lose']();
    else Snd.win();
    showResult(res);
    persist();
    render(false);
    announce($('resTitle').textContent + '，' + res.reason);
  }

  /* ---------------- 新局 / 悔棋 / 提示 / 复盘 ---------------- */
  function replay(list) {
    var st = E.fromFEN(G.start);
    for (var i = 0; i < list.length; i++) E.makeMove(st, list[i].move);
    return st;
  }
  function newGame(opts) {
    opts = opts || {};
    stopPlay();
    G.token++; G.atoken++; G.hintSeq++; G.liveEpoch++;   // 作废在途的引擎着法 / 分析 / 提示
    G.start = opts.fen || E.START_FEN;
    G.st = E.fromFEN(G.start);
    G.hist = []; G.view = -1; G.result = null; G.info = null; G.last = null;
    G.picked = -1; G.legal = []; G.hintPair = null; G.thinking = false;
    G.undoLeft = UNDO_MAX;
    G.clock = [G.limit, G.limit];
    G.running = !!G.limit;
    if (opts.flipped !== undefined) G.flipped = !!opts.flipped;
    else G.flipped = G.mode === 'pve' && G.my === E.BLACK;
    $('resultModal').hidden = true; $('dim').hidden = true;
    AI.clearCache();
    relayout();
    render(false);
    persist();
    var stt = E.status(G.st);          // 导入的局面本身可能就是杀局/困毙/和形
    if (stt.over) { finish(stt); return; }
    maybeAI(false);
    analyze();
  }
  function undo() {
    if (!G.hist.length) { toast('没有可以悔掉的棋'); return; }
    stopPlay();
    if (G.undoLeft <= 0) {
      Snd.illegal();
      toast('本局 ' + UNDO_MAX + ' 次悔棋已用完，想重来请点「重新开始」');
      return;
    }
    G.token++; G.atoken++; G.hintSeq++; G.liveEpoch++; G.thinking = false;
    G.result = null;
    $('resultModal').hidden = true; $('dim').hidden = true;
    var n = 0;
    do {
      n++;
      var st = replay(G.hist.slice(0, G.hist.length - n));
      if (G.mode !== 'pve' || st.turn === G.my || G.hist.length - n === 0) break;
    } while (n < G.hist.length);
    n = Math.min(n, G.hist.length);
    G.hist.length -= n;
    G.undoLeft--;
    G.st = replay(G.hist);
    G.view = -1;
    G.last = G.hist.length ? { from: E.fromOf(G.hist[G.hist.length - 1].move), to: E.toOf(G.hist[G.hist.length - 1].move) } : null;
    G.running = !!G.limit;
    relayout(); render(false); persist();
    toast('已悔 ' + n + ' 手 · 本局余 ' + G.undoLeft + ' 次悔棋');
    // 悔棋后可能轮到引擎（例如执黑悔掉引擎首着回到开局）：重新调度，否则界面会停走。
    maybeAI(false);
    analyze();
  }
  function hint() {
    if (G.result) { toast('本局已结束'); return; }
    if (G.view >= 0) setView(-1);
    if (G.thinking) { toast('引擎正在思考'); return; }
    var st = G.st;
    if (G.mode === 'pve' && st.turn !== G.my) { toast('还没轮到你走棋'); return; }
    if (G.mode === 'demo') { toast('演示模式：切到「双人」再取建议'); return; }
    toast('正在计算建议着法…');
    var strong = Math.max(3, Math.min(AI.LEVELS.length - 1, G.level + 1));
    // 请求令牌 + 局面对象身份：开新局/走子/复盘后，旧提示一律不回写。
    var seq = ++G.hintSeq, epoch = G.liveEpoch, rootFen = E.toFEN(st);
    AI.think(st, { level: strong, ms: 1600, historyTexts: texts(), pure: true, book: false }).then(function (res) {
      if (seq !== G.hintSeq || epoch !== G.liveEpoch || G.result || G.view >= 0 || E.toFEN(G.st) !== rootFen) return;
      if (!res.move) return;
      G.hintPair = [E.fromOf(res.move), E.toOf(res.move)];
      G.picked = E.fromOf(res.move);
      G.legal = E.legalMoves(G.st).filter(function (m) { return E.fromOf(m) === G.picked; });
      var node = els.get(G.picked);
      if (node) node.classList.add('picked');
      paintSpots();
      banner('建议 ' + E.moveToText(G.st, res.move) + (res.mate ? ' · 杀着' : ' · 评分 ' + (res.score / 100).toFixed(1)));
      announce('建议着法 ' + E.moveToText(G.st, res.move));
    }).catch(function (err) { toast('引擎异常：' + err.message); });
  }
  function setView(i) {
    if (i >= 0 && (i >= G.hist.length || !G.hist[i])) i = G.hist.length ? G.hist.length - 1 : -1;
    G.view = i;
    unpick();
    relayout(); render(false);
    if (i < 0) {
      // 回到当前：作废在途提示；若之前 AI 在复盘中把着法丢弃了（G.view>=0 时 resolve），
      // 这里在没在思考的前提下重新调度引擎，避免停在轮 AI 走子的死局。
      G.hintSeq++; G.liveEpoch++;
      if (!G.thinking) maybeAI(false);
      analyze();
    }
  }

  /* ---------------- 复盘播放 ---------------- */
  var PLAY_INTERVAL = 900;
  function playLabel() {
    var b = $('btnPlay');
    if (!b) return;
    b.textContent = G.playing ? '❚❚' : '▶';
    b.setAttribute('aria-pressed', G.playing ? 'true' : 'false');
    b.setAttribute('aria-label', G.playing ? '暂停复盘' : '播放复盘');
  }
  function stopPlay() {
    if (G.playTimer) { clearTimeout(G.playTimer); G.playTimer = 0; }
    G.playing = false;
    playLabel();
  }
  function tickPlay() {
    G.playTimer = 0;
    if (!G.playing) return;
    if (G.view + 1 >= G.hist.length) { stopPlay(); return; }
    setView(G.view + 1);
    if (G.view + 1 >= G.hist.length) { stopPlay(); return; }
    G.playTimer = setTimeout(tickPlay, PLAY_INTERVAL / G.playSpeed);
  }
  function togglePlay() {
    if (G.playing) { stopPlay(); return; }
    if (!G.hist.length) { toast('还没有可以播放的着法'); return; }
    G.playing = true;
    playLabel();
    if (G.view < 0 || G.view + 1 >= G.hist.length) setView(0);
    G.playTimer = setTimeout(tickPlay, PLAY_INTERVAL / G.playSpeed);
  }
  function cycleSpeed() {
    var opts = [1, 2, 4];
    G.playSpeed = opts[(opts.indexOf(G.playSpeed) + 1) % opts.length];
    $('btnSpeed').textContent = G.playSpeed + '×';
    if (G.playing) { if (G.playTimer) clearTimeout(G.playTimer); G.playTimer = setTimeout(tickPlay, PLAY_INTERVAL / G.playSpeed); }
  }

  /* ---------------- 棋谱文本 / 剪贴板 / 存档 ---------------- */
  function pad(s) { while (s.replace(/　/g, ' ').length < 7) s += '　'; return s; }
  function sheetText() {
    var head = [
      '中国象棋 · 对局记录',
      '时间 ' + new Date().toLocaleString('zh-CN'),
      '模式 ' + (G.mode === 'pve' ? '人机（你执' + (G.my === E.RED ? '红' : '黑') + '，引擎 ' + AI.LEVELS[G.level].name + ' 档）'
        : G.mode === 'pvp' ? '双人同屏' : '引擎自对弈'),
      '用时 ' + (G.limit ? '每方 ' + Math.round(G.limit / 60) + ' 分钟' : '不限'),
      '结果 ' + (G.result ? (G.result.winner < 0 ? '和棋' : (G.result.winner === E.RED ? '红胜' : '黑胜')) + '（' + G.result.reason + '）' : '未完成'),
      ''
    ];
    var body = [];
    for (var i = 0; i < G.hist.length; i += 2) {
      var r = G.hist[i], b = G.hist[i + 1];
      body.push(String(i / 2 + 1) + '. ' + pad(r.text + (r.check ? '†' : '')) + pad(b ? b.text + (b.check ? '†' : '') : ''));
    }
    return head.join('\n') + body.join('\n') + '\n\n终局 FEN ' + E.toFEN(G.st) + '\n';
  }
  function copyText(txt, label) {
    function done() { toast(label + '已复制到剪贴板'); }
    function legacy() {
      var ta = document.createElement('textarea');
      ta.value = txt;
      ta.style.cssText = 'position:fixed;left:-9999px';
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      ta.remove();
      if (ok) done();
      else showInSheet(txt, label);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, legacy);
    else legacy();
  }
  function showInSheet(v, label) {
    $('fenTitle').textContent = label + '（请手动复制）';
    $('fenInput').value = v;
    $('fenErr').textContent = '';
    $('fenSheet').hidden = false; $('dim').hidden = false;
  }
  function download(name, text) {
    var a = document.createElement('a');
    a.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(text);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast('已导出 ' + name);
  }

  var KEY = 'qoder.xiangqi.v1';
  var THEME_KEY = 'qoder.xiangqi.theme.v1';
  var THEME_LIST = ['wood', 'ink', 'night'];
  var THEME_NAME = { wood: '木纹', ink: '宣纸', night: '夜战' };
  function prefersLight() {
    try { return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches); }
    catch (e) { return false; }
  }
  function readThemeKey() {
    try { var t = localStorage.getItem(THEME_KEY); return THEME_LIST.indexOf(t) >= 0 ? t : null; }
    catch (e) { return null; }
  }
  function resolveTheme(gameSavedTheme) {
    var explicit = readThemeKey();
    if (explicit) return explicit;
    if (gameSavedTheme && THEME_LIST.indexOf(gameSavedTheme) >= 0) return gameSavedTheme;
    return prefersLight() ? 'ink' : 'wood';
  }
  function applyTheme(name) {
    G.theme = name;
    document.documentElement.dataset.theme = name;
  }
  // 统一的主题落点：只改外观并重绘，绝不重置棋局 / 不动棋局存档键。
  // explicit=true 时把选择写入 THEME_KEY（qoder.xiangqi.theme.v1）作为用户显式偏好。
  function setThemeNamed(name, explicit) {
    if (THEME_LIST.indexOf(name) < 0) return false;
    G.theme = name;
    G._savedTheme = name;
    applyTheme(name);
    if (explicit) { try { localStorage.setItem(THEME_KEY, name); } catch (e) { /* 忽略 */ } }
    relayout();
    render(false);
    persist();
    return true;
  }
  function persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify({
        mode: G.mode, my: G.my, level: G.level, limit: G.limit, theme: G.theme, sound: G.sound,
        flipped: G.flipped, start: G.start, clock: G.clock, undoLeft: G.undoLeft,
        result: (G.result && G.result.over)
          ? { over: true, winner: G.result.winner, reason: G.result.reason, code: G.result.code } : null,
        uci: G.hist.map(function (h) { return E.sqName(E.fromOf(h.move)) + E.sqName(E.toOf(h.move)); })
      }));
    } catch (e) { /* 隐私模式等场景忽略 */ }
  }
  function parseSq(str) { return E.sq(+str[1], str.charCodeAt(0) - 97); }
  function restore() {
    var raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { return false; }
    if (!raw) return false;
    var d;
    try { d = JSON.parse(raw); } catch (e) { return false; }
    G.mode = d.mode || 'pve';
    G.my = d.my === undefined ? E.RED : d.my;
    G.level = d.level === undefined ? 2 : d.level;
    G.limit = d.limit || 0;
    G._savedTheme = d.theme || null;
    G.theme = resolveTheme(G._savedTheme);
    G.sound = d.sound !== false;
    G.flipped = !!d.flipped;
    // 认输 / 将死 / 和棋等结果一并存档，刷新后不“复活”成进行中。
    G.result = (d.result && d.result.over)
      ? { over: true, winner: d.result.winner, reason: d.result.reason, code: d.result.code } : null;
    G.undoLeft = typeof d.undoLeft === 'number' ? Math.max(0, Math.min(UNDO_MAX, d.undoLeft)) : UNDO_MAX;
    var st = E.fromFEN(d.start || E.START_FEN), moves = [];
    (d.uci || []).forEach(function (u) {
      var m = E.findLegal(st, parseSq(u.slice(0, 2)), parseSq(u.slice(2, 4)));
      if (m < 0) return;
      moves.push(m);
      E.makeMove(st, m);
    });
    G.start = d.start || E.START_FEN;
    G.st = st;
    G.clock = Array.isArray(d.clock) && d.clock.length === 2 ? d.clock : [G.limit, G.limit];
    var acc = E.fromFEN(G.start);
    G.hist = moves.map(function (m) {
      var desc = E.describeMove(acc, m);
      E.makeMove(acc, m);
      return {
        move: m, text: desc.san, cap: desc.cap, by: E.colorOf(desc.piece),
        check: E.inCheck(acc, acc.turn), fen: E.toFEN(acc), evalR: AI.evaluate(acc)
      };
    });
    if (G.hist.length) G.last = { from: E.fromOf(G.hist[G.hist.length - 1].move), to: E.toOf(G.hist[G.hist.length - 1].move) };
    G.running = !!G.limit && !E.status(G.st).over;
    return (d.uci || []).length === 0 || moves.length > 0;
  }

  /* ---------------- 音效（WebAudio 合成，无外部资源） ---------------- */
  var Snd = (function () {
    var ctx = null, noise = null;
    function ac() {
      if (!G.sound) return null;
      if (!ctx) {
        var C = window.AudioContext || window.webkitAudioContext;
        if (!C) return null;
        try { ctx = new C(); } catch (e) { return null; }
        var len = Math.floor(ctx.sampleRate * 0.06);
        noise = ctx.createBuffer(1, len, ctx.sampleRate);
        var data = noise.getChannelData(0);
        for (var i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      }
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    }
    function tone(freq, dur, vol, type, slideTo, delay) {
      var c = ac(); if (!c) return;
      var t0 = c.currentTime + (delay || 0);
      var o = c.createOscillator(), g = c.createGain();
      o.type = type || 'triangle';
      o.frequency.setValueAtTime(freq, t0);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(c.destination);
      o.start(t0); o.stop(t0 + dur + 0.03);
    }
    function clack(dur, vol, cut) {
      var c = ac(); if (!c) return;
      var src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
      src.buffer = noise;
      f.type = 'bandpass'; f.frequency.value = cut; f.Q.value = 1.3;
      g.gain.setValueAtTime(vol, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
      src.connect(f); f.connect(g); g.connect(c.destination);
      src.start();
    }
    return {
      move: function () { tone(232, .09, .16, 'triangle', 150); clack(.05, .12, 1500); },
      capture: function () { tone(152, .15, .24, 'sine', 80); clack(.09, .2, 780); },
      check: function () { tone(880, .1, .12, 'square'); tone(1180, .12, .1, 'square', null, .12); },
      illegal: function () { tone(98, .1, .09, 'square'); },
      win: function () { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, .17, .12, 'triangle', null, i * .11); }); },
      lose: function () { [523, 392, 311, 233].forEach(function (f, i) { tone(f, .2, .12, 'sine', null, i * .13); }); }
    };
  })();

  /* ---------------- 指针与键盘 ---------------- */
  function onDown(ev) {
    if (ev.button) return;
    var sq = sqAt(ev.clientX, ev.clientY);
    if (sq < 0) return;
    if (!canMove()) {
      toast(G.view >= 0 ? '复盘模式中：点「回到当前」再走棋'
        : G.result ? '本局已结束：点「重新开始」再来一局'
          : G.mode === 'demo' ? '引擎演示中：切到「人机」或「双人」即可行棋'
            : G.thinking ? '引擎正在思考' : '还没轮到你走棋');
      return;
    }
    var st = G.st, pc = st.board[sq];
    if (G.picked >= 0) {
      if (sq === G.picked) { unpick(); paintSpots(); return; }          // 再点一次取消
      if (E.findLegal(st, G.picked, sq) >= 0) { tryMove(G.picked, sq); return; }
      if (!pc || E.colorOf(pc) !== st.turn) { reject(G.picked, sq); return; }   // 说明原因，保留选中
    }
    if (!pc) { unpick(); paintSpots(); return; }
    if (E.colorOf(pc) !== st.turn) { toast('轮到' + (st.turn === E.RED ? '红' : '黑') + '方走棋'); return; }
    pick(sq);
    G.dragging = { from: sq, node: els.get(sq), x0: ev.clientX, y0: ev.clientY, moved: false, id: ev.pointerId };
    try { layer.setPointerCapture(ev.pointerId); } catch (e) { }
    ev.preventDefault();
  }
  function onMove(ev) {
    var d = G.dragging;
    if (!d || !d.node) return;
    if (!d.moved && Math.abs(ev.clientX - d.x0) + Math.abs(ev.clientY - d.y0) < 6) return;
    if (!d.moved) { d.moved = true; d.node.classList.add('dragging'); }
    var gm = geom(), p = xyOf(d.from);
    d.node.style.left = (ev.clientX - gm.left - p.size / 2) + 'px';
    d.node.style.top = (ev.clientY - gm.top - p.size / 2) + 'px';
    ev.preventDefault();
  }
  function onUp(ev) {
    var d = G.dragging;
    if (!d) return;
    G.dragging = null;
    try { layer.releasePointerCapture(d.id); } catch (e) { }
    if (!d.moved) { place(d.node, d.from); return; }
    d.node.classList.remove('dragging');
    var to = sqAt(ev.clientX, ev.clientY);
    if (to >= 0 && E.findLegal(G.st, d.from, to) >= 0) { tryMove(d.from, to); return; }
    place(d.node, d.from);
    if (to >= 0 && to !== d.from) {
      var target = G.st.board[to];
      if (target && E.colorOf(target) === G.st.turn) { pick(to); return; }
      reject(d.from, to);
      return;
    }
    paintSpots();
  }
  layer.addEventListener('pointerdown', onDown);
  layer.addEventListener('pointermove', onMove);
  layer.addEventListener('pointerup', onUp);
  layer.addEventListener('pointercancel', function (ev) {
    if (G.dragging && G.dragging.node) { G.dragging.node.classList.remove('dragging'); place(G.dragging.node, G.dragging.from); }
    G.dragging = null;
  });
  layer.addEventListener('focus', paintSpots);
  layer.addEventListener('blur', paintSpots);

  layer.addEventListener('keydown', function (ev) {
    var step = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[ev.key];
    if (step) {
      ev.preventDefault();
      var dir = G.flipped ? [-step[0], -step[1]] : step;
      var r = Math.max(0, Math.min(9, E.rowOf(G.cursor) + dir[0]));
      var c = Math.max(0, Math.min(8, E.colOf(G.cursor) + dir[1]));
      G.cursor = E.sq(r, c);
      paintSpots();
      var pc = shownState().board[G.cursor];
      announce((pc ? pieceName(pc) : '空位') + '，第 ' + (r + 1) + ' 行第 ' + (c + 1) + ' 列');
      return;
    }
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      if (!canMove()) return;
      if (G.picked >= 0) {
        if (E.findLegal(G.st, G.picked, G.cursor) >= 0) tryMove(G.picked, G.cursor);
        else if (G.st.board[G.cursor] && E.colorOf(G.st.board[G.cursor]) === G.st.turn) pick(G.cursor);
        else reject(G.picked, G.cursor);
      } else if (G.st.board[G.cursor] && E.colorOf(G.st.board[G.cursor]) === G.st.turn) pick(G.cursor);
      return;
    }
    if (ev.key === 'Escape') { unpick(); paintSpots(); }
  });

  /* ---------------- 控件绑定 ---------------- */
  function segBind(id, onPick) {
    var box = $(id);
    box.addEventListener('click', function (ev) {
      var b = ev.target.closest('button');
      if (!b || b.getAttribute('aria-pressed') === 'true') return;
      Array.prototype.forEach.call(box.querySelectorAll('button'), function (n) {
        n.setAttribute('aria-pressed', String(n === b));
      });
      onPick(b.dataset.v);
    });
  }
  function press(id, value) {
    var b = $(id).querySelector('[data-v="' + value + '"]');
    if (b) b.setAttribute('aria-pressed', 'true');
  }
  function closeSheets() {
    $('helpSheet').hidden = true; $('fenSheet').hidden = true;
    $('resultModal').hidden = true; $('dim').hidden = true;
  }
  function wire() {
    var fresh = function () { newGame({ fen: E.START_FEN }); };
    segBind('segMode', function (v) { G.mode = v; fresh(); });
    segBind('segLevel', function (v) { G.level = +v; render(false); persist(); });
    segBind('segSide', function (v) {
      G.my = +v === 2 ? (Math.random() < .5 ? E.RED : E.BLACK) : +v;
      fresh();
      toast('本局你执' + (G.my === E.RED ? '红' : '黑') + '方');
    });
    segBind('segClock', function (v) { G.limit = +v; fresh(); });

    $('btnNew').onclick = function () { newGame({}); toast('已开始新对局'); };
    $('btnUndo').onclick = undo;
    $('btnHint').onclick = hint;
    $('btnFlip').onclick = function () {
      G.flipped = !G.flipped;
      relayout(); render(false); persist();
    };
    $('btnFit').onclick = function () { setFit(true); };     // 全览：整盘适配（幂等，始终落到可见档）
    $('btnZoomIn').onclick = function () { zoomBy(ZOOM_STEP); };
    $('btnZoomOut').onclick = function () { zoomBy(-ZOOM_STEP); };
    $('btnResign').onclick = function () {
      if (G.result) { toast('本局已结束'); return; }
      var loser = G.mode === 'pve' ? G.my : G.st.turn;
      finish({ over: true, winner: loser ^ 1, reason: (loser === E.RED ? '红方' : '黑方') + '认输', code: 'resign' });
    };
    $('btnSound').onclick = function () {
      G.sound = !G.sound;
      $('btnSound').textContent = G.sound ? '♪' : '✕';
      $('btnSound').classList.toggle('off', !G.sound);
      if (G.sound) Snd.move();
      persist();
    };
    $('btnTheme').onclick = function () {
      var next = THEME_LIST[(THEME_LIST.indexOf(G.theme) + 1) % THEME_LIST.length];
      setThemeNamed(next, true);                 // 仅换肤，不重置棋局
      toast('主题：' + THEME_NAME[next]);
      announce('主题切换为' + THEME_NAME[next]);
    };
    $('btnHelp').onclick = function () { $('helpSheet').hidden = false; $('dim').hidden = false; };
    $('helpClose').onclick = closeSheets;
    $('dim').onclick = closeSheets;
    $('fenClose').onclick = closeSheets;

    $('btnCopyLine').onclick = function () { copyText(sheetText(), '棋谱'); };
    $('btnCopyFen').onclick = function () { copyText(E.toFEN(shownState()), 'FEN'); };
    $('btnEpd').onclick = function () { download('中国象棋棋谱.txt', sheetText()); };
    $('btnSave').onclick = function () { persist(); toast('已保存到本机，下次打开自动续局'); };
    $('btnLoadFen').onclick = function () {
      $('fenTitle').textContent = '导入局面';
      $('fenInput').value = E.toFEN(G.st);
      $('fenErr').textContent = '';
      $('fenSheet').hidden = false; $('dim').hidden = false;
    };
    $('fenApply').onclick = function () {
      var v = $('fenInput').value.trim();
      try {
        var st = E.fromFEN(v);
        closeSheets();
        newGame({ fen: v, flipped: G.mode === 'pve' ? G.my === E.BLACK : G.flipped });
        toast('已载入局面，轮' + (st.turn === E.RED ? '红' : '黑') + '方走');
      } catch (e) { $('fenErr').textContent = '局面无效：' + e.message; }
    };
    $('fenStart').onclick = function () { closeSheets(); newGame({}); };

    $('moves').addEventListener('click', function (ev) {
      var td = ev.target.closest('td[data-i]');
      if (td) setView(+td.dataset.i);
    });
    $('graph').addEventListener('click', function (ev) {
      var t = ev.target.closest && ev.target.closest('[data-i]');
      if (t) setView(+t.dataset.i);
    });
    $('btnPlay').onclick = togglePlay;
    $('btnSpeed').onclick = cycleSpeed;
    $('btnBack1').onclick = function () { stopPlay(); setView(Math.max(0, G.view < 0 ? G.hist.length - 1 : G.view - 1)); };
    $('btnFwd1').onclick = function () { stopPlay(); setView(G.view + 1 >= G.hist.length ? -1 : G.view + 1); };
    $('btnLive').onclick = function () { stopPlay(); setView(-1); };

    $('resAgain').onclick = function () { closeSheets(); newGame({}); };
    $('resClose').onclick = closeSheets;
    $('resCopy').onclick = function () { copyText(sheetText(), '棋谱'); };

    document.addEventListener('keydown', function (ev) {
      if (ev.target.tagName === 'TEXTAREA' || ev.ctrlKey || ev.metaKey || ev.altKey) return;
      var k = ev.key.toLowerCase();
      if (k === 'n') newGame({});
      else if (k === 'u') undo();
      else if (k === 'h') hint();
      else if (k === 'f') $('btnFlip').click();
      else if (k === 'o') toggleOverview();
      else if (k === 's') $('btnSound').click();
      else if (k === 'd') $('btnTheme').click();
      else if (ev.key === 'ArrowLeft' && ev.target === document.body) {
        if (G.hist.length) { stopPlay(); setView(G.view < 0 ? G.hist.length - 1 : Math.max(0, G.view - 1)); }
      } else if (ev.key === 'ArrowRight' && ev.target === document.body) {
        if (G.view >= 0) { stopPlay(); setView(G.view + 1 >= G.hist.length ? -1 : G.view + 1); }
      } else if (ev.code === 'Space') {
        if (G.view >= 0 && ev.target === document.body) { ev.preventDefault(); togglePlay(); }
      } else if (ev.key === 'Escape') { stopPlay(); closeSheets(); unpick(); paintSpots(); }
    });

    window.addEventListener('resize', function () { applyZoom(false); });
    document.addEventListener('visibilitychange', function () { if (!document.hidden) applyZoom(false); });
    window.addEventListener('focus', function () { applyZoom(false); });
    if (window.ResizeObserver) new ResizeObserver(relayout).observe(wrap);
  }

  /* ---------------- 棋钟 ---------------- */
  setInterval(function () {
    var now = Date.now(), dt = (now - G.lastTick) / 1000;
    G.lastTick = now;
    if (!G.limit || !G.running || G.result || G.view >= 0 || G.mode === 'demo') return;
    var c = G.st.turn;
    G.clock[c] = Math.max(0, G.clock[c] - dt);
    [E.RED, E.BLACK].forEach(function (side) {
      var cl = $('clock' + rowTag(side));
      cl.textContent = clockStr(side);
      cl.classList.toggle('low', G.clock[side] < 30);
    });
    if (G.clock[c] <= 0) {
      finish({ over: true, winner: c ^ 1, reason: (c === E.RED ? '红方' : '黑方') + '用时耗尽', code: 'timeout' });
    }
  }, 250);

  /* ---------------- 启动 ---------------- */
  buildBoard();
  var restored = restore();
  $('segLevel').innerHTML = AI.LEVELS.map(function (l, i) {
    return '<button data-v="' + i + '">' + l.name + '</button>';
  }).join('');
  press('segMode', G.mode);
  press('segSide', G.mode === 'pve' ? G.my : 0);
  press('segClock', G.limit);
  press('segLevel', G.level);
  $('btnSound').textContent = G.sound ? '♪' : '✕';
  $('btnSound').classList.toggle('off', !G.sound);
  applyTheme(resolveTheme(G._savedTheme));
  try {
    var schemeMQ = window.matchMedia('(prefers-color-scheme: light)');
    var onSchemeChange = function () {
      if (readThemeKey()) return;                 // 用户已手动选择，尊重其偏好
      applyTheme(prefersLight() ? 'ink' : 'wood');
      relayout(); render(false);
    };
    if (schemeMQ.addEventListener) schemeMQ.addEventListener('change', onSchemeChange);
    else if (schemeMQ.addListener) schemeMQ.addListener(onSchemeChange);
  } catch (e) { /* 旧浏览器忽略 */ }
  wire();
  if (!restored) { G.st = E.fromFEN(G.start); G.clock = [G.limit, G.limit]; }
  if (G.result) {
    // 存档里本局已结束：只回显结果，不再调度引擎 / 分析，避免刷新后“复活”。
    G.running = false;
    relayout(); render(false); loadZoom(); applyZoom(false);
    showResult(G.result);
    if (restored && G.hist.length) toast('已恢复上一局：' + G.hist.length + ' 手 · ' + G.result.reason, 3000);
  } else {
    G.running = !!G.limit && !E.status(G.st).over;
    relayout(); render(false); loadZoom(); applyZoom(false);
    if (restored && G.hist.length) toast('已恢复上一局：' + G.hist.length + ' 手，轮' + (G.st.turn === E.RED ? '红' : '黑') + '方走', 3000);
    var stt0 = E.status(G.st);          // 兼容旧存档：局面本身已终局则直接结算
    if (stt0.over) finish(stt0);
    else { maybeAI(false); analyze(); }
  }
  layer.focus({ preventScroll: true });

  /* ---------------- 宿主集成接口 ----------------
     站点外壳通过 window.GAME_HOST 控制主题与时钟。游戏内部主题为 wood/ink/night，
     这里同时接受站点的 'light'/'dark'/'auto'（映射到 ink/night/跟随系统）以及内部名。
     setTheme / pause / resume 均不重置棋局、不改动棋局存档键（qoder.xiangqi.v1）。 */
  var HOST_THEME = { light: 'ink', dark: 'night', wood: 'wood', ink: 'ink', night: 'night' };
  window.GAME_HOST = {
    setTheme: function (mode) {
      var name = (mode === 'auto' || mode === undefined || mode === null)
        ? (prefersLight() ? 'ink' : 'wood')
        : HOST_THEME[String(mode).toLowerCase()];
      if (!name || !setThemeNamed(name, true)) return { ok: false, theme: G.theme };
      announce('主题切换为' + THEME_NAME[name]);
      return { ok: true, theme: name };
    },
    pause: function () {
      G.hostWasRunning = G.running;
      G.hostPaused = true;
      G.running = false;                              // 冻结棋钟；AI 着法由 token 保证安全
      return { paused: true, wasRunning: G.hostWasRunning };
    },
    resume: function () {
      if (G.hostPaused) {
        G.hostPaused = false;
        G.running = !!(G.hostWasRunning && !G.result && G.limit);
      }
      return { running: G.running, pausedByHost: G.hostPaused };
    },
    get state() {
      return {
        theme: G.theme, running: G.running, pausedByHost: G.hostPaused,
        result: G.result ? G.result.code : null, thinking: G.thinking
      };
    }
  };
})();
