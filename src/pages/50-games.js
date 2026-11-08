/* 游戏室：六款游戏的入口页（列表、分类、续玩提示） */
'use strict';

const CATALOG = require('../game-catalog');

const UI = {
  'zh-CN': {
    eyebrow: '游戏室 / PLAY ROOM', title: '留一点时间，玩一局。',
    lead: '从两分钟的扫雷，到一盘认真的对弈。六款小作品，不用安装，点开就能玩。',
    local: '本机记录，不用注册', play: '开始游戏', minutes: '分钟一局', count: '%d 款游戏',
    all: '全部', puzzle: '数字与推理', casual: '轻松合成', strategy: '棋盘对弈', simulation: '策略模拟',
    recent: '上次玩过', resume: '再来一局', empty: '这个分类暂时没有游戏。',
    tip: '难度与规则都在游戏里；部分游戏的界面为简体中文。股市模拟只使用虚拟资金，不构成投资建议。'
  },
  'zh-TW': {
    eyebrow: '遊戲室 / PLAY ROOM', title: '留一點時間，玩一局。',
    lead: '從兩分鐘的掃雷，到一盤認真對弈。六款小作品，不用安裝，點開就能玩。',
    local: '本機紀錄，不用註冊', play: '開始遊戲', minutes: '分鐘一局', count: '%d 款遊戲',
    all: '全部', puzzle: '數字與推理', casual: '輕鬆合成', strategy: '棋盤對弈', simulation: '策略模擬',
    recent: '上次玩過', resume: '再來一局', empty: '這個分類暫時沒有遊戲。',
    tip: '難度與規則都在遊戲內；部分遊戲的介面為簡體中文。股市模擬只使用虛擬資金，不構成投資建議。'
  },
  en: {
    eyebrow: 'PLAY ROOM', title: 'A little time. One more round.',
    lead: 'A two-minute game of Minesweeper or a serious board match. Six small games — nothing to install, click and play.',
    local: 'Local records, no sign-up', play: 'Play now', minutes: 'min per round', count: '%d games',
    all: 'All', puzzle: 'Puzzles', casual: 'Casual', strategy: 'Board games', simulation: 'Simulation',
    recent: 'Last played', resume: 'Play again', empty: 'No games in this category yet.',
    tip: 'Difficulty and rules live inside each game; some game interfaces are Simplified Chinese only. The market simulator uses virtual funds and is not investment advice.'
  },
  ja: {
    eyebrow: 'ゲーム室 / PLAY ROOM', title: '少しの時間、もう一局。',
    lead: '2 分のマインスイーパーから本気の盤面勝負まで。インストール不要の 6 つの小さな作品を、クリックしたらすぐ遊べます。',
    local: '端末内記録、登録不要', play: 'プレイ', minutes: '分 / 1 回', count: '%d ゲーム',
    all: 'すべて', puzzle: '数字と推理', casual: '合成ゲーム', strategy: 'ボードゲーム', simulation: 'シミュレーション',
    recent: '前回のゲーム', resume: 'もう一度', empty: 'このカテゴリーにはまだゲームがありません。',
    tip: '難易度とルールはゲーム内にあります。一部のゲーム画面は簡体字中国語のみ。株式シミュレーターは仮想資金を用い、投資助言ではありません。'
  }
};

