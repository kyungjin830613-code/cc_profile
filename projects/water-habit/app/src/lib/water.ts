// 물 한 잔 습관: 하루 물 마신 컵 수와 간단한 건강 체크 기록. 의학적 조언이 아닌 생활 습관 기록장.

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

export const CHECKS = [
  { id: 'walk', label: '30분 걷기', emoji: '🚶' },
  { id: 'stretch', label: '스트레칭', emoji: '🙆' },
  { id: 'vitamin', label: '영양제 챙기기', emoji: '💊' },
  { id: 'sleep', label: '12시 전에 자기', emoji: '🌙' },
  { id: 'veggie', label: '채소 한 접시', emoji: '🥗' },
] as const;
export type CheckId = (typeof CHECKS)[number]['id'];
const CHECK_IDS = CHECKS.map((c) => c.id) as string[];

export interface DayLog {
  cups: number;
  checks: CheckId[];
}

export interface Data {
  version: 1;
  /** 하루 목표 컵 수 */
  goal: number;
  /** 한 컵 용량(ml) */
  cupMl: number;
  /** 쓰는 체크 항목 */
  enabled: CheckId[];
  log: Record<Day, DayLog>;
}

export const MAX_CUPS = 20;
export const CUP_SIZES = [150, 200, 250, 300, 500];

export function emptyData(): Data {
  return { version: 1, goal: 8, cupMl: 200, enabled: ['walk', 'stretch'], log: {} };
}

export function dayLog(d: Data, day: Day): DayLog {
  return d.log[day] ?? { cups: 0, checks: [] };
}

export function addCup(d: Data, day: Day, n = 1): Data {
  const cur = dayLog(d, day);
  const cups = Math.max(0, Math.min(MAX_CUPS, cur.cups + n));
  return { ...d, log: { ...d.log, [day]: { ...cur, cups } } };
}

export function toggleCheck(d: Data, day: Day, id: CheckId): Data {
  const cur = dayLog(d, day);
  const checks = cur.checks.includes(id) ? cur.checks.filter((c) => c !== id) : [...cur.checks, id];
  return { ...d, log: { ...d.log, [day]: { ...cur, checks } } };
}

export function reached(d: Data, day: Day): boolean {
  return dayLog(d, day).cups >= d.goal;
}

/** 목표 달성 연속 일수. 오늘 아직 못 채웠으면 어제부터 센다. */
export function goalStreak(d: Data, today: Day): number {
  let cur = reached(d, today) ? today : addDays(today, -1);
  let n = 0;
  while (reached(d, cur)) {
    n++;
    cur = addDays(cur, -1);
  }
  return n;
}

/** 최근 7일(오래된 날 → 오늘) */
export function lastWeek(d: Data, today: Day): { day: Day; cups: number; reached: boolean }[] {
  return Array.from({ length: 7 }, (_, i) => {
    const day = addDays(today, i - 6);
    return { day, cups: dayLog(d, day).cups, reached: reached(d, day) };
  });
}

export function weekAverage(d: Data, today: Day): number {
  const w = lastWeek(d, today);
  return Math.round((w.reduce((s, x) => s + x.cups, 0) / 7) * 10) / 10;
}

export function ml(cups: number, cupMl: number): string {
  const v = cups * cupMl;
  return v >= 1000 ? `${(Math.round(v / 100) / 10).toLocaleString('ko-KR')}L` : `${v}ml`;
}

/** 저장값 정리: 이상한 값은 버리고 기본값으로 */
export function restore(raw: string | null): Data {
  const base = emptyData();
  if (!raw) return base;
  try {
    const v = JSON.parse(raw);
    if (!v || v.version !== 1) return base;
    const goal = Number.isInteger(v.goal) && v.goal >= 1 && v.goal <= MAX_CUPS ? v.goal : base.goal;
    const cupMl = CUP_SIZES.includes(v.cupMl) ? v.cupMl : base.cupMl;
    const enabled = Array.isArray(v.enabled) ? (v.enabled.filter((x: unknown) => CHECK_IDS.includes(x as string)) as CheckId[]) : base.enabled;
    const log: Record<Day, DayLog> = {};
    if (v.log && typeof v.log === 'object') {
      for (const [day, l] of Object.entries(v.log as Record<string, DayLog>)) {
        if (!isDay(day) || !l || typeof l !== 'object') continue;
        const cups = Number.isInteger(l.cups) ? Math.max(0, Math.min(MAX_CUPS, l.cups)) : 0;
        const checks = Array.isArray(l.checks) ? ([...new Set(l.checks.filter((c) => CHECK_IDS.includes(c)))] as CheckId[]) : [];
        log[day] = { cups, checks };
      }
    }
    return { version: 1, goal, cupMl, enabled, log };
  } catch {
    return base;
  }
}
