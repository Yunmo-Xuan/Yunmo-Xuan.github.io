/* 游戏嵌入页外壳：站点导航 + iframe 游戏 + 主题同步 + 放大
   标题栏、样式和「放大」行为在 game-shell.js 与 core.js 里，和站内原生游戏共用；
   这里只留 iframe 特有的部分：装载态、深浅色同步和标题。 */
'use strict';

const CATALOG = require('./game-catalog');
const SHELL = require('./game-shell');

const FRAME_LABEL = {
  'zh-CN': '%s 游戏画面', 'zh-TW': '%s 遊戲畫面',
  en: '%s game screen', ja: '%s のゲーム画面'
};

const BRAND = { 'zh-CN': '云陌轩', 'zh-TW': '雲陌軒', en: 'Yunmo-Xuan', ja: '雲陌軒' };

module.exports = function embed(id) {
  const game = CATALOG.find(g => g.id === id);
  if (!game) throw new Error('game-catalog 里没有这款游戏：' + id);
  const langs = Object.keys(FRAME_LABEL);
  return {
    file: game.page, path: '/' + game.page, active: 'games', ogType: 'website',
    title: Object.fromEntries(langs.map(l => [l, game.name[l] + ' · ' + BRAND[l]])),
    desc: Object.fromEntries(langs.map(l => [l, game.desc[l]])),
    i18n: Object.fromEntries(langs.map(l => [l, Object.assign(SHELL.strings(l), {
      meta_description: game.desc[l],
      frame_label: FRAME_LABEL[l],
      game_name: game.name[l], game_tag: game.desc[l], game_how: game.how[l]
    })])),
    bodyClass: 'embed-app',
    styles: SHELL.styles,
    body: SHELL.bar(game) + `        <div class="embed-frame" id="embedFrame">
            <div class="embed-loading" id="embedLoading" data-i18n="loading">正在装载游戏…</div>
            <iframe id="embedGame" data-game="${game.id}" src="assets/games/${game.id}.html" title="${game.name['zh-CN']}" referrerpolicy="no-referrer"></iframe>
        </div>
`,
    render: function render(ctx) {
        var frameEl = document.getElementById('embedGame');
        var loading = document.getElementById('embedLoading');
        frameEl.title = ctx.t('frame_label').replace('%s', ctx.t('game_name'));

        /* 打开这款游戏就记一笔，游戏室据此提示"再来一局"。
           id 只能从 DOM 上取：render 会被序列化成字符串内联，闭包变量在页面里根本不存在。 */
        try { localStorage.setItem('lastPlayedGame', frameEl.dataset.game); } catch (e) {}

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

        /* 监听器只注册一次：切语言会重跑 render，重复绑定会把主题同步挂上两遍 */
        if (!window.EMBED_BOUND) {
            window.EMBED_BOUND = true;
            frameEl.addEventListener('load', opened);
            window.addEventListener('message', function (event) {
                var data = event.data;
                if (data && data.type === 'yunmo-theme-request') syncTheme();
            });
            new MutationObserver(syncTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        }
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
