/* ==========================================================================
   БЛАНК — трудовой договор. Всё на листе живое: фоновый текст листается,
   дрожит, плывёт в расфокусе, отдельные фразы вдруг становятся чёткими;
   мысли Комарова беспрерывно всплывают и растворяются.
   Подпись → имя стирается кровью пальцем, поверх пишется «К-0» → штамп.
   Отказ → взгляд поднимается: серая комната, двое напротив → перезапуск.
   ========================================================================== */
const CONTRACT = {
  words: ['актив', 'клонирование', 'регенерация', 'нейропрофиль', 'цикл', 'биомасса', 'утилизация', 'деактивация',
    'регламент', 'нормы', 'расход', 'плоть', 'смерть', 'воскрешение', 'контракт', 'эксперимент', 'подавление',
    'отклонение', 'апелляция', 'приказ', 'уничтожение', 'отказ', 'покой', 'Vitezstvi', 'Купол-7', 'К-0', '2999', 'биоматериал',
    'пункт 4.7', 'не предусмотрен', 'подпись', 'носитель', 'объект', 'смена', 'расходный', 'списание', 'норма', 'восстановление'],
  // фразы, которые иногда проступают на фоне резко и отчётливо
  sharp: ['АКТИВ ПОДЛЕЖИТ ВОССТАНОВЛЕНИЮ', 'ОТКАЗ НЕ ПРЕДУСМОТРЕН', 'НОРМА РАСХОДА: 47', 'БИОМАТЕРИАЛ СПИСЫВАЕТСЯ',
    'ПОДПИСЬ ОБЯЗАТЕЛЬНА', 'ЦИКЛ 48', 'НЕЙРОПРОФИЛЬ СОХРАНЁН', 'УТИЛИЗАЦИЯ ЗА СЧЁТ РАБОТОДАТЕЛЯ', 'ВЫ УЖЕ ПОДПИСЫВАЛИ'],
  primary: [
    'Странное слово… регенерация…', 'Актив… это я? Или не я?', 'К-0… красивый номер…', 'Я не понимаю. Ничего.',
    'Там что-то про смерть… или нет?', 'Мне кажется, я уже это подписывал…', 'Я не хочу читать. Я устал.',
    'Голова пустая. Только слова.', 'Эта комната пахнет страхом.', 'Я не знаю, кто я. Совсем.', 'Мне кажется, я уже умирал.',
    'Рука сама тянется к подписи…', 'Нормы расхода плоти… странные слова…', 'Нейропрофиль… моя голова?', 'Утилизация… это конец?',
  ],
  childhood: [
    'Пахнет мамой… или нет?', 'Холодно. Всегда холодно.', 'Там, где темно… я помню…', 'Он смотрел сквозь меня. Всегда.',
    'Считать… считать… до тысячи…', 'Гвоздь. Кровь. Тишина.', 'Почему я не плачу?', 'Она ушла… или я ушёл?',
    'Отец не обнимал. Никогда.', 'Мама… у тебя были тёплые руки?', 'В берлоге… темно… я один…', 'Я не помню её лица. Совсем.',
    'Я помню только холод. И пустоту.', 'Она улыбалась на фотографии…', 'Мама… я стал сильным. Но я не знаю, зачем.',
  ],
  final: ['ПОДПИСЫВАЙ', 'ПОДПИШИ', 'ПОДПИСЬ', 'НЕМЕДЛЕННО', 'ОНИ ЖДУТ'],
  shades: ['#88ddff', '#66ccff', '#aaddff', '#44aadd', '#bbeeff', '#5599cc', '#77ccff', '#99ddff'],
  // сцена отказа (глава 14): толстый — директор, в очках — «кто-то из штаба»
  refusal: [
    { who: 'fat', text: 'Что...?!', pitch: 0.7 },
    { who: 'thin', text: 'Я что, зря сюда приехал?!', pitch: 1.15 },
    { who: 'thin', text: '...', pitch: 1 },
    { who: 'thin', text: 'Может это и к лучшему.', pitch: 1.05 },
  ],
};

