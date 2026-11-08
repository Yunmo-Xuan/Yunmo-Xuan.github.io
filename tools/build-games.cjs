/* 把 src/games 里的独立游戏构建到 site/assets/games，并注入站点主题桥接
   用法：node tools/build-games.cjs */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src', 'games');
const OUT = path.join(ROOT, 'site', 'assets', 'games');

const GAMES = [
  ['planet-merge.html', 'planet-merge.html'],
  ['gomoku.html', 'gomoku.html'],
  ['minesweeper.html', 'minesweeper.html'],
  ['simdesk.html', 'simdesk.html'],
  [path.join('xiangqi', '中国象棋.html'), 'xiangqi.html']
];

/* 站点设计令牌（与 src/core.css 保持一致），用于把游戏内部外观统一到同一套风格 */
const SITE = {
  light: {
    bg: '#faf9f8', bgSoft: '#f1f0ee', surface: '#ffffff', surface2: '#f6f7f9',
    text: '#15171c', muted: '#5c626c', faint: '#8b919b',
    line: 'rgba(0, 0, 0, .07)', lineStrong: 'rgba(0, 0, 0, .13)',
    accent: '#0b63f6', accentInk: '#0a50c9', accentSoft: 'rgba(11, 99, 246, .08)', accent2: '#7b2ffc',
    ok: '#0f8a4d', warn: '#b45309', danger: '#c02020',
    shadow1: '0 1px 2px rgba(16, 24, 40, .04), 0 8px 24px rgba(16, 24, 40, .05)',
    shadow2: '0 4px 12px rgba(16, 24, 40, .07), 0 20px 44px rgba(16, 24, 40, .10)',
    scrim: 'rgba(24, 28, 34, .48)', onAccent: '#ffffff',
    radius: '20px', radiusSm: '12px', radiusLg: '28px', radiusPill: '999px'
  },
  dark: {
    bg: '#0e1116', bgSoft: '#12171f', surface: '#161c25', surface2: '#1b222c',
    text: '#e9edf3', muted: '#9aa4b2', faint: '#6f7a88',
    line: 'rgba(255, 255, 255, .09)', lineStrong: 'rgba(255, 255, 255, .17)',
    accent: '#5aa0ff', accentInk: '#93c3ff', accentSoft: 'rgba(90, 160, 255, .14)', accent2: '#b18cff',
    ok: '#4ade80', warn: '#f0b26b', danger: '#ff7a8a',
    shadow1: '0 1px 2px rgba(0, 0, 0, .3), 0 8px 24px rgba(0, 0, 0, .26)',
    shadow2: '0 4px 14px rgba(0, 0, 0, .4), 0 24px 50px rgba(0, 0, 0, .42)',
    scrim: 'rgba(4, 7, 12, .62)', onAccent: '#08101c',
    radius: '20px', radiusSm: '12px', radiusLg: '28px', radiusPill: '999px'
  }
};
const FONT = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC', sans-serif";
const MONO = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', 'Courier New', monospace";

/* 每款游戏的变量名不同：这里只映射"外壳色"（背景/面板/文字/描边/主色/阴影/圆角/字体），
   棋盘木色、棋子、方块色阶、涨跌红绿这些游戏识别色保持原样 */
