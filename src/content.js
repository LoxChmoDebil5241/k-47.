export const CHAPTERS = [
  { id: "s0",  number: "1",  title: "Оп-12-Л",           paras: 14 },
  { id: "s1",  number: "2",  title: "Вторжение",          paras: 16 },
  { id: "s2",  number: "3",  title: "Агония",             paras: 6  },
  { id: "s3",  number: "4",  title: "Свет",               paras: 12 },
  { id: "s4",  number: "5",  title: "Берлога",            paras: 16 },
  { id: "s5",  number: "6",  title: "Метина",             paras: 12 },
  { id: "s6",  number: "7",  title: "Образ",              paras: 14 },
  { id: "s7",  number: "8",  title: "Мантра",             paras: 6  },
  { id: "s8",  number: "9",  title: "Путь",               paras: 20 },
  { id: "s9",  number: "10", title: "Тринадцать",         paras: 10 },
  { id: "s10", number: "11", title: "Щит",                paras: 16 },
  { id: "s11", number: "12", title: "За что?",            paras: 14 },
  { id: "s12", number: "13", title: "Училище",            paras: 28 },
  { id: "s13", number: "14", title: "Контракт",           paras: 18 },
  { id: "s14", number: "15", title: "Триумф",             paras: 22 },
  { id: "s15", number: "16", title: "Койка",              paras: 10 },
  { id: "s16", number: "17", title: "Глубина",            paras: 26 },
  { id: "s17", number: "18", title: "Линия",              paras: 16 },
  { id: "s18", number: "19", title: "Кожа",               paras: 14 },
  { id: "s19", number: "20", title: "Буклет",             paras: 24 },
  { id: "s20", number: "21", title: "Снег",               paras: 14 },
  { id: "s21", number: "22", title: "Быт",                paras: 14 },
  { id: "s22", number: "23", title: "Пыль",               paras: 18 },
  { id: "s23", number: "24", title: "Брак",               paras: 14 },
  { id: "s24", number: "25", title: "Повар",              paras: 16 },
  { id: "s25", number: "26", title: "Санитар",            paras: 20 },
  { id: "s26", number: "27", title: "Шипение",            paras: 18 },
  { id: "s27", number: "28", title: "Техник",             paras: 14 },
  { id: "s28", number: "29", title: "Коктейль",           paras: 22 },
  { id: "s29", number: "30", title: "Смотритель",         paras: 16 },
  { id: "s30", number: "31", title: "Наблюдатель",        paras: 20 },
  { id: "s31", number: "32", title: "Сталь",              paras: 14 },
  { id: "s32", number: "33", title: "Лекция",             paras: 18 },
  { id: "s33", number: "34", title: "Скелет",             paras: 16 },
  { id: "s34", number: "35", title: "Лёд",                paras: 14 },
  { id: "s35", number: "36", title: "Кровь",              paras: 16 },
  { id: "s36", number: "37", title: "Слепота",            paras: 14 },
  { id: "s37", number: "38", title: "Оскал",              paras: 18 },
  { id: "s38", number: "39", title: "Соль",               paras: 10 },
  { id: "s39", number: "40", title: "Осознание",          paras: 12 },
  { id: "s40", number: "41", title: "Срыв",               paras: 16 },
  { id: "s41", number: "42", title: "Ужас",               paras: 20 },
  { id: "s42", number: "43", title: "Пропасть",           paras: 10 },
  { id: "s43", number: "44", title: "Рациональность",     paras: 22 },
  { id: "s44", number: "45", title: "Имущество",          paras: 16 },
  { id: "s45", number: "46", title: "Регламент",          paras: 14 },
  { id: "s46", number: "47", title: "47",                 paras: 6  },
  { id: "s48", number: "48", title: "После",              paras: 18, requiresCycle: true },
];

export function getParagraphsForChapter(chapter) {
  const count = chapter.paras || 6;
  const num = chapter.number;
  const paragraphs = [];
  for (let i = 1; i <= count; i++) {
    paragraphs.push(`Абзац ${i} главы ${num}.`);
  }
  return paragraphs;
}
