/* 引擎自测：perft 对照标准值 + 规则用例 + 中文记谱 + FEN + 非法着解释 */
const XQ = require('../src/js/engine.js');

let pass = 0, fail = 0;
function ok(name, got, want) {
  const good = String(got) === String(want);
  if (good) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + '\n      实际: ' + got + '\n      期望: ' + want); }
}
function group(t) { console.log('\n== ' + t + ' =='); }
const S = (r, c) => XQ.sq(r, c);

// 记谱只做格式化，不校验合法性
const MAXD_DEFAULT = 5; // depth 5 = 133,312,995（约 15s），作为回归基准
function text(fen, r1, c1, r2, c2) {
  const st = XQ.fromFEN(fen);
  return XQ.moveToText(st, XQ.moveOf(S(r1, c1), S(r2, c2), st.board[S(r2, c2)]));
}
function legal(fen, r1, c1, r2, c2) {
  return XQ.findLegal(XQ.fromFEN(fen), S(r1, c1), S(r2, c2)) > -1;
}
function why(fen, r1, c1, r2, c2) {
  return XQ.whyNoMove(XQ.fromFEN(fen), S(r1, c1), S(r2, c2));
}

group('perft（标准节点数，参考 talkchess Xiangqi perft）');
const EXPECT = [, 44, 1920, 79666, 3290240, 133312995];
const MAXD = +(process.argv[2] || MAXD_DEFAULT);
for (let d = 1; d <= MAXD; d++) {
  const st = XQ.fromFEN(XQ.START_FEN);
  const before = XQ.keyOf(st);
  const t0 = Date.now();
  const n = XQ.perft(st, d);
  ok('depth ' + d + '（' + (Date.now() - t0) + ' ms）', n, EXPECT[d]);
  ok('depth ' + d + ' 后局面/哈希/回合完全复原', XQ.keyOf(st) === before && st.ply === 0 && st.turn === XQ.RED, true);
}

group('飞将（将帅照面）');
const face = '4k4/9/9/9/9/9/9/9/9/3K5 w';
ok('照面着法被禁止', legal(face, 9, 3, 9, 4), false);
ok('照面解释文案', why(face, 9, 3, 9, 4), '将帅不能照面（白脸将）');
ok('离开同列合法', legal(face, 9, 3, 8, 3), true);
const pinned = '4k4/9/9/9/9/4R4/9/9/9/4K4 w';
ok('帅前的车被钉住不能横走', legal(pinned, 5, 4, 5, 0), false);
ok('钉车可沿列前后走', legal(pinned, 5, 4, 4, 4), true);
ok('钉车横走解释文案', why(pinned, 5, 4, 5, 0), '将帅不能照面（白脸将）');
ok('照面局面被判为被将军', XQ.inCheck(XQ.fromFEN('4k4/9/9/9/9/9/9/9/9/4K4 w'), XQ.RED), true);

group('蹩马腿');
const horseFen = '3k5/9/9/9/9/9/3P5/3N5/9/4K4 w';   // 兵在 (6,3)，正是马 (7,3) 向前两跳的马腿
ok('前方被蹩（到 5,2）', legal(horseFen, 7, 3, 5, 2), false);
ok('前方被蹩（到 5,4）', legal(horseFen, 7, 3, 5, 4), false);
ok('侧向仍可跳', legal(horseFen, 7, 3, 6, 1), true);
ok('蹩腿解释文案', why(horseFen, 7, 3, 5, 2), '马腿被蹩住了');

group('塞象眼 / 相不能过河');
const eyeFen = '3k5/9/9/9/9/9/9/9/3p5/2B2K3 w';
ok('塞眼时走不到 (7,4)', legal(eyeFen, 9, 2, 7, 4), false);
ok('塞眼解释文案', why(eyeFen, 9, 2, 7, 4), '象眼被塞住了');
ok('另一侧象眼空着可走', legal(eyeFen, 9, 2, 7, 0), true);
ok('相不能过河', why('3k5/9/9/9/9/2B6/9/9/9/4K4 w', 5, 2, 3, 0), '相/象不能过河');