const MAPS = {
  'planet-merge.html': {
    surface: 'surface', raised: 'surface2', line: 'line', 'line-strong': 'lineStrong',
    ink: 'text', muted: 'muted', faint: 'faint', accent: 'accent', accent2: 'accent2',
    warn: 'warn', danger: 'danger', success: 'ok', 'ink-on-accent': 'onAccent',
    'shadow-1': 'shadow1', 'shadow-2': 'shadow2', radius: 'radius', 'radius-sm': 'radiusSm',
    'radius-lg': 'radiusLg', 'radius-pill': 'radiusPill', 'field-bg': 'surface',
    'overlay-bg': 'scrim', 'toast-bg': 'surface2', 'meter-bg': 'lineStrong', 'stage-bg': 'bg'
  },
  'gomoku.html': {
    page: 'bg', 'page-2': 'bgSoft', surface: 'surface', raised: 'surface2', sunken: 'bgSoft',
    hover: 'surface2', press: 'line', line: 'line', 'line-strong': 'lineStrong',
    ink: 'text', muted: 'muted', faint: 'faint', accent: 'accent', 'accent-hi': 'accentInk',
    'accent-text': 'accentInk', 'accent-soft': 'accentSoft', 'on-accent': 'onAccent',
    success: 'ok', 'success-soft': 'accentSoft', warn: 'warn', danger: 'danger',
    'danger-soft': 'accentSoft', 'shadow-1': 'shadow1', 'shadow-2': 'shadow2',
    scrim: 'scrim', 'scrim-2': 'scrim', 'card-bg': 'surface', 'card-line': 'line',
    'card-shadow': 'shadow1', 'btn-bg': 'surface', 'btn-line': 'lineStrong', 'btn-ink': 'text',
    'btn-bg-hover': 'surface2', 'btn-line-hover': 'lineStrong', 'btn-primary-bg': 'accent',
    'btn-primary-ink': 'onAccent', 'shell-bg': 'bg', 'rd-sm': 'radiusSm', 'rd-md': 'radiusSm',
    'rd-lg': 'radius', 'rd-xl': 'radiusLg', 'rd-pill': 'radiusPill'
  },
  'minesweeper.html': {
    bg: 'bg', 'bg-mid': 'bgSoft', raised: 'surface2', surface: 'surface', 'surface-2': 'surface2',
    inset: 'bgSoft', line: 'line', 'line-faint': 'line', 'line-strong': 'lineStrong',
    ink: 'text', muted: 'muted', faint: 'faint', accent: 'accent', 'accent-2': 'accent2',
    'on-accent': 'onAccent', success: 'ok', warn: 'warn', danger: 'danger', info: 'accent',
    panel: 'surface', scrim: 'scrim', glow: 'accentSoft', radius: 'radiusSm',
    'rad-sm': 'radiusSm', 'rad-md': 'radiusSm', 'rad-lg': 'radius', 'rad-xl': 'radiusLg',
    'rad-pill': 'radiusPill', 'shadow-near': 'shadow1', 'shadow-far': 'shadow2', 'shadow-emboss': 'shadow1'
  },
  'xiangqi.html': {
    bg: 'bg', 'bg-2': 'bgSoft', panel: 'surface', 'panel-2': 'surface2', text: 'text',
    muted: 'muted', line: 'line', 'line-soft': 'line', accent: 'accent', 'accent-2': 'accent2',
    shadow: 'shadow1', r: 'radiusSm', ring: 'lineStrong', 'ring-color': 'accent'
  },
  'simdesk.html': {
    'bg-0': 'bg', 'bg-1': 'surface', 'bg-2': 'surface2', surface: 'surface', 'surface-2': 'surface2',
    'surface-3': 'bgSoft', line: 'line', 'line-soft': 'line', ink: 'text', 'ink-dim': 'muted',
    'ink-mute': 'muted', 'ink-faint': 'faint', 'ink-on-accent': 'onAccent', accent: 'accent',
    'accent-fill': 'accent', 'accent-2': 'accent2', 'accent-soft': 'accentSoft',
    'accent-line': 'lineStrong', 'accent-glow': 'accentSoft', 'accent-fill-2': 'accent2',
    info: 'accent', 'info-soft': 'accentSoft', 'info-line': 'lineStrong', violet: 'accent2',
    'violet-soft': 'accentSoft', 'violet-line': 'lineStrong', overlay: 'scrim', scrim: 'scrim',
    'pane-bg': 'surface', 'pane-head-bg': 'surface2', 'field-bg': 'bgSoft', 'field-line': 'line',
    'chip-bg': 'surface2', 'chip-line': 'line', 'row-line': 'line', 'canvas-bg': 'bgSoft',
    'tape-bg': 'surface2', 'row-hover': 'surface2', 'row-active': 'accentSoft',
    'r-sm': 'radiusSm', 'r-md': 'radiusSm', 'r-lg': 'radius', 'r-pill': 'radiusPill',
    shadow: 'shadow1', 'shadow-2': 'shadow2'
  }
};

