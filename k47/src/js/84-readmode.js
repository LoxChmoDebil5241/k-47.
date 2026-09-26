/* ==========================================================================
   РЕЖИМ ЧТЕНИЯ — терминал без игры: только текст книги, все 49 глав открыты.
   Без эффектов, без сюжета. Вернуться в игру можно из меню (цикл начнётся заново).
   ========================================================================== */
Acts.read = {
  enter(scope) {
    const R = GameState.reader;
    GameState.readMode = true;
    FX.setLevel(0, { instant: true }); FX.clearBlood(); FX.setVisible(false);
    Audio47.setAmbient(null, 1);
    const main = $('#rmMain'), art = $('#rmArticle');
    if (!Number.isInteger(R.chapter) || R.chapter < 0 || R.chapter >= BOOK.length) R.chapter = 0;

    function render(i) {
      const ch = BOOK[i];
      const paras = ch.p.map(p => (p === '---' ? '<p class="sep" aria-hidden="true">— — —</p>' : `<p>${p}</p>`)).join('');
      art.innerHTML = `<header class="ch-head"><p class="ch-num">Глава ${i + 1}</p><h2 class="ch-title">${ch.t}</h2></header>
        <div class="ch-text rm-text">${paras}</div>
        <footer class="ch-foot">${i < BOOK.length - 1
          ? `<p class="note">Дальше — глава ${i + 2}</p><button class="btn btn-primary" data-go="${i + 1}">«${BOOK[i + 1].t}» →</button>`
          : '<p class="note">Конец книги.</p>'}</footer>`;
      $('#rmInd').textContent = `ГЛ. ${i + 1} / ${BOOK.length} · ${ch.t}`;
      $('#rmPrev').disabled = i === 0; $('#rmNext').disabled = i === BOOK.length - 1;
      main.scrollTop = 0; progress();
    }
    function open(i) {
      if (i < 0 || i >= BOOK.length) return;
      if (i !== R.chapter) Audio47.sfx.page();
      R.chapter = i; Save.progress(); render(i);
    }
    function progress() {
      const max = main.scrollHeight - main.clientHeight;
      $('#rmProgress').style.width = `${max > 0 ? (main.scrollTop / max) * 100 : 100}%`;
    }
    function toc() {
      $('#tocList').innerHTML = BOOK.map((ch, i) => `<li><button class="toc-item${i === R.chapter ? ' current' : ''}" data-go="${i}" aria-label="Глава ${i + 1}. ${ch.t}"${i === R.chapter ? ' aria-current="true"' : ''}>
        <span class="n">${i + 1}</span><span class="t">${ch.t}</span><span class="m"></span></button></li>`).join('');
      Modal.open($('#tocModal'), { focus: '.toc-item.current' });
      const cur = $('.toc-item.current'); if (cur) cur.scrollIntoView({ block: 'center' });
    }
    scope.on($('#tocList'), 'click', e => { const b = e.target.closest('[data-go]'); if (!b) return; Modal.close($('#tocModal'), true); open(+b.dataset.go); });
    scope.on($('#rmPrev'), 'click', () => open(R.chapter - 1));
    scope.on($('#rmNext'), 'click', () => open(R.chapter + 1));
    scope.on($('#rmToc'), 'click', () => { Audio47.sfx.click(); toc(); });
    const leave = () => { Audio47.sfx.click(); Save.progress(); leaveToBoot(); };   // место чтения сохраняется
    scope.on($('#rmExit'), 'click', leave);
    scope.on(art, 'click', e => { const b = e.target.closest('[data-go]'); if (b) open(+b.dataset.go); });
    scope.on(main, 'scroll', progress, { passive: true });
    scope.on(document, 'keydown', e => {
      if (Modal.isOpen() || isTyping(e) || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.code === 'ArrowLeft') { e.preventDefault(); open(R.chapter - 1); }
      else if (e.code === 'ArrowRight') { e.preventDefault(); open(R.chapter + 1); }
      else if (e.code === 'KeyT') { e.preventDefault(); toc(); }
      else if (e.key === 'Escape') { e.preventDefault(); leave(); }
    });
    render(R.chapter);
    requestAnimationFrame(() => main.focus({ preventScroll: true }));
  },
};
