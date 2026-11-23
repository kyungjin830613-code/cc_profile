// 무지출 챌린지 + 52주 저축 챌린지: 날짜 계산과 기록 규칙. 실제 돈은 움직이지 않는 습관 기록장.

/** 'YYYY-MM-DD' (기기 현지 날짜) */
export type Day = string;

export function dayOf(d: Date): Day {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function parseDay(day: Day): Date {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

export function addDays(day: Day, n: number): Day {
  const d = parseDay(day);
  d.setDate(d.getDate() + n);
  return dayOf(d);
}

export const isDay = (s: unknown): s is Day => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && dayOf(parseDay(s)) === s;

/** 오늘(또는 기준일)에서 거꾸로 이어진 무지출 일수. 오늘을 아직 안 찍었으면 어제부터 센다. */
export function currentStreak(days: Set<Day>, today: Day): number {
  let start = days.has(today) ? today : addDays(today, -1);
  let n = 0;
  while (days.has(start)) {
    n++;
    start = addDays(start, -1);
  }
  return n;
}

export function bestStreak(days: Set<Day>): number {
  let best = 0;
  for (const d of days) {
    if (days.has(addDays(d, -1))) continue; // 연속 구간의 첫날에서만 센다
    let n = 0;
    let cur = d;
    while (days.has(cur)) {
      n++;
      cur = addDays(cur, 1);
    }
    best = Math.max(best, n);
  }
  return best;
}

export function countInMonth(days: Set<Day>, year: number, month: number): number {
  const prefix = `${year}-${String(month).padStart(2, '0')}-`;
  let n = 0;
  for (const d of days) if (d.startsWith(prefix)) n++;
  return n;
}

/** 달력 칸: 그 달 1일 앞의 빈칸(일요일 시작) + 날짜들 */
export function monthGrid(year: number, month: number): (Day | null)[] {
  const first = new Date(year, month - 1, 1, 12);
  const last = new Date(year, month, 0, 12).getDate();
  const cells: (Day | null)[] = Array(first.getDay()).fill(null);
  for (let d = 1; d <= last; d++) cells.push(dayOf(new Date(year, month - 1, d, 12)));
  return cells;
}

/** 무지출 도장을 찍거나 지운다. 미래 날짜는 찍을 수 없다. */
export function toggle(days: Set<Day>, day: Day, today: Day): Set<Day> {
  if (day > today) return days;
  const next = new Set(days);
  if (next.has(day)) next.delete(day);
  else next.add(day);
  return next;
}

/** 연속 기록 배지 */
export const BADGES = [3, 7, 14, 30, 50, 100] as const;
export function nextBadge(streak: number): number | null {
  return BADGES.find((b) => b > streak) ?? null;
}

// ---- 52주 저축 챌린지 ----

export const WEEKS = 52;

/** n주 차(1~52)에 넣을 금액. reverse면 52주 차 금액부터 거꾸로(처음에 크게, 연말에 작게). */
export function weekAmount(base: number, week: number, reverse = false): number {
  return base * (reverse ? WEEKS + 1 - week : week);
}

/** 52주를 다 채우면 모이는 돈 = base × (1+2+…+52) = base × 1378 */
export function goalTotal(base: number): number {
  return (base * WEEKS * (WEEKS + 1)) / 2;
}

export function savedTotal(base: number, done: Set<number>, reverse = false): number {
  let s = 0;
  for (const w of done) if (w >= 1 && w <= WEEKS) s += weekAmount(base, w, reverse);
  return s;
}

/** 시작일 기준 지금 몇 주 차인지(1~52, 끝나면 52) */
export function weekNow(start: Day, today: Day): number {
  const diff = Math.floor((parseDay(today).getTime() - parseDay(start).getTime()) / 86_400_000);
  return Math.min(WEEKS, Math.max(1, Math.floor(diff / 7) + 1));
}

export interface SaveData {
  version: 1;
  noSpend: Day[];
  /** 월 무지출 목표 일수 */
  monthlyGoal: number;
  weekly: { base: number; reverse: boolean; start: Day; done: number[] } | null;
}

export function emptyData(): SaveData {
  return { version: 1, noSpend: [], monthlyGoal: 10, weekly: null };
}

export function restore(raw: string | null): SaveData {
  if (!raw) return emptyData();
  try {
    const v = JSON.parse(raw);
    if (!v || v.version !== 1) return emptyData();
    const noSpend = Array.isArray(v.noSpend) ? [...new Set<Day>(v.noSpend.filter(isDay))] : [];
    const monthlyGoal = Number.isInteger(v.monthlyGoal) && v.monthlyGoal >= 1 && v.monthlyGoal <= 31 ? v.monthlyGoal : 10;
    let weekly: SaveData['weekly'] = null;
    const w = v.weekly;
    if (w && [1000, 5000, 10000].includes(w.base) && typeof w.reverse === 'boolean' && isDay(w.start) && Array.isArray(w.done)) {
      weekly = { base: w.base, reverse: w.reverse, start: w.start, done: [...new Set<number>(w.done.filter((n: unknown) => Number.isInteger(n) && (n as number) >= 1 && (n as number) <= WEEKS))] };
    }
    return { version: 1, noSpend, monthlyGoal, weekly };
  } catch {
    return emptyData();
  }
}

export function won(n: number): string {
  if (n >= 10_000 && n % 10_000 === 0) return `${(n / 10_000).toLocaleString('ko-KR')}만원`;
  if (n >= 10_000) return `${Math.floor(n / 10_000).toLocaleString('ko-KR')}만 ${(n % 10_000).toLocaleString('ko-KR')}원`;
  return `${n.toLocaleString('ko-KR')}원`;
}
