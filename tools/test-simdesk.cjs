"use strict";
/* ============================================================================
 * SIMDESK 回归测试（puppeteer-core + 本机 Chrome）
 * 覆盖审阅中逐项复现的 P1/P2 问题与 golden-path。
 * 运行： node tools/test-simdesk.cjs
 * ==========================================================================*/
const fs = require("fs");
const path = require("path");
const http = require("http");
const puppeteer = require("puppeteer-core");

const ROOT = path.resolve(__dirname, "..");                 // repo/
const GAME = "/src/games/simdesk.html";
const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const MIME = { ".html":"text/html; charset=utf-8", ".js":"text/javascript", ".css":"text/css",
  ".json":"application/json", ".svg":"image/svg+xml", ".png":"image/png", ".ico":"image/x-icon" };

function serve(){
  return new Promise(res=>{
    const srv=http.createServer((req,rw)=>{
      try{
        const p=path.normalize(path.join(ROOT, decodeURIComponent(req.url.split("?")[0])));
        if(!p.startsWith(ROOT)){ rw.writeHead(403); rw.end(); return; }
        fs.readFile(p,(e,buf)=>{ if(e){ rw.writeHead(404); rw.end("nf"); return; }
          rw.writeHead(200,{ "Content-Type": MIME[path.extname(p).toLowerCase()]||"application/octet-stream",
            "Cache-Control":"no-store" });
          rw.end(buf); });
      }catch(e){ rw.writeHead(500); rw.end(); }
    });
    srv.listen(0,"127.0.0.1",()=> res(srv));
  });
}

let server=null, browser=null;
const results=[];
function report(name, detail){ results.push({name, ok:true, detail}); console.log("PASS  "+name+"  |  "+(detail||"")); }
function fail(name, err){ results.push({name, ok:false, detail:String(err&&err.message||err)}); console.log("FAIL  "+name+"  |  "+String(err&&err.message||err)); }
function assert(cond, msg){ if(!cond) throw new Error("断言失败: "+msg); }
function assertNear(a,b,tol,msg){ if(!(isFinite(a)&&Math.abs(a-b)<=tol)) throw new Error(`${msg}: 期望≈${b} 实际 ${a} (容差 ${tol})`); }
async function run(name, fn){
  console.log("---- "+name);
  try{ const d=await fn(); report(name, d); }
  catch(e){ fail(name, e); }
}

function gameUrl(){ return "http://127.0.0.1:"+server.address().port+GAME; }

/* 页内工具（可重复安装；reload 后重装） */
function INSTALL(){
  window.__H = {
    stop(){ CLK.running=false; try{ if(typeof CO!=="undefined" && CO.open) coachClose(); }catch(e){}
      try{ if(MD.el && MD.el.classList.contains("on")) closeModal(); }catch(e){} return true; },
    state(){ return {di:CLK.di, min:CLK.min, sec:CLK.sec, cash:ACC.cash, frozen:ACC.frozenCash, shortCash:ACC.shortCash,
      marginLoan:ACC.marginLoan, cashLoan:ACC.cashLoan||0, feePaid:ACC.feePaid, swap:ACC.stat.swapPaid||0,
      realized:ACC.realized, eq:equity(), INIT:ACC.initCash, running:CLK.running, mcModal:!!CLK.mcModal, days:MK.days.length}; },
    advanceDays(n, cap){ let g=0; const d0=CLK.di; cap=cap||20000; while(CLK.di-d0<n && g<cap){ advanceTick(); g++; } return {advanced:CLK.di-d0, ticks:g}; },
    ensureCont(cap){ let g=0; cap=cap||3200; while(CLK.min<571 && g<cap){ advanceTick(); g++; } return {min:CLK.min, di:CLK.di, ticks:g}; },
    nextDayCont(){ const r=this.advanceDays(1); const c=this.ensureCont(); return {r,c}; },
    /* 权益一致性基准：无持仓挂账时 equity ≈ INIT - 已付费用 - 隔夜息（借款/利息另有专项） */
    eqCheck(){ const s=this.state(); const base=s.INIT - s.feePaid - s.swap; return {eq:s.eq, base, diff:s.eq-base}; },
    /* 冻结审计：avail+frozen==qty 且 frozen 恰等于未成卖单剩余量；T+1 市场今日买入不参与可用 */
    freezeAudit(){ const need={};
      for(const o of ACC.orders) if(o.status==="待成" && o.side<0 && o.kind!=="short" && o.kind!=="cover") need[o.code]=(need[o.code]||0)+remQty(o);
      const bad=[];
      for(const c in ACC.pos){ const p=ACC.pos[c]; const w=need[c]||0;
        const sym=MK.byCode[c]; const t1=sym && MKT[sym.mkt] && MKT[sym.mkt].t1;
        const expAvail=Math.max(0, p.qty - w - (t1?(p.todayBuy||0):0));
        if(Math.abs(p.frozen-w)>1e-6 || Math.abs(p.avail-expAvail)>1e-6) bad.push({c,qty:p.qty,avail:p.avail,frozen:p.frozen,wantFrozen:w,expAvail}); }
      return bad; },
    ghosts(){ const out=[];
      for(const s of MK.syms){ for(const arr of [s.bids||[], s.asks||[]]){ for(const L of arr){ for(const o of L.u){
        if(o.status!=="待成" && remQty(o)>1e-9) out.push(o.id+":"+o.status); } } } } return out; },
    tradesOf(id){ return ACC.trades.filter(t=>String(t.id).indexOf(id+".")===0).reduce((a,t)=>a+t.qty,0); },
    orderById(id){ return ACC.orders.find(o=>o.id===id)||null; },
  };
  window.__H.stop();
}

const BOOT_WAIT = "typeof MK!=='undefined' && MK.syms && MK.syms.length>0 && !document.getElementById('bootMask') && typeof window.GAME_HOST!=='undefined'";

async function installWithRetry(page){
  for(let i=0;i<5;i++){
    try{ await page.waitForFunction(BOOT_WAIT, {timeout:150000, polling:300}); }
    catch(e){ await new Promise(r=>setTimeout(r,800)); continue; }
    try{ await page.evaluate(INSTALL); return page; }
    catch(e){ await new Promise(r=>setTimeout(r,800)); }
  }
  throw new Error("页面启动/工具安装失败");
}