group('炮翻山');
const noScreen = '3k5/9/9/9/9/9/9/9/9/1r2CK3 w';
ok('无炮架不能吃子', legal(noScreen, 9, 4, 9, 1), false);
ok('无炮架文案', why(noScreen, 9, 4, 9, 1), '炮打子需要恰好一个炮架');
const oneScreen = '3k5/9/9/9/9/9/9/9/9/1r1pCK3 w';
ok('恰好一个炮架可吃', legal(oneScreen, 9, 4, 9, 1), true);
const twoScreen = '3k5/9/9/9/9/9/9/9/9/1rCpCK3 w';
ok('两个炮架不能吃', legal(twoScreen, 9, 4, 9, 1), false);
ok('两炮架文案', why(twoScreen, 9, 4, 9, 1), '炮打子只能翻一个炮架');
ok('炮移动不需要炮架', legal(noScreen, 9, 4, 9, 3), true);
const blockedCannon = '3k5/9/9/9/9/9/3p5/9/9/3CK4 w';
ok('炮不能越过子落到空位', why(blockedCannon, 9, 3, 4, 3), '炮中间隔了子，不能直接落空位');

group('过河兵');
const home = '3k5/9/9/9/9/9/4P4/9/9/4K4 w';
ok('未过河兵不能横走', legal(home, 6, 4, 6, 3), false);
ok('未过河横走文案', why(home, 6, 4, 6, 3), '兵/卒未过河不能横走');
ok('未过河兵可前进', legal(home, 6, 4, 5, 4), true);
const crossed = '3k5/9/9/9/3P5/9/9/9/9/4K4 w';
ok('过河兵可横走', legal(crossed, 4, 3, 4, 2), true);
ok('过河兵仍可前进', legal(crossed, 4, 3, 3, 3), true);
ok('兵不能后退', legal(crossed, 4, 3, 5, 3), false);
ok('后退文案', why(crossed, 4, 3, 5, 3), '兵/卒不能后退');

group('九宫与走法形状');
ok('帅不能出九宫', why(face, 9, 3, 9, 2), '帅/将不能走出九宫');
ok('帅只能走一格', why(face, 9, 3, 7, 3), '帅/将每步只能走一格');
ok('仕不能直走', why('3k5/9/9/9/9/9/9/9/9/3AK4 w', 9, 3, 8, 3), '仕/士只能走斜线');
ok('仕可斜走到中宫', legal('3k5/9/9/9/9/9/9/9/9/3AK4 w', 9, 3, 8, 4), true);
ok('仕不能走两格', why('3k5/9/9/9/9/9/9/9/9/3AK4 w', 9, 3, 7, 1), '仕/士每步只能走一格');
ok('车只能走直线', why('3k5/9/9/9/9/9/9/9/9/2R1K4 w', 9, 2, 7, 3), '车只能走直线');
ok('车路上有子不能穿', why('3k5/9/9/9/9/9/9/9/4p4/2R1K4 w', 9, 2, 9, 7), '车路上有子，不能穿越');
ok('不能吃自己子', why('3k5/9/9/9/9/9/9/9/9/2RK5 w', 9, 2, 9, 3), '不能吃自己的棋子');
ok('轮次不对时禁止', why('3k5/9/9/9/9/9/9/9/9/2RK5 b', 9, 2, 8, 2), '现在轮到黑方走');

