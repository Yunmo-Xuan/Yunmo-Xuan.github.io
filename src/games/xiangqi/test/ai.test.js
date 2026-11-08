/* AI 自测：开局库合法性 / 杀法识别 / 得子判断 / 搜索不破坏局面 / 自对弈跑通 */
global.XQ = require('../src/js/engine.js');
const XQAI = require('../src/js/ai.js');
const XQ = global.XQ;

let pass = 0, fail = 0;
function ok(name, got, want) {
  const good = String(got) === String(want);
  if (good) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + '\n      实际: ' + got + '\n      期望: ' + want); }
}
function group(t) { console.log('\n== ' + t + ' =='); }

function legalTexts(st) {
  return XQ.legalMoves(st).map(m => XQ.moveToText(st, m));
}

async function main() {
  group('开局库：每一着都必须在真实局面中合法');
  XQAI.BOOK.forEach((bk, idx) => {
    const st = XQ.fromFEN(XQ.START_FEN);
    let bad = '';
    for (let i = 0; i < bk.line.length; i++) {
      const legal = XQ.legalMoves(st);
      const hit = legal.find(m => XQ.moveToText(st, m) === bk.line[i]);
      if (!hit) { bad = '第 ' + (i + 1) + ' 着「' + bk.line[i] + '」不合法（可选：' + legalTexts(st).slice(0, 6).join(' ') + '…）'; break; }
      XQ.makeMove(st, hit);
    }
    ok('《' + bk.name + '》' + bk.line.length + ' 着', bad || 'ok', 'ok');
  });

  group('评估函数');
  const init = XQ.fromFEN(XQ.START_FEN);
  const ev = XQAI.evaluate(init);
  ok('初始局面接近均势（|eval| < 60，实得 ' + ev + '）', Math.abs(ev) < 60, true);
  ok('红多一车 → 明显优势', XQAI.evaluate(XQ.fromFEN('3k5/9/9/9/9/9/9/9/9/4K1R2 w')) > ev + 500, true);
  ok('黑多一车 → 明显劣势', XQAI.evaluate(XQ.fromFEN('3k5/9/9/9/9/9/9/9/1r7/4K4 w')) < ev - 500, true);
  ok('轮走方视角：多子方为正分', XQAI.evalSTMS(XQ.fromFEN('3k5/9/9/9/9/9/9/9/1r7/4K4 b')) > 0, true);
  const bare = XQAI.evaluate(XQ.fromFEN('3k5/9/9/9/9/9/9/9/9/4K4 w'));
  const shield = XQAI.evaluate(XQ.fromFEN('3k5/9/9/9/9/9/9/9/9/2BAKAB2 w'));
  ok('士象全比光帅有价值（差 ' + (shield - bare) + '）', shield - bare > 550, true);

  group('杀法与战术识别');
  const mateFen = '4k4/R8/9/9/9/8R/9/9/9/3K5 w';
  const st1 = XQ.fromFEN(mateFen);
  const key0 = XQ.keyOf(st1), ply0 = st1.ply;
  const r1 = await XQAI.think(st1, { level: 3, ms: 1500, book: false });
  const after1 = XQ.fromFEN(mateFen);
  XQ.makeMove(after1, r1.move);
  ok('一步杀：返回杀分', r1.mate, true);
  ok('一步杀：落子后确实将死', XQ.status(after1).code, 'mate');
  ok('一步杀：着法是 ' + XQ.moveToText(XQ.fromFEN(mateFen), r1.move),
    XQ.legalMoves(XQ.fromFEN(mateFen)).indexOf(r1.move) > -1, true);
  ok('搜索后根局面完好（ply/哈希/回合）', XQ.keyOf(st1) === key0 && st1.ply === ply0 && st1.turn === XQ.RED, true);

  // 白吃无根车：限定深度 2 + pure，避免被更远的杀着掩盖“得子”这一基本判断
  const grabFen = '2bakab2/9/9/4p4/r2R5/9/9/9/9/3KA4 w';
  const st2 = XQ.fromFEN(grabFen);
  const r2 = await XQAI.think(st2, { level: 3, depth: 2, ms: 600, book: false, pure: true });
  ok('浅搜也认得白吃车（' + XQ.moveToText(st2, r2.move) + '）', XQ.capOf(r2.move), XQ.piece(XQ.ROOK, XQ.BLACK));
  const r2b = await XQAI.think(st2, { level: 3, ms: 1500, book: false, pure: true });
  ok('深搜得分不低于吃车价值（' + r2b.score + '）', r2b.score >= 400, true);

  // 被将军时必须应将
  const checkFen = '4k4/9/9/4R4/9/r8/9/9/9/3K5 b';   // 红车照将，黑有应将的余地
  const st3 = XQ.fromFEN(checkFen);
  ok('黑方处于被将状态', XQ.inCheck(st3, XQ.BLACK), true);
  ok('黑方仍有合法应着', XQ.legalMoves(st3).length > 0, true);
  const r3 = await XQAI.think(st3, { level: 2, ms: 1000, book: false, pure: true });
  const st3b = XQ.fromFEN(checkFen);
  XQ.makeMove(st3b, r3.move);
  ok('应着后解除将军', XQ.inCheck(st3b, XQ.BLACK), false);

  group('静态搜索应将 / 快照隔离根局面（item 3、4）');
  // (a) 已被将死：think 必须返回 0（无合法应将），而非 stand-pat 出一个假着
  {
    const st = XQ.fromFEN('R2k5/8R/9/9/9/9/9/9/9/4K4 b');
    const key0 = XQ.keyOf(st), fen0 = XQ.toFEN(st);
    const r = await XQAI.think(st, { level: 2, ms: 600, book: false, pure: true });
    ok('被将死时 think 返回 0', r.move, 0);
    ok('被将死局面 status 判 mate', XQ.status(st).code, 'mate');
    ok('被将死搜索后根局面未被动过', XQ.toFEN(st), fen0);
  }
  // (b) 被将但未死：think 返回的着法必须解除将军，且原局面完好
  {
    const st = XQ.fromFEN('4k4/9/9/9/9/4R4/9/9/9/4K4 b');   // 红车照将黑将
    const key0 = XQ.keyOf(st), fen0 = XQ.toFEN(st);
    ok('黑方确实被将军', XQ.inCheck(st, XQ.BLACK), true);
    const r = await XQAI.think(st, { level: 3, ms: 1200, book: false, pure: true });
    const after = XQ.fromFEN(fen0);
    XQ.makeMove(after, r.move);
    ok('返回着法合法', XQ.legalMoves(st).indexOf(r.move) > -1, true);
    ok('应着解除将军', XQ.inCheck(after, XQ.BLACK), false);
    ok('搜索后根 FEN/ply/哈希全复原', XQ.toFEN(st) === fen0 && st.ply === 0 && XQ.keyOf(st) === key0, true);
  }
  // (c) 底线车 lift 成杀（合法局面，双方均未在被将）：qsearch 不应因 stand-pat 漏杀
  {
    const st = XQ.fromFEN('4k4/R8/9/9/9/9/9/9/9/K7R w');
    ok('杀法局面初始合法（黑未被将）', XQ.inCheck(st, XQ.BLACK), false);
    const r = await XQAI.think(st, { level: 3, ms: 1500, book: false, pure: true });
    const after = XQ.cloneState(st);
    XQ.makeMove(after, r.move);
    ok('think 报杀并走出将死手（' + XQ.moveToText(st, r.move) + '）', r.mate && XQ.status(after).code === 'mate', true);
  }
  // (d) 并发两次 think 不共享可变局面（快照 + 隔离）
  {
    const st = XQ.fromFEN(XQ.START_FEN);
    const key0 = XQ.keyOf(st), fen0 = XQ.toFEN(st);
    const p1 = XQAI.think(st, { level: 1, ms: 280, book: false, pure: true });
    const p2 = XQAI.think(st, { level: 1, ms: 280, book: false, pure: true });
    const [a, b] = await Promise.all([p1, p2]);
    ok('并发搜索未破坏根局面', XQ.toFEN(st), fen0);
    ok('并发搜索各自返回合法着', XQ.legalMoves(st).includes(a.move) && XQ.legalMoves(st).includes(b.move), true);
    ok('两次独立搜索给出合法结果', a.move !== 0 && b.move !== 0, true);
  }

  group('算力与时间控制');
  const t0 = Date.now();
  const deep = await XQAI.think(XQ.fromFEN(XQ.START_FEN), { level: 4, ms: 2000 });
  const dur = Date.now() - t0;
  ok('大师档在预算内结束（' + dur + 'ms）', dur <= 5000, true);
  ok('开局库优先命中（' + (deep.book || '未命中，深度 ' + deep.depth) + '）',
    typeof deep.book === 'string' || deep.depth >= 5, true);
  const mid = await XQAI.think(XQ.fromFEN(XQ.START_FEN), { level: 4, ms: 1500, book: false });
  ok('空局搜索达到深度 ≥ 5（实得 ' + mid.depth + '）', mid.depth >= 5, true);
  ok('节点数可观（' + mid.nodes + '，约 ' + mid.nps + ' nps）', mid.nodes > 30000, true);
  const easy = await XQAI.think(XQ.fromFEN(XQ.START_FEN), { level: 0, ms: 120, book: false });
  ok('初学档返回合法着', XQ.legalMoves(XQ.fromFEN(XQ.START_FEN)).indexOf(easy.move) > -1, true);

  group('AI 自对弈整盘健全性');
  const st = XQ.fromFEN(XQ.START_FEN);
  const texts = [];
  let plies = 0, illegal = 0, result = null;
  while (plies < 200) {
    result = await XQAI.think(st, { level: 1, ms: 220, historyTexts: texts, book: plies < 12 });
    if (!result.move) break;
    if (XQ.legalMoves(st).indexOf(result.move) < 0) { illegal++; break; }
    texts.push(XQ.moveToText(st, result.move));
    XQ.makeMove(st, result.move);
    plies++;
    const s = XQ.status(st);
    if (s.over) { console.log('    终局于第 ' + plies + ' 步：' + s.reason); break; }
  }
  ok('自对弈 ' + plies + ' 步无非法着', illegal, 0);
  ok('步数与引擎计数一致', st.ply, plies);
  ok('整局棋谱文本可生成', texts.length, plies);
  ok('局面哈希仍然有效', isFinite(XQ.keyOf(st)), true);

  console.log('\n前 12 着：' + texts.slice(0, 12).join(' '));
  console.log('\n合计：' + pass + ' 通过 / ' + fail + ' 失败');
  process.exit(fail ? 1 : 0);
}

main().catch(e => { console.error('测试脚本异常：', e); process.exit(2); });