/* ---------- фон: поле слов, которое листается, дрожит и плывёт ---------- */
function createWordField(scope, canvas) {
  const g = canvas.getContext('2d');
  const ROW = 22;
  let W = 0, H = 0, k = 1, bands = [], t = 0, speed = 14, flipV = 0, nextFlip = rand(4, 7), intensity = 0;
  const phrases = [];
  let nextPhrase = rand(1.5, 3);

  function renderBand(b) {
    const s = b.sharp.getContext('2d'), bl = b.blur.getContext('2d');
    s.setTransform(1, 0, 0, 1, 0, 0); s.clearRect(0, 0, b.sharp.width, b.sharp.height);
    s.setTransform(k, 0, 0, k, 0, 0);
    s.font = `${Math.round(rand(10, 13))}px "Courier New", monospace`;
    s.fillStyle = 'rgba(136,221,255,1)';
    let x = rand(-40, 10);
    while (x < W + 160) {
      const w = Math.random() < 0.08 ? pick(CONTRACT.sharp).toLowerCase() : pick(CONTRACT.words);
      s.globalAlpha = rand(0.5, 1);
      s.fillText(w, x, ROW * 0.7); x += s.measureText(w).width + rand(8, 18);
    }
    bl.setTransform(1, 0, 0, 1, 0, 0); bl.clearRect(0, 0, b.blur.width, b.blur.height);
    if ('filter' in bl) bl.filter = `blur(${(rand(1.6, 3) * k).toFixed(1)}px)`;
    bl.drawImage(b.sharp, 0, 0);
    if ('filter' in bl) bl.filter = 'none';
  }
  function makeBand(y) {
    const mk = () => { const c = document.createElement('canvas'); c.width = Math.round((W + 200) * k); c.height = Math.round(ROW * k); return c; };
    const b = { y, sharp: mk(), blur: mk(), alpha: rand(0.1, 0.28), shake: 0, focus: 0, phase: rand(0, 6.28), sway: rand(10, 40) };
    renderBand(b);
    return b;
  }
  function build() {
    k = Math.min(1.5, window.devicePixelRatio || 1);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * k); canvas.height = Math.round(H * k);
    bands = [];
    for (let y = -ROW; y < H + ROW; y += ROW) bands.push(makeBand(y));
  }
  function step(dt) {
    t += dt;
    // «листание»: время от времени лист резко прокручивается на полстраницы
    nextFlip -= dt;
    if (nextFlip <= 0) { flipV = H * rand(0.9, 1.6); nextFlip = rand(3.5, 7.5) / (1 + intensity); Audio47.sfx.page(); }
    const v = speed * (1 + intensity) + flipV;
    flipV *= Math.pow(0.08, dt);
    let refreshed = 0;
    for (const b of bands) {
      b.y -= v * dt;
      if (b.y < -ROW) {
        b.y += bands.length * ROW;
        if (refreshed++ < 2) renderBand(b);          // слова меняются, пока строка «за кадром»
      }
      if (b.shake > 0) b.shake -= dt;
      if (b.focus > 0) b.focus -= dt;
    }
    if (Math.random() < dt * (1.5 + intensity * 4)) pick(bands).shake = rand(0.25, 1.1);
    if (Math.random() < dt * 0.6) pick(bands).focus = rand(0.8, 1.8);
    nextPhrase -= dt;
    if (nextPhrase <= 0) {
      nextPhrase = rand(2.2, 4.5) / (1 + intensity);
      phrases.push({ text: pick(CONTRACT.sharp), x: rand(0.04, 0.6) * W, y: rand(0.08, 0.92) * H, t: 0, life: rand(1.6, 2.8), size: Math.round(rand(12, 18)) });
    }
    draw();
  }
  function draw() {
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, canvas.width, canvas.height);
    for (const b of bands) {
      const wave = 0.5 + 0.5 * Math.sin(t * 0.55 + b.y * 0.012 + b.phase);          // волна расфокуса
      const focus = b.focus > 0 ? Math.sin(Math.min(1, b.focus) * Math.PI) : 0;
      const blurMix = clamp(wave - focus, 0, 1);
      const x = (-100 + Math.sin(t * 0.25 + b.phase) * b.sway + (b.shake > 0 ? rand(-4, 4) : 0)) * k;
      const y = (b.y + (b.shake > 0 ? rand(-1.5, 1.5) : 0)) * k;
      g.globalAlpha = b.alpha * blurMix * 1.3; g.drawImage(b.blur, x, y);
      g.globalAlpha = Math.min(1, b.alpha * (1 - blurMix) * 0.9 + focus * 0.35); g.drawImage(b.sharp, x, y);
    }
    g.globalAlpha = 1;
    g.setTransform(k, 0, 0, k, 0, 0);
    for (let i = phrases.length - 1; i >= 0; i--) {
      const p = phrases[i];
      p.t += 1 / 30;
      const a = Math.sin(Math.min(1, p.t / p.life) * Math.PI);
      g.font = `700 ${p.size}px "Courier New", monospace`;
      g.fillStyle = `rgba(200,240,255,${(a * 0.85).toFixed(3)})`;
      g.fillText(p.text, p.x + (Math.random() < 0.1 ? rand(-2, 2) : 0), p.y);
      if (p.t >= p.life) phrases.splice(i, 1);
    }
  }
  build();
  scope.tick('wordfield', dt => step(dt), 30);
  scope.on(window, 'k47:resize', build);
  return { setIntensity(v) { intensity = v; } };
}

