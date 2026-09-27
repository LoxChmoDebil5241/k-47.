// Сборка www/ для Capacitor из финальной HTML-версии игры.
// - three.js и шрифты кладутся локально (приложение работает без сети);
// - подключается media.js — слой настоящих звуков и изображений из media/.
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const APP = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC_HTML = resolve(APP, '..', 'К-47. Нормы расхода плоти. Цикл-48 (финал).html');
const WWW = join(APP, 'www');
const NM = join(APP, 'node_modules');

rmSync(WWW, { recursive: true, force: true });
mkdirSync(join(WWW, 'vendor', 'fonts'), { recursive: true });

let html = readFileSync(SRC_HTML, 'utf8');

function replaceOnce(re, to, what) {
  if (!re.test(html)) throw new Error(`build: не найдено — ${what}`);
  html = html.replace(re, to);
}

// three.js — локально
cpSync(join(NM, 'three', 'build', 'three.module.js'), join(WWW, 'vendor', 'three.module.js'));
replaceOnce(/https:\/\/cdn\.jsdelivr\.net\/npm\/three@[^"]+\/build\/three\.module\.js/, './vendor/three.module.js', 'importmap three');

// шрифты — локально (латиница + кириллица)
const fonts = [
  ['press-start-2p', ['latin', 'cyrillic', 'cyrillic-ext']],
  ['share-tech-mono', ['latin']],
];
let fontCss = '';
for (const [pkg, subsets] of fonts) {
  const dir = join(NM, '@fontsource', pkg);
  for (const sub of subsets) {
    const cssFile = join(dir, `${sub}-400.css`);
    if (!existsSync(cssFile)) continue;
    fontCss += readFileSync(cssFile, 'utf8').replace(/\.\/files\//g, './fonts/') + '\n';
  }
  for (const f of readdirSync(join(dir, 'files'))) {
    if (f.endsWith('.woff2')) cpSync(join(dir, 'files', f), join(WWW, 'vendor', 'fonts', f));
  }
}
writeFileSync(join(WWW, 'vendor', 'fonts.css'), fontCss);
html = html.replace(/<link rel="preconnect"[^>]*>\s*/g, '');
replaceOnce(/<link href="https:\/\/fonts\.googleapis\.com[^>]*>/, '<link rel="stylesheet" href="./vendor/fonts.css">', 'google fonts');

// медиа-слой: после основного модуля игры
replaceOnce(/<\/body>/, '<script type="module" src="./media.js"></script>\n</body>', '</body>');

writeFileSync(join(WWW, 'index.html'), html);
cpSync(join(APP, 'src', 'media.js'), join(WWW, 'media.js'));
cpSync(join(APP, 'media'), join(WWW, 'media'), { recursive: true, filter: s => !s.endsWith('.gitkeep') });

console.log('www/ собран:', WWW);