async function openGame({fresh=true}={}){
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", e=> errors.push(String(e&&e.message||e)));
  page.on("console", m=>{ if(m.type()==="error"){ const t=m.text(); if(!/favicon|Failed to load resource/i.test(t)) errors.push("console:"+t); } });
  await page.setViewport({width:1440, height:900});
  page.__errors = errors;
  await page.goto(gameUrl(), {waitUntil:"domcontentloaded"});
  if(fresh){
    await page.evaluate(async()=>{
      try{ localStorage.clear(); }catch(e){}
      await new Promise(res=>{ let done=false; const fin=()=>{ if(!done){done=true;res();} };
        try{ const rq=indexedDB.deleteDatabase("simdesk"); rq.onsuccess=rq.onerror=rq.onblocked=fin; }catch(e){ fin(); }
        setTimeout(fin,3000); });
    });
    await page.reload({waitUntil:"domcontentloaded"});
  }
  return await installWithRetry(page);
}

/* ============================== 用例 ============================== */

async function t01_snapshotReload(){
  const page = await openGame({fresh:true});
  const before = await page.evaluate(async()=>{
    const e0=equity();
    const ok=borrowCash(50000);
    const eB=equity();
    const adv=window.__H.advanceDays(2, 8000);
    let flush=await Store.flush(true);
    if(!flush){ await new Promise(r=>setTimeout(r,300)); flush=await Store.flush(true); }   // 等待在途 flush 完成
    return {ok, e0, eB, loan:ACC.cashLoan, st:window.__H.state(), flush, adv,
      acctSnapHasLoan: ("cashLoan" in Store.acctSnap()) && ("loanRate" in Store.acctSnap()),
      clockVer: Store.clockSnap().ver};
  });
  assert(before.ok, "borrowCash(50000) 应成功");
  assertNear(before.eB, before.e0, 0.5, "借款不增加权益");
  assert(before.adv.advanced>=2, "应推进≥2个交易日: "+JSON.stringify(before.adv));
  assert(before.acctSnapHasLoan, "acctSnap 必须包含 cashLoan/loanRate");
  assert(before.clockVer===2, "clockSnap.ver 应为 2，实际 "+before.clockVer);
  assert(before.flush, "Store.flush(true) 应成功");

  await page.reload({waitUntil:"domcontentloaded"});
  await installWithRetry(page);
  const after = await page.evaluate(()=>({st:window.__H.state(), di:CLK.di, days:MK.days.length}));
  const st0=before.st, st1=after.st;
  assert(st1.di >= st0.di, `日期不能倒退: 保存于第${st0.di}日, 重载后第${st1.di}日`);
  assert(st1.days === st0.days, `交易日历应成套恢复: ${st0.days} vs ${st1.days}`);
  assert(st1.cashLoan >= before.loan-0.001, `负债不得归零: 保存 ${before.loan}, 重载后 ${st1.cashLoan}`);
  assertNear(st1.cashLoan, before.loan, 101, "重载后负债≈保存值");
  assert(st1.eq < st0.INIT + 1, `权益不能凭空+5万(1050000): 重载后权益 ${st1.eq}`);
  assertNear(st1.eq, st0.eq, 101, "重载前后权益一致(允许一天息差)");
  await page.close();
  return `di ${st0.di}->${st1.di}, 负债 ${st0.cashLoan}->${st1.cashLoan}, 权益 ${st0.eq.toFixed(2)}->${st1.eq.toFixed(2)}`;
}

async function t02_resting_fill_semantics(){
  const r = await STATE.page.evaluate(()=>{
    window.__H.ensureCont();
    resetAccount();                                        // 隔离基线
    const s=MK.byCode["510300"];
    const o=submitOrder({code:"510300", side:1, kind:"lim", qty:300, price:pxr(s, s.bidPx||s.last)});
    if(!o) return {err:"限价买单被拒"};
    const unfilledAtSubmit=o.filled===0 && o.status==="待成";
    const frozenAtSubmit=ACC.frozenCash;
    // 确定性被动成交（复现审阅场景"买300被动成交100"）：模拟一笔恰好越过做市余量的市价卖流
    const L0=s.bids.find(L=>L.u.includes(o));
    if(!L0) return {err:"挂单未进入盘口", unfilledAtSubmit};
    const shares=Math.floor(L0.oth/s.lot)*s.lot + 100;      // 做市余量整手部分 + 1 手 → 恰吃用户 100 股
    sweepSell(s, shares, [], "test");
    const tradesSum=window.__H.tradesOf(o.id);
    let levelLive=0; for(const arr of [s.bids]){ for(const L of arr){ if(L.u.includes(o)) levelLive=liveQty(o); } }
    const out={unfilledAtSubmit, frozenAtSubmit, qty:o.qty, filled:o.filled, tradesSum, status:o.status,
      frozenBefore:ACC.frozenCash, reserve:o.reserve, rem:remQty(o), levelLive, id:o.id};
    if(o.status==="待成"){
      out.expectBack=(o.reserve||0)*(remQty(o)/(o.qty0||o.qty));
      out.cancelOk=cancelOrder(o,true);
      out.frozenAfter=ACC.frozenCash;
      out.audit=window.__H.freezeAudit(); out.ghosts=window.__H.ghosts();
    } else {
      out.cancelOk=false; out.ghosts=window.__H.ghosts();
      const oo=window.__H.orderById(o.id); out.cancelRejected = !cancelOrder(oo,true);
      out.frozenAfter=ACC.frozenCash;
    }
    return out;
  });
  assert(!r.err, r.err||"");
  assert(r.unfilledAtSubmit, "刚挂出应待成未成交");
  assert(r.filled===100, "构造被动成交应为 100 股: "+JSON.stringify(r));
  assert(r.filled<300, "构造应为部分成交: filled="+r.filled);
  assert(r.qty===300, `总量语义统一: o.qty 应恒为 300, 实际 ${r.qty}（旧 bug 会被递减）`);
  assert(r.filled===r.tradesSum, `filled 只能由 onFill 累加一次: filled=${r.filled}, 流水合计=${r.tradesSum}（旧 bug 双倍显示 200）`);
  assert(r.status==="待成", `部分成交状态应为待成，实际 ${r.status}（旧 bug 误判已成致无法撤单）`);
  assert(r.levelLive===r.rem, `盘口应显示剩余量 qty-filled=${r.rem}, 档位内实际剩余 ${r.levelLive}`);
  assert(r.cancelOk===true, "部分成交的待成单必须可撤");
  assertNear(r.frozenBefore-r.frozenAfter, r.expectBack, 1.001, `撤单必须按比例释放冻结资金（旧 bug ${r.expectBack.toFixed(2)} 冻结无法释放）`);
  assert(r.audit.length===0, "冻结审计: "+JSON.stringify(r.audit));
  assert(r.ghosts.length===0, "盘口不该残留终态订单: "+JSON.stringify(r.ghosts));
  return `被动成交 ${r.filled}/300, 档位剩余=${r.levelLive}, 冻结 ${r.frozenBefore.toFixed(2)}→${r.frozenAfter.toFixed(2)}`;
}

