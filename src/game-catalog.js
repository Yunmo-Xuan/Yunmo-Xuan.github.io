/* 游戏清单：六款游戏的名称、简介、玩法与入口的唯一来源。
   新增一款游戏 = 在这里加一条，并让 tools/build-games.cjs 认识它的源文件。 */
'use strict';

module.exports = [
  {
    id: '2048',
    page: '2048.html',
    src: null,                       /* 站点原生实现，见 src/pages/51-2048.js */
    category: 'puzzle',
    mark: '2048',
    color: 'blue',
    time: '3–10',
    name: { 'zh-CN': '2048', 'zh-TW': '2048', en: '2048', ja: '2048' },
    desc: {
      'zh-CN': '推一格，合一对。接着上次的棋局，向更大的数字迈进。',
      'zh-TW': '推一格，合一對。接著上次的棋局，向更大的數字邁進。',
      en: 'Slide, merge, repeat. Pick up your last board and work toward a bigger number.',
      ja: '一押しで一つ合わせ、前回の盤面から大きな数字を目指しましょう。'
    },
    features: {
      'zh-CN': '滑动操作 / 自动续局', 'zh-TW': '滑動操作 / 自動續局',
      en: 'Swipe controls / Saved progress', ja: 'スワイプ / 続きから'
    },
    how: {
      'zh-CN': '方向键或 WASD 移动，手机上在棋盘内滑动；相同数字相撞合并一次。',
      'zh-TW': '方向鍵或 WASD 移動，手機上在棋盤內滑動；相同數字相撞合併一次。',
      en: 'Arrows or WASD to move, swipe inside the board on touch screens; equal tiles merge once per move.',
      ja: '矢印キーか WASD、タッチでは盤面内をスワイプ。同じ数字は1回の移動で1度だけ合体します。'
    }
  },
  {
    id: 'planet-merge',
    page: 'planet-merge.html',
    src: 'planet-merge.html',
    category: 'casual',
    mark: '◎',
    color: 'violet',
    time: '5–15',
    name: { 'zh-CN': '星核合成', 'zh-TW': '星核合成', en: 'Planet Merge', ja: '星核合成' },
    desc: {
      'zh-CN': '找准落点，让同级天体相遇。留好空间，等待下一次连锁合成。',
      'zh-TW': '找準落點，讓同級天體相遇。留好空間，等待下一次連鎖合成。',
      en: 'Aim the drop, let matching bodies meet, and leave room for the next chain.',
      ja: '落下位置を見極めて同じ天体を衝突させ、次の連鎖のための空間を残しましょう。'
    },
    features: {
      'zh-CN': '物理碰撞 / 每日挑战', 'zh-TW': '物理碰撞 / 每日挑戰',
      en: 'Physics collisions / Daily challenge', ja: '物理衝突 / 日替わりチャレンジ'
    },
    how: {
      'zh-CN': '拖动选择落点，松手投放；相同星级相遇即合成。',
      'zh-TW': '拖動選擇落點，鬆手投放；相同星級相遇即合成。',
      en: 'Drag to aim, release to drop; equal tiers merge on contact.',
      ja: 'ドラッグで位置を決めて離すと投入。同じ等級が触れると合体します。'
    }
  },
  {
    id: 'gomoku',
    page: 'gomoku.html',
    src: 'gomoku.html',
    category: 'strategy',
    mark: '● ○',
    color: 'blue',
    time: '5–20',
    name: { 'zh-CN': '五子棋', 'zh-TW': '五子棋', en: 'Gomoku', ja: '五目並べ' },
    desc: {
      'zh-CN': '从一条活三开始布局。与电脑过招，或和身边的人轮流落子。',
      'zh-TW': '從一條活三開始佈局。與電腦過招，或和身邊的人輪流落子。',
      en: 'Build from an open three. Play the computer, or take turns on one board.',
      ja: '活三から布石を組み立てる。コンピューター戦、または同一画面で交互に着手。'
    },
    features: {
      'zh-CN': '人机对弈 / 双人同屏', 'zh-TW': '人機對弈 / 雙人同屏',
      en: 'Computer opponent / Local two-player', ja: 'コンピューター戦 / 同一画面2人'
    },
    how: {
      'zh-CN': '点击交叉点落子；禁手按页面规则提示（简化规则，非完整连珠赛事规则）。',
      'zh-TW': '點擊交叉點落子；禁手依頁面規則提示（簡化規則，非完整連珠賽事規則）。',
      en: 'Click an intersection to play; forbidden moves follow the simplified rules shown on the page.',
      ja: '交点をクリックして着手。禁手は画面に表示される簡易ルールで判定します。'
    }
  },
  {
    id: 'minesweeper',
    page: 'minesweeper.html',
    src: 'minesweeper.html',
    category: 'puzzle',
    mark: '1 2 3',
    color: 'mint',
    time: '2–15',
    name: { 'zh-CN': '扫雷', 'zh-TW': '掃雷', en: 'Minesweeper', ja: 'マインスイーパー' },
    desc: {
      'zh-CN': '每个数字都是线索。先圈出危险，再一口气打开安全区域。',
      'zh-TW': '每個數字都是線索。先圈出危險，再一次打開安全區域。',
      en: 'Every number is a clue. Mark the danger, then open safe ground in one go.',
      ja: '数字はすべて手がかり。危険を旗で囲み、安全な領域を一気に開きましょう。'
    },
    features: {
      'zh-CN': '难度选择 / 标旗与快捷展开', 'zh-TW': '難度選擇 / 標旗與快捷展開',
      en: 'Difficulty levels / Flags and chords', ja: '難易度選択 / 旗と一括展開'
    },
    how: {
      'zh-CN': '左键翻开，右键标旗；数字与旗数一致时可快捷展开周围格子。',
      'zh-TW': '左鍵翻開，右鍵標旗；數字與旗數一致時可快捷展開周圍格子。',
      en: 'Left click reveals, right click flags; a matching flag count chords the neighbours open.',
      ja: '左クリックで開き、右クリックで旗。数字と旗の数が合えば周囲を一括展開できます。'
    }
  },
  {
    id: 'xiangqi',
    page: 'xiangqi.html',
    src: 'xiangqi/中国象棋.html',
    category: 'strategy',
    mark: '將',
    color: 'amber',
    time: '10–30',
    name: { 'zh-CN': '中国象棋', 'zh-TW': '中國象棋', en: 'Chinese Chess', ja: '中国象棋' },
    desc: {
      'zh-CN': '楚河汉界，从开局走到残局。对弈之后，回看关键的那一步。',
      'zh-TW': '楚河漢界，從開局走到殘局。對弈之後，回看關鍵的那一步。',
      en: 'Cross the river and play it out, then review the move that decided the game.',
      ja: '川を渡り、開局から終盤まで。対局後に大事な一手を振り返れます。'
    },
    features: {
      'zh-CN': '人机对弈 / 棋谱复盘', 'zh-TW': '人機對弈 / 棋譜複盤',
      en: 'Computer opponent / Game review', ja: 'コンピューター戦 / 棋譜レビュー'
    },
    how: {
      'zh-CN': '点击棋子再看落点；支持人机、双人、悔棋与复盘。',
      'zh-TW': '點擊棋子再看落點；支援人機、雙人、悔棋與復盤。',
      en: 'Select a piece, then its destination. Supports AI, two-player, undo and review.',
      ja: '駒を選んでから移動先をクリック。AI戦・2人対戦・待った・検討に対応。'
    }
  },
  {
    id: 'simdesk',
    page: 'simdesk.html',
    src: 'simdesk.html',
    category: 'simulation',
    mark: '↗',
    color: 'mint',
    time: '10–30',
    name: { 'zh-CN': '股市模拟', 'zh-TW': '股市模擬', en: 'Market Simulator', ja: '株式シミュレーター' },
    desc: {
      'zh-CN': '在虚拟市场里试试自己的判断。看行情、下订单，也别忘了风险。',
      'zh-TW': '在虛擬市場裡試試自己的判斷。看行情、下訂單，也別忘了風險。',
      en: 'Test your judgement in a virtual market. Read prices, place orders, mind the risk.',
      ja: '仮想市場で判断力を試す。相場を読み、注文し、リスクも忘れずに。'
    },
    features: {
      'zh-CN': '模拟交易 / 情景战役', 'zh-TW': '模擬交易 / 情景戰役',
      en: 'Virtual trading / Scenario campaigns', ja: '模擬取引 / シナリオ戦役'
    },
    how: {
      'zh-CN': '行情、财务与新闻全部由本地引擎生成，不是真实市场，也不构成投资建议。',
      'zh-TW': '行情、財務與新聞全部由本地引擎生成，不是真實市場，也不構成投資建議。',
      en: 'Prices, financials and news are generated locally — not a real market and not investment advice.',
      ja: '価格・財務・ニュースはすべてローカル生成。実市場ではなく投資助言でもありません。'
    }
  }
];