group('中文记谱（红中文数字 / 黑阿拉伯数字）');
const I = XQ.START_FEN;
ok('炮二平五', text(I, 7, 7, 7, 4), '炮二平五');
ok('炮八平五', text(I, 7, 1, 7, 4), '炮八平五');
ok('马二进三', text(I, 9, 7, 8, 6), '马二进三');
ok('马八进七', text(I, 9, 1, 8, 2), '马八进七');
ok('车一平二', text(I, 9, 8, 9, 7), '车一平二');
ok('兵七进一', text(I, 6, 2, 5, 2), '兵七进一');
ok('兵三进一', text(I, 6, 6, 5, 6), '兵三进一');
ok('相三进五', text(I, 9, 6, 7, 4), '相三进五');
ok('相七进五', text(I, 9, 2, 7, 4), '相七进五');
ok('仕四进五', text(I, 9, 5, 8, 4), '仕四进五');
ok('仕六进五', text(I, 9, 3, 8, 4), '仕六进五');
ok('帅五进一', text('3k5/9/9/9/9/9/9/9/9/4K4 w', 9, 4, 8, 4), '帅五进一');
const BI = 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR b';
ok('黑 马2进3', text(BI, 0, 1, 1, 2), '马2进3');
ok('黑 马8进7', text(BI, 0, 7, 1, 6), '马8进7');
ok('黑 炮8平5', text(BI, 2, 7, 2, 4), '炮8平5');
ok('黑 车1进1', text(BI, 0, 0, 1, 0), '车1进1');
ok('黑 卒7进1', text(BI, 3, 6, 4, 6), '卒7进1');
ok('黑 士6进5', text(BI, 0, 5, 1, 4), '士6进5');
ok('黑 象7进5', text(BI, 0, 6, 2, 4), '象7进5');

group('中文记谱（同路用前中后 / 异路用路分）');
const twoCannon = '3k5/9/9/9/9/9/4C4/4C4/9/4K4 w';
ok('前炮进一', text(twoCannon, 6, 4, 5, 4), '前炮进一');
ok('后炮平六', text(twoCannon, 7, 4, 7, 3), '后炮平六');
const twoRook = '3k5/9/9/9/9/9/9/4R4/4R4/4K4 w';
ok('前车进一', text(twoRook, 7, 4, 6, 4), '前车进一');
ok('后车平六', text(twoRook, 8, 4, 8, 3), '后车平六');
const threePawn = '3k5/9/4P4/4P4/4P4/9/9/9/9/4K4 w';
ok('前兵进一', text(threePawn, 2, 4, 1, 4), '前兵进一');
ok('中兵平六', text(threePawn, 3, 4, 3, 3), '中兵平六');
ok('后兵进一', text(threePawn, 4, 4, 3, 4), '后兵进一');
const diffFile = '3k5/9/9/9/9/9/4C4/9/C8/4K4 w';
ok('异路炮用路分（炮五平六）', text(diffFile, 6, 4, 6, 3), '炮五平六');
ok('异路炮用路分（炮九平五）', text(diffFile, 8, 0, 8, 4), '炮九平五');

group('将军 / 将死 / 和棋判定');
const mated = 'R2k5/8R/9/9/9/9/9/9/9/4K4 b';
ok('双车错：黑方被将军', XQ.inCheck(XQ.fromFEN(mated), XQ.BLACK), true);
ok('双车错：黑方无着可走', XQ.legalMoves(XQ.fromFEN(mated)).length, 0);
ok('双车错：判为将死', XQ.status(XQ.fromFEN(mated)).code, 'mate');
ok('双车错：红胜', XQ.status(XQ.fromFEN(mated)).winner, XQ.RED);
ok('开局未结束', XQ.status(XQ.fromFEN(I)).over, false);
ok('无进攻子力判和', XQ.status(XQ.fromFEN('3k5/9/9/9/9/9/9/9/9/4K4 w')).code, 'material');
ok('只剩将帅判和、多一枚兵即不判和', XQ.status(XQ.fromFEN('4k4/9/9/9/9/9/9/9/4P4/4K4 w')).code !== 'material', true);
ok('未过河的兵也算进攻子力', XQ.attackingForce(XQ.fromFEN('4k4/9/9/9/9/9/9/4P4/9/4K4 w'), XQ.RED), true);
(function rep() {
  const st = XQ.fromFEN('r3k4/9/9/9/9/9/9/9/9/3K2R2 w');
  const mv = (a, b, c, d) => XQ.makeMove(st, XQ.moveOf(S(a, b), S(c, d)));
  mv(9, 6, 9, 5); mv(0, 0, 1, 0); mv(9, 5, 9, 6); mv(1, 0, 0, 0); mv(9, 6, 9, 5); mv(0, 0, 1, 0);
  ok('重复次数（含当前局面）', XQ.repetitionCount(st), 2);
  ok('两次重复不判和（须三次）', XQ.status(st).code !== 'repetition', true);
  mv(9, 5, 9, 6); mv(1, 0, 0, 0); mv(9, 6, 9, 5); mv(0, 0, 1, 0);
  ok('第三次重复局面', XQ.repetitionCount(st), 3);
  ok('三次重复判和', XQ.status(st).code, 'repetition');
})();

