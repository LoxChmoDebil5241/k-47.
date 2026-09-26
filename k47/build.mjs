// Сборка единого HTML «К-47. Нормы расхода плоти. Цикл-48 (финал).html» из исходных частей.
//   node k47/build.mjs          — собрать
//   node k47/build.mjs --check  — собрать и проверить синтаксис скрипта (node --check)
import { readFileSync, writeFileSync, readdirSync, mkdtempSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const src = p => join(here, 'src', p);
const read = p => readFileSync(src(p), 'utf8');
const list = dir => readdirSync(src(dir)).filter(f => !f.startsWith('.')).sort();

const css = list('css').map(f => `/* ---- ${f} ---- */\n${read(`css/${f}`)}`).join('\n');
const jsFiles = list('js');
const games = list('games').map(f => `games/${f}`);
const entry = jsFiles.indexOf('99-entry.js');
const order = [...jsFiles.slice(0, entry).map(f => `js/${f}`), ...games, ...jsFiles.slice(entry).map(f => `js/${f}`)];
const js = order.map(f => `// ==== ${f} ====\n${read(f)}`).join('\n');

const book = read('book-data.json').trim();
JSON.parse(book);                                   // книга должна быть валидным JSON

const html = `${read('head.html').trimEnd()}
<style>
${css}
</style>
<script type="importmap">
{ "imports": { "three": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js" } }
</script>
</head>
${read('body.html').trimEnd()}
<script type="application/json" id="book-data">${book}</script>
<script type="module">
${js}
</script>
</body>
</html>
`;

const out = join(here, '..', 'К-47. Нормы расхода плоти. Цикл-48 (финал).html');
writeFileSync(out, html);
console.log(`собрано: ${out} — ${(Buffer.byteLength(html) / 1024).toFixed(0)} КБ, модулей ${order.length} (игр ${games.length})`);

if (process.argv.includes('--check')) {
  const tmp = join(mkdtempSync(join(tmpdir(), 'k47-')), 'check.mjs');
  writeFileSync(tmp, js);
  execFileSync(process.execPath, ['--check', tmp], { stdio: 'inherit' });
  console.log('синтаксис: ок');
}