async function t03_oversell_and_t0(){
  const r = await STATE.page.evaluate(()=>{
    window.__H.ensureCont();
    resetAccount();
    const s=MK.byCode["EURUSD"];
    const b=submitOrder({code:"EURUSD", side:1, kind:"mkt", qty:1000});
    const p=pos("EURUSD");
    const availAfterBuy=p.avail;
    const buyKind=b&&b.kind;
    const eqA=equity();
    const oversell=submitOrder({code:"EURUSD", side:-1, kind:"mkt", qty:2000});
    const eqB=equity();
    const cashB=ACC.cash;
    const sell=submitOrder({code:"EURUSD", side:-1, kind:"mkt", qty:1000});
    return {buyFilled:b&&b.filled, buyKind, availAfterBuy,
      sMkt:s.mkt, t1:M_of(s).t1, oversellRejected: oversell===null,
      eqBeforeOversell:eqA, eqAfterOversell:eqB, cashAfterOversell:cashB,
      sellFilled:sell&&sell.filled, shortCreated:!!ACC.short["EURUSD"],
      gone:!ACC.pos["EURUSD"], audit:window.__H.freezeAudit()};
  });
  assert(r.buyFilled===1000, "EURUSD 买入 1000 应立即成交: "+JSON.stringify(r));
  assert(r.availAfterBuy===1000, `T+0 成交即时增加可用: avail=${r.availAfterBuy}（旧 bug 为 0）diag=${JSON.stringify(r)}`);
  assert(r.oversellRejected===true, "持1000卖2000必须被拒（旧 bug 放行且凭空+现金、无空头负债）");
  assertNear(r.eqAfterOversell, r.eqBeforeOversell, 1e-9, "被拒的委托不得动权益/现金");
  assert(r.sellFilled===1000, "卖出不超过可用应成交");
  assert(r.gone && !r.shortCreated, "平多不应产生空头");
  assert(r.audit.length===0, "冻结审计: "+JSON.stringify(r.audit));
  return `avail=${r.availAfterBuy}, 超卖被拒=true, 正常平仓=1000`;
}

async function t04_au_multiplier(){
  const r = await STATE.page.evaluate(()=>{
    window.__H.ensureCont();                               // 9:31 商品日盘开市
    resetAccount();
    const st0=window.__H.state();
    const s=MK.byCode["AU"];
    const b=submitOrder({code:"AU", side:1, kind:"mkt", qty:1});
    if(!b||b.filled!==1) return {err:"AU 买入失败", st:st0, openAt:isOpenAt(s,CLK.sec)};
    const p=pos("AU");
    const eqHold=window.__H.eqCheck();
    const pvHold=portfolioValue();
    const out={mult:s.mult, last:s.last, cost:p.cost, avail:p.avail, pvHold, eqHold,
      feePaid:ACC.feePaid-st0.feePaid, eq0:st0.eq, rz0:st0.realized};
    const sell=submitOrder({code:"AU", side:-1, kind:"mkt", qty:1});
    out.sellFilled=sell&&sell.filled;
    out.gone=!ACC.pos["AU"];
    out.eq1=equity(); out.rz1=ACC.realized;
    return out;
  });
  assert(!r.err, r.err+" open="+r.openAt);
  assert(r.avail===1, `期货 T+0 即时可用: avail=${r.avail}（旧 bug avail=0 违背 T+0）`);
  assert(Math.abs(r.cost-r.last)<r.last*0.05, `成本应为价格口径(~${r.last})而非名义额(×1000)，实际 ${r.cost}`);
  assertNear(r.pvHold, r.last*r.mult, r.last*0.05*r.mult, `估值口径必须乘乘数1000: 期望≈${(r.last*r.mult).toFixed(0)}, 实际 ${r.pvHold.toFixed(0)}（旧 bug 会得 500375 类权益）`);
  assertNear(r.eqHold.diff, 0, Math.max(2, r.last*2), `买 1 张 AU 后权益≈INIT-费用（审阅口径 999875）: 偏差 ${r.eqHold.diff.toFixed(2)}`);
  assert(r.sellFilled===1 && r.gone, "AU 卖出平仓成交并清仓");
  assertNear(r.eq1-r.eq0, r.rz1-r.rz0, 0.5, `AU 往返权益一致性 equityΔ==realizedΔ: Δeq=${(r.eq1-r.eq0).toFixed(2)} vs Δrz=${(r.rz1-r.rz0).toFixed(2)}`);
  return `费用=${r.feePaid.toFixed(2)}, 持仓权益偏差=${r.eqHold.diff.toFixed(2)}, 往返 Δeq=${(r.eq1-r.eq0).toFixed(2)} Δrealized=${(r.rz1-r.rz0).toFixed(2)}`;
}

