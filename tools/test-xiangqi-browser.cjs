"use strict";
/* ============================================================================
 * 中国象棋 浏览器回归测试（puppeteer-core + 本机 Chrome，不使用 Edge）
 * 运行： node tools/test-xiangqi-browser.cjs
 * 覆盖：
 *   - 页面零脚本错误 + 全局 XQ / XQAI / window.GAME_HOST 就绪
 *   - item7  GAME_HOST.setTheme(light/dark/auto/内部名/bogus)、pause/resume、不重置棋局、存档键不变
 *   - item2  在页内验证 FEN `... 0 301` 加载后 legalMoves 不破坏棋盘（成品内置引擎）
 *   - item4  成品内置 AI：被将死返回 0、被将返回合法应着、底线杀可算出
 *   - item6  认输后结果持久化，刷新不“复活”
 *   - item3  提示请求令牌：点提示后开新局，旧提示不回写（DOM 高亮不出现）
 *   - item5  执黑悔掉引擎首着后自动重新调度引擎（棋谱手数回补）
 *   - item1  UI 规则文案声明为“简化判和”，不谎称完整赛事裁决
 * ==========================================================================*/
const fs = require("fs");
const path = require("path");
const http = require("http");
const puppeteer = require("puppeteer-core");

const ROOT = path.resolve(__dirname, "..");                 // repo/
const GAME = "/src/games/xiangqi/" + encodeURIComponent("中国象棋.html");
const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css" };
const BOOT = "typeof XQ!=='undefined' && typeof XQAI!=='undefined' && typeof window.GAME_HOST!=='undefined' && !!document.getElementById('board')";

function serve() {
  return new Promise(res => {
    const srv = http.createServer((req, rw) => {
      try {
        const p = path.normalize(path.join(ROOT, decodeURIComponent(req.url.split("?")[0])));
        if (!p.startsWith(ROOT)) { rw.writeHead(403); rw.end(); return; }
        fs.readFile(p, (e, buf) => {
          if (e) { rw.writeHead(404); rw.end("nf"); return; }
          rw.writeHead(200, { "Content-Type": MIME[path.extname(p).toLowerCase()] || "application/octet-stream", "Cache-Control": "no-store" });
          rw.end(buf);
        });
      } catch (e) { rw.writeHead(500); rw.end(); }
    });
    srv.listen(0, "127.0.0.1", () => res(srv));
  });
}

let server = null, browser = null;
const results = [];
function report(name, detail) { results.push({ name, ok: true, detail }); console.log("PASS  " + name + "  |  " + (detail || "")); }
function fail(name, err) { results.push({ name, ok: false, detail: String(err && err.message || err) }); console.log("FAIL  " + name + "  |  " + String(err && err.message || err)); }
function assert(cond, msg) { if (!cond) throw new Error("断言失败: " + msg); }
async function run(name, fn) { console.log("---- " + name); try { const d = await fn(); report(name, d); } catch (e) { fail(name, e); } }
function gameUrl() { return "http://127.0.0.1:" + server.address().port + GAME; }
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function waitFor(page, expr, timeout) {
  const t0 = Date.now();
  for (;;) {
    const v = await page.evaluate(`(function(){ try { return (${expr}); } catch(e){ return "__ERR__:"+e.message; } })()`);
    if (typeof v === "string" && v.startsWith("__ERR__")) throw new Error("页内表达式异常: " + v);
    if (v) return v;
    if (Date.now() - t0 > (timeout || 8000)) throw new Error("等待超时: " + expr);
    await sleep(120);
  }
}

