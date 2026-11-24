// 집중 타이머: 25분 집중 + 5분 휴식(뽀모도로 방식). 시간은 '끝나는 시각'으로 저장해서
// 앱을 닫았다 열어도 남은 시간이 맞게 계산된다. 집중을 끝까지 마친 회차만 기록한다.

export type Day = string;
export function dayOf(d: Date | number): Day {
  const x = typeof d === 'number' ? new Date(d) : d;
  const p = (n: number) => String(n).padStart(2, '0');
  return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`;
}
export function addDays(day: Day, n: number): Day {
  const [y, m, d] = day.split('-').map(Number);
  return dayOf(new Date(y, m - 1, d + n, 12));
}
const isDay = (s: unknown): s is Day => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && addDays(s, 0) === s;

export type Phase = 'focus' | 'break';
export const PRESETS = [
  { focus: 25, rest: 5, label: '25 / 5' },
  { focus: 50, rest: 10, label: '50 / 10' },
  { focus: 15, rest: 3, label: '15 / 3' },
];

export interface TimerState {
  phase: Phase;
  /** 돌고 있으면 끝나는 시각(ms), 멈춰 있으면 null */
  endsAt: number | null;
  /** 멈춰 있을 때 남은 시간(ms) */
  remaining: number;
  focusMin: number;
  restMin: number;
}

export interface Log {
  /** 날짜별 완료한 집중 분 */
  minutes: Record<Day, number>;
  /** 날짜별 완료한 집중 회차 */
  sessions: Record<Day, number>;
}

export function newTimer(focusMin = 25, restMin = 5): TimerState {
  return { phase: 'focus', endsAt: null, remaining: focusMin * 60_000, focusMin, restMin };
}

export function start(s: TimerState, now: number): TimerState {
  if (s.endsAt !== null) return s;
  return { ...s, endsAt: now + s.remaining };
}

export function pause(s: TimerState, now: number): TimerState {
  if (s.endsAt === null) return s;
  return { ...s, endsAt: null, remaining: Math.max(0, s.endsAt - now) };
}

/** 처음부터(현재 단계 시간으로) */
export function reset(s: TimerState): TimerState {
  return { ...s, endsAt: null, remaining: (s.phase === 'focus' ? s.focusMin : s.restMin) * 60_000 };
}

export function remaining(s: TimerState, now: number): number {
  return s.endsAt === null ? s.remaining : Math.max(0, s.endsAt - now);
}

/**
 * 시간이 흐른 뒤 상태 정리. 단계가 끝났으면 다음 단계로 넘어가고(멈춘 상태로 대기),
 * 집중이 끝났으면 그 끝난 날짜로 기록을 더한다.
 */
export function advance(s: TimerState, log: Log, now: number): { state: TimerState; log: Log; finished: Phase | null } {
  if (s.endsAt === null || now < s.endsAt) return { state: s, log, finished: null };
  if (s.phase === 'focus') {
    const day = dayOf(s.endsAt);
    const next: Log = {
      minutes: { ...log.minutes, [day]: (log.minutes[day] ?? 0) + s.focusMin },
      sessions: { ...log.sessions, [day]: (log.sessions[day] ?? 0) + 1 },
    };
    return { state: { ...s, phase: 'break', endsAt: null, remaining: s.restMin * 60_000 }, log: next, finished: 'focus' };
  }
  return { state: { ...s, phase: 'focus', endsAt: null, remaining: s.focusMin * 60_000 }, log, finished: 'break' };
}

/** 지금 단계를 건너뛰기(집중을 건너뛰면 기록하지 않는다) */
export function skip(s: TimerState): TimerState {
  return s.phase === 'focus' ? { ...s, phase: 'break', endsAt: null, remaining: s.restMin * 60_000 } : { ...s, phase: 'focus', endsAt: null, remaining: s.focusMin * 60_000 };
}

export function setPreset(focusMin: number, restMin: number): TimerState {
  return newTimer(focusMin, restMin);
}

/** 하루 1회 이상 집중한 날 연속 일수(오늘 아직이면 어제부터) */
export function streak(log: Log, today: Day): number {
  let cur = (log.sessions[today] ?? 0) > 0 ? today : addDays(today, -1);
  let n = 0;
  while ((log.sessions[cur] ?? 0) > 0) {
    n++;
    cur = addDays(cur, -1);
  }
  return n;
}

export function lastWeek(log: Log, today: Day): { day: Day; minutes: number }[] {
  return Array.from({ length: 7 }, (_, i) => {
    const day = addDays(today, i - 6);
    return { day, minutes: log.minutes[day] ?? 0 };
  });
}

/** 125 → '2:05' */
export function clock(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** 95 → '1시간 35분' */
export function hm(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h}시간${m ? ` ${m}분` : ''}` : `${m}분`;
}

export function restoreLog(raw: unknown): Log {
  const out: Log = { minutes: {}, sessions: {} };
  if (!raw || typeof raw !== 'object') return out;
  const v = raw as Partial<Log>;
  for (const key of ['minutes', 'sessions'] as const) {
    const src = v[key];
    if (!src || typeof src !== 'object') continue;
    for (const [d, n] of Object.entries(src)) if (isDay(d) && Number.isInteger(n) && (n as number) >= 0 && (n as number) < 10_000) out[key][d] = n as number;
  }
  return out;
}

export function restoreTimer(raw: unknown): TimerState {
  if (!raw || typeof raw !== 'object') return newTimer();
  const v = raw as Partial<TimerState>;
  const preset = PRESETS.find((p) => p.focus === v.focusMin && p.rest === v.restMin) ?? PRESETS[0];
  const phase: Phase = v.phase === 'break' ? 'break' : 'focus';
  const max = (phase === 'focus' ? preset.focus : preset.rest) * 60_000;
  const endsAt = typeof v.endsAt === 'number' && Number.isFinite(v.endsAt) ? v.endsAt : null;
  const rem = typeof v.remaining === 'number' && v.remaining >= 0 && v.remaining <= max ? v.remaining : max;
  return { phase, endsAt, remaining: rem, focusMin: preset.focus, restMin: preset.rest };
}
