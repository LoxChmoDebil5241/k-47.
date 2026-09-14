import { $ } from '../config.js';
import { Timers } from '../core/timers.js';
import { Audio } from '../core/audio.js';
import { DialogAudio } from '../core/dialog-audio.js';
import { FocusTrap } from '../core/focus-trap.js';

const CLICKS_NEEDED_47 = 47;
const PAIRS_47 = [
  { victim: 'БЛЯДЬ!', villain: 'Каждое нажатие — ещё одна смерть.' },
  { victim: 'ЗАЧЕМ ТЫ ЭТО ДЕЛАЕШЬ?!', villain: '47 циклов. Ты знаешь, что это значит.' },
  { victim: 'грудь... болит...', villain: 'Он чувствует каждую пулю.' },
  { victim: 'ОСТАНОВИСЬ!!!', villain: '47 — число надежды. Забавно.' },
  { victim: 'ПОЧЕМУ ТЫ НЕ ОСТАНАВЛИВАЕШЬСЯ?!', villain: 'Ты не чувствуешь его агонии?' },
  { victim: 'Я ВИЖУ ТЕБЯ! ТЫ ЗДЕСЬ!', villain: 'Его тело — просто расходник.' },
  { victim: '...', villain: 'К-47. Подъём.' },
  { victim: 'Я ТЕБЯ ПРИКОНЧУ!!!', villain: 'Каждая смерть — прибыль корпорации.' },
  { victim: 'СКОЛЬКО ЕМУ ЕЩЁ УМИРАТЬ?!', villain: 'Ты чувствуешь его крик?' },
  { victim: 'ТЫ СГНИЁШЬ БЛЯДОТА!!!', villain: '47 сокращений сердца. Статистика.' },
  { victim: 'ПОЧЕМУ ТЫ НЕ СЛЫШИШЬ?!', villain: 'Он считает каждый твой удар.' },
  { victim: 'МНЕ БОЛЬНО!!!', villain: 'Ему уже не больно. Почти.' },
  { victim: 'ЗАБУДЬ МЕНЯ!!!', villain: 'Ты читаешь это — ты убиваешь.' },
  { victim: 'Я БЫЛ ЧЕЛОВЕКОМ... ТЫ НЕТ.', villain: 'Он умирал 47 раз. Ты помнишь?' },
  { victim: 'ОСТАВЬ МЕНЯ В ПОКОЕ!!!', villain: 'Ты — просто зритель. Часть системы.' },
  { victim: 'СКОЛЬКО РАЗ МНЕ ЕЩЁ УМЕРЕТЬ???', villain: 'Его жизнь не стоила ничего.' },
  { victim: 'Я ТЕБЯ ПРИКОНЧУ!!!', villain: 'Сколько смертей тебе нужно?' },
  { victim: 'ТЫ СХОДИШЬ С УМА!!!', villain: 'Он знает, что это ты.' },
  { victim: 'УМРИ!!! УМРИ!!! УМРИ!!!', villain: 'Он отомстит. Не сейчас. Но отомстит.' },
  { victim: 'Я ПОМНЮ.', villain: 'Ты делаешь так, чтобы он страдал.' },
  { victim: 'ЗА ЧТО?', villain: 'Ты не остановишься.' },
  { victim: 'ХВАТИТ!!! ХВАТИТ!!! ХВАТИТ!!!', villain: 'Он уже не человек. Ты сделал его таким.' },
  { victim: 'Я УМИРАЮ... И ТЫ ЗНАЕШЬ ЭТО.', villain: 'Ты — механизм. Продолжай.' },
  { victim: 'ОСТАНОВИСЬ, СУКА!!!', villain: 'Сорок семь... Почти.' },
  { victim: 'ПОЧЕМУ ТЫ НЕ ОСТАНОВИШЬСЯ?!', villain: 'Его смерть — твоё развлечение.' },
  { victim: 'ТЫ УБИВАЕШЬ МЕНЯ СНОВА И СНОВА!', villain: 'Ты даже не знаешь его имени.' },
  { victim: 'Я ПОМНЮ КАЖДЫЙ ВЫСТРЕЛ!', villain: 'Он — просто строка в отчёте.' },
  { victim: 'ТЫ НЕ ИМЕЕШЬ ПРАВА!', villain: 'Ты нажимаешь — он умирает.' },
  { victim: 'СКОЛЬКО ЕЩЁ?!', villain: 'Его агония — твой прогресс.' },
  { victim: 'Я ВЫГРЫЗУ ТВОЮ ГОРТАНЬ!!!', villain: 'Ты приближаешься к развязке.' },
  { victim: 'ЗА ЧТО Я ПЛАЧУ!!!', villain: 'Смерть — это бизнес. Ты — клиент.' },
  { victim: 'ЗАЧЕМ ТЕБЕ ЭТО НУЖНО?!', villain: 'Ты никогда не встречал его при жизни.' },
  { victim: 'ОСТАНОВИСЬ!!!', villain: 'Его боль — твоя статистика.' },
  { victim: 'МНЕ НЕ ВЫДЕРЖАТЬ БОЛЬШЕ!', villain: 'Он умрёт столько раз, сколько ты нажмёшь.' },
  { victim: 'ТЫ СОЗДАЁШЬ ЭТОТ АД!', villain: 'Ты не спасаешь его. Ты убиваешь.' },
  { victim: 'ПРЕКРАТИ МЕНЯ УБИВАТЬ!', villain: 'Твоя цель — 47. Его цель — выжить.' },
  { victim: 'Я ВИЖУ ТВОИ ГЛАЗА ЗА ЭКРАНОМ!', villain: 'Он уже не помнит, каково это — быть живым.' },
  { victim: 'ТЫ ДУМАЕШЬ, ЭТО ВЕСЕЛО?!', villain: 'Ты — его судьба. Беспощадная.' },
  { victim: 'ЭТО НЕ ИГРА, ЭТО СМЕРТЬ!', villain: 'Его крики — просто шум для тебя.' },
  { victim: 'ТЫ УБИВАЕШЬ НАСТОЯЩЕГО ЧЕЛОВЕКА!', villain: 'Ты даже не вздрогнешь.' },
  { victim: 'Я СЧИТАЮ КАЖДУЮ ТВОЮ СЕКУНДУ!', villain: 'Его жизнь — твой билет в финал.' },
  { victim: 'ПОЧЕМУ ТЫ НЕ ЧУВСТВУЕШЬ ВИНЫ?!', villain: 'Ты нажимаешь. Он умирает. Всё логично.' },
  { victim: 'ТЫ БУДЕШЬ ОТВЕЧАТЬ ЗА КАЖДУЮ СМЕРТЬ!', villain: 'Он — пешка. Ты — игрок.' },
  { victim: 'Я ЗНАЮ ТВОЁ ЛИЦО!', villain: 'Ты уже убил его. Сотни раз.' },
  { victim: 'ТЫ НЕ СМОЖЕШЬ СПРЯТАТЬСЯ ОТ ЭТОГО!', villain: 'Он умрёт. Ты прочитаешь. И нажмёшь снова.' },
  { victim: 'КОГДА ЭТО ЗАКОНЧИТСЯ?!', villain: 'Ты не остановишься. Потому что можешь.' },
  { victim: '...', villain: 'О... Ты достиг сорока семи.' },
];