/* 各游戏自己的字体变量名，一并指到站点字体栈（象棋的棋子书法字体 --font-piece 保持不动） */
const FONT_VARS = {
  'planet-merge.html': ['--font', '--mono'],
  'gomoku.html': ['--ff-ui', '--ff-display', '--ff-num'],
  'minesweeper.html': ['--font-cjk', '--font-mono'],
  'xiangqi.html': ['--font-ui', '--font-title'],
  'simdesk.html': ['--sans', '--mono']
};

/* 象棋的主题取值是 wood / ink / night，不是 light / dark；其余游戏用 light / dark */
const THEMES = {
  default: { light: ['light'], dark: ['dark'], alias: { light: 'light', dark: 'dark' } },
  'xiangqi.html': { light: ['ink', 'wood'], dark: ['night'], alias: { light: 'ink', dark: 'night' } }
};
const themeOf = name => THEMES[name] || THEMES.default;

const TRIMS = {
  'gomoku.html': ['.masthead .brand'],
  'minesweeper.html': ['.bar .brand'],
  'xiangqi.html': ['.bar .brand'],
  'simdesk.html': ['#topbar .brand']
};

/* 嵌入站点时的界面修正（游戏本体文件不改）：
   1. 游戏头部的品牌标题与外壳标题栏重复，而且白吃掉一屏里最贵的几十像素，只摘标题不摘控件；
   2. 窄屏布局塌成单列后，棋盘会跟着长页面滚走——把棋盘钉在顶部，控件在下方滚动，
      手机上才不用在棋盘和按钮之间来回翻页。 */
const EMBED_CSS = {
  'planet-merge.html': [
    '@media (max-width:940px){',
    /* 用 flex 而不是 block：游戏靠 order 把棋盘提到最前，block 会让 order 失效， */
    /* 于是计分面板压到棋盘上面，layoutView 算出的可用高度只剩 240px。 */
    '  html.in-embed #app{display:flex;flex-direction:column}',
    '  html.in-embed .stage-wrap{position:sticky;top:0;z-index:4;width:min(100%,480px);margin:0 auto}',
    '}',
    /* 触屏上没有键盘，这行快捷键提示只是白占一行 */
    '@media (pointer:coarse){ html.in-embed #app footer{display:none} }'
  ],
  'gomoku.html': [
    '@media (max-width:1000px){',
    '  html.in-embed .stage{display:block}',
    '  html.in-embed .board-shell{position:sticky;top:0;z-index:6;background:var(--page);padding-block:6px}',
    '  html.in-embed .panel{margin-top:14px}',
    '}'
  ],
  /* 扫雷不做布局改写：它的 main.stage 是 1fr 网格，棋盘在自己的滚动容器里；
     改成 block 会让 flex 父项的 min-width:auto 被棋盘撑破，整份文档横向溢出。 */
  'minesweeper.html': [],
  'xiangqi.html': [
    '@media (max-width:1040px){',
    '  html.in-embed .stage{display:block}',
    '  html.in-embed .board-side{position:sticky;top:0;z-index:6;background:var(--bg);padding-block:6px}',
    '  html.in-embed .panel{margin-top:14px}',
    '}'
  ],
  'simdesk.html': []
};
const brandHide = name => (TRIMS[name] || []).map(sel => `  html.in-embed ${sel} { display: none !important; }`).join('\n');

