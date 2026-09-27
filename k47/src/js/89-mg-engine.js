/* ==========================================================================
   МИНИ-ИГРЫ · ДВИЖОК
   По фрагменту нейрослепка на каждую главу. Мини-игра запускается до чтения
   текста главы; результат определяет, каким будет текст:
     ВОССТАНОВЛЕН (ok)   — полный текст + запись в блокнот;
     ИСКАЖЁН (dist)      — текст с глитчами + особая запись;
     ПОВРЕЖДЁН (dmg)     — глитч-текст + износ носителя (+6%, при 100% — клон уничтожен);
     НЕ ВОССТАНОВЛЕН (skip) — читатель отказался играть: глитч-текст без износа.
   Игра: F.start(ctx) → Promise<{ ok: 'ok' | 'dist' | 'fail', detail?, note? }>.
   ========================================================================== */
const FRAGS = [];
/** регистрация фрагмента: ch — индекс главы (0…48) */
function defineFrag(ch, def) { FRAGS[ch] = { ch, ...def }; }
const WEAR_STEP = 6, WEAR_HEAL = 3;
const STATUS_LABEL = { ok: 'ВОССТАНОВЛЕН', dist: 'ИСКАЖЁН', dmg: 'ПОВРЕЖДЁН', skip: 'НЕ ВОССТАНОВЛЕН', none: 'ПОВРЕЖДЁН' };
const chTitle = i => (BOOK[i] ? BOOK[i].t.replace(/\.$/, '') : '');