/* ---------- пункты договора: постраничная прокрутка, расфокус, дрожь, подмена слов ---------- */
function createClauses(scope, box) {
  const reg = (BOOK[45] && BOOK[45].p) || [];
  const texts = ['ПРИЛОЖЕНИЕ № 1 К ТРУДОВОМУ ДОГОВОРУ. ВЫПИСКА ИЗ РЕГЛАМЕНТА № К-00/Р']
    .concat(reg.slice(4, 26).filter(p => p !== '---'));
  texts.splice(4, 0, '4.7. Отказ от подписания настоящего договора регламентом не предусмотрен.');
  const para = (tx, i) => `<p class="${i === 0 ? 'cl-num' : i === 4 ? 'cl-47' : ''}">${tx.split(/\s+/).map(w => `<span class="w">${w}</span>`).join(' ')}</p>`;
  const one = texts.map(para).join('');
  box.innerHTML = `<div class="clauses-track">${one}${one}</div>`;
  const track = box.firstChild;
  const ps = $$('p', track), ws = $$('.w', track);
  let y = 0, half = 0, v = 9, burst = 0, nextPage = rand(4, 7);
  const measure = () => { half = track.scrollHeight / 2; };
  measure();
  scope.on(window, 'k47:resize', measure);
  scope.tick('clauses', dt => {
    nextPage -= dt;
    if (nextPage <= 0) { burst = box.clientHeight * rand(0.55, 0.9) * 2.6; nextPage = rand(4.5, 8); }
    y += (v + burst) * dt; burst *= Math.pow(0.06, dt);
    if (half > 0 && y >= half) y -= half;
    track.style.transform = `translate3d(0,${(-y).toFixed(1)}px,0)`;
  });
  const EFFECTS = ['blur', 'blur', 'shake', 'sharp', 'dim', 'drift'];
  (function effect() {
    const p = pick(ps), cls = pick(EFFECTS);
    p.classList.add(cls);
    scope.timeout(() => p.classList.remove(cls), rand(1400, 4200));
    scope.timeout(effect, rand(450, 1100));
  })();
  const GLYPHS = '█▓▒░#@%&К0470';
  (function glitch() {
    const w = pick(ws);
    if (!w.dataset.o) {
      w.dataset.o = w.textContent;
      w.textContent = Math.random() < 0.6 ? pick(CONTRACT.words) : Array.from({ length: w.dataset.o.length }, () => pick([...GLYPHS])).join('');
      w.classList.add('glitch');
      scope.timeout(() => { w.textContent = w.dataset.o; delete w.dataset.o; w.classList.remove('glitch'); }, rand(220, 900));
    }
    scope.timeout(glitch, rand(140, 420));
  })();
}

