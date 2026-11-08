/* 游戏嵌入页外壳：站点导航 + iframe 游戏 + 主题同步 + 放大
   游戏本体仍是独立文件，外壳只做站点统一的那一层。 */
'use strict';

const CATALOG = require('./game-catalog');

const UI = {
  'zh-CN': { eyebrow: '游戏室', back: '返回游戏室', fullscreen: '放大', exitFullscreen: '退出放大', loading: '正在装载游戏…', rules: '操作', notice: '说明', notes: '玩法与说明', tip: '若游戏没有响应，请刷新页面；进度与纪录保存在本机浏览器。', frame: '%s 游戏画面' },
  'zh-TW': { eyebrow: '遊戲室', back: '返回遊戲室', fullscreen: '放大', exitFullscreen: '退出放大', loading: '正在載入遊戲…', rules: '操作', notice: '說明', notes: '玩法與說明', tip: '若遊戲沒有回應，請重新整理頁面；進度與紀錄保存在本機瀏覽器。', frame: '%s 遊戲畫面' },
  en: { eyebrow: 'Play room', back: 'Back to play room', fullscreen: 'Fullscreen', exitFullscreen: 'Exit fullscreen', loading: 'Loading the game…', rules: 'Controls', notice: 'Note', notes: 'How to play', tip: 'If the game stops responding, reload the page. Progress and records stay in this browser.', frame: '%s game screen' },
  ja: { eyebrow: 'ゲーム室', back: 'ゲーム室へ戻る', fullscreen: '拡大', exitFullscreen: '拡大を終了', loading: 'ゲームを読み込み中…', rules: '操作', notice: '補足', notes: '遊び方と補足', tip: 'ゲームが反応しない場合は再読み込みしてください。進捗と記録はこのブラウザに保存されます。', frame: '%s のゲーム画面' }
};

const BRAND = { 'zh-CN': '云陌轩', 'zh-TW': '雲陌軒', en: 'Yunmo-Xuan', ja: '雲陌軒' };