const Frag = (() => {
  let busy = false, current = null;
  const st = () => GameState.frag;
  const status = i => st().st[i] || null;
  /** доля «битых» символов в тексте главы */
  const glitch = i => { const s = status(i); return !FRAGS[i] || s === 'ok' ? 0 : s === 'dist' ? 0.06 : 0.17; };
  function counts() {
    const v = Object.values(st().st);
    return { ok: v.filter(x => x === 'ok').length, dist: v.filter(x => x === 'dist').length, dmg: v.filter(x => x === 'dmg' || x === 'skip').length, total: FRAGS.filter(Boolean).length };
  }

  /* ---------- окно перед игрой ---------- */
  function showIntro(F, { replay }) {
    return new Promise(res => {
      const m = $('#mgIntro'), s = status(F.ch);
      $('#mgIntroKicker').textContent = `ГЛАВА ${F.ch + 1} · ФРАГМЕНТ ${STATUS_LABEL[s || 'none']}`;
      $('#mgIntroTitle').textContent = `«${chTitle(F.ch)}» — ${F.name}`;
      const t = $('#mgIntroText');
      t.className = `frag-text${s === 'ok' ? ' clean' : ''}`;
      t.innerHTML = s === 'ok' ? esc(F.text) : glitchHTML(F.text, s === 'dist' ? 0.16 : 0.38, hash(F.id) + 3);
      $('#mgIntroHow').textContent = F.how;
      $('#mgIntroKeys').textContent = F.keys;
      const go = $('#mgIntroGo'), back = $('#mgIntroBack');
      go.textContent = s === 'ok' ? 'ПРОЖИТЬ ЕЩЁ РАЗ' : 'ВОССТАНОВИТЬ ФРАГМЕНТ';
      back.textContent = replay ? 'НАЗАД' : 'ЧИТАТЬ ПОВРЕЖДЁННЫМ';
      let done = false;
      const finish = v => { if (done) return; done = true; go.onclick = back.onclick = null; Modal.close(m, true); res(v); };
      go.onclick = () => { A.ensure(); A.sfx.beep(880, 0.1); finish('go'); };
      back.onclick = () => { Audio47.sfx.click(); finish(replay ? 'back' : 'skip'); };
      Modal.open(m, { onClose: () => finish(replay ? 'back' : 'skip'), focus: '#mgIntroGo' });
    });
  }

  /* ---------- сама игра на сцене ---------- */
  function runGame(F) {
    return new Promise(resolve => {
      const scope = new Scope(`mg${F.ch}`);
      // клавиши и указатель на document/window не доходят до игры, пока открыто окно или пауза
      const on0 = scope.on.bind(scope);
      scope.on = (t, type, fn, opts) => on0(t, type, (t === document || t === window) && /^(key|pointer)/.test(type)
        ? e => { if (Modal.isOpen() || Game.paused) return; fn(e); } : fn, opts);
      const stage = $('#mgStage'), body = $('#mgBody'), hintEl = $('#mgHint'), statEl = $('#mgStat');
      body.innerHTML = ''; body.className = 'mg-body'; body.style.cssText = '';
      hintEl.textContent = ''; statEl.textContent = '';
      stage.className = `mg-stage mg-${F.id}`;
      $('#mgTitle').textContent = `ГЛ. ${F.ch + 1} · «${chTitle(F.ch)}» · ${F.name.toUpperCase()}`;
      stage.hidden = false;
      FX.setVisible(false);
      FX.flash('#ff0033', 500, 0.35);
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
      const sayEls = {};
      const ctx = {
        scope, body, F, ch: F.ch, cycle: GameState.cycle,
        now: () => Clock.now(),
        hint(t) { hintEl.textContent = t; },
        stat(t) { statEl.textContent = t; },
        canvas(parent = body, opts) { return makeCanvas(scope, parent, opts); },
        el(tag, cls = '', parent = body, html = '') { const e = document.createElement(tag); if (cls) e.className = cls; if (html) e.innerHTML = html; parent.appendChild(e); return e; },
        say(text, { pos = 'bot', cls = '' } = {}) {
          let e = sayEls[pos];
          if (!e || !e.isConnected) { e = sayEls[pos] = ctx.el('p', `say ${pos}`); e.setAttribute('aria-live', 'polite'); }
          e.className = `say ${pos} ${cls}`; e.textContent = text; void e.offsetWidth; e.classList.add('show');
          return e;
        },
        unsay(pos = 'bot') { const e = sayEls[pos]; if (e) e.classList.remove('show'); },
        async line(text, { pos = 'bot', cls = '', ms = 0 } = {}) {
          ctx.say(text, { pos, cls });
          await scope.wait(ms || 1500 + text.length * 42);
          ctx.unsay(pos);
          await scope.wait(420);
        },
        /** полоска-индикатор; set(0…1) */
        meter(label, { cls = '', left, right, top, bottom } = {}) {
          const m = ctx.el('div', `meter ${cls}`, body, `<span>${esc(label)}</span><div class="mb"><i></i></div>`);
          Object.entries({ left, right, top, bottom }).forEach(([k, v]) => { if (v !== undefined) m.style[k] = typeof v === 'number' ? `${v}px` : v; });
          const fill = $('i', m), lab = $('span', m);
          return { el: m, set(v) { fill.style.width = `${clamp(v, 0, 1) * 100}%`; }, label(t) { lab.textContent = t; } };
        },
        /** выбор кнопками внизу (и клавишами 1…N); вернёт индекс */
        choose(items, { cls = '', col = false } = {}) {
          return new Promise(res => {
            const box = ctx.el('div', `ctl choose${col ? ' col' : ''}`);
            let done = false;
            const fin = k => { if (done) return; done = true; box.remove(); res(k); };
            items.forEach((label, k) => {
              const b = ctx.el('button', `btn ${cls}`, box, `${items.length > 1 ? `<b>${k + 1}</b> · ` : ''}${esc(label)}`);
              b.addEventListener('click', () => { A.sfx.click(); fin(k); });
            });
            scope.on(document, 'keydown', e => { const k = parseInt(e.key, 10); if (!done && k >= 1 && k <= items.length) { e.preventDefault(); A.sfx.click(); fin(k - 1); } });
            requestAnimationFrame(() => { const f = $('button', box); if (f && !done) f.focus({ preventScroll: true }); });
          });
        },
        /** клавиши игры (без Esc и автоповтора) */
        keys(fn) { scope.on(document, 'keydown', e => { if (e.key === 'Escape' || e.repeat) return; fn(e); }); },
      };
      let finished = false;
      const finish = r => {
        if (finished) return;
        finished = true; current = null;
        scope.dispose();
        body.innerHTML = '';
        stage.hidden = true;
        resolve(r);
      };
      current = { finish, F };
      const abort = async () => {
        if (finished || Modal.isOpen()) return;
        Audio47.sfx.click();
        Game.pause();
        const ok = await askConfirm('ПРЕРВАТЬ?', 'Фрагмент останется как был. Износ не начисляется.', 'Прервать', 'Остаться');
        Game.resume();
        if (ok) finish({ ok: 'abort' });
      };
      scope.on($('#mgAbort'), 'click', abort);
      on0(document, 'keydown', e => { if (e.key === 'Escape' && !Modal.isOpen() && !Game.paused) { e.preventDefault(); abort(); } });
      scope.on(body, 'contextmenu', e => e.preventDefault());
      scope.tick('clock', () => {});           // игровые часы идут всё время игры (и замирают на паузе)
      requestAnimationFrame(() => {
        Promise.resolve()
          .then(() => F.start(ctx))
          .then(r => finish(r || { ok: 'fail', detail: 'НЕТ ДАННЫХ' }))
          .catch(err => { console.error(`[фрагмент ${F.id}]`, err); finish({ ok: 'fail', detail: 'СБОЙ ВОССТАНОВЛЕНИЯ' }); });
      });
    });
  }

  /* ---------- результат ---------- */
  function apply(F, r) {
    const d = st(), prev = d.st[F.ch];
    if (r.ok === 'ok') {
      d.st[F.ch] = 'ok'; d.notes[F.ch] = { t: r.note || F.note, k: 'ok' };
      if (prev === 'dmg') d.wear = clamp(d.wear - WEAR_HEAL, 0, 100);
    } else if (r.ok === 'dist') {
      d.st[F.ch] = 'dist'; d.notes[F.ch] = { t: r.note || F.noteDist || F.note, k: 'dist' };
    } else {
      if (!prev || prev === 'skip') d.st[F.ch] = 'dmg';
      d.wear = clamp(d.wear + WEAR_STEP, 0, 100);
      GameState.agingLevel = clamp(GameState.agingLevel + 0.02, 0, 1);
    }
    Save.frags(); Save.progress();
  }
  function showResult(F, r) {
    return new Promise(res => {
      const m = $('#mgResult'), title = $('#mgResTitle'), text = $('#mgResText'), note = $('#mgResNote');
      $('#mgResKicker').textContent = `ГЛАВА ${F.ch + 1} · «${chTitle(F.ch)}» · ${F.name.toUpperCase()}`;
      note.hidden = true;
      const wear = st().wear;
      if (r.ok === 'ok') {
        title.textContent = 'ФРАГМЕНТ ВОССТАНОВЛЕН'; title.className = 'okc';
        text.className = 'frag-text clean'; revealText(text, F.text, hash(F.id));
        note.hidden = false; note.innerHTML = `<small>запись в блокнот · стр. ${F.ch + 1}</small>${esc(r.note || F.note)}`;
        $('#mgResLine').textContent = r.detail || '';
        A.sfx.chime(660, 0.07); setTimeout(() => A.sfx.chime(990, 0.05), 180);
      } else if (r.ok === 'dist') {
        title.textContent = 'ФРАГМЕНТ ИСКАЖЁН'; title.className = 'amb';
        text.className = 'frag-text'; text.innerHTML = glitchHTML(F.text, 0.16, hash(F.id) + 9);
        note.hidden = false; note.className = 'note-out dist'; note.innerHTML = `<small>особая запись · стр. ${F.ch + 1}</small>${esc(r.note || F.noteDist || '')}`;
        $('#mgResLine').textContent = `${r.detail ? `${r.detail} · ` : ''}РАСХОЖДЕНИЕ С ЗАПИСЬЮ · ИЗНОС НЕ НАЧИСЛЕН`;
        A.sfx.glitch();
      } else {
        title.textContent = 'ВОССТАНОВЛЕНИЕ НЕ УДАЛОСЬ'; title.className = '';
        text.className = 'frag-text'; text.innerHTML = glitchHTML(F.text, 0.45, hash(F.id) + 17);
        $('#mgResLine').textContent = `${r.detail ? `${r.detail} · ` : ''}ИЗНОС НОСИТЕЛЯ +${WEAR_STEP}% → ${wear}%`;
        A.sfx.buzz();
      }
      if (r.ok === 'ok') note.className = 'note-out';
      const again = $('#mgResAgain'), back = $('#mgResBack');
      again.hidden = wear >= 100;
      again.textContent = r.ok === 'ok' ? 'ПРОЖИТЬ ЕЩЁ РАЗ' : 'ЕЩЁ РАЗ';
      let done = false;
      const fin = v => { if (done) return; done = true; again.onclick = back.onclick = null; Modal.close(m, true); res(v); };
      again.onclick = () => { Audio47.sfx.click(); fin(true); };
      back.onclick = () => { Audio47.sfx.click(); fin(false); };
      Modal.open(m, { onClose: () => fin(false), focus: '#mgResBack' });
    });
  }

  /** износ 100%: носитель разрушен — клон уничтожен, цикл заново */
  function carrierBreak() {
    return new Promise(res => {
      const m = $('#mgBreak');
      A.sfx.glitch(); A.sfx.thud(0.6); FX.shake('lg'); FX.flash('#ff0033', 900, 0.9);
      $('#mgBreakNext').textContent = `К-${GameState.cycle + 1}. ПОДЪЁМ.`;
      Modal.open(m, { closable: false, focus: '#mgBreakOk' });
      $('#mgBreakOk').onclick = () => { $('#mgBreakOk').onclick = null; Modal.close(m, true); res(); };
    });
  }

  /**
   * Пройти фрагмент главы i. replay — вызван кнопкой «восстановить» (есть «назад»).
   * Вернёт статус главы после игры или 'dead' (носитель разрушен).
   */
  async function run(i, { replay = false, onLog = null } = {}) {
    const F = FRAGS[i];
    if (!F || busy) return status(i);
    busy = true;
    try {
      const choice = await showIntro(F, { replay });
      if (choice !== 'go') {
        if (choice === 'skip' && !status(i)) { st().st[i] = 'skip'; Save.frags(); onLog && onLog('Фрагмент не восстановлен', 'warn'); }
        return status(i);
      }
      Audio47.setAmbient(null, 0.8);
      for (;;) {
        const r = await runGame(F);
        if (r.ok === 'abort') {
          if (!status(i)) { st().st[i] = 'skip'; Save.frags(); }
          onLog && onLog('Восстановление прервано', 'dim');
          break;
        }
        apply(F, r);
        onLog && onLog(r.ok === 'ok' ? `Фрагмент гл. ${i + 1} восстановлен` : r.ok === 'dist' ? `Фрагмент гл. ${i + 1} искажён` : `Сбой восстановления · износ ${st().wear}%`, r.ok === 'ok' ? 'ok' : r.ok === 'dist' ? 'warn' : 'err');
        const again = await showResult(F, r);
        if (st().wear >= 100) {
          await carrierBreak();
          cloneDestroyed({ sub: 'НОСИТЕЛЬ РАЗРУШЕН · ИЗНОС 100%' });
          return 'dead';
        }
        if (!again) break;
      }
      Audio47.setAmbient('reader');
      FX.setVisible(true);
      return status(i);
    } finally {
      busy = false;
    }
  }

  return {
    status, glitch, counts, run,
    isBusy: () => busy,
    /** снять текущую игру (смерть, выход на заставку) */
    kill() { if (current) current.finish({ ok: 'abort' }); $('#mgStage').hidden = true; ['#mgIntro', '#mgResult', '#mgBreak'].forEach(s => Modal.close($(s), true)); },
    /** для отладки и автотестов */
    debugFinish(ok = 'ok') { if (current) current.finish({ ok, detail: 'DEBUG' }); },
  };
})();

window.__k47 = {
  FRAGS, Frag,
  finish: ok => Frag.debugFinish(ok),
  /** запустить игру главы i отдельно (отладка): __k47.play(7) */
  play: i => Frag.run(i, { replay: true }),
  /** для автотестов: перейти в сцену и прочитать состояние */
  act: (name, opts) => startAct(name, opts),
  state: () => GameState,
};
