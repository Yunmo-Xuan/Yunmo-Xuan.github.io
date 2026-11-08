/* 游戏页：2048 */
'use strict';

module.exports = {
    file: '2048.html',
    path: '/2048.html',
    active: 'games',
    ogType: 'website',

    title: {
        'zh-CN': '2048 · 云陌轩',
        'zh-TW': '2048 · 雲陌軒',
        'en': '2048 · Yunmo-Xuan',
        'ja': '2048 · 雲陌軒'
    },
    desc: {
        'zh-CN': '站内小游戏：2048。方向键或滑动操作，合并相同数字；进度与最佳纪录保存在本机，支持深浅主题与四种界面语言。',
        'en': 'A small in-site game: 2048. Arrow keys or swipe, merge equal tiles; progress and best score stay on this device, with light/dark themes and four interface languages.'
    },

    styles: `
        .g-wrap { max-width: 560px; margin: 0 auto; }
        .g-back-line { margin: 22px 0 0; font-size: .86rem; }
        .g-top { display: flex; flex-wrap: wrap; align-items: stretch; justify-content: space-between; gap: 12px; margin: 28px 0 12px; }
        .g-scores { display: flex; gap: 10px; }
        .g-score {
            min-width: 96px; padding: 10px 16px; text-align: center;
            background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-sm);
        }
        .g-score .k { display: block; font-size: .72rem; font-weight: 650; letter-spacing: .1em; text-transform: uppercase; color: var(--faint); }
        .g-score .v { display: block; margin-top: 2px; font-family: var(--mono); font-size: 1.4rem; font-weight: 700; color: var(--text); }
        .g-score .v.bump { animation: g-bump .3s ease; }
        @keyframes g-bump { 40% { transform: scale(1.22); color: var(--accent-ink); } }
        .g-actions { display: flex; gap: 8px; align-self: center; }
        .g-actions .icon-btn { width: 40px; height: 40px; }
        .g-actions .icon-btn.off { color: var(--faint); }
        .g-restored { margin: 0 2px 12px; font-size: .84rem; color: var(--accent-ink); display: flex; align-items: center; gap: 7px; }
        .g-restored[hidden] { display: none; }

        .g-board {
            position: relative; padding: 12px; touch-action: none; user-select: none; -webkit-user-select: none;
            background: var(--surface-2); border: 1px solid var(--line); border-radius: var(--radius);
            box-shadow: var(--shadow-1);
        }
        .g-board.nudge { animation: g-nudge .18s ease; }
        @keyframes g-nudge { 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
        .g-grid {
            display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); grid-template-rows: repeat(4, minmax(0, 1fr));
            gap: 10px; container-type: inline-size;
        }
        .g-cell {
            aspect-ratio: 1; display: grid; place-items: center;
            border-radius: var(--radius-sm); background: var(--surface); border: 1px solid var(--line);
            font-family: var(--mono); font-weight: 700; font-size: 13cqi;
            color: var(--text); user-select: none; line-height: 1;
        }
        .g-cell.spawn { animation: g-spawn .22s ease; }
        @keyframes g-spawn { from { transform: scale(.55); opacity: .2; } }
        .g-cell.pop { animation: g-pop .24s ease; }
        @keyframes g-pop { 45% { transform: scale(1.16); } }
        .g-cell.t2 { background: #eee4da; border-color: #eee4da; color: #6f655c; }
        .g-cell.t4 { background: #ede0c8; border-color: #ede0c8; color: #6f655c; }
        .g-cell.t8 { background: #f2b179; border-color: #f2b179; color: #fff; }
        .g-cell.t16 { background: #f59563; border-color: #f59563; color: #fff; }
        .g-cell.t32 { background: #f67c5f; border-color: #f67c5f; color: #fff; }
        .g-cell.t64 { background: #f65e3b; border-color: #f65e3b; color: #fff; }
        .g-cell.t128 { background: #edcf72; border-color: #edcf72; color: #fff; font-size: 11.4cqi; }
        .g-cell.t256 { background: #edcc61; border-color: #edcc61; color: #fff; font-size: 11.4cqi; }
        .g-cell.t512 { background: #edc850; border-color: #edc850; color: #fff; font-size: 11.4cqi; }
        .g-cell.t1024 { background: #edc53f; border-color: #edc53f; color: #fff; font-size: 9.4cqi; }
        .g-cell.t2048 { background: #edc22e; border-color: #edc22e; color: #fff; font-size: 9.4cqi; }
        .g-cell.tsuper { background: #3c3a32; border-color: #3c3a32; color: #fff; font-size: 7.8cqi; }

        .g-msg {
            position: absolute; inset: 12px; display: none; place-items: center; text-align: center;
            border-radius: var(--radius-sm); background: rgba(250, 249, 248, .9); backdrop-filter: blur(2px);
        }
        [data-theme="dark"] .g-msg { background: rgba(14, 17, 22, .9); }
        .g-msg.show { display: grid; }
        .g-msg.show > div { animation: g-rise .3s ease; }
        @keyframes g-rise { from { transform: translateY(10px); opacity: 0; } }
        .g-msg.won { background: rgba(237, 194, 46, .38); }
        [data-theme="dark"] .g-msg.won { background: rgba(237, 194, 46, .26); }
        .g-msg p { margin: 0; font-size: clamp(1.7rem, 7vw, 2.5rem); font-weight: 800; letter-spacing: -.03em; }
        .g-msg .btn-row { margin-top: 16px; justify-content: center; }

        .g-hint { margin: 14px 2px 0; font-size: .86rem; color: var(--muted); display: flex; align-items: center; gap: 8px; }
        .g-hint .icon { color: var(--accent-ink); flex-shrink: 0; }
        .g-rules { margin-top: 26px; }
        @media (max-width: 480px) {
            .g-board { padding: 8px; }
            .g-grid { gap: 8px; }
            .g-msg { inset: 8px; }
            .g-score { min-width: 84px; padding: 8px 12px; }
        }
        /* 矮屏（横放手机等）：收起装饰文案，棋盘按视口高度收缩，保证 controls 够得着 */
        @media (max-height: 600px) {
            .page-head { padding-top: 22px; }
            .page-head .lead { display: none; }
            .g-top { margin: 12px 0 10px; }
            .g-rules { display: none; }
            .g-hint { margin-top: 10px; }
            .g-board { width: min(100%, max(240px, 58vh)); margin-inline: auto; }
        }
        @media (max-height: 460px) {
            .page-head { display: none; }
            .g-hint { display: none; }
            .section.tight { padding: 6px 0 10px; }
            .g-top { margin: 6px 0 8px; }
            .g-board { width: min(100%, calc(100vh - 200px)); min-width: 200px; margin-inline: auto; }
            .g-cell { border-radius: 6px; }
        }
    `,

    body: `        <section class="page-head">
            <div class="container">
                <span class="eyebrow" data-i18n="eyebrow">小游戏</span>
                <h1>2048</h1>
                <p class="lead" data-i18n="lead">
                    站里唯一会动嘴劝你再玩一局的东西。方向键或滑动，把相同的数字合到一起；进度和最佳纪录留在这台设备上。
                </p>
            </div>
        </section>

        <section class="section tight">
            <div class="container">
                <div class="g-wrap">
                    <p class="g-back-line"><a class="g-back" href="games.html" data-i18n="g_back">返回游戏室</a></p>
                    <div class="g-top">
                        <div class="g-scores">
                            <div class="g-score"><span class="k" data-i18n="g_score">分数</span><span class="v" id="gScore">0</span></div>
                            <div class="g-score"><span class="k" data-i18n="g_best">最佳</span><span class="v" id="gBest">0</span></div>
                        </div>
                        <div class="g-actions">
                            <button type="button" class="icon-btn" id="gSound" aria-pressed="true" data-i18n-title="g_sound" data-i18n-aria="g_sound" title="音效">
                                <svg class="icon i-on" aria-hidden="true"><use href="#i-sound" /></svg>
                                <svg class="icon i-off" aria-hidden="true" style="display:none"><use href="#i-mute" /></svg>
                            </button>
                            <button type="button" class="btn btn-ghost btn-sm" id="gNew">
                                <svg class="icon" aria-hidden="true"><use href="#i-zap" /></svg>
                                <span data-i18n="g_new">新游戏</span>
                            </button>
                        </div>
                    </div>

                    <p class="g-restored" id="gRestored" hidden>
                        <svg class="icon" aria-hidden="true"><use href="#i-clock" /></svg>
                        <span data-i18n="g_restored">已恢复上次的棋局与分数。</span>
                    </p>

                    <div class="g-board" id="gBoard" data-i18n-aria="g_board" aria-label="2048 棋盘">
                        <div class="g-grid" id="gGrid"></div>
                        <div class="g-msg" id="gMsg" role="status">
                            <div>
                                <p id="gMsgText"></p>
                                <div class="btn-row">
                                    <button type="button" class="btn btn-primary btn-sm" id="gKeep" hidden>
                                        <span data-i18n="g_keep">继续游戏</span>
                                    </button>
                                    <button type="button" class="btn btn-ghost btn-sm" id="gRetry">
                                        <span data-i18n="g_retry">再试一次</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <p class="g-hint">
                        <svg class="icon" aria-hidden="true"><use href="#i-terminal" /></svg>
                        <span data-i18n="g_hint">键盘方向键或 WASD 移动；手机上在棋盘上滑动（棋盘内不会触发页面滚动或下拉刷新）。</span>
                    </p>

                    <aside class="note g-rules" data-i18n="g_rules">
                        规则：每次移动后随机落下一块 2 或 4；相同数字相撞会合并成它们的和，并计入分数。
                        合成 2048 即获胜，之后可以继续挑战更大的数字；棋盘填满且无处可合时游戏结束。
                        棋局、分数与最佳纪录保存在本机浏览器里，关掉页面下次接着玩。
                    </aside>
                </div>
            </div>
        </section>
`,

    i18n: {
        'zh-CN': {
            meta_description: '站内小游戏：2048。方向键或滑动操作，合并相同数字；进度与最佳纪录保存在本机，支持深浅主题与四种界面语言。',
            eyebrow: '小游戏',
            lead: '站里唯一会动嘴劝你再玩一局的东西。方向键或滑动，把相同的数字合到一起；进度和最佳纪录留在这台设备上。',
            g_score: '分数', g_best: '最佳', g_new: '新游戏', g_back: '返回游戏室',
            g_keep: '继续游戏', g_retry: '再试一次',
            g_win: '你赢了！', g_over: '游戏结束',
            g_hint: '键盘方向键或 WASD 移动；手机上在棋盘上滑动（棋盘内不会触发页面滚动或下拉刷新）。',
            g_rules: '规则：每次移动后随机落下一块 2 或 4；相同数字相撞会合并成它们的和，并计入分数。合成 2048 即获胜，之后可以继续挑战更大的数字；棋盘填满且无处可合时游戏结束。棋局、分数与最佳纪录保存在本机浏览器里，关掉页面下次接着玩。',
            g_board: '2048 棋盘', g_sound: '音效开关',
            g_restored: '已恢复上次的棋局与分数。'
        },
        'zh-TW': {
            meta_description: '站內小遊戲：2048。方向鍵或滑動操作，合併相同數字；進度與最佳紀錄保存在本機，支援深淺主題與四種介面語言。',
            eyebrow: '小遊戲',
            lead: '站裡唯一會開口勸你再玩一局的東西。方向鍵或滑動，把相同的數字合在一起；進度和最佳紀錄留在這台裝置上。',
            g_score: '分數', g_best: '最佳', g_new: '新遊戲', g_back: '返回遊戲室',
            g_keep: '繼續遊戲', g_retry: '再試一次',
            g_win: '你贏了！', g_over: '遊戲結束',
            g_hint: '鍵盤方向鍵或 WASD 移動；手機上在棋盤上滑動（棋盤內不會觸發頁面滾動或下拉刷新）。',
            g_rules: '規則：每次移動後隨機落下一塊 2 或 4；相同數字相撞會合併成它們的和，並計入分數。合成 2048 即獲勝，之後可以繼續挑戰更大的數字；棋盤填滿且無處可合時遊戲結束。棋局、分數與最佳紀錄保存在本機瀏覽器裡，關掉頁面下次接著玩。',
            g_board: '2048 棋盤', g_sound: '音效開關',
            g_restored: '已恢復上次的棋局與分數。'
        },
        'en': {
            meta_description: 'A small in-site game: 2048. Arrow keys or swipe, merge equal tiles; progress and best score stay on this device, with light/dark themes and four interface languages.',
            eyebrow: 'Mini game',
            lead: 'The only thing on this site that talks you into one more round. Arrows or swipe, merge equal numbers; progress and best score stay on this device.',
            g_score: 'Score', g_best: 'Best', g_new: 'New game', g_back: 'Back to play room',
            g_keep: 'Keep going', g_retry: 'Try again',
            g_win: 'You win!', g_over: 'Game over',
            g_hint: 'Arrow keys or WASD to move; swipe on the board on touch screens (the board never scrolls the page or pulls to refresh).',
            g_rules: 'Rules: every move drops a random 2 or 4; equal tiles that collide merge into their sum and add to the score. Reaching 2048 wins, and you can keep going for bigger tiles; the game ends when the board is full with no possible merge. The board, score and best record live in this browser, so you can close the page and continue later.',
            g_board: '2048 board', g_sound: 'Sound on/off',
            g_restored: 'Restored your previous board and score.'
        },
        'ja': {
            meta_description: 'サイト内のミニゲーム：2048。矢印キーまたはスワイプで同じ数字を合体。進度とベストは端末に保存。ライト/ダークテーマと4言語UIに対応。',
            eyebrow: 'ミニゲーム',
            lead: 'このサイトで唯一「もう一局」と囁いてくるもの。矢印キーかスワイプで同じ数字を合わせます。進度とベストはこの端末に残ります。',
            g_score: 'スコア', g_best: 'ベスト', g_new: '新しいゲーム', g_back: 'ゲーム室へ戻る',
            g_keep: '続行', g_retry: 'もう一度',
            g_win: '勝利！', g_over: 'ゲームオーバー',
            g_hint: '矢印キーまたは WASD で移動、タッチ端末では盤面をスワイプ（盤面内ではページスクロールや pull-to-refresh は起きません）。',
            g_rules: 'ルール：手を動かすごとに 2 か 4 がランダムに出現。同じ数字がぶつかると合計値に合体し、スコアに加算されます。2048 を作れば勝利、その後もより大きなタイルに挑戦できます。盤面が埋まり合体できなくなったら終了です。盤面・スコア・ベストはこのブラウザに保存され、ページを閉じても続きから遊べます。',
            g_board: '2048 盤面', g_sound: 'サウンド切替',
            g_restored: '前回の盤面とスコアを復元しました。'
        }
    },

    render: function render(ctx) {
        var grid = document.getElementById('gGrid');
        if (!grid) return;

        /* ── 纯逻辑：一行滑动 = 去零 → 相邻同值合并一次 → 再去零 → 补零 ── */
        function slide(line) {
            var row = line.filter(function (v) { return v !== 0; });
            var gained = 0;
            for (var i = 0; i < row.length - 1; i++) {
                if (row[i] === row[i + 1]) {
                    row[i] *= 2;
                    gained += row[i];
                    row[i + 1] = 0;
                }
            }
            row = row.filter(function (v) { return v !== 0; });
            while (row.length < 4) row.push(0);
            return { line: row, gained: gained };
        }

        function linesOf(board, dir) {
            if (dir === 'left') return [function (b, i) { return b[i].slice(); }, function (b, i, l) { b[i] = l; }];
            if (dir === 'right') return [function (b, i) { return b[i].slice().reverse(); }, function (b, i, l) { b[i] = l.reverse(); }];
            if (dir === 'up') return [function (b, i) { return [b[0][i], b[1][i], b[2][i], b[3][i]]; }, function (b, i, l) { for (var r = 0; r < 4; r++) b[r][i] = l[r]; }];
            return [function (b, i) { return [b[3][i], b[2][i], b[1][i], b[0][i]]; }, function (b, i, l) { for (var r = 0; r < 4; r++) b[3 - r][i] = l[r]; }];
        }

        function emptyBoard() {
            return [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
        }

        function cloneBoard(b) {
            return b.map(function (r) { return r.slice(); });
        }

        function sameBoard(a, b) {
            for (var i = 0; i < 4; i++) for (var j = 0; j < 4; j++) if (a[i][j] !== b[i][j]) return false;
            return true;
        }

        function movesAvailable(b) {
            for (var i = 0; i < 4; i++) {
                for (var j = 0; j < 4; j++) {
                    if (b[i][j] === 0) return true;
                    if (j < 3 && b[i][j] === b[i][j + 1]) return true;
                    if (i < 3 && b[i][j] === b[i + 1][j]) return true;
                }
            }
            return false;
        }

        function applyMove(board, dir) {
            var io = linesOf(board, dir);
            var out = emptyBoard();
            var gained = 0;
            for (var i = 0; i < 4; i++) {
                var res = slide(io[0](board, i));
                gained += res.gained;
                io[1](out, i, res.line);
            }
            return { board: out, gained: gained, moved: !sameBoard(board, out) };
        }

        /* ── 本机存档：棋局 + 分数 + 胜负状态；读失败或数据坏掉就开新局 ── */
        var SAVE_KEY = 'g2048save';
        function validScore(value) {
            return Number.isSafeInteger(value) && value >= 0;
        }

        function validTile(value) {
            if (value === 0) return true;
            if (!Number.isSafeInteger(value) || value < 2) return false;
            /* 不用位运算（会截成 32 位），也不依赖大整数 log2 的舍入结果。 */
            while (value % 2 === 0) value /= 2;
            return value === 1;
        }

        function readBest() {
            try {
                var best = Number(localStorage.getItem('best2048'));
                return validScore(best) ? best : 0;
            } catch (e) { return 0; }
        }

        function readSave() {
            try {
                var raw = localStorage.getItem(SAVE_KEY);
                if (!raw) return null;
                var s = JSON.parse(raw);
                if (!s || s.v !== 1 || !Array.isArray(s.board) || s.board.length !== 4) return null;
                var occupied = false, won = false;
                for (var i = 0; i < 4; i++) {
                    if (!Array.isArray(s.board[i]) || s.board[i].length !== 4) return null;
                    for (var j = 0; j < 4; j++) {
                        var v = s.board[i][j];
                        if (!validTile(v)) return null;
                        if (v) occupied = true;
                        if (v >= 2048) won = true;
                    }
                }
                if (!occupied || !validScore(s.score)) return null;
                if (typeof s.won !== 'boolean' || typeof s.kept !== 'boolean' || typeof s.over !== 'boolean') return null;
                if (s.won !== won || (s.kept && !s.won) || s.over !== !movesAvailable(s.board)) return null;
                return s;
            } catch (e) { return null; }
        }

        function writeSave(S) {
            try {
                localStorage.setItem(SAVE_KEY, JSON.stringify({
                    v: 1, board: S.board, score: S.score, won: S.won, kept: S.kept, over: S.over
                }));
            } catch (e) { /* 隐私模式：记不住就不记 */ }
        }

        /* ── 音效：WebAudio 合成，无外部资源；首次手势后才出声 ── */
        function audio() {
            var A = window.G2048_AUDIO;
            if (!A) {
                A = window.G2048_AUDIO = { ctx: null, on: true };
                try { A.on = localStorage.getItem('g2048sound') !== 'off'; } catch (e) { A.on = true; }
            }
            return A;
        }
        function ensureAudio() {
            var A = audio();
            try {
                if (!A.ctx) A.ctx = new (window.AudioContext || window.webkitAudioContext)();
                if (A.ctx.state === 'suspended') A.ctx.resume();
            } catch (e) { A.ctx = null; }
        }
        function tone(freq, dur, type, vol) {
            var A = audio();
            if (!A.on || !A.ctx || A.ctx.state !== 'running') return;
            try {
                var o = A.ctx.createOscillator();
                var g = A.ctx.createGain();
                o.type = type || 'sine';
                o.frequency.value = freq;
                g.gain.setValueAtTime(vol || .06, A.ctx.currentTime);
                g.gain.exponentialRampToValueAtTime(.0001, A.ctx.currentTime + dur);
                o.connect(g); g.connect(A.ctx.destination);
                o.start(); o.stop(A.ctx.currentTime + dur);
            } catch (e) { /* 出声失败不影响游戏 */ }
        }

        var reduceMotion = false;
        try { reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { reduceMotion = false; }

        /* ── 状态：挂在 window 上，切语言重跑 render 时不丢局 ── */
        var S = window.G2048;
        if (!S) {
            S = window.G2048 = { board: emptyBoard(), score: 0, best: 0, won: false, over: false, kept: false, cells: [], last: emptyBoard() };
            try { S.best = readBest(); } catch (e) { S.best = 0; }

            for (var c = 0; c < 16; c++) {
                var cell = document.createElement('div');
                cell.className = 'g-cell';
                grid.appendChild(cell);
                S.cells.push(cell);
            }

            function drop() {
                var free = [];
                for (var i = 0; i < 4; i++) for (var j = 0; j < 4; j++) if (S.board[i][j] === 0) free.push([i, j]);
                if (!free.length) return;
                var spot = free[Math.floor(Math.random() * free.length)];
                S.board[spot[0]][spot[1]] = Math.random() < 0.9 ? 2 : 4;
            }

            function saveBest() {
                try { localStorage.setItem('best2048', String(S.best)); } catch (e) { /* 同上 */ }
            }

            function flash(el, cls) {
                if (reduceMotion || !el) return;
                el.classList.remove(cls);
                /* 强制 reflow 让同名动画可以重复触发 */
                void el.offsetWidth;
                el.classList.add(cls);
                setTimeout(function () { el.classList.remove(cls); }, 320);
            }

            function paint() {
                if (!S.won) {
                    for (var r = 0; r < 4; r++) for (var q = 0; q < 4; q++) if (S.board[r][q] === 2048) S.won = true;
                }
                if (!S.over && !movesAvailable(S.board)) S.over = true;

                for (var i = 0; i < 4; i++) {
                    for (var j = 0; j < 4; j++) {
                        var v = S.board[i][j];
                        var el = S.cells[i * 4 + j];
                        el.className = v > 2048 ? 'g-cell tsuper' : ('g-cell' + (v ? ' t' + v : ''));
                        el.textContent = v || '';
                        var was = S.last[i][j];
                        if (v && !was) flash(el, 'spawn');
                        else if (v && was && v > was) flash(el, 'pop');
                    }
                }
                S.last = cloneBoard(S.board);
                document.getElementById('gScore').textContent = String(S.score);
                document.getElementById('gBest').textContent = String(S.best);

                var msg = document.getElementById('gMsg');
                var text = document.getElementById('gMsgText');
                var keep = document.getElementById('gKeep');
                var t = window.SITE_RUNTIME ? window.SITE_RUNTIME.t : function (k) { return k; };
                /* 刚合成 2048 时先看胜利，再继续看是否无路可走 */
                if (S.won && !S.kept) {
                    msg.className = 'g-msg show won';
                    text.textContent = t('g_win');
                    keep.hidden = false;
                } else if (S.over) {
                    msg.className = 'g-msg show';
                    text.textContent = t('g_over');
                    keep.hidden = true;
                } else {
                    msg.className = 'g-msg';
                    keep.hidden = true;
                }
            }

            S.reset = function () {
                S.board = emptyBoard();
                S.last = emptyBoard();
                S.score = 0;
                S.won = false;
                S.over = false;
                S.kept = false;
                drop();
                drop();
                paint();
                writeSave(S);
                document.getElementById('gRestored').hidden = true;
            };

            S.move = function (dir) {
                /* 胜利弹层没关掉之前不接受移动，避免玩家没看到结果就滑走 */
                if (S.over || (S.won && !S.kept)) return false;
                var res = applyMove(S.board, dir);
                if (!res.moved) {
                    flash(document.getElementById('gBoard'), 'nudge');
                    return false;
                }
                var before = S.score;
                S.board = res.board;
                S.score += res.gained;
                if (S.score > S.best) { S.best = S.score; saveBest(); }
                drop();
                paint();
                /* 真的动过一步，才算"玩过 2048" */
                try { localStorage.setItem('lastPlayedGame', '2048'); } catch (e) {}
                if (S.score > before) flash(document.getElementById('gScore'), 'bump');
                tone(240, .06, 'triangle', .04);
                if (res.gained) tone(320 + 40 * Math.log2(res.gained), .12, 'sine', .07);
                if (S.won && !S.kept) { tone(523, .12); setTimeout(function () { tone(659, .12); }, 110); setTimeout(function () { tone(784, .2); }, 220); }
                if (S.over) tone(150, .3, 'sawtooth', .05);
                writeSave(S);
                return true;
            };

            document.getElementById('gNew').addEventListener('click', function () { ensureAudio(); S.reset(); });
            document.getElementById('gRetry').addEventListener('click', function () { ensureAudio(); S.reset(); });
            var keepBtn = document.getElementById('gKeep');
            keepBtn.addEventListener('click', function () {
                /* 隐藏的继续按钮不该把新开局污染成"已继续" */
                if (keepBtn.hidden) return;
                ensureAudio();
                S.kept = true;
                paint();
                writeSave(S);
            });

            var soundBtn = document.getElementById('gSound');
            function paintSound() {
                var A = audio();
                soundBtn.setAttribute('aria-pressed', String(A.on));
                soundBtn.classList.toggle('off', !A.on);
                soundBtn.querySelector('.i-on').style.display = A.on ? '' : 'none';
                soundBtn.querySelector('.i-off').style.display = A.on ? 'none' : '';
            }
            soundBtn.addEventListener('click', function () {
                var A = audio();
                A.on = !A.on;
                try { localStorage.setItem('g2048sound', A.on ? 'on' : 'off'); } catch (e) { /* 同上 */ }
                if (A.on) { ensureAudio(); tone(660, .08, 'sine', .05); }
                paintSound();
            });
            paintSound();

            var KEYS = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', a: 'left', d: 'right', w: 'up', s: 'down', A: 'left', D: 'right', W: 'up', S: 'down' };

            /* 键盘只在"玩家确实准备下这一步"时接管：启动动画、菜单、弹层、输入框都让路 */
            function editableAncestor(node) {
                for (var el = node; el && el.getAttribute; el = el.parentElement || el.parentNode) {
                    var mode = el.getAttribute('contenteditable');
                    if (mode === 'true' || mode === 'plaintext-only') return el;
                }
                return null;
            }
            function inputBlocked(e) {
                if (!e || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.isComposing) return true;
                var target = e.target;
                var tag = (target && target.tagName) || '';
                if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || editableAncestor(target)) return true;
                if (document.body && document.body.classList.contains('nav-open')) return true;
                var langToggle = document.getElementById('langToggle');
                if (langToggle && langToggle.getAttribute('aria-expanded') === 'true') return true;
                if (document.documentElement.classList.contains('booting')) return true;
                var main = document.getElementById('main');
                if (main && main.inert) return true;
                if (openDialogPresent()) return true;
                return false;
            }
            /* 弹层（dialog）打开时方向键属于弹层，不属于棋盘 */
            function openDialogPresent() {
                var body = document.body;
                if (!body) return false;
                if (typeof body.querySelectorAll === 'function') return body.querySelectorAll('dialog[open]').length > 0;
                for (var i = 0; i < (body.children || []).length; i++) {
                    var el = body.children[i];
                    if (el && el.tagName === 'DIALOG' && el.getAttribute && el.getAttribute('open') !== null) return true;
                }
                return false;
            }
            document.addEventListener('keydown', function (e) {
                var dir = KEYS[e.key];
                if (!dir || inputBlocked(e)) return;
                e.preventDefault();
                ensureAudio();
                S.move(dir);
            });

            /* 滑动：指针事件 + 指针捕获；棋盘 touch-action:none，浏览器手势不会抢走这次触摸 */
            var boardEl = document.getElementById('gBoard');
            var px = 0, py = 0, pid = null;

            function usablePointer(e) {
                if (e.isPrimary === false) return false;
                if (typeof e.button === 'number' && e.button !== 0) return false;
                /* 覆盖层里的按钮要保留原生点击，不能被指针捕获抢走 */
                if (e.target && e.target.closest && e.target.closest('.g-msg')) return false;
                return true;
            }
            function releasePointer() {
                if (pid === null) return;
                var leaving = pid;
                pid = null;
                try { if (boardEl.releasePointerCapture) boardEl.releasePointerCapture(leaving); } catch (err) { /* 已释放 */ }
            }
            boardEl.addEventListener('pointerdown', function (e) {
                if (pid !== null || !usablePointer(e)) return;
                ensureAudio();
                pid = e.pointerId;
                px = e.clientX; py = e.clientY;
                try { boardEl.setPointerCapture(pid); } catch (err) { /* 老浏览器忽略 */ }
            });
            boardEl.addEventListener('pointerup', function (e) {
                if (pid === null || e.pointerId !== pid) return;
                var dx = e.clientX - px, dy = e.clientY - py;
                releasePointer();
                if (!usablePointer(e)) return;
                if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
                if (Math.abs(dx) > Math.abs(dy)) S.move(dx > 0 ? 'right' : 'left');
                else S.move(dy > 0 ? 'down' : 'up');
            });
            boardEl.addEventListener('pointercancel', function (e) { if (pid !== null && e.pointerId === pid) releasePointer(); });
            boardEl.addEventListener('lostpointercapture', function (e) { if (pid !== null && e.pointerId === pid) pid = null; });
            window.addEventListener('blur', releasePointer);
            boardEl.addEventListener('contextmenu', function (e) { e.preventDefault(); });
            boardEl.addEventListener('gesturestart', function (e) { e.preventDefault(); });
            boardEl.addEventListener('touchmove', function (e) { e.preventDefault(); }, { passive: false });

            /* 每一步都已经落盘；关页再写反而可能被另一个标签页的旧状态覆盖 */

            window.G2048_API = {
                setBoard: function (b) { S.board = cloneBoard(b); S.last = cloneBoard(b); S.over = false; S.won = false; S.kept = false; paint(); writeSave(S); },
                getBoard: function () { return cloneBoard(S.board); },
                move: function (dir) { return S.move(dir); },
                score: function () { return S.score; },
                reset: S.reset
            };

            var saved = readSave();
            if (saved) {
                S.board = cloneBoard(saved.board);
                S.last = cloneBoard(saved.board);
                S.score = saved.score;
                S.won = !!saved.won;
                S.kept = !!saved.kept;
                S.over = !!saved.over;
                if (S.score > S.best) { S.best = S.score; saveBest(); }
                paint();
                document.getElementById('gRestored').hidden = false;
            } else {
                S.reset();
            }
        }

        /* 切语言时只重画文案与覆盖层，不动棋局 */
        var msg = document.getElementById('gMsg');
        if (msg.classList.contains('show')) {
            document.getElementById('gMsgText').textContent = ctx.t((S.won && !S.kept) ? 'g_win' : 'g_over');
        }
    },

    data: [],

    jsonld: {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: '2048 · 云陌轩',
        url: 'https://yunmo-xuan.github.io/2048.html',
        inLanguage: ['zh-CN', 'zh-TW', 'en', 'ja']
    }
};