async function t05_day_rollover_gtc_reset(){
  const r = await STATE.page.evaluate(async()=>{
    window.__H.ensureCont();
    resetAccount();                                        // 隔离基线
    const s=MK.byCode["510300"];
    const b=submitOrder({code:"510300", side:1, kind:"mkt", qty:100});
    if(!b||b.filled!==100) return {err:"建仓失败"};
    const out={};
    // (a) 当日卖单日切撤销：可用量不得翻倍
    window.__H.nextDayCont();
    const daySell=submitOrder({code:"510300", side:-1, kind:"lim", qty:100, price:s.limitUp, postpone:false});
    out.availFrozenBefore=[pos("510300").avail, pos("510300").frozen];
    window.__H.advanceDays(1, 8000); window.__H.ensureCont();
    const p=pos("510300");
    out.daySellStatus=daySell?daySell.status:null;
    out.avail=p.avail; out.qty=p.qty;                       // 旧 bug: avail=200
    // (b) GTC 卖单日切后应重挂回盘口且冻结保持
    const gtc=submitOrder({code:"510300", side:-1, kind:"lim", qty:100, price:s.limitUp, postpone:true});
    window.__H.advanceDays(1, 8000); window.__H.ensureCont();
    let inBook=false; for(const arr of [s.asks]){ for(const L of arr){ if(L.u.includes(gtc)) inBook=true; } }
    out.gtcStatus=gtc.status; out.gtcInBook=inBook;         // 旧 bug: 待成但脱离盘口
    const p3=ACC.pos["510300"]||{qty:0,avail:0,frozen:0};
    out.gtcAfter=[p3.avail,p3.frozen,p3.qty];
    if(gtc.status==="待成") cancelOrder(gtc,true);
    // (c) 重置账户：先清用户挂单与冰山队列，旧挂单不得再成交
    const ghost=submitOrder({code:"510300", side:1, kind:"lim", qty:100, price:pxr(s,(s.bidPx||s.last)-20*s.step)});
    resetAccount();
    out.afterResetOrders=ACC.orders.length;
    out.iceCleared=UI2.iceQueue.length===0;
    let g=0; while(g<1500){ advanceTick(); g++; }
    out.posAfterReset=Object.keys(ACC.pos).filter(c=>ACC.pos[c].qty>0).length;
    out.frozenAfterReset=ACC.frozenCash;
    out.eqAfterReset=equity();
    out.ghostStatus=ghost.status;
    out.ghosts=window.__H.ghosts();
    out.audit=window.__H.freezeAudit();
    return out;
  });
  assert(!r.err, r.err);
  assert(r.daySellStatus==="已撤", "当日委托日切应撤销: "+r.daySellStatus);
  assert(r.avail===100 && r.qty===100, `日切撤销卖单后可用应=100 而非翻倍: avail=${r.avail}（旧 bug 200）`);
  assert(r.gtcStatus==="待成" && r.gtcInBook===true, `GTC 卖单日切后应重挂回盘口（旧 bug 脱离盘口）: status=${r.gtcStatus} inBook=${r.gtcInBook}`);
  assert(r.gtcAfter[1]===100 && r.gtcAfter[0]===0, `GTC 卖单冻结应跨日保持: avail/frozen/qty=${r.gtcAfter}`);
  assert(r.afterResetOrders===0 && r.iceCleared, "重置应先清挂单与冰山队列");
  assert(r.ghostStatus!=="待成", "重置后旧挂单必须失效");
  assert(r.posAfterReset===0, `重置后旧挂单不得再成交白得股票: pos=${r.posAfterReset}`);
  assertNear(r.frozenAfterReset, 0, 1e-6, "重置后冻结为0");
  assertNear(r.eqAfterReset, 1000000, 0.5, "重置后权益=初始资金");
  assert(r.ghosts.length===0 && r.audit.length===0, "盘口幽灵/冻结审计: "+JSON.stringify([r.ghosts,r.audit]));
  return `日切撤单后 avail=${r.avail}; GTC重挂=${r.gtcInBook}; 重置后 pos=${r.posAfterReset}, 冻结=${r.frozenAfterReset}`;
}

async function t06_stop_order(){
  const r = await STATE.page.evaluate(async()=>{
    window.__H.ensureCont();
    resetAccount();                                        // 隔离基线
    const out={eq0:equity(), rz0:ACC.realized};
    // 条件按钮状态
    document.getElementById("btnStop").click();
    out.btnOpensRow=document.getElementById("slRow").style.display==="flex";
    out.btnPressed=document.getElementById("btnStop").classList.contains("on");
    out.kindOn=UI2.kind;                                    // 旧 bug: 不设 stop
    document.getElementById("btnStop").click();
    out.kindOff=UI2.kind;
    // 买条件单：触发后旧预留必须原子释放，不遗留冻结（审阅值 1205.012）
    const s=MK.byCode["510300"];
    const f0=ACC.frozenCash;
    const sb=submitOrder({code:"510300", side:1, kind:"stop", stop:s.last*0.99, qty:100});
    if(!sb) return {err:"买条件单被拒"};
    out.buyReserveFrozen=ACC.frozenCash-f0;
    monitorStops();
    out.buyStatus=sb.status;
    out.buyFrozenLeftover=ACC.frozenCash;
    out.buyPos=pos("510300").qty;
    // 卖条件单（等 T+1 可用）：触发后股份冻结应清零（审阅值：剩 100 冻结）
    window.__H.nextDayCont();
    const ss=submitOrder({code:"510300", side:-1, kind:"stop", stop:s.last*1.01, qty:100});
    if(!ss) return {err:"卖条件单被拒"};
    const p=pos("510300");
    out.sellFrozen=[p.avail,p.frozen];
    monitorStops();
    const p2=ACC.pos["510300"];
    out.sellStatus=ss.status;
    out.sellPosLeft=p2?p2.qty:0; out.sellFrozenLeft=p2?p2.frozen:0;
    out.frozenCash=ACC.frozenCash; out.audit=window.__H.freezeAudit(); out.ghosts=window.__H.ghosts();
    out.eq1=equity(); out.rz1=ACC.realized;
    return out;
  });
  assert(!r.err, r.err);
  assert(r.btnOpensRow && r.btnPressed, "条件按钮应展开触发价行并点亮");
  assert(r.kindOn==="stop", `点条件按钮后 kind 必须为 stop（旧 bug 保持 lim）: ${r.kindOn}`);
  assert(r.kindOff==="lim", `关闭条件行后 kind 应还原: ${r.kindOff}`);
  assert(r.buyReserveFrozen>0, "买条件单挂出应冻结预留");
  assert(r.buyStatus==="触发", "买条件单应进入触发终态");
  assertNear(r.buyFrozenLeftover, 0, 1e-6, `买条件单触发后不得遗留冻结（审阅值 1205.012）: ${r.buyFrozenLeftover.toFixed(6)}`);
  assert(r.buyPos===100, "触发后市价买单应建仓: "+r.buyPos);
  assert(r.sellFrozen[0]===0 && r.sellFrozen[1]===100, "卖条件单挂出应冻结股份");
  assert(r.sellStatus==="触发", "卖条件单应触发");
  assert(r.sellPosLeft===0 && r.sellFrozenLeft===0, `卖条件单触发后股份冻结应清零（旧 bug 剩 100）: ${JSON.stringify([r.sellPosLeft,r.sellFrozenLeft])}`);
  assertNear(r.frozenCash, 0, 1e-6, "触发后现金冻结应为0");
  assert(r.audit.length===0 && r.ghosts.length===0, "冻结/幽灵审计: "+JSON.stringify([r.audit,r.ghosts]));
  assertNear(r.eq1-r.eq0, r.rz1-r.rz0, 0.5, `条件单往返后权益一致性 Δeq==Δrealized: Δeq=${(r.eq1-r.eq0).toFixed(2)} Δrz=${(r.rz1-r.rz0).toFixed(2)}`);
  return `买预留 ${r.buyReserveFrozen.toFixed(2)}→0; 卖冻结 100→${r.sellFrozenLeft}; Δeq=${(r.eq1-r.eq0).toFixed(2)}`;
}

