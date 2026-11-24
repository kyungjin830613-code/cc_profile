// 새해 소원 등불: 소원을 적어 등불로 띄우고, 매일 다짐을 확인하는 기록. 종교·점술 요소 없음.

export type Day = string; // 'YYYY-MM-DD' 기기 현지 날짜

export function dayOf(d: Date): Day {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
export function addDays(day: Day, n: number): Day {
  const [y, m, d] = day.split('-').map(Number);
  return dayOf(new Date(y, m - 1, d + n, 12));
}
const isDay = (s: unknown): s is Day => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && addDays(s, 0) === s;

export function daysBetween(from: Day, to: Day): number {
  const [ay, am, ad] = from.split('-').map(Number);
  const [by, bm, bd] = to.split('-').map(Number);
  return Math.round((new Date(by, bm - 1, bd, 12).getTime() - new Date(ay, am - 1, ad, 12).getTime()) / 86_400_000);
}

export type Topic = 'health' | 'money' | 'love' | 'work' | 'study' | 'family';
export const TOPICS: Record<Topic, { label: string; color: string; emoji: string }> = {
  health: { label: '건강', color: '#5cc489', emoji: '🌿' },
  money: { label: '돈', color: '#f2b134', emoji: '💰' },
  love: { label: '사랑', color: '#ff7aa2', emoji: '💗' },
  work: { label: '일', color: '#5b8def', emoji: '💼' },
  study: { label: '공부', color: '#9b7be8', emoji: '📚' },
  family: { label: '가족', color: '#ff9459', emoji: '🏠' },
};
const TOPIC_IDS = Object.keys(TOPICS) as Topic[];

export interface Wish {
  id: string;
  text: string;
  topic: Topic;
  /** 띄운 날 */
  created: Day;
  /** 다짐을 확인한 날들 */
  checks: Day[];
}

export const MAX_WISHES = 7;
export const MAX_TEXT = 40;

export function makeWish(text: string, topic: Topic, today: Day, id: string): Wish | null {
  const t = text.replace(/\s+/g, ' ').trim().slice(0, MAX_TEXT);
  if (!t || !TOPIC_IDS.includes(topic)) return null;
  return { id, text: t, topic, created: today, checks: [] };
}

export function addWish(list: Wish[], w: Wish | null): Wish[] {
  if (!w || list.length >= MAX_WISHES) return list;
  return [...list, w];
}

/** 오늘 다짐 확인(하루 한 번). 이미 했으면 그대로. */
export function checkIn(w: Wish, today: Day): Wish {
  if (w.checks.includes(today)) return w;
  return { ...w, checks: [...w.checks, today].sort() };
}

export function checkedToday(w: Wish, today: Day): boolean {
  return w.checks.includes(today);
}

/** 다짐 연속 일수(오늘 안 했으면 어제부터) */
export function streak(w: Wish, today: Day): number {
  const set = new Set(w.checks);
  let cur = set.has(today) ? today : addDays(today, -1);
  let n = 0;
  while (set.has(cur)) {
    n++;
    cur = addDays(cur, -1);
  }
  return n;
}

/** 등불 밝기 0~1: 최근 7일 중 다짐한 날 비율 (켜 두면 밝아지고, 잊으면 희미해진다) */
export function glow(w: Wish, today: Day): number {
  let n = 0;
  for (let i = 0; i < 7; i++) if (w.checks.includes(addDays(today, -i))) n++;
  return Math.max(0.25, n / 7);
}

/** 다음 1월 1일까지 남은 날(1월 1일 당일은 0) */
export function daysToNewYear(today: Day): number {
  const y = Number(today.slice(0, 4));
  const target = today.slice(5) === '01-01' ? today : `${y + 1}-01-01`;
  return daysBetween(today, target);
}

export function restore(raw: string | null): Wish[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    if (!Array.isArray(v)) return [];
    return v
      .filter((w) => w && typeof w.id === 'string' && typeof w.text === 'string' && w.text.trim() && TOPIC_IDS.includes(w.topic) && isDay(w.created) && Array.isArray(w.checks))
      .map((w) => ({ id: w.id, text: String(w.text).slice(0, MAX_TEXT), topic: w.topic as Topic, created: w.created, checks: [...new Set<Day>(w.checks.filter(isDay))].sort() }))
      .slice(0, MAX_WISHES);
  } catch {
    return [];
  }
}