module.exports = function embed(id) {
  const game = CATALOG.find(g => g.id === id);
  if (!game) throw new Error('game-catalog 里没有这款游戏：' + id);
  const langs = Object.keys(UI);
  return {
    file: game.page, path: '/' + game.page, active: 'games', ogType: 'website',
    title: Object.fromEntries(langs.map(l => [l, game.name[l] + ' · ' + BRAND[l]])),
    desc: Object.fromEntries(langs.map(l => [l, game.desc[l]])),
    i18n: Object.fromEntries(langs.map(l => [l, {
      meta_description: game.desc[l], eyebrow: UI[l].eyebrow, back: UI[l].back,
      fullscreen: UI[l].fullscreen, exitFullscreen: UI[l].exitFullscreen,
      loading: UI[l].loading, rules: UI[l].rules, notice: UI[l].notice, notes: UI[l].notes, tip: UI[l].tip,
      frame_label: UI[l].frame,
      game_name: game.name[l], game_tag: game.desc[l], game_how: game.how[l]
    }])),
    /* 游戏是整屏应用：站点只留一条标题栏，剩下的空间全部给游戏本体。
       以前是「正文 + 固定高 iframe」，于是页面自己滚、iframe 里再滚一层，
       棋盘被压到两三百像素，控件全在屏外。 */
    bodyClass: 'embed-app',
    styles: `
      .embed-app { display: flex; flex-direction: column; min-height: 100dvh; }
      .embed-app .site-header { flex: none; }
      .embed-app .site-footer { display: none; }
      .embed-app main { display: flex; flex-direction: column; flex: 1 1 auto; min-height: 0; }
      .embed-bar { position: relative; flex: none; display: flex; flex-wrap: wrap; align-items: center;
          justify-content: space-between; gap: 10px 16px; padding-block: 10px 11px;
          background: var(--bg); border-bottom: 1px solid var(--line); }
      .embed-id { display: flex; align-items: baseline; gap: 10px; min-width: 0; }
      .embed-id .eyebrow { white-space: nowrap; }
      .embed-id h1 { font-size: clamp(1.05rem, 2.4vw, 1.35rem); letter-spacing: -.03em; margin: 0; }
      .embed-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
      .embed-notes { position: relative; }
      .embed-notes > summary { list-style: none; cursor: pointer; font-size: .84rem; font-weight: 600;
          color: var(--muted); padding: 7px 12px; border: 1px solid var(--line); border-radius: var(--radius-pill);
          background: var(--surface); }
      .embed-notes > summary::-webkit-details-marker { display: none; }
      .embed-notes > summary:hover { color: var(--text); border-color: var(--line-strong); }
      .embed-notes-body { position: absolute; right: 0; top: calc(100% + 8px); z-index: 70;
          width: min(420px, calc(100vw - 32px)); max-height: 56dvh; overflow: auto;
          padding: 14px 16px; border: 1px solid var(--line); border-radius: var(--radius);
          background: var(--surface); box-shadow: var(--shadow-2); font-size: .88rem; color: var(--muted); }
      .embed-notes-body p { margin: 0 0 8px; }
      .embed-notes-body p:last-child { margin-bottom: 0; }
      .embed-notes-body strong { color: var(--text); font-weight: 650; }
      .embed-frame { position: relative; flex: 1 1 0; min-height: 320px; background: var(--surface-2); }
      .embed-frame iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; background: var(--surface); }
      .embed-frame.is-full { position: fixed; inset: 0; z-index: 200; min-height: 0; }
      .embed-loading { position: absolute; inset: 0; display: grid; place-items: center; color: var(--muted);
          background: var(--surface-2); font-size: .92rem; z-index: 2; }
      body.embed-full { overflow: hidden; }
      /* 横屏手机只有 390px 高：压缩标题栏，游戏区保底 300px，
         再多一寸棋盘就多一寸可点，外层最多多出几像素的滚动，可以接受。 */
      @media (max-height: 560px) {
          .embed-bar { padding-block: 4px 5px; }
          .embed-frame { min-height: 300px; }
      }
      @media (max-width: 620px) {
          .embed-bar { padding-block: 8px 9px; }
          .embed-id .eyebrow { display: none; }
          /* 三个按钮挤一行会把标题顶出屏幕，返回只留箭头（名称走 aria-label） */
          .embed-back span { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
          .embed-back { padding-inline: 9px; }
          .embed-frame { min-height: 340px; }
      }
    `,
    body: `        <div class="container embed-bar">
            <div class="embed-id">
                <span class="eyebrow" data-i18n="eyebrow">游戏室</span>
                <h1 data-i18n="game_name">${game.name['zh-CN']}</h1>
            </div>
            <div class="embed-actions">
                <details class="embed-notes" id="embedNotes">
                    <summary data-i18n="notes">玩法与说明</summary>
                    <div class="embed-notes-body">
                        <p><strong data-i18n="rules">操作</strong> · <span data-i18n="game_how">${game.how['zh-CN']}</span></p>
                        <p><strong data-i18n="notice">说明</strong> · <span data-i18n="game_tag">${game.desc['zh-CN']}</span></p>
                        <p data-i18n="tip"></p>
                    </div>
                </details>
                <a class="btn btn-ghost btn-sm embed-back" href="games.html" data-i18n-aria="back" aria-label="返回游戏室"><svg class="icon" aria-hidden="true"><use href="#i-arrow-left" /></svg><span data-i18n="back">返回游戏室</span></a>
                <button type="button" class="btn btn-ghost btn-sm" id="embedFull" aria-pressed="false"><span data-i18n="fullscreen">放大</span></button>
            </div>
        </div>
        <div class="embed-frame" id="embedFrame">
            <div class="embed-loading" id="embedLoading" data-i18n="loading">正在装载游戏…</div>
            <iframe id="embedGame" src="assets/games/${game.id}.html" title="${game.name['zh-CN']}" referrerpolicy="no-referrer"></iframe>
        </div>
`,
    render: function render(ctx) {
        var frame = document.getElementById('embedFrame');
        var frameEl = document.getElementById('embedGame');
        var loading = document.getElementById('embedLoading');
        var button = document.getElementById('embedFull');
        frameEl.title = ctx.t('frame_label').replace('%s', ctx.t('game_name'));

        /* 打开这款游戏就记一笔，游戏室据此提示"再来一局" */
        try { localStorage.setItem('lastPlayedGame', id); } catch (e) {}

        function syncTheme() {
            var theme = document.documentElement.getAttribute('data-theme') || 'light';
            try { frameEl.contentWindow.postMessage({ type: 'yunmo-theme', theme: theme }, '*'); } catch (e) {}
        }
        function opened() {
            loading.hidden = true;
            syncTheme();
        }
        function ready() {
            try { return frameEl.contentDocument && frameEl.contentDocument.readyState === 'complete'; } catch (e) { return false; }
        }

        /* 监听器只注册一次：切语言会重跑 render，重复绑定会让"放大"一开一关互相抵消 */
        if (!window.EMBED_BOUND) {
            window.EMBED_BOUND = true;
            frameEl.addEventListener('load', opened);
            window.addEventListener('message', function (event) {
                var data = event.data;
                if (!data || typeof data !== 'object') return;
                if (data.type === 'yunmo-theme-request') syncTheme();
                if (data.type === 'yunmo-exit-fullscreen' && frame.classList.contains('is-full')) toggle(false);
            });
            button.addEventListener('click', function () { toggle(!frame.classList.contains('is-full')); });
            document.addEventListener('keydown', function (event) {
                if (event.key === 'Escape' && frame.classList.contains('is-full')) toggle(false);
            });
            new MutationObserver(syncTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        }
        function toggle(on) {
            frame.classList.toggle('is-full', on);
            document.body.classList.toggle('embed-full', on);
            button.setAttribute('aria-pressed', String(on));
            button.querySelector('span').textContent = ctx.t(on ? 'exitFullscreen' : 'fullscreen');
            if (on) frameEl.focus();
        }
        toggle(frame.classList.contains('is-full'));   /* 语言切换后按钮文案跟着当前状态走 */
        if (ready()) opened();
        syncTheme();
    },
    jsonld: {
      '@context': 'https://schema.org', '@type': 'Game',
      name: game.name['zh-CN'], url: 'https://yunmo-xuan.github.io/' + game.page,
      inLanguage: langs, playMode: 'SinglePlayer',
      description: game.desc['zh-CN'],
      publisher: { '@type': 'Person', name: '云陌轩', url: 'https://yunmo-xuan.github.io/' }
    }
  };
};