/* ---------- кровь: «пальцем» зачёркиваем имя и пишем «К-0» ---------- */
function createBloodWriter(scope, canvas) {
  const g = canvas.getContext('2d');
  let k = 1, W = 0, H = 0;
  const drips = [];
  function fit() {
    const r = canvas.getBoundingClientRect();
    k = Math.min(2, window.devicePixelRatio || 1); W = r.width; H = r.height;
    canvas.width = Math.round(W * k); canvas.height = Math.round(H * k);
    g.setTransform(k, 0, 0, k, 0, 0);
  }
  const col = a => `rgba(${Math.round(rand(95, 140))},${Math.round(rand(0, 8))},${Math.round(rand(0, 10))},${a.toFixed(3)})`;
  function dab(x, y, r, load) {
    g.fillStyle = col(0.35 + load * 0.5);
    g.beginPath(); g.arc(x + rand(-0.8, 0.8), y + rand(-0.8, 0.8), r * rand(0.85, 1.1), 0, Math.PI * 2); g.fill();
    if (load < 0.45 && Math.random() < 0.5) {                         // палец подсыхает: рваные края
      g.clearRect(x + rand(-r, r) - 1, y + rand(-r, r) - 1, rand(1, 3), rand(1, 3));
    }
    if (Math.random() < 0.06) { g.fillStyle = col(0.7); g.beginPath(); g.arc(x + rand(-r * 2, r * 2), y + rand(-r * 2, r * 2), rand(0.5, 1.4), 0, Math.PI * 2); g.fill(); }
  }
  /** провести «пальцем» по ломаной pts за dur секунд */
  function stroke(pts, dur, { r = 5, load0 = 1, load1 = 0.35, drip = 2 } = {}) {
    const seg = []; let total = 0;
    for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); total += d; }
    return new Promise(res => {
      let t = 0, done = 0;
      const id = `blood${Math.random().toString(36).slice(2, 7)}`;
      const at = s => {
        let acc = 0;
        for (let i = 0; i < seg.length; i++) {
          if (acc + seg[i] >= s) { const f = (s - acc) / (seg[i] || 1); return [lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f)]; }
          acc += seg[i];
        }
        return pts[pts.length - 1];
      };
      scope.tick(id, dt => {
        t = Math.min(1, t + dt / dur);
        const upto = easeInOutCubic(t) * total;
        for (let s = done; s <= upto; s += 1.1) {
          const f = s / total, [x, y] = at(s);
          const load = lerp(load0, load1, f);
          dab(x, y, r * (0.75 + 0.35 * Math.sin(f * Math.PI)) * (0.7 + load * 0.4), load);
          if (drip && Math.random() < 0.004 * drip * load) drips.push({ x: x + rand(-2, 2), y: y + r * 0.6, len: rand(8, 34) * load, cur: 0, v: rand(9, 22), r: rand(1.2, 2.2) });
        }
        done = upto;
        if (t >= 1) {
          const [ex, ey] = pts[pts.length - 1];
          g.fillStyle = col(0.55 * load1 + 0.3); g.beginPath(); g.ellipse(ex, ey, r * 1.1, r * 0.8, 0, 0, Math.PI * 2); g.fill();
          scope.untick(id); res();
        }
      });
    });
  }
  scope.tick('drips', dt => {
    for (let i = drips.length - 1; i >= 0; i--) {
      const d = drips[i], step = Math.min(d.len - d.cur, d.v * dt);
      for (let s = 0; s < step; s += 0.8) { g.fillStyle = col(0.75); g.beginPath(); g.arc(d.x, d.y + d.cur + s, d.r * (1 - (d.cur + s) / (d.len * 2.2)), 0, Math.PI * 2); g.fill(); }
      d.cur += step; d.v *= Math.pow(0.55, dt);
      if (d.cur >= d.len || d.v < 1.2) { g.fillStyle = col(0.85); g.beginPath(); g.arc(d.x, d.y + d.cur, d.r * 1.35, 0, Math.PI * 2); g.fill(); drips.splice(i, 1); }
    }
  });
  return {
    fit, clear() { drips.length = 0; g.clearRect(0, 0, W, H); },
    /** name — прямоугольник имени относительно холста; возвращает промис */
    async strikeAndWrite(name) {
      const y = name.y + name.h * 0.52, x0 = name.x - 6, x1 = name.x + name.w + 6;
      await stroke([[x0, y - 2], [lerp(x0, x1, 0.3), y + 2], [lerp(x0, x1, 0.65), y - 3], [x1, y + 1]], 0.9, { r: 3.6, load1: 0.45, drip: 3 });
      await stroke([[x1 + 2, y + 4], [lerp(x0, x1, 0.5), y + 2], [x0 + 12, y + 5]], 0.7, { r: 2.4, load0: 0.5, load1: 0.15, drip: 1 });
      await scope.wait(260);
      // «К-0» справа от имени, пальцем
      const h = Math.min(H * 0.62, name.h * 2.3), top = name.y + name.h - h + 4, L = x1 + 20, wK = h * 0.6;
      await stroke([[L, top], [L + 1, top + h]], 0.35, { r: 4.2, drip: 2 });
      await stroke([[L + wK, top + 2], [L + 3, top + h * 0.52]], 0.3, { r: 4, load0: 0.9 });
      await stroke([[L + 4, top + h * 0.5], [L + wK + 2, top + h]], 0.32, { r: 4, load0: 0.8, drip: 2 });
      const dx = L + wK + 12;
      await stroke([[dx, top + h * 0.55], [dx + h * 0.36, top + h * 0.53]], 0.22, { r: 3.6, load0: 0.7, drip: 0 });
      const ox = dx + h * 0.36 + 14 + h * 0.3, oy = top + h * 0.5, orx = h * 0.3, ory = h * 0.5, ring = [];
      for (let a = -Math.PI / 2; a <= Math.PI * 1.55; a += 0.18) ring.push([ox + Math.cos(a) * orx * rand(0.95, 1.05), oy + Math.sin(a) * ory]);
      await stroke(ring, 0.75, { r: 4.2, load0: 0.9, load1: 0.3, drip: 3 });
    },
  };
}

