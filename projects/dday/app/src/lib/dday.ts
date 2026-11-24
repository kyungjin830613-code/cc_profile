// 디데이 모아보기: 날짜 계산. 모든 날짜는 기기 현지 날짜 'YYYY-MM-DD'.
// 다가오는 날(D-n)과 시작한 날부터 세는 날(+n일, 예: 사귄 날·입사일·아기 태어난 날)을 함께 다룬다.

export type Day = string;

export function dayOf(d: Date): Day {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
export function addDays(day: Day, n: number): Day {
  const [y, m, d] = day.split('-').map(Number);
  return dayOf(new Date(y, m - 1, d + n, 12));
}
export const isDay = (s: unknown): s is Day => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && addDays(s, 0) === s;

export function diffDays(from: Day, to: Day): number {
  const [ay, am, ad] = from.split('-').map(Number);
  const [by, bm, bd] = to.split('-').map(Number);
  return Math.round((new Date(by, bm - 1, bd, 12).getTime() - new Date(ay, am - 1, ad, 12).getTime()) / 86_400_000);
}

export type Kind = 'countdown' | 'since';

export interface Event {
  id: string;
  title: string;
  date: Day;
  kind: Kind;
  emoji: string;
  /** 진행률을 보여 줄 시작일(다가오는 날만, 선택) */
  start?: Day;
  pinned?: boolean;
}

/** 'D-12', 'D-Day', 'D+3' */
export function ddayLabel(target: Day, today: Day): string {
  const n = diffDays(today, target);
  if (n === 0) return 'D-Day';
  return n > 0 ? `D-${n}` : `D+${-n}`;
}

/** 시작한 날부터 세기: 시작일이 1일째 (한국식 '사귄 지 100일'은 시작일 포함) */
export function sinceCount(start: Day, today: Day): number {
  return diffDays(start, today) + 1;
}

/** 시작일 포함 n일째가 되는 날 */
export function nthDay(start: Day, n: number): Day {
  return addDays(start, n - 1);
}

/** 다음 기념일들: 100일 단위(최대 1000일까지)와 매년 같은 날(주년) 중 오늘 이후 가장 가까운 것들 */
export function upcomingMilestones(start: Day, today: Day, count = 3): { label: string; date: Day; left: number }[] {
  const list: { label: string; date: Day; left: number }[] = [];
  for (let n = 100; n <= 3000; n += 100) {
    const d = nthDay(start, n);
    const left = diffDays(today, d);
    if (left >= 0) list.push({ label: `${n}일`, date: d, left });
  }
  const [sy, sm, sd] = start.split('-').map(Number);
  for (let y = 1; y <= 30; y++) {
    // 2월 29일 시작은 평년에 3월 1일로 넘어간다(Date 기본 동작)
    const d = dayOf(new Date(sy + y, sm - 1, sd, 12));
    const left = diffDays(today, d);
    if (left >= 0) list.push({ label: `${y}주년`, date: d, left });
  }
  return list.sort((a, b) => a.left - b.left || a.label.localeCompare(b.label)).slice(0, count);
}

/** 시작일→목표일 진행률 0~100 */
export function progress(start: Day, target: Day, today: Day): number {
  const total = diffDays(start, target);
  if (total <= 0) return 100;
  return Math.max(0, Math.min(100, Math.round((diffDays(start, today) / total) * 100)));
}

export function weekdayKo(day: Day): string {
  const [y, m, d] = day.split('-').map(Number);
  return '일월화수목금토'[new Date(y, m - 1, d, 12).getDay()];
}

/** 정렬: 고정 → 다가오는 날(가까운 순) → 지난 다가오는 날 → 세는 날 */
export function sortEvents(list: Event[], today: Day): Event[] {
  const rank = (e: Event) => {
    if (e.pinned) return 0;
    if (e.kind === 'countdown') return diffDays(today, e.date) >= 0 ? 1 : 2;
    return 3;
  };
  return [...list].sort((a, b) => rank(a) - rank(b) || (a.kind === 'countdown' ? diffDays(today, a.date) - diffDays(today, b.date) : diffDays(b.date, a.date)));
}

export function restore(raw: string | null): Event[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    if (!Array.isArray(v)) return [];
    return v
      .filter((e) => e && typeof e.id === 'string' && typeof e.title === 'string' && e.title.trim() && isDay(e.date) && (e.kind === 'countdown' || e.kind === 'since') && typeof e.emoji === 'string')
      .map((e) => ({ id: e.id, title: String(e.title).slice(0, 20), date: e.date, kind: e.kind, emoji: String(e.emoji).slice(0, 4), ...(isDay(e.start) ? { start: e.start } : {}), ...(e.pinned ? { pinned: true } : {}) }))
      .slice(0, 30);
  } catch {
    return [];
  }
}