async function newPage(opts) {
  opts = opts || {};
  const page = await browser.newPage();
  page.__errors = [];
  page.on("pageerror", e => page.__errors.push(String(e && e.message || e)));
  page.on("console", m => { if (m.type() === "error") page.__errors.push("console:" + m.text()); });
  await page.setViewport({ width: 1200, height: 900 });
  await page.goto(gameUrl(), { waitUntil: "domcontentloaded" });
  await waitFor(page, BOOT, 12000);
  if (opts.clear) {                       // 清档并回到默认新局（pve 执红 level2）
    await page.evaluate(`(function(){ try{localStorage.clear();}catch(e){} })()`);
    await page.reload({ waitUntil: "domcontentloaded" });
    await waitFor(page, BOOT, 12000);
  }
  return page;
}
function checkNoErrors(page) {
  assert(page.__errors.length === 0, "页面不应有未捕获脚本错误: " + page.__errors.slice(0, 3).join(" | "));
}

/* ---------------- item7：GAME_HOST 契约 ---------------- */
async function t_gamehost() {
  const page = await newPage({ clear: true });
  const r = await page.evaluate(async () => {
    const TK = "qoder.xiangqi.theme.v1";
    const dataset = () => document.documentElement.dataset.theme;
    const out = {};
    const light = GAME_HOST.setTheme("light");
    const dark = GAME_HOST.setTheme("dark");
    const wood = GAME_HOST.setTheme("wood");
    const ink = GAME_HOST.setTheme("ink");
    const auto = GAME_HOST.setTheme("auto");
    const bogus = GAME_HOST.setTheme("bogus");
    const night = GAME_HOST.setTheme("night");          // 放最后：最终成功态为 night
    out.light = light.theme; out.dark = dark.theme; out.wood = wood.theme;
    out.ink = ink.theme; out.night = night.theme;
    out.autoOk = !!(auto && auto.ok && (auto.theme === "ink" || auto.theme === "wood"));
    out.bogusRejected = bogus.ok === false;
    out.themeKey = localStorage.getItem(TK);
    out.datasetMatchesNight = dataset() === "night";
    out.gameKeyRenamedCheck = localStorage.getItem("xiangqi:theme") === null && localStorage.getItem("qoder.xiangqi.theme") === null;
    // pause / resume（先给棋钟让它 running=true）
    document.querySelector('#segClock button[data-v="300"]').click();   // 触发 newGame → running=true
    await new Promise(r2 => setTimeout(r2, 200));
    const runningBefore = GAME_HOST.state.running;
    const pr = GAME_HOST.pause(); const runningPaused = GAME_HOST.state.running;
    const rs = GAME_HOST.resume(); const runningResumed = GAME_HOST.state.running;
    out.pauseResume = { runningBefore, pausedFlag: pr && pr.paused, runningPaused, runningResumed, resumeObj: !!rs };
    return out;
  });
  assert(r.light === "ink", "light 应落到 ink，实得 " + r.light);
  assert(r.dark === "night", "dark 应落到 night，实得 " + r.dark);
  assert(r.wood === "wood" && r.ink === "ink" && r.night === "night", "内部主题名应原样生效: " + JSON.stringify(r));
  assert(r.autoOk, "auto 应解析为 ink/wood");
  assert(r.bogusRejected, "bogus 主题应被拒绝 (ok:false)");
  assert(r.themeKey === "night", "最后成功设置的 theme 应写入 theme.v1（本次为 night），实得 " + r.themeKey);
  assert(r.datasetMatchesNight, "data-theme 应与最终 setTheme 结果 night 一致");
  assert(r.gameKeyRenamedCheck, "不得新增/改名存档键");
  const pr = r.pauseResume;
  assert(pr.runningBefore === true, "设了棋钟后 running 应为 true");
  assert(pr.pausedFlag === true && pr.runningPaused === false, "pause 应停表 running=false");
  assert(pr.runningResumed === true, "resume 应恢复 running=true");
  checkNoErrors(page);
  await page.close();
  return JSON.stringify({ light: r.light, dark: r.dark, bogus: r.bogusRejected, pr });
}

