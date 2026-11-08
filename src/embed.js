/* 游戏嵌入页外壳：站点导航 + iframe 游戏 + 主题同步 + 放大
   游戏本体仍是独立文件，外壳只做站点统一的那一层。 */
'use strict';

const CATALOG = require('./game-catalog');

const UI = {
  'zh-CN': { eyebrow: '游戏室', back: '返回游戏室', fullscreen: '放大', exitFullscreen: '退出放大', loading: '正在装载游戏…', rules: '操作', notice: '说明', tip: '若游戏没有响应，请刷新页面；进度与纪录保存在本机浏览器。', frame: '%s 游戏画面' },
  'zh-TW': { eyebrow: '遊戲室', back: '返回遊戲室', fullscreen: '放大', exitFullscreen: '退出放大', loading: '正在載入遊戲…', rules: '操作', notice: '說明', tip: '若遊戲沒有回應，請重新整理頁面；進度與紀錄保存在本機瀏覽器。', frame: '%s 遊戲畫面' },
  en: { eyebrow: 'Play room', back: 'Back to play room', fullscreen: 'Fullscreen', exitFullscreen: 'Exit fullscreen', loading: 'Loading the game…', rules: 'Controls', notice: 'Note', tip: 'If the game stops responding, reload the page. Progress and records stay in this browser.', frame: '%s game screen' },
  ja: { eyebrow: 'ゲーム室', back: 'ゲーム室へ戻る', fullscreen: '拡大', exitFullscreen: '拡大を終了', loading: 'ゲームを読み込み中…', rules: '操作', notice: '補足', tip: 'ゲームが反応しない場合は再読み込みしてください。進捗と記録はこのブラウザに保存されます。', frame: '%s のゲーム画面' }
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
      loading: UI[l].loading, rules: UI[l].rules, notice: UI[l].notice, tip: UI[l].tip,
      frame_label: UI[l].frame,
      game_name: game.name[l], game_tag: game.desc[l], game_how: game.how[l]
    }])),
    styles: `
      .embed-head { padding: 40px 0 18px; display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 16px; }
      .embed-head h1 { font-size: clamp(1.7rem, 3.6vw, 2.4rem); letter-spacing: -.035em; }
      .embed-head p { color: var(--muted); margin-top: 8px; max-width: 62ch; }
      .embed-actions { display: flex; gap: 8px; flex-wrap: wrap; }
      .embed-frame { position: relative; border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface-2); box-shadow: var(--shadow-1); overflow: hidden; }
      .embed-frame iframe { display: block; width: 100%; height: min(80vh, 860px); border: 0; background: var(--surface); }
      .embed-frame.is-full { position: fixed; inset: 0; z-index: 200; border-radius: 0; border: 0; }
      .embed-frame.is-full iframe { height: 100dvh; }
      .embed-loading { position: absolute; inset: 0; display: grid; place-items: center; color: var(--muted); background: var(--surface-2); font-size: .92rem; }
      .embed-foot { display: flex; flex-wrap: wrap; gap: 10px 22px; align-items: baseline; color: var(--muted); font-size: .86rem; padding: 16px 2px 56px; }
      .embed-foot strong { color: var(--text); font-weight: 650; }
      body.embed-full { overflow: hidden; }
      @media (max-width: 620px) {
          .embed-head { padding-top: 26px; }
          .embed-frame iframe { height: calc(100dvh - 320px); min-height: 380px; }
      }
    `,
    body: `        <div class="container">
            <div class="embed-head">
                <div>
                    <span class="eyebrow" data-i18n="eyebrow">游戏室</span>
                    <h1 data-i18n="game_name">${game.name['zh-CN']}</h1>
                    <p data-i18n="game_tag">${game.desc['zh-CN']}</p>
                </div>
                <div class="embed-actions">
                    <a class="btn btn-ghost btn-sm" href="games.html"><span data-i18n="back">返回游戏室</span></a>
                    <button type="button" class="btn btn-ghost btn-sm" id="embedFull" aria-pressed="false"><span data-i18n="fullscreen">放大</span></button>
                </div>
            </div>
            <div class="embed-frame" id="embedFrame">
                <div class="embed-loading" id="embedLoading" data-i18n="loading">正在装载游戏…</div>
                <iframe id="embedGame" src="assets/games/${game.id}.html" title="${game.name['zh-CN']}" referrerpolicy="no-referrer"></iframe>
            </div>
            <div class="embed-foot">
                <span><strong data-i18n="rules">操作</strong> · <span data-i18n="game_how">${game.how['zh-CN']}</span></span>
                <span><strong data-i18n="notice">说明</strong> · <span data-i18n="tip"></span></span>
            </div>
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