const DEATH_WORDS_47 = [
  'застрелен','убит','предан','растерзан','раздавлен','сломлен','забыт','стёрт',
  'пустота','холод','кровь','лёд','крик','тишина','пульс','боль','выстрел','осколок',
  'рана','агония','одиночество','отчаяние','ненависть','пуля','падение','темнота',
  'свет','конец','номер','плоть','кость','мясо','цикл','повтор','снова','опять',
  'молчит','страдает','считает','смерть',
];

const DIALOGS_47 = {
  apathy: ['Ты нажал 47 раз.','Ты видел, как он умирал.','Снова и снова.','И ты ничего не почувствовал.','Ты — зритель.','Ты просто был здесь.','Ты не хуже и не лучше других.','Ты просто был частью системы.','Иди. Ты выполнил свою часть.'],
  sadness: ['Ты чувствуешь его боль.','Ты плакал вместе с ним.','Ты не мог остановиться.','Ты запомнишь его.','Ты расскажешь о нём.','Чтобы он не был забыт.','Спасибо.','Спасибо, что был с ним до конца.'],
  anger: ['Ты злишься.','Ты злишься на меня.','На систему.','На то, что я заставил тебя нажимать.','Ты мог уйти.','Ты мог закрыть страницу.','Ты остался.','Это был твой выбор.','Теперь живи с этим.'],
  joy: ['Ты улыбаешься.','Ты доволен.','Ты прошёл до конца.','Ты сделал это.','Ты странный, читатель.','Ты смотрел на смерть.','И чувствовал радость.','Может быть, ты тоже не совсем человек.','Ты — уникальный экземпляр.'],
  silence: ['Молчание...','Тоже ответ.','Ты просто ждал.','Ты не выбрал эмоцию.','Ты дал себе время.','Иногда молчание — самый честный ответ.','Ты никому ничего не должен.','Иди. Тишина ждёт тебя.'],
  final: ['Теперь ты готов.','Иди.','Читай.','Живи.','Или не живи.','Выбор за тобой.','Цикл завершён.'],
};