group('自然限着口径：只有吃子才清零');
(function limiter() {
  const st = XQ.fromFEN('4k4/9/9/9/4R4/9/9/9/9/3K5 w');
  st.halfmove = 120; st.moveNumber = 61;                       // 连续 120 半步未吃子、局数足够
  ok('达阈值触发限着判和', XQ.status(st).code, 'limiter');
  st.halfmove = 120; st.moveNumber = 30;                       // 计数虚高但局数不足（防导入脏 FEN 误判）
  ok('局数不足不误判限着', XQ.status(st).code !== 'limiter', true);
  st.halfmove = 119; st.moveNumber = 61;
  ok('差一步未达阈值不判和', XQ.status(st).code !== 'limiter', true);
})();
(function pawnAdvance() {
  const st = XQ.fromFEN('4k4/9/9/9/4P4/9/9/9/9/4K4 w');     // 红兵未过河
  XQ.makeMove(st, XQ.moveOf(S(4, 4), S(3, 4)));             // 兵进一（未吃子）
  ok('兵未吃子的推进不清零限着计数', st.halfmove, 1);
  const st2 = XQ.fromFEN('4k4/9/9/9/9/9/9/9/9/4K4 w');
  XQ.makeMove(st2, XQ.moveOf(S(9, 4), S(8, 4)));
  XQ.makeMove(st2, XQ.moveOf(S(0, 4), S(1, 4)));
  ok('纯将/帅移动只累加限着', st2.halfmove, 2);
  const st3 = XQ.fromFEN('4k4/9/9/4p4/9/9/4R4/9/9/4K4 w');   // 红车可吃黑中卒
  st3.halfmove = 40;
  XQ.makeMove(st3, XQ.moveOf(S(6, 4), S(3, 4)));            // 车吃兵
  ok('吃子才把限着计数清零', st3.halfmove, 0);
})();

group('回归：初始 FEN 结尾 `0 301` 不应破坏棋盘（engine 67/118/290）');
(function fenHighMoveNumber() {
  const base = 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR';
  const st = XQ.fromFEN(base + ' w - - 0 301');
  ok('加载后 ply 归零（与 moveNumber 解耦）', st.ply, 0);
  ok('moveNumber 仍保留 301', st.moveNumber, 301);
  const before = XQ.toFEN(st);
  const legal = XQ.legalMoves(st);                          // 关键：曾因 hashLog/undo 越界写坏棋盘
  ok('legalMoves 返回 44 个合法着', legal.length, 44);
  ok('legalMoves 后棋盘/回合完好', XQ.toFEN(st), before);
  XQ.makeMove(st, legal[0]);
  ok('走一步后 ply=1、undo 可回退', st.ply, 1);
  XQ.unmakeMove(st);
  ok('unmake 后棋盘复原', XQ.toFEN(st), before);
})();
(function undoGrowth() {
  // 纯将帅移动把 ply 推过初始容量 256，验证动态扩容不越界。
  const st = XQ.fromFEN('4k4/9/9/9/9/9/9/9/9/3K5 w');
  let flips = 0;
  for (let i = 0; i < 300; i++) {
    const legal = XQ.legalMoves(st);
    if (!legal.length) break;
    XQ.makeMove(st, legal[0]);
    flips++;
  }
  ok('超过初始容量仍可继续走子（' + flips + ' 步）', flips > 256, true);
  ok('扩容后 hashLog 覆盖当前 ply', st.undoCap > st.ply, true);
})();