module.exports = {
  file: 'games.html', path: '/games.html', active: 'games', ogType: 'website',
  title: { 'zh-CN': '游戏室 · 云陌轩', 'zh-TW': '遊戲室 · 雲陌軒', en: 'Play room · Yunmo-Xuan', ja: 'ゲーム室 · 雲陌軒' },
  desc: Object.fromEntries(Object.keys(UI).map(l => [l, UI[l].lead])),
  i18n: Object.fromEntries(Object.keys(UI).map(l => [l, Object.assign({ meta_description: UI[l].lead }, UI[l]) ])),
  data: CATALOG,
  styles: `
    .play-head { padding: 58px 0 26px; }
    .play-head h1 { font-size: clamp(2.1rem, 5vw, 3.6rem); line-height: 1.12; letter-spacing: -.045em; max-width: 19ch; }
    .play-head .lead { max-width: 58ch; margin: 18px 0 0; color: var(--muted); }
    .play-meta { display: flex; gap: 18px; flex-wrap: wrap; margin-top: 16px; font-size: .82rem; color: var(--muted); }
    .play-meta span:first-child { color: var(--accent-ink); }
    .recent-game { margin: 18px 0 0; padding: 12px 16px; border: 1px solid var(--line); border-radius: var(--radius-sm); background: var(--surface); font-size: .88rem; color: var(--muted); display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
    .recent-game a { font-weight: 650; }
    .play-filter { display: flex; gap: 8px; flex-wrap: wrap; margin: 26px 0; }
    .play-filter button { padding: 8px 16px; border-radius: 99px; border: 1px solid var(--line-strong); background: var(--surface); color: var(--muted); font-size: .86rem; font-weight: 600; cursor: pointer; transition: color .18s ease, border-color .18s ease, background-color .18s ease; }
    .play-filter button:hover { border-color: var(--accent); color: var(--accent-ink); }
    .play-filter button[aria-pressed="true"] { background: var(--text); border-color: var(--text); color: var(--bg); }
    .play-grid { display: grid; gap: 22px; grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .game-card { position: relative; overflow: hidden; border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface); box-shadow: var(--shadow-1); color: inherit; text-decoration: none; display: flex; flex-direction: column; transition: transform .22s ease, box-shadow .28s ease, border-color .22s ease; }
    .game-card:hover { transform: translateY(-5px); box-shadow: var(--shadow-2); border-color: var(--line-strong); }
    .game-cover { height: 158px; display: grid; place-items: center; position: relative; border-bottom: 1px solid var(--line); background: linear-gradient(145deg, var(--accent-soft), var(--surface-2)); }
    .game-cover::before, .game-cover::after { content: ''; position: absolute; border: 1px solid var(--line-strong); border-radius: 50%; }
    .game-cover::before { width: 216px; height: 216px; }
    .game-cover::after { width: 150px; height: 150px; }
    .game-cover.violet { background: linear-gradient(135deg, rgba(123, 47, 252, .13), var(--surface-2)); }
    .game-cover.mint { background: linear-gradient(135deg, rgba(15, 138, 77, .13), var(--surface-2)); }
    .game-cover.amber { background: linear-gradient(135deg, rgba(200, 144, 40, .16), var(--surface-2)); }
    .game-mark { position: relative; z-index: 1; padding: 9px 20px; border: 1px solid var(--line); border-radius: 16px; background: var(--surface); box-shadow: var(--shadow-1); color: var(--accent-ink); font: 750 38px/1.15 var(--mono); letter-spacing: -.04em; white-space: nowrap; }
    .game-copy { flex: 1; display: flex; flex-direction: column; padding: 20px; }
    .game-copy small { font-size: .72rem; letter-spacing: .05em; color: var(--muted); }
    .game-copy h2 { margin: 7px 0 6px; font-size: 1.32rem; letter-spacing: -.025em; }
    .game-copy p { color: var(--muted); font-size: .92rem; line-height: 1.7; }
    .game-features { margin: 14px 0 0; font-size: .74rem; color: var(--muted); }
    .game-bottom { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: auto; padding-top: 14px; border-top: 1px solid var(--line); }
    .game-bottom strong { display: inline-flex; align-items: center; gap: 6px; color: var(--accent-ink); font-size: .87rem; }
    .game-bottom .icon { transition: transform .22s ease; }
    .game-card:hover .game-bottom .icon { transform: translateX(4px); }
    .game-bottom span { color: var(--muted); font: .7rem/1 var(--mono); }
    .play-tip { max-width: 92ch; margin: 28px 0 56px; color: var(--muted); font-size: .82rem; }
    @media (max-width: 980px) { .play-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    @media (max-width: 620px) { .play-grid { grid-template-columns: minmax(0, 1fr); } .play-head { padding-top: 34px; } .game-cover { height: 138px; } }
  `,
  body: `        <section class="play-head">
            <div class="container">
                <span class="eyebrow" data-i18n="eyebrow">游戏室 / PLAY ROOM</span>
                <h1 data-i18n="title">留一点时间，玩一局。</h1>
                <p class="lead" data-i18n="lead"></p>
                <div class="play-meta"><span data-i18n="local"></span><span id="gameCount"></span></div>
                <p class="recent-game" id="recentGame" hidden></p>
            </div>
        </section>

        <section class="section tight">
            <div class="container">
                <div class="play-filter" id="gameFilters" role="group" aria-label="游戏分类"></div>
                <div class="play-grid" id="gameList"></div>
                <p class="play-tip" data-i18n="tip"></p>
            </div>
        </section>
`,
    render: function render(ctx) {
        var games = window.PAGE_DATA;
        var state = window.PLAY_ROOM || (window.PLAY_ROOM = { filter: 'all' });
        var filters = document.getElementById('gameFilters');
        var list = document.getElementById('gameList');
        var count = document.getElementById('gameCount');

        function paint() {
            var items = games.filter(function (g) { return state.filter === 'all' || g.category === state.filter; });
            count.textContent = ctx.t('count').replace('%d', items.length);
            list.innerHTML = items.map(function (g) {
                return '<a class="game-card" href="' + g.page + '">' +
                    '<div class="game-cover ' + g.color + '" aria-hidden="true"><span class="game-mark">' + escHtml(g.mark) + '</span></div>' +
                    '<div class="game-copy"><small>' + escHtml(ctx.t(g.category)) + '</small>' +
                    '<h2>' + escHtml(ctx.pick(g.name)) + '</h2><p>' + escHtml(ctx.pick(g.desc)) + '</p>' +
                    '<div class="game-features">' + escHtml(ctx.pick(g.features)) + '</div>' +
                    '<div class="game-bottom"><strong>' + escHtml(ctx.t('play')) + '<svg class="icon" aria-hidden="true"><use href="#i-arrow-right" /></svg></strong>' +
                    '<span>' + escHtml(g.time) + ' ' + escHtml(ctx.t('minutes')) + '</span></div></div></a>';
            }).join('');
        }

        if (!window.PLAY_ROOM_BOUND) {
            window.PLAY_ROOM_BOUND = true;
            filters.addEventListener('click', function (event) {
                var pill = event.target.closest('button[data-category]');
                if (!pill) return;
                state.filter = pill.getAttribute('data-category');
                markPills();
                paint();
            });
        }
        /* 换语言时才重建；筛选只改属性，否则点一下按钮就被替换，焦点会丢 */
        function buildPills() {
            filters.innerHTML = ['all', 'puzzle', 'casual', 'strategy', 'simulation'].map(function (key) {
                return '<button type="button" data-category="' + key + '" aria-pressed="false">' + escHtml(ctx.t(key)) + '</button>';
            }).join('');
            markPills();
        }
        function markPills() {
            [].forEach.call(filters.children, function (b) {
                b.setAttribute('aria-pressed', String(b.getAttribute('data-category') === state.filter));
            });
        }
        buildPills();
        paint();

        var recent = document.getElementById('recentGame');
        var last = null;
        try { last = localStorage.getItem('lastPlayedGame'); } catch (e) {}
        var game = games.find(function (g) { return g.id === last; });
        if (game) {
            recent.hidden = false;
            recent.innerHTML = '<span>' + escHtml(ctx.t('recent')) + ' · <strong>' + escHtml(ctx.pick(game.name)) + '</strong></span>' +
                '<a href="' + game.page + '">' + escHtml(ctx.t('resume')) + '</a>';
        } else {
            recent.hidden = true;
        }
    },
    jsonld: {
      '@context': 'https://schema.org', '@type': 'ItemList',
      name: '游戏室 · 云陌轩', url: 'https://yunmo-xuan.github.io/games.html',
      itemListElement: CATALOG.map(function (g, i) {
        return { '@type': 'ListItem', position: i + 1, name: g.name['zh-CN'], url: 'https://yunmo-xuan.github.io/' + g.page };
      })
    }
};