/* ---------------- item7 补充：setTheme 不改变当前棋局字段（不重置）---------------- */
async function t_theme_no_reset() {
  const page = await newPage({ clear: true });
  await page.evaluate(() => document.getElementById("btnNew").click());   // 确保存在棋局存档
  const r = await page.evaluate(() => {
    const GK = "qoder.xiangqi.v1";
    const snap = () => {
      const d = JSON.parse(localStorage.getItem(GK) || "{}");
      return JSON.stringify({ start: d.start, mode: d.mode, uci: d.uci, result: d.result, my: d.my });
    };
    const s0 = snap();
    GAME_HOST.setTheme("light");
    GAME_HOST.setTheme("night");
    const s1 = snap();
    return { same: s0 === s1, theme: GAME_HOST.state.theme, keyPresent: !!localStorage.getItem(GK) };
  });
  assert(r.keyPresent, "应有棋局存档 qoder.xiangqi.v1");
  assert(r.same, "换肤不得改动棋局字段(start/mode/uci/result/my)");
  assert(r.theme === "night", "最终主题应为 night");
  checkNoErrors(page);
  await page.close();
  return "棋局字段不变=" + r.same + ", theme=" + r.theme;
}

/* ---------------- item2：页内成品引擎，FEN `0 301` 不破坏棋盘 ---------------- */
async function t_fen301_inpage() {
  const page = await newPage({ clear: true });
  const r = await page.evaluate(() => {
    const base = "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR";
    const st = XQ.fromFEN(base + " w - - 0 301");
    const before = XQ.toFEN(st);
    const legal = XQ.legalMoves(st);          // 曾在此破坏棋盘
    const after = XQ.toFEN(st);
    return { ply: st.ply, moveNumber: st.moveNumber, legal: legal.length, intact: before === after };
  });
  assert(r.ply === 0, "ply 应归零，实得 " + r.ply);
  assert(r.moveNumber === 301, "moveNumber 应保留 301，实得 " + r.moveNumber);
  assert(r.legal === 44, "legalMoves 应 44，实得 " + r.legal);
  assert(r.intact, "legalMoves 前后棋盘应完全一致");
  checkNoErrors(page);
  await page.close();
  return "ply0/legal" + r.legal + "/棋盘完好";
}

/* ---------------- item4：页内成品 AI 的将杀 / 应将 ---------------- */
async function t_ai_inpage() {
  const page = await newPage({ clear: true });
  const r = await page.evaluate(async () => {
    const mated = "R2k5/8R/9/9/9/9/9/9/9/4K4 b";
    const inChk = "4k4/9/9/9/9/4R4/9/9/9/4K4 b";
    const liftMate = "4k4/R8/9/9/9/9/9/9/9/K7R w";
    const s1 = XQ.fromFEN(mated);
    const r1 = await XQAI.think(s1, { level: 2, ms: 500, book: false, pure: true });
    const s2 = XQ.fromFEN(inChk);
    const fen2 = XQ.toFEN(s2);
    const r2 = await XQAI.think(s2, { level: 2, ms: 800, book: false, pure: true });
    const after2 = XQ.fromFEN(fen2); XQ.makeMove(after2, r2.move);
    const s3 = XQ.fromFEN(liftMate);
    const r3 = await XQAI.think(s3, { level: 3, ms: 1200, book: false, pure: true });
    const after3 = XQ.cloneState(s3); XQ.makeMove(after3, r3.move);
    return {
      matedZero: r1.move === 0,
      evasionLegal: XQ.legalMoves(s2).indexOf(r2.move) > -1,
      evasionResolves: !XQ.inCheck(after2, XQ.BLACK),
      root2Intact: XQ.toFEN(s2) === fen2 && s2.ply === 0,
      liftIsMate: r3.mate && XQ.status(after3).code === "mate"
    };
  });
  assert(r.matedZero, "被将死应返回 0");
  assert(r.evasionLegal && r.evasionResolves, "被将应返回解除将军的合法着");
  assert(r.root2Intact, "搜索后根局面必须完好（快照隔离）");
  assert(r.liftIsMate, "底线车 lift 一步杀应被算出");
  checkNoErrors(page);
  await page.close();
  return JSON.stringify(r);
}