group('FEN 字段校验与子力上限');
let tval = 0;
try { XQ.fromFEN('rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR q'); } catch (e) { tval = 1; }
ok('非法回合字段被拒绝', tval, 1);
tval = 0;
try { XQ.fromFEN('4k4/9/9/9/ppppp4/1p7/9/9/9/4K4 w'); } catch (e) { tval = 1; }   // 黑 6 卒（超 5）
ok('兵卒数量超上限被拒绝', tval, 1);
tval = 0;
try { XQ.fromFEN('rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR'); } catch (e) { tval = 1; }
ok('缺回合字段时默认红先且不报错', tval, 0);
ok('缺回合字段 FEN 默认记为红走', XQ.toFEN(XQ.fromFEN('rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR')).split(' ')[1], 'w');

group('搜索快照 cloneState 与原局面隔离（ai 134）');
(function snapshot() {
  const st = XQ.fromFEN(XQ.START_FEN);
  const snap = XQ.cloneState(st);
  const key0 = XQ.keyOf(st);
  XQ.makeMove(snap, XQ.legalMoves(snap)[0]);
  ok('改副本不影响原始哈希', XQ.keyOf(st), key0);
  ok('改副本不影响原始 ply', st.ply, 0);
  ok('副本自带 ply 前进', snap.ply, 1);
  const back = XQ.cloneState(snap);
  XQ.unmakeMove(back);
  ok('副本可独立回退', XQ.toFEN(back), XQ.toFEN(st));
})();

group('FEN 读写');
const f2 = 'rnbak1bnr/9/1c4c2/p1p1p1p1p/9/9/P1P1P1P1P/1C3C3/9/RNBAKABNR w - - 3 4';
ok('FEN 往返（盘面部分）', XQ.toFEN(XQ.fromFEN(f2)).split(' ').slice(0, 3).join(' '), f2.split(' ').slice(0, 3).join(' '));
ok('FEN 保持回合', XQ.toFEN(XQ.fromFEN(f2)).split(' ')[1], 'w');
ok('FEN 保持限着计数', XQ.toFEN(XQ.fromFEN(f2)).split(' ')[4], '3');
ok('黑方 FEN 回合', XQ.toFEN(XQ.fromFEN(BI)).split(' ')[1], 'b');
let threw = 0;
try { XQ.fromFEN('rnbakabnr/9/1c5c1/p1p1p1p1/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w'); } catch (e) { threw = 1; }
ok('列数不足被拒绝', threw, 1);
threw = 0;
try { XQ.fromFEN('rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9 w'); } catch (e) { threw = 1; }
ok('行数不足被拒绝', threw, 1);
threw = 0;
try { XQ.fromFEN('rnba1abnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w'); } catch (e) { threw = 1; }
ok('缺黑将被拒绝', threw, 1);
threw = 0;
try { XQ.fromFEN('rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBA1ABNR w'); } catch (e) { threw = 1; }
ok('缺红帅被拒绝', threw, 1);
threw = 0;
try { XQ.fromFEN('rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/4K4K1 w'); } catch (e) { threw = 1; }
ok('同一方两位帅/将被拒绝', threw, 1);

group('随机自对弈健全性');
(function selfPlay() {
  const st = XQ.fromFEN(XQ.START_FEN);
  let plies = 0, bad = 0, caps = 0;
  while (plies < 300) {
    const legal = XQ.legalMoves(st);
    const key0 = XQ.keyOf(st);
    if (!legal.length) break;
    const mv = legal[(Math.random() * legal.length) | 0];
    XQ.makeMove(st, mv);
    XQ.unmakeMove(st);
    if (XQ.keyOf(st) !== key0 || st.ply !== plies) bad++;
    XQ.makeMove(st, mv);
    if (XQ.inCheck(st, st.turn ^ 1)) bad++;   // 刚走完的一方不应处于被将状态
    if (XQ.capOf(mv)) caps++;
    plies++;
  }
  ok('自对弈 ' + plies + ' 步，undo 与合法性无损（异常 ' + bad + ' 次）', bad, 0);
  ok('确实发生了吃子（' + caps + ' 次）', caps > 0, true);
})();

console.log('\n合计：' + pass + ' 通过 / ' + fail + ' 失败');
process.exit(fail ? 1 : 0);