async function t07_margin_modal_and_negative_cash(){
  const page=STATE.page;
  const r1 = await page.evaluate(()=>{
    openMarginCall("margin");
    return {on:MD.el.classList.contains("on"), mcModal:CLK.mcModal, running:CLK.running, mc:MD.mc}; });
  assert(r1.on && r1.mcModal && !r1.running, "追保弹窗应暂停时钟");
  await page.click("#mdClose");
  const r2 = await page.evaluate(()=>({mcModal:CLK.mcModal, running:CLK.running, mc:MD.mc}));
  assert(r2.mcModal===false && r2.running===true, `按×后时钟必须恢复（旧 bug mcModal 卡死）: ${JSON.stringify(r2)}`);
  const r3 = await page.evaluate(()=>{ openMarginCall("margin"); return {mcModal:CLK.mcModal, running:CLK.running}; });
  assert(r3.mcModal===true && !r3.running, "重新打开追保弹窗");
  await page.keyboard.press("Escape");
  const r4 = await page.evaluate(()=>({mcModal:CLK.mcModal, running:CLK.running, on:MD.el.classList.contains("on")}));
  assert(r4.mcModal===false && r4.running===true, "Esc 关闭追保弹窗后时钟恢复");
  const r5 = await page.evaluate(()=>{
    const c=ACC.cash; ACC.cash=-5000;
    sanitizeLedger();
    const kept=ACC.cash; ACC.cash=c; return {kept}; });
  assert(r5.kept===-5000, `负现金(穿仓负债)不得被清洗归零: 实际 ${r5.kept}`);
  return "×/Esc 均恢复时钟; 负现金 -5000 保留";
}

async function t08_fx_resting_recheck(){
  const r = await STATE.page.evaluate(()=>{
    window.__H.ensureCont();
    resetAccount();                                        // 隔离基线
    const eq0=equity(), rz0=ACC.realized;
    const s=MK.byCode["EURUSD"];
    const o=submitOrder({code:"EURUSD", side:1, kind:"lim", qty:1000, price:pxr(s, s.askPx-3*s.step)});
    if(!o) return {err:"限价被拒", openAt:isOpenAt(s,CLK.sec)};
    const unfilledAtSubmit=o.filled===0;
    s.last=s.last*0.997; s.fair=Math.log(s.last);           // 驱动报价下移越过限价
    let g=0; while(o.filled<1000 && g<300){ advanceTick(); g++; }
    const cleanup=submitOrder({code:"EURUSD", side:-1, kind:"mkt", qty:o.filled});
    const p=ACC.pos["EURUSD"];
    return {unfilledAtSubmit, filled:o.filled, status:o.status, ticks:g,
      eq1:equity(), rz1:ACC.realized, cleanupFilled:cleanup&&cleanup.filled, eq0, rz0,
      dbg:{last:s.last,bid:s.bidPx,ask:s.askPx,fair:s.fair,mid:s.mid,tvu:s.tickVolUnit,
        cash:ACC.cash, frozen:ACC.frozenCash, pos:p?{qty:p.qty,cost:p.cost,buyAmt:p.buyAmt,avail:p.avail}:null,
        tr0:ACC.trades[0], tr1:ACC.trades[1]}};
  });
  assert(!r.err, r.err+" open="+r.openAt);
  assert(r.unfilledAtSubmit, "刚挂出应待成未成交");
  assert(r.filled===1000, `报价更新后挂单重查必须成交（旧 bug 限价单永不被动成交）: filled=${r.filled}, ticks=${r.ticks}`);
  assert(r.cleanupFilled===1000, "清理平仓成交");
  assertNear(r.eq1-r.eq0, r.rz1-r.rz0, 0.5, `fx 挂单往返权益一致性 Δeq==Δrealized: ${(r.eq1-r.eq0).toFixed(2)} vs ${(r.rz1-r.rz0).toFixed(2)} diag=${JSON.stringify(r.dbg)} eq0=${r.eq0} rz0=${r.rz0}`);
  return `${r.ticks} tick 内重查成交 1000; Δeq=${(r.eq1-r.eq0).toFixed(2)}`;
}

