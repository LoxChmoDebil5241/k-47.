/* ==========================================================================
   КОМНАТА — навигация как во «втором номере»: повернуться к стене / столу,
   обернуться к проёму, подойти ближе, осмотреться (зажми и веди).
   Сюжет (GameState.story.stage):
     explore  — в проёме охранник с пистолетом: обернёшься — выстрел, смерть;
     damaged  — экран треснут, ползут мысли «кто-то сзади», дрожь; в проёме — худой: «загляни в терминал»;
     norm     — в терминале 47 нажатий;
     feel     — худой в проёме спрашивает, что ты чувствуешь; открывает последние главы;
     final    — дочитать 47–49 (выстрел в спину — в 23-terminal.js).
   Любая смерть → заставка, всё с самого начала.
   ========================================================================== */
const DARK_THOUGHTS = ['То что я делаю — незаконно...', 'С того проёма на меня смотрят...', 'Пусть охрана пройдёт мимо...',
  'Не сейчас... Не сейчас...', 'Сколько их было?', 'Кто это?', 'Они знают, что я здесь.', 'Это не моя комната.', 'Я не должен был заходить.',
  'Дверь... она была закрыта.', 'Кто оставил эти фотографии?', 'Тот, кто это делал — ещё здесь.', 'Фото... все смотрят на меня.',
  'Я слышу дыхание.', 'Что если это не сон?', 'Мне нужно выбраться.', 'Свет... он не настоящий.', 'Здесь что-то не так.',
  'Кто-то ходит по ту сторону стены.', 'Не оборачивайся.', 'Это последний раз.'];
const CRAWL_THOUGHTS = ['КТО-ТО СЗАДИ', 'ОН СТОИТ ЗА СПИНОЙ', 'ОБЕРНИСЬ', 'НЕ ОБОРАЧИВАЙСЯ', 'ТЫ СЛЫШИШЬ ДЫХАНИЕ?', 'ШАГИ...', 'ОН ЖДЁТ',
  'СЗАДИ', 'КТО-ТО В ПРОЁМЕ', 'ОН ЗНАЕТ, ЧТО ТЫ ЧИТАЛ', 'ОБЕРНИСЬ. ОБЕРНИСЬ.', 'ЭКРАН ТРЕСНУЛ НЕ САМ'];
const DRAWER_ITEMS = {
  paper: ['БУМАГА', 'Смятая. Исписанная с двух сторон. Часть строк зачёркнута, часть — просто нет.'],
  list: ['СПИСОК', 'Фамилии в столбик. Все зачёркнуты. Последнюю кто-то стёр пальцем до дыры.'],
  pda: ['КПК', 'Пустой. Экран тускло-серый. Нет ID-карты. Без неё — просто кирпич.'],
};

