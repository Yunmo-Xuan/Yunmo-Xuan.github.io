/* 打包：把分模块的 html/css/js 合成一个可直接双击打开的单文件，与源码同目录输出 */
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'src');
const OUT = process.argv[2] || path.join(__dirname, '中国象棋.html');
const read = p => fs.readFileSync(path.join(SRC, p), 'utf8');

const scripts = ['js/engine.js', 'js/ai.js', 'js/ui.js']
  .map(f => '<script>\n' + read(f).replace(/if \(typeof module.*$/gm, '').trim() + '\n</script>')
  .join('\n');

const out = read('html/head.html')
  + '<style>\n' + read('css/style.css').trim() + '\n</style>\n</head>\n'
  + read('html/body.html').trim() + '\n'
  + scripts + '\n</body>\n</html>\n';

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, out, 'utf8');
console.log('已生成 ' + OUT + '（'
  + (Buffer.byteLength(out, 'utf8') / 1024).toFixed(1) + ' KB，'
  + out.split('\n').length + ' 行）');
