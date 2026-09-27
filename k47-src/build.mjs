// Сборка единого HTML-файла игры из исходников k47-src/.
// Запуск: node k47-src/build.mjs  →  «К-47. Нормы расхода плоти. Цикл-48.html» в корне репозитория.
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = dirname(fileURLToPath(import.meta.url));
const ROOT = join(SRC, '..');
const OUT = join(ROOT, 'К-47. Нормы расхода плоти. Цикл-48.html');
const read = p => readFileSync(join(SRC, p), 'utf8');
const list = (dir, ext) => readdirSync(join(SRC, dir)).filter(f => f.endsWith(ext)).sort();

const css = list('css', '.css').map(f => `/* ===== ${f} ===== */\n${read(join('css', f)).trim()}`).join('\n\n');
const js = list('js', '.js').map(f => `/* ===== ${f} ===== */\n${read(join('js', f)).trim()}`).join('\n\n');
// текст книги: JSON внутри <script type="application/json">, «<» экранируем, чтобы не закрыть тег
const book = JSON.stringify(JSON.parse(read('data/book.json'))).replace(/</g, '\\u003c');

const html = read('shell.html')
  .replace('/*@CSS@*/', () => css)
  .replace('<!--@BODY@-->', () => read('body.html').trim())
  .replace('/*@BOOK@*/', () => book)
  .replace('/*@JS@*/', () => js);

writeFileSync(OUT, html);
// отдельный файл со скриптом — только для проверки синтаксиса (node --check)
if (process.argv.includes('--check')) {
  mkdirSync(join(SRC, '.tmp'), { recursive: true });
  writeFileSync(join(SRC, '.tmp', 'bundle.mjs'), js);
}
console.log(`OK → ${OUT} (${(html.length / 1024).toFixed(0)} КБ, код ${(js.length / 1024).toFixed(0)} КБ, стили ${(css.length / 1024).toFixed(0)} КБ)`);
