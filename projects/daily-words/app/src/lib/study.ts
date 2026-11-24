import { BY_ID, WORDS, type Level, type Word } from './words';

export const DAILY = 5;
/** 맞힌 횟수(단계)별 다음 복습까지 날짜. 5단계를 넘기면 외운 단어 */
export const INTERVALS = [1, 3, 7, 14, 30];

export interface Card {
  stage: number; // 0~5. 5면 외움
  due: string; // 다음 복습 날짜 YYYY-MM-DD
  wrong: number;
}
export interface Data {
  level: Level;
  cards: Record<string, Card>;
  days: string[]; // 공부한 날
  today: { day: string; ids: string[] } | null; // 오늘의 새 단어
}

export const emptyData = (): Data => ({ level: 'basic', cards: {}, days: [], today: null });

export function dayOf(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export function addDays(day: string, n: number): string {
  const [y, m, d] = day.split('-').map(Number);
  return dayOf(new Date(y, m - 1, d + n));
}

/** 날짜로 정해지는 난수(같은 날 같은 결과) */
export function seeded(seed: string): () => number {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

export function shuffle<T>(list: T[], rnd: () => number): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 오늘의 새 단어: 아직 안 배운 단어 중에서 날짜로 고정해 5개 */
export function pickToday(data: Data, day: string): string[] {
  if (data.today && data.today.day === day) return data.today.ids;
  const fresh = WORDS.filter((w) => w.level === data.level && !data.cards[w.id]);
  return shuffle(fresh, seeded(`${day}:${data.level}`))
    .slice(0, DAILY)
    .map((w) => w.id);
}

/** 오늘 복습할 단어(외운 단어 제외, 기한이 된 것) */
export function dueReviews(data: Data, day: string, exclude: string[] = []): string[] {
  return Object.entries(data.cards)
    .filter(([id, c]) => c.stage < INTERVALS.length && c.due <= day && !exclude.includes(id) && BY_ID[id])
    .sort((a, b) => (a[1].due < b[1].due ? -1 : 1))
    .map(([id]) => id);
}

/** 퀴즈 결과 반영: 맞히면 다음 단계, 틀리면 처음부터(내일 다시) */
export function grade(data: Data, id: string, correct: boolean, day: string): Data {
  const prev = data.cards[id] ?? { stage: 0, due: day, wrong: 0 };
  const stage = correct ? Math.min(prev.stage + 1, INTERVALS.length) : 0;
  const due = addDays(day, correct ? INTERVALS[Math.min(stage, INTERVALS.length) - 1] : 1);
  const days = data.days.includes(day) ? data.days : [...data.days, day].sort();
  return { ...data, days, cards: { ...data.cards, [id]: { stage, due, wrong: prev.wrong + (correct ? 0 : 1) } } };
}

/** 오늘(또는 어제)까지 이어진 연속 공부 일수 */
export function streak(days: string[], today: string): number {
  const set = new Set(days);
  let d = set.has(today) ? today : addDays(today, -1);
  let n = 0;
  while (set.has(d)) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

export interface Question {
  id: string;
  word: Word;
  choices: string[]; // 뜻 4개
  answer: number;
}

/** 4지선다: 같은 품사에서 오답 3개를 고른다 */
export function makeQuestion(id: string, rnd: () => number): Question {
  const word = BY_ID[id];
  const same = WORDS.filter((w) => w.id !== id && w.pos === word.pos && w.ko !== word.ko);
  const pool = same.length >= 3 ? same : WORDS.filter((w) => w.id !== id && w.ko !== word.ko);
  const wrongs = shuffle(pool, rnd)
    .slice(0, 3)
    .map((w) => w.ko);
  const choices = shuffle([word.ko, ...wrongs], rnd);
  return { id, word, choices, answer: choices.indexOf(word.ko) };
}

export function stats(data: Data) {
  const cards = Object.values(data.cards);
  return {
    learned: cards.length,
    mastered: cards.filter((c) => c.stage >= INTERVALS.length).length,
    total: WORDS.length,
  };
}

/** 오답이 많은 순 */
export function wrongNote(data: Data): Word[] {
  return Object.entries(data.cards)
    .filter(([id, c]) => c.wrong > 0 && BY_ID[id])
    .sort((a, b) => b[1].wrong - a[1].wrong)
    .slice(0, 20)
    .map(([id]) => BY_ID[id]);
}

export function restore(raw: string | null): Data {
  try {
    const v = raw ? JSON.parse(raw) : null;
    if (!v || typeof v !== 'object') return emptyData();
    const level: Level = ['basic', 'middle', 'toeic'].includes(v.level) ? v.level : 'basic';
    const cards: Record<string, Card> = {};
    if (v.cards && typeof v.cards === 'object') {
      for (const [id, c] of Object.entries(v.cards as Record<string, Card>)) {
        if (BY_ID[id] && c && Number.isInteger(c.stage) && /^\d{4}-\d{2}-\d{2}$/.test(c.due)) cards[id] = { stage: Math.max(0, Math.min(c.stage, INTERVALS.length)), due: c.due, wrong: Number.isInteger(c.wrong) ? c.wrong : 0 };
      }
    }
    const days = Array.isArray(v.days) ? v.days.filter((d: unknown) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)).slice(-400) : [];
    const today = v.today && typeof v.today.day === 'string' && Array.isArray(v.today.ids) ? { day: v.today.day, ids: v.today.ids.filter((id: string) => BY_ID[id]).slice(0, DAILY) } : null;
    return { level, cards, days, today };
  } catch {
    return emptyData();
  }
}