/* ---------------- item6：认输后刷新不复活 ---------------- */
async function t_resign_persist() {
  const page = await newPage({ clear: true });
  await page.evaluate(() => document.getElementById("btnResign").click());
  await waitFor(page, "!document.getElementById('resultModal').hidden", 4000);
  const before = await page.evaluate(() => ({ modal: !document.getElementById("resultModal").hidden, code: GAME_HOST.state.result }));
  assert(before.modal, "认输后应弹出结果框");
  assert(before.code === "resign", "存档结果 code 应为 resign，实得 " + before.code);

  await page.reload({ waitUntil: "domcontentloaded" });
  await waitFor(page, BOOT, 12000);
  await sleep(400);
  const after = await page.evaluate(() => ({
    modal: !document.getElementById("resultModal").hidden,
    code: GAME_HOST.state.result,
    thinking: GAME_HOST.state.thinking
  }));
  assert(after.modal, "刷新后结果框应仍在（未复活为进行中）");
  assert(after.code === "resign", "刷新后仍记录 resign 结果，实得 " + after.code);
  assert(after.thinking === false, "结束后不应再调度引擎思考");
  checkNoErrors(page);
  await page.close();
  return "刷新后 modal=" + after.modal + ", code=" + after.code;
}

/* ---------------- item3：提示令牌——开新局作废旧提示 ---------------- */
async function t_hint_token() {
  const page = await newPage({ clear: true });
  // 先证明提示本身会高亮（level2 → 强档 ms1600）
  await page.evaluate(() => document.getElementById("btnHint").click());
  await waitFor(page, "document.querySelectorAll('.spot.hint').length >= 1", 5000);
  const hintShown = await page.evaluate(() => document.querySelectorAll(".spot.hint").length);
  assert(hintShown >= 1, "提示应高亮建议着（from/to 至少 1 处），实得 " + hintShown);

  // 再：点提示后立刻开新局，等旧提示 resolve 也不得回写
  await page.evaluate(() => { document.getElementById("btnHint").click(); document.getElementById("btnNew").click(); });
  await sleep(3200);                       // > 提示 ms1600，确保旧的 resolve 时机已过
  const stale = await page.evaluate(() => ({
    hintSpots: document.querySelectorAll(".spot.hint").length,
    picked: document.querySelectorAll(".piece.picked").length
  }));
  assert(stale.hintSpots === 0, "开新局后旧提示不应残留高亮，实得 " + stale.hintSpots);
  assert(stale.picked === 0, "开新局后旧提示不应残留选中环，实得 " + stale.picked);
  checkNoErrors(page);
  await page.close();
  return "提示高亮=" + hintShown + "; 新局后残留=" + JSON.stringify(stale);
}

/* ---------------- item5：执黑悔掉引擎首着后重新调度 ---------------- */
async function t_undo_reschedules_ai() {
  const page = await newPage({ clear: true });
  await page.evaluate(() => { document.querySelector('#segLevel button[data-v="0"]').click(); });   // 初学档，快
  await page.evaluate(() => { document.querySelector('#segSide button[data-v="1"]').click(); });     // 执黑 → 引擎(红)先手
  // 等引擎走出首着
  await waitFor(page, "parseInt((document.getElementById('plyTag').textContent.match(/\\d+/)||[0])[0],10) >= 1", 8000);
  const plyAfterAI = await page.evaluate(() => parseInt((document.getElementById("plyTag").textContent.match(/\d+/) || [0])[0], 10));
  assert(plyAfterAI >= 1, "执黑开局后引擎应先走一手");
  await sleep(300);
  // 悔棋：退掉引擎首着 → 回到开局、轮引擎。点击处理器是同步的：click 返回时 undo 已完成、
  // 引擎重调度为异步，故同一 evaluate 内读到的应瞬间为 0 手。
  const plyAfterUndo = await page.evaluate(() => {
    document.getElementById("btnUndo").click();
    return parseInt((document.getElementById("plyTag").textContent.match(/\d+/) || [0])[0], 10);
  });
  assert(plyAfterUndo === 0, "悔棋后棋谱应即时清空，实得 " + plyAfterUndo);
  // 关键：修复前会停走（一直 0 手）；修复后引擎应自动重新调度并再次落子
  await waitFor(page, "parseInt((document.getElementById('plyTag').textContent.match(/\\d+/)||[0])[0],10) >= 1", 8000);
  const plyResumed = await page.evaluate(() => parseInt((document.getElementById("plyTag").textContent.match(/\d+/) || [0])[0], 10));
  assert(plyResumed >= 1, "悔掉引擎首着后应自动重新调度并再次落子，实得 " + plyResumed + " 手");
  checkNoErrors(page);
  await page.close();
  return "AI首着→悔→AI再走，ply: " + plyAfterAI + "→" + plyAfterUndo + "→" + plyResumed;
}