async function t09_flatten_short(){
  const r = await STATE.page.evaluate(()=>{
    window.__H.ensureCont();
    resetAccount();                                        // 隔离基线
    const eq0=equity(), rz0=ACC.realized;
    const so=submitOrder({code:"GBPUSD", side:-1, kind:"short", qty:1000});
    if(!so || so.filled!==1000) return {err:"开空失败"};
    selectSymbol("GBPUSD");
    flattenCurrent();
    const sp=ACC.short["GBPUSD"], p=ACC.pos["GBPUSD"];
    return {eq0, rz0, shortGone:!sp||sp.qty<=0, noNewLong:!p||p.qty<=0,
      eq1:equity(), rz1:ACC.realized,
      resting:ACC.orders.filter(o=>o.status==="待成").length, audit:window.__H.freezeAudit(),
      shortCash:ACC.shortCash};
  });
  assert(!r.err, r.err);
  assert(r.shortGone, "空头一键平仓应买回空头");
  assert(r.noNewLong, `不得新开多头（旧 bug kind:"mkt"+cover 标记被忽略）: pos=${JSON.stringify(r)}`);
  assert(r.resting===0, "cover IOC 剩余应撤销，不留待成");
  assert(r.audit.length===0, "冻结审计");
  assertNear(r.shortCash, 0, 0.01, "平仓后融券担保池应清空");
  assertNear(r.eq1-r.eq0, r.rz1-r.rz0, 0.5, `空头往返权益一致性 Δeq==Δrealized: ${(r.eq1-r.eq0).toFixed(2)} vs ${(r.rz1-r.rz0).toFixed(2)}`);
  return "flatten → shortGone, noNewLong, shortCash=0, Δeq="+(r.eq1-r.eq0).toFixed(2);
}

async function t10_battle(){
  const page=STATE.page;
  const r = await page.evaluate(()=>{
    window.__H.ensureCont();
    startBattle("panic-2020");
    return {confirmOpen: MD.el.classList.contains("on") && document.getElementById("mdTitle").textContent==="开始经典战役"};
  });
  assert(r.confirmOpen, "startBattle 应弹出确认框且不被立即关闭");
  await page.evaluate(()=>{ const b=[...document.querySelectorAll("#mdFoot .btn")]; b[b.length-1].click(); });
  const r2 = await page.evaluate(()=>({ id:SB.id, cash:ACC.cash, fired0:!!SB.fired[0] }));
  assert(r2.id==="panic-2020" && r2.cash===1000000 && r2.fired0, "确认后进入战役并重置账户+触发第1日事件");
  const r3 = await page.evaluate(()=>{
    const scn=scenarioOf("panic-2020");
    scenarioDay(SB.startDi+scn.days-1);                     // 最后一个事件日"刚开始"
    const midDone=SB.done, midModal=MD.el.classList.contains("on");
    const lastEvt=!!SB.fired[scn.script.length-1];
    scenarioDay(SB.startDi+scn.days);                       // 事件日全部过完
    const endDone=SB.done, endModal=MD.el.classList.contains("on") && document.getElementById("mdTitle").textContent==="战役回放结束";
    return {midDone, midModal, lastEvt, endDone, endModal};
  });
  assert(r3.midDone===false && r3.midModal===false, `最后一天刚开始不应宣布结束（旧 bug）: ${JSON.stringify(r3)}`);
  assert(r3.lastEvt, "最后事件日应已投放剧本事件");
  assert(r3.endDone===true && r3.endModal, "走完全部事件日后才弹出结束卡");
  await page.evaluate(()=>{ const b=[...document.querySelectorAll("#mdFoot .btn")]; b[1].click(); });   // 本局结算
  const r4 = await page.evaluate(()=>({on:MD.el.classList.contains("on"), title:document.getElementById("mdTitle").textContent}));
  assert(r4.on && r4.title==="本局退休结算", `结算二级确认框不应被外层 closeModal 吞掉: ${JSON.stringify(r4)}`);
  await page.evaluate(()=>{ const b=[...document.querySelectorAll("#mdFoot .btn")]; b[0].click(); closeModal(); });
  const r5 = await page.evaluate(()=>{
    // 战役进行中重开：外层弹窗的按钮回调里再开确认框，必须存活
    openBattlePicker();
    const b=[...document.querySelectorAll("#mdFoot .btn")];  // 关闭/重新开始/退出战役
    b[1].click();                                             // 重新开始 → confirmBox
    return {on:MD.el.classList.contains("on"), title:document.getElementById("mdTitle").textContent};
  });
  assert(r5.on && r5.title==="开始经典战役", `「重新开始」确认框应存活（旧 bug 被外层关闭）: ${JSON.stringify(r5)}`);
  await page.evaluate(()=>{ const b=[...document.querySelectorAll("#mdFoot .btn")]; b[0].click(); });
  const r6 = await page.evaluate(()=>{ exitBattle(); return {id:SB.id}; });
  assert(r6.id===null, "退出战役后 SB.id 清空");
  return "确认框存活; 终态推迟至全部事件日过完; 重开确认框存活";
}

async function t11_corp_action(){
  const r = await STATE.page.evaluate(()=>{
    window.__H.ensureCont();
    resetAccount();                                        // 隔离基线
    const s=MK.byCode["601009"];
    const b=submitOrder({code:"601009", side:1, kind:"mkt", qty:100});
    if(!b||b.filled!==100) return {err:"建仓失败 "+s.stName};
    const eq0=equity();
    applyCorpAction(s, 0.5, 1, makeRng(12345));             // 每股派0.5 + 每10送1
    const p=pos("601009");
    const eq1=equity();
    return {qty:p?p.qty:null, eq0, eq1, prev:s.prevClose, last:s.last};
  });
  assert(!r.err, r.err);
  assert(r.qty===110, `100股每10送1应变110股（旧 bug 抹回100股致≈91元蒸发）: ${r.qty}`);
  assertNear(r.eq1, r.eq0, 1.0, "除权除息不毁灭价值（整股入账+零头折现）");
  return `qty=110, eq ${r.eq0.toFixed(2)}→${r.eq1.toFixed(2)}`;
}

async function t12_open_auction(){
  const page=await openGame({fresh:true});
  const r = await page.evaluate(()=>{
    const s=MK.byCode["601009"];
    const st0=s._daySt;
    let g=0; while(CLK.sec<9*3600+25*60 && g<30){ advanceTick(); g++; }
    const at925={sec:CLK.sec, st1:s._daySt, open:s.open, last:s.last};
    let h=0; while(CLK.min<571 && h<80){ advanceTick(); h++; }
    return {st0, at925, contMin:CLK.min};
  });
  assert(r.at925.st1===1, `9:25 开盘竞价定价应执行（旧 bug 分支不可达, _daySt=${r.at925.st1}）`);
  assert(r.at925.open>0 && Math.abs(r.at925.last-r.at925.open)<1e-9, `定价后 open=last=竞价价: ${JSON.stringify(r.at925)}`);
  assert(r.contMin>=571, "继续推进到 9:31 连续竞价");
  await page.close();
  return `_daySt ${r.st0}→1 @sec=${r.at925.sec}, open=${r.at925.open.toFixed(2)}`;
}

