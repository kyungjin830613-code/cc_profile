import { describe, expect, it } from 'vitest';
import { advance, clock, hm, lastWeek, newTimer, pause, remaining, reset, restoreLog, restoreTimer, skip, start, streak, type Log } from './timer';

const T0 = new Date(2026, 10, 24, 9, 0, 0).getTime();
const MIN = 60_000;
const empty = (): Log => ({ minutes: {}, sessions: {} });

describe('타이머 흐름', () => {
  it('시작하면 끝나는 시각으로 남은 시간을 계산', () => {
    const s = start(newTimer(25, 5), T0);
    expect(remaining(s, T0 + 10 * MIN)).toBe(15 * MIN);
  });
  it('일시정지했다가 다시 시작해도 남은 시간 유지', () => {
    let s = start(newTimer(25, 5), T0);
    s = pause(s, T0 + 10 * MIN);
    expect(remaining(s, T0 + 60 * MIN)).toBe(15 * MIN);
    s = start(s, T0 + 60 * MIN);
    expect(remaining(s, T0 + 70 * MIN)).toBe(5 * MIN);
  });
  it('집중이 끝나면 기록하고 휴식 대기, 휴식이 끝나면 집중 대기', () => {
    const s = start(newTimer(25, 5), T0);
    const a = advance(s, empty(), T0 + 25 * MIN);
    expect(a.finished).toBe('focus');
    expect(a.log.minutes['2026-11-24']).toBe(25);
    expect(a.log.sessions['2026-11-24']).toBe(1);
    expect(a.state.phase).toBe('break');
    expect(a.state.endsAt).toBeNull();
    const b = advance(start(a.state, T0 + 26 * MIN), a.log, T0 + 31 * MIN);
    expect(b.finished).toBe('break');
    expect(b.state.phase).toBe('focus');
    expect(b.log).toBe(a.log);
  });
  it('끝나기 전엔 아무 일도 없다', () => {
    const s = start(newTimer(), T0);
    expect(advance(s, empty(), T0 + 24 * MIN).finished).toBeNull();
  });
  it('앱을 닫았다가 한참 뒤 열어도 끝난 날짜로 한 번만 기록', () => {
    const late = new Date(2026, 10, 24, 23, 50).getTime();
    const a = advance(start(newTimer(25, 5), late), empty(), late + 8 * 60 * MIN);
    expect(a.log.sessions).toEqual({ '2026-11-25': 1 });
  });
  it('집중을 건너뛰면 기록하지 않는다, 처음부터는 현재 단계 시간', () => {
    const s = skip(start(newTimer(25, 5), T0));
    expect(s.phase).toBe('break');
    expect(s.remaining).toBe(5 * MIN);
    expect(reset(start(newTimer(50, 10), T0)).remaining).toBe(50 * MIN);
  });
});

describe('기록', () => {
  it('연속 일수와 7일 그래프', () => {
    const log: Log = { minutes: { '2026-11-22': 50, '2026-11-23': 25 }, sessions: { '2026-11-22': 2, '2026-11-23': 1 } };
    expect(streak(log, '2026-11-24')).toBe(2);
    expect(streak(log, '2026-11-25')).toBe(0);
    const w = lastWeek(log, '2026-11-24');
    expect(w).toHaveLength(7);
    expect(w[5]).toEqual({ day: '2026-11-23', minutes: 25 });
  });
  it('표시', () => {
    expect(clock(25 * MIN)).toBe('25:00');
    expect(clock(61_500)).toBe('1:02');
    expect(hm(95)).toBe('1시간 35분');
    expect(hm(25)).toBe('25분');
    expect(hm(120)).toBe('2시간');
  });
  it('저장값 정리', () => {
    expect(restoreLog({ minutes: { '2026-11-24': 25, bad: 3, '2026-11-25': -1 }, sessions: 'x' })).toEqual({ minutes: { '2026-11-24': 25 }, sessions: {} });
    const t = restoreTimer({ phase: 'break', focusMin: 50, restMin: 10, remaining: 3 * MIN, endsAt: null });
    expect(t).toMatchObject({ phase: 'break', focusMin: 50, restMin: 10, remaining: 3 * MIN });
    expect(restoreTimer({ focusMin: 7, restMin: 1, remaining: 999 * MIN }).focusMin).toBe(25);
  });
});