const QUESTION_SET_47 = [
  { id: 'why', text: 'Зачем это всё?', answer: 'Чтобы ты понял, что такое цена.' },
  { id: 'next', text: 'Что дальше?', answer: 'Ты идёшь дальше. Или нет.' },
  { id: 'who', text: 'Кто я теперь?', answer: 'Ты — свидетель.' },
  { id: 'system', text: 'Ты тоже часть системы?', answer: 'Я — голос. Может быть.' },
];

export const dialog47State = {
  clicks: 0, completed: false, answerPhase: false, dialogPlaying: false,
  questionLoopActive: false, silenceTimer: null, dialogTimer: null,
  dialogIndex: 0, currentDialog: [], isActive: false,
};

let onComplete = null;
export function setDialog47Complete(fn) { onComplete = fn; }

export function openDialog47() {
  if (dialog47State.isActive) return;
  dialog47State.isActive = true;
  dialog47State.clicks = 0;
  dialog47State.completed = false;
  dialog47State.answerPhase = false;
  dialog47State.questionLoopActive = false;
  const DOM = {
    dialog47: $('dialog47'),
    dialog47Status: $('dialog47Status'),
    dialog47ProgressFill: $('dialog47ProgressFill'),
    dialog47Victim: $('dialog47Victim'),
    dialog47Villain: $('dialog47Villain'),
    dialog47ClickBtn: $('dialog47ClickBtn'),
    dialog47WordDisplay: $('dialog47WordDisplay'),
    dialog47Answers: $('dialog47Answers'),
    dialog47Dynamic: $('dialog47Dynamic'),
  };
  DOM.dialog47.classList.add('active');
  DOM.dialog47Status.textContent = 'НОРМА РАСХОДА ПЛОТИ НЕ ДОСТИГНУТА';
  DOM.dialog47Status.className = 'dialog-47-status';
  DOM.dialog47ProgressFill.style.width = '0%';
  DOM.dialog47ProgressFill.className = 'fill';
  DOM.dialog47Victim.className = 'dialog-47-victim';
  DOM.dialog47Villain.className = 'dialog-47-villain';
  DOM.dialog47ClickBtn.style.display = 'block';
  DOM.dialog47ClickBtn.disabled = false;
  DOM.dialog47ClickBtn.innerHTML = 'НАЖАТЬ<span class="word-display empty" id="dialog47WordDisplay"></span>';
  DOM.dialog47WordDisplay.className = 'word-display empty';
  DOM.dialog47Answers.classList.remove('show');
  DOM.dialog47Dynamic.innerHTML = '';
  DialogAudio.startDrone();
  FocusTrap.activate(DOM.dialog47);
}

export function closeDialog47() {
  dialog47State.isActive = false;
  const DOM = { dialog47: $('dialog47') };
  DOM.dialog47.classList.remove('active');
  DialogAudio.stopDrone();
  FocusTrap.deactivate();
  if (onComplete) onComplete();
}

function triggerDialogFlash() {
  const DOM = { dialogFlash: $('dialogFlash') };
  DOM.dialogFlash.classList.remove('active', 'dark');
  DOM.dialogFlash.style.background = '#cc0000';
  DOM.dialogFlash.classList.add('active');
  Timers.set('flash-red', () => {
    DOM.dialogFlash.style.background = '#000000';
    DOM.dialogFlash.classList.remove('active');
    DOM.dialogFlash.classList.add('dark');
  }, 80);
  Timers.set('flash-reset', () => {
    DOM.dialogFlash.classList.remove('dark');
    DOM.dialogFlash.style.background = '#cc0000';
  }, 500);
}