/* ---------------- item1：UI 规则文案声明“简化判和” ---------------- */
async function t_help_copy() {
  const page = await newPage({ clear: true });
  const copy = await page.evaluate(() => {
    const dt = Array.prototype.slice.call(document.querySelectorAll("#helpSheet dt"));
    const hit = dt.find(d => /和棋/.test(d.textContent));
    return hit ? (hit.nextElementSibling ? hit.nextElementSibling.textContent : "") : "";
  });
  assert(/简化/.test(copy), "和棋说明应标注“简化判和”，实得: " + copy.slice(0, 40));
  assert(/重复.{0,6}三/.test(copy) && /120|60 回合/.test(copy), "应说明三次重复与 60 回合(120半步)未吃子口径");
  assert(!/完整赛事裁决规则/.test(copy) && /并非完整赛事裁决|不逐例裁定/.test(copy), "不得谎称完整赛事裁决，应明确未实现长将/长捉逐例裁定");
  checkNoErrors(page);
  await page.close();
  return copy.slice(0, 24) + "…";
}

/* ================================ main ================================ */
(async () => {
  if (!fs.existsSync(CHROME)) { console.error("未找到 Chrome: " + CHROME); process.exit(2); }
  const target = path.join(ROOT, "src/games/xiangqi/中国象棋.html");
  if (!fs.existsSync(target)) { console.error("未找到成品 HTML，请先在 src/games/xiangqi 运行 node build.js"); process.exit(2); }
  server = await serve();
  browser = await puppeteer.launch({
    executablePath: CHROME, headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--autoplay-policy=no-user-gesture-required", "--window-size=1280,900"]
  });
  const t0 = Date.now();
  let fatal = null;
  try {
    await run("页面就绪 + GAME_HOST 契约(item7)", t_gamehost);
    await run("GAME_HOST.setTheme 不重置棋局(item7)", t_theme_no_reset);
    await run("FEN 0 301 页内不破坏棋盘(item2)", t_fen301_inpage);
    await run("AI 应将/将死/杀法(页内成品, item4)", t_ai_inpage);
    await run("认输结果持久化·刷新不复活(item6)", t_resign_persist);
    await run("提示令牌·开新局作废旧提示(item3)", t_hint_token);
    await run("执黑悔首着·重新调度引擎(item5)", t_undo_reschedules_ai);
    await run("规则文案声明简化判和(item1)", t_help_copy);
  } catch (e) {
    fatal = e; console.error("测试批次异常:", e && e.stack || e);
  } finally {
    const pass = results.filter(r => r.ok).length, total = results.length;
    console.log("\n==== " + pass + "/" + total + " 通过 (" + ((Date.now() - t0) / 1000).toFixed(1) + "s) ====");
    for (const r of results) if (!r.ok) console.log("  FAILED: " + r.name + " — " + r.detail);
    try { await browser.close(); } catch (e) { }
    try { server.close(); } catch (e) { }
    process.exit((!fatal && pass === total && total > 0) ? 0 : 1);
  }
})().catch(e => { console.error("运行器异常", e); try { browser && browser.close(); } catch (_) { } try { server && server.close(); } catch (_) { } process.exit(3); });