async function t13_import_validation(){
  const page=STATE.page;
  const r = await page.evaluate(async()=>{
    const calls=[]; const origPut=Store.put;
    Store.put=(k,v)=>{ calls.push(k); return Promise.resolve(true); };
    const bad1=await importAll({app:"NOPE"});
    const bad2=await importAll({app:"SIMDESK"});
    const bad3=await importAll({app:"SIMDESK", clock:{ver:1, di:5, days:[]}, acct:{cash:"x"}, series:{}});
    const bad4=await importAll({app:"SIMDESK", clock:{ver:2, di:5, days:new Array(300).fill("2026-01-05")}, acct:{cash:NaN}, series:{}});
    const mid=calls.length;
    Store.put=origPut;
    return {bad1,bad2,bad3,bad4,mid,calls};
  });
  assert(r.bad1===false && r.bad2===false && r.bad3===false && r.bad4===false,
    "非 SIMDESK / 空壳 / ver:1 / 现金非数 都必须先校验再拒: "+JSON.stringify(r));
  assert(r.mid===0, `非法导入不得写入任何缓存键（旧 bug 只查 app 名就逐键覆盖）: ${JSON.stringify(r.calls)}`);
  // 合法结构：全部键成套写入（临时吞掉 800ms 重载定时器，保持共享页测试连续）
  const r2 = await page.evaluate(async()=>{
    const calls=[]; const origPut=Store.put; const origST=window.setTimeout;
    Store.put=(k)=>{ calls.push(k); return Promise.resolve(true); };
    window.setTimeout=(f,d,...a)=> (d===800 ? 0 : origST(f,d,...a));
    let good;
    try{ good=await importAll({app:"SIMDESK", ver:1, clock:Store.clockSnap(), acct:Store.acctSnap(),
      series:Store.seriesSnap(), journal:Store.journalSnap(), settings:UI.settings(), watch:UI.watch}); }
    finally{ Store.put=origPut; window.setTimeout=origST; }
    return {good, calls};
  });
  assert(r2.good===true && r2.calls.length>=5, "合法存档应成套原子写入全部键: "+JSON.stringify(r2.calls));
  return `拒绝4类非法输入(0写入); 合法导入写 ${r2.calls.length} 键`;
}

async function t13b_import_reload_roundtrip(){
  const page=await openGame({fresh:true});
  await page.evaluate(()=>{ window.__H.ensureCont(); });
  await page.evaluate(()=>{ window.__SNAP=window.__SNAP||null; });
  const before = await page.evaluate(()=>{
    const b=submitOrder({code:"510300", side:1, kind:"mkt", qty:100});
    window.__SNAP={app:"SIMDESK", ver:1, clock:Store.clockSnap(), acct:Store.acctSnap(),
      series:Store.seriesSnap(), journal:Store.journalSnap(), settings:UI.settings(), watch:UI.watch};
    resetAccount();
    const a=submitOrder({code:"AU", side:1, kind:"mkt", qty:1});
    // 屏蔽后续一切自动落盘：beforeunload/防抖 flush 都会用"重置后的 AU 态"覆盖待导入快照
    Store.flush=()=>Promise.resolve(false);
    return {bought:b.filled, au:a?a.filled:null};
  });
  assert(before.bought===100 && before.au===1, "预置交易应成交: "+JSON.stringify(before));
  await page.evaluate(()=>{ window.__PRE_RELOAD=true; importAll(window.__SNAP); });
  await new Promise(r=>setTimeout(r,1600));                 // 等 importAll 的 reload
  await installWithRetry(page);                             // 重载后重装工具（若从未触发重载也安全）
  const after=await page.evaluate(()=>({ pos:ACC.pos["510300"]?ACC.pos["510300"].qty:0,
    au:ACC.pos["AU"]?ACC.pos["AU"].qty:0, flagged:!!window.__PRE_RELOAD, di:CLK.di }));
  assert(!after.flagged, "导入后应已重载（旧 window 标记消失）");
  assert(after.pos===100, `导入应恢复 510300×100: ${JSON.stringify(after)}`);
  assert(after.au===0, "导入后不应残留重置后的 AU");
  await page.close();
  return `重载回滚: 510300=${after.pos}, AU=${after.au}`;
}

async function t14_game_host(){
  const page=STATE.page;
  const r = await page.evaluate(()=>{
    window.__H.stop();
    CLK.running=true;                                      // 从运行态开始验证宿主暂停/恢复
    const cash0=ACC.cash;
    const a=GAME_HOST.setTheme("light");
    const light=document.documentElement.getAttribute("data-theme");
    const pref=localStorage.getItem("simdesk:themePref");
    const b=GAME_HOST.setTheme("dark");
    const dark=document.documentElement.getAttribute("data-theme");
    const c=GAME_HOST.setTheme("bogus").ok;
    GAME_HOST.setTheme("auto");
    const wasRunning=CLK.running;
    GAME_HOST.pause(); const paused=!CLK.running;
    const rs=GAME_HOST.resume(); const resumed=rs.running && CLK.running===wasRunning;
    return {a:a.ok, light, pref, dark, badRejected:c===false, paused, resumed, cashKept:ACC.cash===cash0};
  });
  assert(r.light==="light" && r.dark==="dark", "GAME_HOST.setTheme 应切换 data-theme");
  assert(r.pref==="light", "主题偏好必须写入 simdesk:themePref");
  assert(r.badRejected, "非法 mode 应拒绝");
  assert(r.paused && r.resumed, "pause/resume 应复用 CLK 暂停语义");
  assert(r.cashKept, "宿主接口不得重置账户");
  return "setTheme/pause/resume OK; 偏好键=light; 账户未重置";
}