export function bindDialog47() {
  const DOM = {
    dialog47ClickBtn: $('dialog47ClickBtn'),
    dialog47WordDisplay: $('dialog47WordDisplay'),
    dialog47Victim: $('dialog47Victim'),
    dialog47Villain: $('dialog47Villain'),
    dialog47Status: $('dialog47Status'),
    dialog47ProgressFill: $('dialog47ProgressFill'),
    dialog47Answers: $('dialog47Answers'),
  };
  DOM.dialog47ClickBtn.addEventListener('click', () => {
    if (dialog47State.completed || dialog47State.answerPhase || dialog47State.questionLoopActive) return;
    if (dialog47State.clicks >= CLICKS_NEEDED_47) return;
    DialogAudio.playClickSound();
    triggerDialogFlash();
    const word = DEATH_WORDS_47[Math.floor(Math.random() * DEATH_WORDS_47.length)];
    DOM.dialog47WordDisplay.textContent = word;
    DOM.dialog47WordDisplay.className = 'word-display';
    const pair = PAIRS_47[dialog47State.clicks % PAIRS_47.length];
    DOM.dialog47Victim.textContent = pair.victim;
    DOM.dialog47Victim.className = 'dialog-47-victim show shaking';
    DOM.dialog47Villain.textContent = pair.villain;
    DOM.dialog47Villain.className = 'dialog-47-villain show';
    dialog47State.clicks++;
    const progress = Math.min(dialog47State.clicks / CLICKS_NEEDED_47, 1);
    DOM.dialog47ProgressFill.style.width = (progress * 100) + '%';
    if (dialog47State.clicks >= CLICKS_NEEDED_47) {
      DOM.dialog47WordDisplay.textContent = '';
      DOM.dialog47WordDisplay.className = 'word-display empty';
      DOM.dialog47Villain.textContent = 'О... Ты достиг сорока семи.';
      DOM.dialog47Victim.className = 'dialog-47-victim';
      DOM.dialog47Status.textContent = 'НОРМА РАСХОДА ПЛОТИ ДОСТИГНУТА.';
      DOM.dialog47Status.className = 'dialog-47-status completed';
      DOM.dialog47ProgressFill.className = 'fill completed';
      if (Audio.isEnabled()) DialogAudio.playInterference();
      Timers.set('dialog-phase-1', () => {
        DOM.dialog47Villain.textContent = 'Кажется, ты выполнил норму расхода плоти.';
        Timers.set('dialog-phase-2', () => {
          DOM.dialog47Villain.textContent = 'Свою задачу ты выполнил.';
          Timers.set('dialog-phase-3', () => enterAnswerPhase47(), 1800);
        }, 1800);
      }, 2200);
    }
  });
  DOM.dialog47Answers.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!dialog47State.answerPhase) return;
      Audio.navClick();
      const answer = btn.dataset.answer;
      dialog47State.answerPhase = false;
      if (dialog47State.silenceTimer) {
        clearTimeout(dialog47State.silenceTimer);
        dialog47State.silenceTimer = null;
      }
      DOM.dialog47Answers.classList.remove('show');
      const dialog = DIALOGS_47[answer] || DIALOGS_47.apathy;
      playDialog47(dialog, () => Timers.set('dialog-to-questions', () => askQuestions47(), 1200), 1600);
    });
  });
}

function playDialog47(dialog, callback, delayBetween = 1600) {
  if (dialog47State.dialogPlaying) return;
  dialog47State.dialogPlaying = true;
  dialog47State.dialogIndex = 0;
  dialog47State.currentDialog = dialog;
  const DOM = { dialog47Victim: $('dialog47Victim'), dialog47Villain: $('dialog47Villain') };
  DOM.dialog47Victim.className = 'dialog-47-victim hidden';
  function showNext() {
    if (dialog47State.dialogIndex >= dialog47State.currentDialog.length) {
      dialog47State.dialogPlaying = false;
      if (callback) callback();
      return;
    }
    const text = dialog47State.currentDialog[dialog47State.dialogIndex];
    DOM.dialog47Villain.textContent = text;
    DOM.dialog47Villain.className = 'dialog-47-villain show';
    dialog47State.dialogIndex++;
    dialog47State.dialogTimer = setTimeout(showNext, delayBetween);
  }
  setTimeout(showNext, 600);
}

function enterAnswerPhase47() {
  dialog47State.answerPhase = true;
  dialog47State.completed = true;
  const DOM = {
    dialog47ClickBtn: $('dialog47ClickBtn'),
    dialog47WordDisplay: $('dialog47WordDisplay'),
    dialog47Victim: $('dialog47Victim'),
    dialog47Villain: $('dialog47Villain'),
    dialog47Answers: $('dialog47Answers'),
  };
  DOM.dialog47ClickBtn.style.display = 'none';
  DOM.dialog47WordDisplay.className = 'word-display empty';
  DOM.dialog47Victim.className = 'dialog-47-victim hidden';
  DOM.dialog47Villain.textContent = 'Что ты чувствуешь?';
  DOM.dialog47Villain.className = 'dialog-47-villain show question';
  DOM.dialog47Answers.classList.add('show');
  dialog47State.silenceTimer = setTimeout(() => {
    if (dialog47State.answerPhase) handleSilence47();
  }, 47000);
}