/* ---------- сцена ---------- */
Acts.contract = {
  enter(scope) {
    const root = $('#act-contract');
    Audio47.setAmbient('contract');
    GameState.agingLevel = 0;
    FX.setLevel(0, { instant: true });
    FX.clearBlood(); FX.setVisible(true);
    GameState.contract.signed = false;

    const signBtn = $('#signBtn'), refuseBtn = $('#refuseBtn');
    const who = $('#candidate'), stamp = $('#stamp'), sig = $('#sigCanvas');
    root.classList.remove('gazing', 'signed');
    $('#gaze').hidden = true; $('#gaze').className = 'gaze';
    stamp.classList.remove('on');
    who.classList.remove('struck');
    sig.getContext('2d').clearRect(0, 0, sig.width, sig.height);
    signBtn.disabled = false; refuseBtn.disabled = false;
    signBtn.classList.remove('pulse');

    const field = createWordField(scope, $('#contractBg'));
    createClauses(scope, $('#contractClauses'));
    const blood = createBloodWriter(scope, $('#bloodCanvas'));
    blood.fit(); blood.clear();

    // ---------- мысли: плывут беспрерывно ----------
    const layer = $('#contractThoughts');
    layer.innerHTML = '';
    const drifter = createDrifter(scope, layer, 'thoughts');
    let pool = [], stopThoughts = false, pressure = false;
    const t0 = Clock.now();
    function nextThought() {
      if (!pool.length) pool = shuffle([...CONTRACT.primary.map(t => ({ t, child: false })), ...CONTRACT.childhood.map(t => ({ t, child: true }))]);
      return pool.pop();
    }
    function spawnThought() {
      if (stopThoughts) return;
      if (drifter.count() < (pressure ? 9 : 7)) {
        const th = nextThought();
        const blurry = Math.random() < 0.3;
        drifter.spawn(th.t, {
          cls: `drift-thought${th.child ? ' child' : ''}`, color: pick(CONTRACT.shades),
          from: Math.random() < 0.35 ? 'edge' : 'inside', life: rand(7, 12),
          blur: blurry ? rand(0.8, 1.8) : 0, alpha: blurry ? 0.7 : rand(0.8, 1),
          shake: Math.random() < 0.2 ? rand(0.6, 1.6) : 0, scale: Math.random() < 0.3 ? [1.08, 0.92] : [0.94, 1.06],
        });
      }
      scope.timeout(spawnThought, rand(900, 2100) / (pressure ? 1.6 : 1));
    }
    function spawnFinal() {
      if (stopThoughts) return;
      drifter.spawn(pick(CONTRACT.final), { cls: 'drift-thought final', from: 'inside', life: rand(2.6, 3.8), shake: 3, scale: [1.25, 0.9], fin: 0.08, fout: 0.4 });
      Audio47.sfx.heartbeat(rand(0.45, 0.7));
      FX.shake('sm');
      signBtn.classList.add('pulse');
      scope.timeout(spawnFinal, rand(3200, 6000));
    }
    for (let i = 0; i < 3; i++) scope.timeout(spawnThought, 300 + i * 500);
    scope.timeout(() => { pressure = true; setSub('pressure'); field.setIntensity(0.6); spawnFinal(); }, 35000);
    scope.tick('pressure', () => { if (pressure) field.setIntensity(Math.min(1.6, 0.6 + (Clock.now() - t0 - 35000) / 60000)); }, 2);

    // ---------- подпись ----------
    function drawSignature() {
      return new Promise(resolve => {
        const r = sig.getBoundingClientRect();
        const w = Math.max(120, r.width), h = Math.max(30, r.height), kk = Math.min(2, window.devicePixelRatio || 1);
        sig.width = w * kk; sig.height = h * kk;
        const x = sig.getContext('2d');
        x.setTransform(kk, 0, 0, kk, 0, 0);
        const N = 900, dur = 1.5, A = Math.min(w / 2.6, h * 1.1) * 0.42;
        const pt = i => {
          const t = (i / N) * 4 * Math.PI;
          return [w / 2 + A * 1.9 * (Math.sin(2.3 * t) + 0.4 * Math.cos(5.1 * t)) * 0.62, h / 2 + A * (Math.cos(1.7 * t) + 0.4 * Math.sin(4.9 * t)) * 0.62];
        };
        let tt = 0, drawn = 0;
        x.clearRect(0, 0, w, h);
        x.lineJoin = x.lineCap = 'round';
        x.strokeStyle = '#00d4ff'; x.lineWidth = 2.4; x.shadowColor = '#00d4ff'; x.shadowBlur = 10;
        scope.tick('signature', dt => {
          tt += dt;
          const p = Math.min(1, tt / dur), upto = Math.floor(easeOutCubic(p) * N);
          if (upto > drawn) {
            x.beginPath(); const [sx, sy] = pt(drawn); x.moveTo(sx, sy);
            for (let i = drawn + 1; i <= upto; i++) { const [px, py] = pt(i); x.lineTo(px, py); }
            x.stroke(); drawn = upto;
          }
          if (p >= 1) { scope.untick('signature'); resolve(); }
        });
      });
    }

    async function sign() {
      if (GameState.contract.signed || signBtn.disabled) return;
      GameState.contract.signed = true;
      signBtn.disabled = true; refuseBtn.disabled = true; signBtn.classList.remove('pulse');
      stopThoughts = true;
      root.classList.add('signed');
      Audio47.unlock();
      Audio47.sfx.sign();
      await drawSignature();
      await scope.wait(450);
      // имя Комарова — кровью, пальцем
      blood.fit();
      const cv = $('#bloodCanvas').getBoundingClientRect(), nm = $('#candName').getBoundingClientRect();
      Audio47.sfx.heartbeat(0.7);
      who.classList.add('struck');
      await blood.strikeAndWrite({ x: nm.left - cv.left, y: nm.top - cv.top, w: nm.width, h: nm.height });
      await scope.wait(700);
      stamp.classList.add('on');
      Audio47.sfx.stamp();
      FX.shake('sm'); FX.vibrate(60);
      Save.progress();
      await scope.wait(1900);
      startAct('room', { flash: '#ff0033' });
    }

    // ---------- отказ: персонаж поднимает взгляд ----------
    async function refuse() {
      if (GameState.contract.signed || refuseBtn.disabled) return;
      signBtn.disabled = true; refuseBtn.disabled = true; signBtn.classList.remove('pulse');
      stopThoughts = true;
      drifter.clear();
      Audio47.sfx.error();
      Audio47.sfx.whoosh(1.6, true);
      root.classList.add('gazing');
      Audio47.setAmbient('office', 2.4);
      await scope.wait(1100);
      const gz = $('#gaze'), line = $('#gazeLine');
      gz.hidden = false; void gz.offsetWidth;
      gz.classList.add('on');
      await scope.wait(3000);
      for (const r of CONTRACT.refusal) {
        gz.dataset.who = r.who;
        line.className = `gaze-line ${r.who}`;
        line.textContent = r.text === '...' ? '...' : `— ${r.text}`;
        line.classList.add('show');
        const dur = r.text === '...' ? 1.8 : 0.6 + r.text.length * 0.06;
        if (r.text !== '...') Audio47.sfx.mumble(dur * 0.8, r.pitch);
        await scope.wait(dur * 1000 + 1500);
        line.classList.remove('show');
        await scope.wait(500);
      }
      gz.dataset.who = '';
      await scope.wait(900);
      gz.classList.add('close');
      Audio47.sfx.glitch(1.2);
      await scope.wait(1300);
      resetToBoot();
    }

    scope.on(signBtn, 'click', sign);
    scope.on(refuseBtn, 'click', refuse);
    scope.on(window, 'k47:resize', () => { if (!GameState.contract.signed) blood.fit(); });
    scope.timeout(() => signBtn.focus({ preventScroll: true }), 900);
  },
};