Acts.room = {
  async enter(scope, opts) {
    const root = $('#act-room'), mount = $('#roomView');
    const R = GameState.reader, S = GameState.story;
    FX.setLevel(GameState.agingLevel, { instant: true });
    FX.setVisible(false);                       // износ виден только на экране терминала
    Audio47.setIntensity(GameState.agingLevel / 0.5);
    mount.innerHTML = '';
    mount.classList.remove('tilted'); $('#roomFreeze').classList.remove('on');
    $('#roomVignette').className = 'room-vignette';
    $('#doorTalk').hidden = true;
    $$('.room-bar .pulse', root).forEach(b => b.classList.remove('pulse'));
    document.body.classList.remove('room-pulse');

    // ---------- общий контекст сцены ----------
    const ctx = {
      scope, phase: 'init', view: null, R3: null, dead: false,
      bars: $$('.room-bar', root),
      setBar(name) {
        this.bars.forEach(b => { b.hidden = b.dataset.bar !== name; });
        $('#lookHint').classList.toggle('show', !!LOOK_LIMITS[name] && name !== 'outside' && name !== 'facing');
      },
      say(text, ms = 2600) {
        const el = $('#roomSpeech'); el.textContent = text; el.classList.add('show');
        scope.clear(ctx._sayT); ctx._sayT = scope.timeout(() => el.classList.remove('show'), ms);
      },
      async ensureRenderer() {
        if (ctx.R3) return ctx.R3;
        let r;
        try { r = await createRoom3D(mount); }
        catch (e) { console.warn('3D-комната недоступна, включён плоский режим:', e.message); r = createRoomFlat(mount); }
        if (!scope.alive) { r.dispose(); return null; }
        ctx.R3 = r;
        r.setPhotoCount(Math.min(47, R.read.size));
        r.setScreenState({ codeOk: S.codeOk, cracked: S.cracked, aging: GameState.agingLevel });
        r.setFigure(S.stage === 'explore' ? 'guard' : 'thin');
        scope.onDispose(() => r.dispose());
        scope.tick('render', dt => { r.tick(dt); updateLook(dt); updateDark(dt); });
        return r;
      },
    };

    Acts.room.ctx = ctx;
    scope.onDispose(() => { if (Acts.room.ctx === ctx) Acts.room.ctx = null; });

    // ---------- переходы между ракурсами ----------
    async function go(view, { dur = 1.6, ease = 'tension', steps = true } = {}) {
      if (ctx.phase === 'moving' || ctx.dead) return false;
      const from = ctx.view;
      ctx.phase = 'moving'; ctx.setBar(null); stopDark();
      document.body.style.cursor = '';
      if (steps && dur > 1.1) Audio47.sfx.steps(Math.floor(dur / 0.45), dur);
      Audio47.sfx.whoosh(Math.min(1.1, dur * 0.6), view === 'outside' && from !== 'facing');
      look.ty = look.tp = look.y = look.p = 0;
      await ctx.R3.moveTo(view, { dur, ease });
      if (!scope.alive || ctx.dead) return false;
      ctx.view = view; ctx.phase = view;
      ctx.setBar(view);
      if (view === 'wallClose') ctx.R3.setLinks(links);
      return true;
    }
    ctx.go = go;

    // ---------- осмотр: зажми и веди (вверх — меньше) ----------
    const look = { y: 0, p: 0, ty: 0, tp: 0, drag: false, lx: 0, ly: 0, moved: 0, t0: 0, id: null };
    const canLook = () => !!LOOK_LIMITS[ctx.phase] && !Modal.isOpen();
    function updateLook(dt) {
      if (!canLook()) { look.ty *= 0.85; look.tp *= 0.85; }
      const k = 1 - Math.pow(0.88, dt * 60);
      look.y += (look.ty - look.y) * k; look.p += (look.tp - look.p) * k;
      if (ctx.phase !== 'moving') ctx.R3.setLook(look.y, look.p);
    }
    function nudgeLook(dx) {
      const lim = LOOK_LIMITS[ctx.phase]; if (!lim) return;
      look.ty = clamp(look.ty + dx, -lim.yaw, lim.yaw);
    }
    function ndcOf(e) { const r = mount.getBoundingClientRect(); return [((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1]; }
    let pressTimer = 0, pressHit = null;
    scope.on(mount, 'pointerdown', e => {
      if (!ctx.R3 || ctx.phase === 'moving') return;
      look.drag = true; look.moved = 0; look.lx = e.clientX; look.ly = e.clientY; look.t0 = performance.now(); look.id = e.pointerId;
      try { mount.setPointerCapture(e.pointerId); } catch { /* */ }
      pressHit = pickAt(e);
      if (pressHit && pressHit.type === 'photo') {
        scope.clear(pressTimer);
        pressTimer = scope.timeout(() => { if (look.drag && look.moved < 8) { const i = pressHit.index; pressHit = null; look.drag = false; zoomPhoto(i); } }, 520);
      }
    });
    scope.on(mount, 'pointermove', e => {
      if (!ctx.R3) return;
      if (!look.drag) { hover(e); return; }
      const dx = e.clientX - look.lx, dy = e.clientY - look.ly;
      look.lx = e.clientX; look.ly = e.clientY; look.moved += Math.abs(dx) + Math.abs(dy);
      if (look.moved > 8 && canLook()) {
        const lim = LOOK_LIMITS[ctx.phase];
        look.ty = clamp(look.ty - dx * 0.0042, -lim.yaw, lim.yaw);
        look.tp = clamp(look.tp - dy * 0.0042, -lim.pitch, lim.pitch * LOOK_UP);
      }
    });
    const endPress = e => {
      if (!look.drag || (e && e.pointerId !== look.id)) return;
      look.drag = false; scope.clear(pressTimer);
      if (look.moved < 8 && performance.now() - look.t0 < 520 && pressHit) act(pressHit);
      pressHit = null;
    };
    scope.on(mount, 'pointerup', endPress);
    scope.on(mount, 'pointercancel', () => { look.drag = false; scope.clear(pressTimer); });
    function pickAt(e) {
      if (!ctx.R3) return null;
      const [nx, ny] = ndcOf(e);
      if (ctx.phase === 'wallClose') return ctx.R3.pick(nx, ny, 'wall');
      if (ctx.phase === 'deskClose') return ctx.R3.pick(nx, ny, 'desk');
      return null;
    }
    function hover(e) { document.body.style.cursor = pickAt(e) ? 'pointer' : ''; }
    function act(hit) {
      if (hit.type === 'photo') photoClick(hit.index);
      else if (hit.type === 'item') deskItem(hit.id);
    }

    // ---------- фото-стена: связи красной нитью ----------
    const links = new Set();
    let selected = null;
    function photoClick(i) {
      if (selected === i) { ctx.R3.markPhoto(i, 0x1a1008); selected = null; Audio47.sfx.nail(true); return; }
      if (selected === null) { selected = i; ctx.R3.markPhoto(i, 0x660011); Audio47.sfx.click(); return; }
      const a = Math.min(selected, i), b = Math.max(selected, i), key = `${a}-${b}`;
      if (links.has(key)) { links.delete(key); Audio47.sfx.nail(true); } else { links.add(key); Audio47.sfx.nail(false); }
      ctx.R3.markPhoto(selected, 0x1a1008); ctx.R3.markPhoto(i, 0x1a1008);
      selected = null;
      ctx.R3.setLinks(links);
    }
    function clearLinks() {
      links.clear(); if (selected !== null) ctx.R3.markPhoto(selected, 0x1a1008); selected = null;
      ctx.R3.setLinks(links); Audio47.sfx.click();
    }
    function zoomPhoto(i) {
      openZoom(`К-${i}`, 'Фото со стены. Со временем все лица стираются.', RoomTex.get().photos[i]);
    }

    // ---------- предметы на столе ----------
    function openZoom(title, caption, canvas) {
      const img = $('#zoomImg');
      img.textContent = canvas ? '' : title;
      img.style.backgroundImage = canvas ? `url(${canvas.toDataURL()})` : 'none';
      img.classList.toggle('noimg', !canvas);
      $('#zoomTitle').textContent = title;
      $('#zoomCaption').textContent = caption;
      Audio47.sfx.click();
      Modal.open($('#zoomModal'));
    }
    function deskItem(id) {
      switch (id) {
        case 'notebook': openNotebook(); break;
        case 'drawer': Audio47.sfx.drawer(); Modal.open($('#drawerModal')); break;
        case 'photo': openZoom('ФОТО В РАМКЕ', 'Женщина, чьего лица никто не помнит.', RoomTex.get().oldPhoto); break;
        case 'note': openZoom('ЗАПИСКА', 'Жёлтый листок, прилип к столу. Почерк торопливый.', RoomTex.stickyNote(1, RoomTex.codeParts(S.code)[0])); break;
        case 'radio':
          Audio47.sfx.radio(3.4); ctx.R3.radioLed(true); scope.timeout(() => ctx.R3 && ctx.R3.radioLed(false), 3500);
          openZoom('РАЦИЯ', 'Портативная. Ловит только помехи. Голоса нет — только треск.');
          break;
      }
    }
    scope.on($('#drawerModal'), 'click', e => {
      const it = e.target.closest('[data-item]'); if (!it) return;
      const [t, c] = DRAWER_ITEMS[it.dataset.item];
      Modal.close($('#drawerModal'), true);
      openZoom(t, c);
    });

    // ---------- блокнот: страница = глава; запись «читателя» проступает после главы ----------
    const nb = GameState.notebook, nbText = $('#nbText');
    let nbSave = 0;
    function renderNb() {
      const n = nb.current, ch = BOOK[n];
      nbText.value = nb.pages[n] || '';
      const note = $('#nbNote');
      note.innerHTML = '';
      const head = document.createElement('span'); head.className = 'nb-ch'; head.textContent = `гл. ${n + 1} · ${ch ? ch.t : ''}`;
      const body = document.createElement('span');
      if (R.read.has(n)) { body.className = 'nb-comment'; body.textContent = DIARY[n] || ''; }
      else { body.className = 'nb-empty'; body.textContent = 'Страница пуста. Запись появится, когда глава будет прочитана.'; }
      note.append(head, body);
      $('#nbPage').textContent = `${n + 1} / ${NB_PAGES}`;
      $('#nbPrev').disabled = n === 0;
      $('#nbNext').disabled = n === NB_PAGES - 1;
      $('#nbCount').textContent = `${nbText.value.length} символов`;
    }
    function openNotebook() {
      $('#nbDate').textContent = '15.04.2999';
      renderNb();
      Audio47.sfx.book();
      Modal.open($('#nbModal'), { focus: '#nbNext', onClose: () => { nb.pages[nb.current] = nbText.value; Save.notebook(); } });
    }
    function flip(delta) {
      const to = clamp(nb.current + delta, 0, NB_PAGES - 1); if (to === nb.current) return;
      nb.pages[nb.current] = nbText.value;
      const f = $('#nbFlip'); f.classList.remove('on'); void f.offsetWidth; f.classList.add('on');
      Audio47.sfx.page();
      nb.current = to;
      scope.timeout(() => { renderNb(); Save.notebook(); }, 180);
    }
    scope.on($('#nbPrev'), 'click', () => flip(-1));
    scope.on($('#nbNext'), 'click', () => flip(1));
    scope.on(nbText, 'input', () => {
      if (nbText.value.length > 4000) nbText.value = nbText.value.slice(0, 4000);
      nb.pages[nb.current] = nbText.value;
      $('#nbCount').textContent = `${nbText.value.length} символов`;
      $('#nbSaved').textContent = '…';
      scope.clear(nbSave); nbSave = scope.timeout(() => { Save.notebook(); $('#nbSaved').textContent = 'сохранено'; }, 400);
    });
    scope.on($('#nbModal'), 'keydown', e => {
      if (e.target === nbText) return;
      if (e.key === 'ArrowLeft') flip(-1); else if (e.key === 'ArrowRight') flip(1);
    });

    // ---------- смерть: выстрел, кадр замирает — снова заставка ----------
    ctx.die = async ({ muzzle = false } = {}) => {
      if (ctx.dead) return;
      ctx.dead = true; ctx.phase = 'dead'; ctx.setBar(null);
      stopCrawl(); stopDark(true);
      $('#doorTalk').hidden = true;
      Modal.closeAll();
      if (muzzle && ctx.R3) ctx.R3.muzzle();
      Audio47.sfx.shot();
      FX.flash('#fff2cc', 90, 0.95); scope.timeout(() => FX.flash('#ff2200', 260, 0.6), 110);
      if (ctx.R3) ctx.R3.shake(0.07, 900);
      FX.vibrate([60, 40, 90, 30, 120]);
      await scope.wait(380);
      if (ctx.R3) ctx.R3.setActive(false);
      mount.classList.add('tilted'); $('#roomFreeze').classList.add('on');
      Audio47.sfx.glitch(3);
      await scope.wait(2700);
      resetToBoot();
    };

    // ---------- взгляд в темноту: у стены, влево — к проёму ----------
    const dark = { on: false, t0: 0, level: 0, thoughts: false, done: false, dread: null, nextThought: 0, nextBeat: 0 };
    const darkDrifter = createDrifter(scope, $('#roomThoughts'), 'darkThoughts');
    function lookingIntoDark() {
      if (ctx.phase !== 'wall' && ctx.phase !== 'wallClose') return false;
      const lim = LOOK_LIMITS[ctx.phase];
      return look.y >= lim.yaw * 0.85;             // влево — туда, где проём (фото-стена слева от терминала)
    }
    function startDark() {
      dark.on = true; dark.t0 = Clock.now(); dark.thoughts = false; dark.done = false; dark.nextThought = 0; dark.nextBeat = 0;
      dark.dread = Audio47.dread(14.7);
      if (ctx.R3.kind === 'flat') { $('#roomVignette').classList.add('red'); document.body.classList.add('room-pulse'); }
    }
    function stopDark(hard = false) {
      if (!dark.on) return;
      dark.on = false;
      $('#roomVignette').classList.remove('red'); document.body.classList.remove('room-pulse');
      if (dark.dread) { dark.dread.stop(hard ? 0.1 : 0.6); dark.dread = null; }
      if (ctx.R3) ctx.R3.clearThoughts(true);
      darkDrifter.clear();
    }
    scope.onDispose(() => stopDark(true));
    function updateDark(dt) {
      if (ctx.dead) return;
      const l = lookingIntoDark();
      if (l && !dark.on) startDark();
      else if (!l && dark.on && !dark.done) stopDark();
      const now = Clock.now();
      if (dark.on) {
        const el = (now - dark.t0) / 1000;
        dark.level = Math.min(1, dark.level + dt / 5);
        ctx.R3.setDread(dark.level * (0.82 + 0.18 * Math.sin(el * (3 + el * 0.5))));
        if (now > dark.nextBeat) { Audio47.sfx.heartbeat(0.35 + dark.level * 0.5); dark.nextBeat = now + (1300 - dark.level * 650); }
        if (el >= 4.7 && now > dark.nextThought) {
          dark.nextThought = now + rand(700, 1300) * (1 - dark.level * 0.35);
          const text = pick(DARK_THOUGHTS);
          if (ctx.R3.kind === 'webgl') ctx.R3.thought(text);
          else darkDrifter.spawn(text, { cls: 'dark-thought', from: 'edge', life: rand(6, 9), shake: rand(0.6, 1.8) });
          if (Math.random() < 0.3) Audio47.sfx.whisper(1.4);
        }
        if (el >= 14.7 && !dark.done) { dark.done = true; ctx.die(); }
      } else if (dark.level > 0) {
        dark.level = Math.max(0, dark.level - dt / 1.2);
        ctx.R3.setDread(dark.level);
      }
    }

    // ---------- после треснувшего экрана: ползущие мысли и дрожь ----------
    const crawl = { on: false, spawn: 0, shake: 0 };
    const crawlDrifter = createDrifter(scope, $('#roomCrawl'), 'crawl');
    function startCrawl() {
      if (crawl.on || S.stage !== 'damaged') return;
      crawl.on = true;
      $('[data-go="turn"]', root).classList.add('pulse');
      const one = () => crawlDrifter.spawn(pick(CRAWL_THOUGHTS), { cls: 'crawl-thought', from: 'edge', life: rand(9, 14), shake: rand(1, 2.4), alpha: rand(0.55, 0.9), scale: [0.9, 1.15] });
      one();
      crawl.spawn = scope.every(1300, () => { if (crawl.on && crawlDrifter.count() < 8) one(); });
      crawl.shake = scope.every(2300, () => {
        if (!crawl.on || ctx.phase === 'moving') return;
        FX.shake('sm'); if (ctx.R3) ctx.R3.shake(0.025, 700);
        Audio47.sfx.heartbeat(0.5);
      });
    }
    function stopCrawl() {
      if (!crawl.on) return;
      crawl.on = false; crawl.spawn(); crawl.shake();
      crawlDrifter.clear();
    }
    ctx.stopCrawl = stopCrawl;
    scope.onDispose(stopCrawl);

    /** вызывается, когда вернулись к терминалу снаружи (после выхода из системы) */
    ctx.onOutside = () => {
      if (S.stage === 'damaged') startCrawl();
      else if (S.stage === 'feel') $('[data-go="turn"]', root).classList.add('pulse');
      else if (S.stage === 'norm' || S.stage === 'final') $('[data-go="enter"]', root).classList.add('pulse');
      if (ctx.R3) ctx.R3.setFigure(S.stage === 'explore' ? 'guard' : 'thin');
    };

    // ---------- проём за спиной ----------
    setupNorm(ctx);
    const door = setupDoor(ctx);
    let doorSeq = 0;
    async function turnAround() {
      const my = ++doorSeq;
      $('[data-go="turn"]', root).classList.remove('pulse');
      stopCrawl();
      if (!(await go('facing'))) return;
      if (my !== doorSeq) return;
      ctx.phase = 'door'; ctx.setBar(null);
      switch (S.stage) {
        case 'explore': await door.guard(); return;
        case 'damaged': S.stage = 'norm'; Save.progress(); await door.thin(['Загляни в терминал.']); break;
        case 'norm': await door.thin(['Загляни в терминал.', 'Норма ещё не выполнена.']); break;
        case 'feel': await door.dialogue(); break;
        case 'final': await door.thin(['Дочитай.']); break;
      }
      if (!scope.alive || ctx.dead) return;
      ctx.phase = ctx.view;
      await go('outside');
      ctx.onOutside();
    }

    // ---------- кнопки ----------
    const ACTIONS = {
      wall: () => go('wall'), desk: () => go('desk'), turn: turnAround,
      outside: () => go('outside'),
      wallClose: () => go('wallClose', { dur: 1.35 }), deskClose: () => go('deskClose', { dur: 1.35 }),
      wallBack: () => go('wall', { dur: 1.35 }), deskBack: () => go('desk', { dur: 1.35 }),
      clearLinks, notebook: () => deskItem('notebook'), drawer: () => deskItem('drawer'), photo: () => deskItem('photo'),
      radio: () => deskItem('radio'), note: () => deskItem('note'),
      enter: () => {
        if (S.stage === 'damaged') { ctx.say('ЭКРАН НЕ ОТВЕЧАЕТ. СЗАДИ...', 2400); FX.shake('sm'); Audio47.sfx.error(); return; }
        $('[data-go="enter"]', root).classList.remove('pulse'); ctx.enterTerminal();
      },
    };
    scope.on(root, 'click', e => {
      const b = e.target.closest('.room-bar [data-go]'); if (!b || b.disabled || ctx.dead) return;
      e.stopPropagation(); Audio47.sfx.click();
      const fn = ACTIONS[b.dataset.go]; if (fn) fn();
    });
    // клавиатура: ← → к стене/столу, ↓ обернуться, ↑ ближе/войти, Esc назад
    scope.on(document, 'keydown', e => {
      if (Modal.isOpen() || isTyping(e) || e.ctrlKey || e.metaKey || e.altKey || ctx.phase === 'moving' || ctx.dead) return;
      const k = e.code, onBtn = e.target instanceof HTMLButtonElement;
      const P = ctx.phase;
      const map = {
        outside: { ArrowLeft: 'wall', KeyA: 'wall', ArrowRight: 'desk', KeyD: 'desk', ArrowDown: 'turn', KeyS: 'turn', ArrowUp: 'enter', KeyW: 'enter', Enter: 'enter' },
        wall: { ArrowUp: 'wallClose', KeyW: 'wallClose', ArrowDown: 'outside', KeyS: 'outside', Escape: 'outside' },
        wallClose: { ArrowDown: 'wallBack', KeyS: 'wallBack', Escape: 'wallBack' },
        desk: { ArrowUp: 'deskClose', KeyW: 'deskClose', ArrowDown: 'outside', KeyS: 'outside', Escape: 'outside' },
        deskClose: { ArrowDown: 'deskBack', KeyS: 'deskBack', Escape: 'deskBack', KeyN: 'notebook' },
        facing: { ArrowDown: 'outside', ArrowUp: 'outside', KeyS: 'outside', KeyW: 'outside', Escape: 'outside' },
      }[P];
      if (!map) return;
      if ((k === 'Enter' || k === 'Space') && onBtn) return;
      if ((P === 'wall' || P === 'wallClose' || P === 'desk' || P === 'deskClose') && (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'KeyA' || k === 'KeyD')) {
        e.preventDefault(); nudgeLook(k === 'ArrowLeft' || k === 'KeyA' ? 0.12 : -0.12); return;
      }
      const a = map[k] || map[e.key]; if (!a) return;
      e.preventDefault(); Audio47.sfx.click(); ACTIONS[a]();
    });
    scope.on(window, 'k47:resize', () => ctx.R3 && ctx.R3.resize());

    // ---------- терминал и архив ----------
    setupTerminal(ctx);

    // ---------- старт ----------
    Audio47.setAmbient('room');
    const mode = opts.mode === 'terminal' || opts.mode === 'reader' ? opts.mode : 'explore';
    if (mode === 'terminal' || mode === 'reader') {
      ctx.showTerminal(true);
      if (mode === 'reader' && S.codeOk && S.stage !== 'norm') ctx.openReader(Number.isInteger(opts.chapter) ? opts.chapter : R.chapter, { direct: true });
    } else {
      await ctx.ensureRenderer();
      if (!scope.alive) return;
      ctx.R3.setPose('outside'); ctx.view = 'outside'; ctx.phase = 'outside';
      ctx.setBar('outside');
      setSub('explore');
      ctx.onOutside();
      scope.timeout(() => { const b = $('[data-go="enter"]', root); if (b && !b.closest('[hidden]')) b.focus({ preventScroll: true }); }, 700);
    }
  },
};