function bridgeCss(name) {
  const map = MAPS[name];
  if (!map) return '';
  const t = themeOf(name);
  const block = theme => Object.entries(map)
    .map(([variable, token]) => `--${variable}: ${SITE[theme][token]};`)
    .join('\n    ');
  const vars = FONT_VARS[name] || [];
  const fonts = vars.map(v => (/mono|num/.test(v)
    ? `    ${v}: var(--site-mono);`
    : `    ${v}: var(--site-font);`)).join('\n');
  const sel = list => list.map(v => `:root[data-theme="${v}"]`).join(', ');
  return `<style id="site-bridge">
  /* site-bridge：把游戏的外壳配色、字体与圆角统一到站点设计令牌（由 tools/build-games.cjs 注入） */
  :root {
    --site-font: ${FONT};
    --site-mono: ${MONO};
  }
  ${sel(t.light)} {
    color-scheme: light;
    ${block('light')}
${fonts}
  }
  ${sel(t.dark)} {
    color-scheme: dark;
    ${block('dark')}
${fonts}
  }
  html, body { font-family: var(--site-font); }
  ${brandHide(name)}
  ${(EMBED_CSS[name] || []).join('\n')}
</style>
<script>/* 站点里以 iframe 嵌入时，游戏自带的品牌标题与外壳重复，让位给整屏游戏区 */
if (window.top !== window.self) document.documentElement.classList.add('in-embed');</script>`;
}

/* 站点主题桥：外壳页面负责深浅色，游戏内部控件仍然可用 */
function bridgeScript(name) {
  const alias = themeOf(name).alias;
  return `
<!-- site-bridge：由 tools/build-games.cjs 注入，勿手工编辑此段 -->
<script>
(function () {
    var root = document.documentElement;
    var ALIAS = ${JSON.stringify(alias)};
    function apply(siteTheme) {
        var theme = ALIAS[siteTheme];
        if (!theme) return;
        try {
            if (window.GAME_HOST && typeof window.GAME_HOST.setTheme === 'function') window.GAME_HOST.setTheme(theme);
            else root.setAttribute('data-theme', theme);
        } catch (e) { root.setAttribute('data-theme', theme); }
    }
    function report() {
        try { parent.postMessage({ type: 'yunmo-theme-report', theme: root.getAttribute('data-theme') }, '*'); } catch (e) {}
    }
    window.addEventListener('message', function (event) {
        var data = event.data;
        if (data && data.type === 'yunmo-theme') apply(data.theme);
    });
    try { parent.postMessage({ type: 'yunmo-theme-request' }, '*'); } catch (e) {}
    report();
    new MutationObserver(report).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    /* 外壳里的「放大」需要能退出：Esc 由外壳处理，这里只保证键盘不被游戏长期占用 */
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') { try { parent.postMessage({ type: 'yunmo-exit-fullscreen' }, '*'); } catch (e) {} }
    });
})();
</script>
`;
}

function inject(html, name) {
  if (html.includes('id="site-bridge"')) return html;
  const css = bridgeCss(name);
  const bridge = bridgeScript(name);
  if (css && /<\/head>/i.test(html)) html = html.replace(/<\/head>/i, css + '\n</head>');
  return /<\/body>/i.test(html) ? html.replace(/<\/body>/i, bridge + '</body>') : html + bridge;
}

if (fs.existsSync(path.join(SRC, 'xiangqi', 'build.js'))) {
  execFileSync(process.execPath, [path.join(SRC, 'xiangqi', 'build.js')], { cwd: path.join(SRC, 'xiangqi'), stdio: 'inherit' });
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
for (const [from, to] of GAMES) {
  const source = path.join(SRC, from);
  if (!fs.existsSync(source)) { console.error('  ✗ 缺少游戏源文件：' + source); process.exitCode = 1; continue; }
  const html = fs.readFileSync(source, 'utf8');
  fs.writeFileSync(path.join(OUT, to), inject(html, to), 'utf8');
  console.log(`  ✓ assets/games/${to}  ${(fs.statSync(path.join(OUT, to)).size / 1024).toFixed(1)} KB`);
}
console.log('game assets ready in site/assets/games');