function handleSilence47() {
  if (!dialog47State.answerPhase) return;
  dialog47State.answerPhase = false;
  const DOM = { dialog47Answers: $('dialog47Answers') };
  DOM.dialog47Answers.classList.remove('show');
  playDialog47(DIALOGS_47.silence, () => Timers.set('silence-to-questions', () => askQuestions47(), 1200), 1600);
}

function askQuestions47() {
  dialog47State.questionLoopActive = true;
  const DOM = {
    dialog47Dynamic: $('dialog47Dynamic'),
    dialog47Villain: $('dialog47Villain'),
  };
  DOM.dialog47Dynamic.innerHTML = '';
  DOM.dialog47Villain.textContent = 'Вопросы?';
  DOM.dialog47Villain.className = 'dialog-47-villain show question';
  const row = document.createElement('div');
  row.className = 'dialog-47-dynamic-row';
  const btnYes = document.createElement('button');
  btnYes.textContent = 'Да';
  btnYes.addEventListener('click', () => {
    if (dialog47State.questionLoopActive) { Audio.navClick(); showQuestionChoices47(); }
  });
  const btnNo = document.createElement('button');
  btnNo.textContent = 'Нет';
  btnNo.addEventListener('click', () => {
    if (dialog47State.questionLoopActive) { Audio.navClick(); finishCycle47(); }
  });
  row.appendChild(btnYes);
  row.appendChild(btnNo);
  DOM.dialog47Dynamic.appendChild(row);
}

function showQuestionChoices47() {
  if (!dialog47State.questionLoopActive) return;
  const DOM = {
    dialog47Dynamic: $('dialog47Dynamic'),
    dialog47Villain: $('dialog47Villain'),
  };
  DOM.dialog47Dynamic.innerHTML = '';
  DOM.dialog47Villain.textContent = 'Выбери вопрос:';
  DOM.dialog47Villain.className = 'dialog-47-villain show question';
  const row = document.createElement('div');
  row.className = 'dialog-47-dynamic-row';
  QUESTION_SET_47.forEach(q => {
    const btn = document.createElement('button');
    btn.textContent = q.text;
    btn.addEventListener('click', () => {
      if (dialog47State.questionLoopActive) { Audio.navClick(); handleQuestionAnswer47(q.id); }
    });
    row.appendChild(btn);
  });
  DOM.dialog47Dynamic.appendChild(row);
}

function handleQuestionAnswer47(qid) {
  if (!dialog47State.questionLoopActive) return;
  dialog47State.questionLoopActive = false;
  const q = QUESTION_SET_47.find(item => item.id === qid);
  if (!q) return;
  const DOM = {
    dialog47Dynamic: $('dialog47Dynamic'),
    dialog47Villain: $('dialog47Villain'),
  };
  DOM.dialog47Dynamic.innerHTML = '';
  DOM.dialog47Villain.textContent = q.answer;
  DOM.dialog47Villain.className = 'dialog-47-villain show';
  Timers.set('question-to-loop', () => {
    dialog47State.questionLoopActive = true;
    askQuestions47();
  }, 2200);
}

function finishCycle47() {
  if (!dialog47State.questionLoopActive) return;
  dialog47State.questionLoopActive = false;
  const DOM = {
    dialog47Dynamic: $('dialog47Dynamic'),
    dialog47Villain: $('dialog47Villain'),
  };
  DOM.dialog47Dynamic.innerHTML = '';
  DOM.dialog47Villain.textContent = 'Цикл закончен. Дальше без счёта.';
  DOM.dialog47Villain.className = 'dialog-47-villain show';
  Timers.set('finish-to-final', () => enterFinalPhase47(), 2200);
}

function enterFinalPhase47() {
  const DOM = {
    dialog47Dynamic: $('dialog47Dynamic'),
    dialog47ClickBtn: $('dialog47ClickBtn'),
  };
  DOM.dialog47Dynamic.innerHTML = '';
  playDialog47(DIALOGS_47.final, () => {
    Timers.set('final-btn', () => {
      DOM.dialog47ClickBtn.style.display = 'block';
      DOM.dialog47ClickBtn.innerHTML = 'ЗАКРЫТЬ';
      DOM.dialog47ClickBtn.disabled = false;
      DOM.dialog47ClickBtn.onclick = () => closeDialog47();
    }, 1500);
  }, 1600);
                                                    }