async function t15_golden(){
  const page=await openGame({fresh:true});
  await page.evaluate(()=>{ coachClose(); CLK.running=false; });
  const g = await page.evaluate(()=>{
    const log={}; const chk=(c,m)=>{ if(!c) throw new Error("页内断言: "+m); };
    let g=0; while(CLK.min<571 && g<200){ advanceTick(); g++; }              // 有界推进至 09:31
    log.reached={min:CLK.min, di:CLK.di};
    const b=submitOrder({code:"510300", side:1, kind:"mkt", qty:100});       // 买入1手
    log.buy=b?{filled:b.filled, status:b.status}:null;
    chk(b && b.filled===100, "买入1手成交");
    let guard=0; while(CLK.di===log.reached.di && guard<20000){ advanceTick(); guard++; }   // 次日
    guard=0; while(CLK.min<571 && guard<2000){ advanceTick(); guard++; }
    const p=pos("510300");
    log.avail=p.avail;
    const s2=submitOrder({code:"510300", side:-1, kind:"mkt", qty:100});     // 次日卖出
    log.sell=s2?{filled:s2.filled, status:s2.status}:null;
    chk(s2 && s2.filled===100, "次日卖出成交");
    chk(Math.abs(ACC.frozenCash)<1e-6, "空仓冻结应为0: "+ACC.frozenCash);
    log.frozen=ACC.frozenCash;
    log.eqDelta=equity()-ACC.initCash; log.realized=ACC.realized;
    chk(Math.abs((equity()-ACC.initCash)-ACC.realized)<0.5,
      "equity-initCash≈realized: Δ"+(equity()-ACC.initCash).toFixed(3)+" vs "+ACC.realized.toFixed(3));
    // 借还5万：借款不增加权益但改善担保比例口径保留
    const e1=equity(), m1=maintainRatio();
    chk(borrowCash(50000)===true, "借款成功");
    chk(Math.abs(equity()-e1)<0.01, "借款不增加权益");
    chk(maintainRatio()>=m1, "借款不恶化担保比例（设计取舍保留）");
    chk(repayCash(50000)===true, "还款成功");
    chk(ACC.cashLoan===0, "还款后负债清零");
    // 进出疫情战役
    startBattle("panic-2020");
    const btns=[...document.querySelectorAll("#mdFoot .btn")]; btns[btns.length-1].click();
    chk(SB.id==="panic-2020", "战役进入");
    let gd=0; while(gd<3000 && SB.done===false){ advanceTick(); gd++; }                      // 推进几天
    exitBattle(); chk(SB.id===null, "战役退出");
    // 主题切换（宿主接口 + 游戏内 cycleTheme）
    GAME_HOST.setTheme("light"); const t1=document.documentElement.getAttribute("data-theme");
    GAME_HOST.setTheme("dark");  const t2=document.documentElement.getAttribute("data-theme");
    document.getElementById("btnTheme").click();
    const t3=document.documentElement.getAttribute("data-theme");
    chk(t1==="light" && t2==="dark" && (t3==="light"||t3==="dark"), "主题切换生效");
    log.audit=window.__H.freezeAudit();
    log.errBanner=document.body.innerText.includes("运行时错误");
    return log;
  });
  assert(g.audit.length===0, "冻结审计: "+JSON.stringify(g.audit));
  assert(!g.errBanner, "页面内不得出现运行时错误横幅");
  const errs=page.__errors;
  assert(errs.length===0, "无未捕获脚本错误: "+errs.slice(0,3).join(" | "));
  await page.close();
  return `买/卖=${g.buy&&g.buy.filled}/${g.sell&&g.sell.filled}, Δeq=${g.eqDelta.toFixed(2)}, realized=${g.realized.toFixed(2)}`;
}

async function t16_no_page_errors(){
  const errs = STATE.page.__errors;
  assert(errs.length===0, "共享页全程无脚本错误: "+errs.slice(0,4).join(" | "));
  return `errors=${errs.length}`;
}

/* ================================ main ================================ */
const STATE={};
(async()=>{
  if(!fs.existsSync(CHROME)){ console.error("未找到 Chrome: "+CHROME); process.exit(2); }
  server=await serve();
  browser=await puppeteer.launch({executablePath:CHROME, headless:true,
    args:["--no-sandbox","--disable-dev-shm-usage","--autoplay-policy=no-user-gesture-required","--window-size=1440,900"]});
  const t0=Date.now();
  let fatal=null;
  try{
    await run("P1-1 快照续档: cashLoan/loanRate + ver:2 + 日期不倒退", t01_snapshotReload);    await run("P2  09:25 开盘竞价定价分支可达", t12_open_auction);

    STATE.page = await openGame({fresh:true});
    await run("P1-2 挂单数量语义/状态一致/撤单释放冻结", t02_resting_fill_semantics);
    await run("P1-3 超卖拒绝 + T+0 成交即时可用", t03_oversell_and_t0);
    await run("P1-4 AU 乘数口径: 估值/成本/权益(999875)", t04_au_multiplier);
    await run("P1-5 日切撤销不翻倍/GTC重挂/重置清挂单", t05_day_rollover_gtc_reset);
    await run("P1-6 条件单按钮 kind + 预留原子释放", t06_stop_order);
    await run("P1-7 追保弹窗生命周期 + 负现金保留", t07_margin_modal_and_negative_cash);
    await run("P2  外汇限价单报价重查成交", t08_fx_resting_recheck);
    await run("P2  空头一键平仓 kind=cover 不开新多", t09_flatten_short);
    await run("P2  战役确认框存活 + 终态时机 + 重开", t10_battle);
    await run("P2  送股保留零股/折现不灭值", t11_corp_action);
    await run("P2  导入结构/版本校验, 非法零写入", t13_import_validation);
    await run("宿主接口 GAME_HOST setTheme/pause/resume", t14_game_host);
    await run("共享页无未捕获脚本错误", t16_no_page_errors);

    await run("P2  导入合法存档重载回滚账户", t13b_import_reload_roundtrip);
    await run("Golden-path 端到端", t15_golden);
  } catch(e){
    fatal=e; console.error("测试批次异常:", e && e.stack || e);
  } finally {
    const pass=results.filter(r=>r.ok).length, total=results.length;
    console.log(`\n==== ${pass}/${total} 通过 (${((Date.now()-t0)/1000).toFixed(1)}s) ====`);
    for(const r of results) if(!r.ok) console.log("  FAILED: "+r.name+" — "+r.detail);
    try{ await browser.close(); }catch(e){}
    try{ server.close(); }catch(e){}
    process.exit((!fatal && pass===total && total>0)?0:1);
  }
})().catch(e=>{ console.error("运行器异常", e); try{browser&&browser.close();}catch(_){} process.exit(3); });
