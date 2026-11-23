import { describe, expect, it } from 'vitest';
import { addDays, bestStreak, countInMonth, currentStreak, goalTotal, isDay, monthGrid, nextBadge, restore, savedTotal, toggle, weekAmount, weekNow, won } from './challenge';

const S = (...d: string[]) => new Set(d);

describe('날짜', () => {
  it('월말·연말·윤년을 넘어간다', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2028-03-01', -1)).toBe('2028-02-29');
    expect(addDays('2027-03-01', -1)).toBe('2027-02-28');
  });
  it('없는 날짜는 거른다', () => {
    expect(isDay('2026-02-30')).toBe(false);
    expect(isDay('2026-2-3')).toBe(false);
    expect(isDay('2026-11-23')).toBe(true);
  });
  it('달력: 2026년 11월 1일은 일요일, 30칸', () => {
    const g = monthGrid(2026, 11);
    expect(g[0]).toBe('2026-11-01');
    expect(g.filter(Boolean)).toHaveLength(30);
    expect(monthGrid(2026, 12)[2]).toBe('2026-12-01'); // 12월 1일은 화요일
  });
});

describe('연속 기록', () => {
  it('오늘 찍었으면 오늘부터, 아직이면 어제부터 센다', () => {
    const d = S('2026-11-21', '2026-11-22', '2026-11-23');
    expect(currentStreak(d, '2026-11-23')).toBe(3);
    expect(currentStreak(S('2026-11-21', '2026-11-22'), '2026-11-23')).toBe(2);
    expect(currentStreak(S('2026-11-20'), '2026-11-23')).toBe(0);
  });
  it('최장 기록', () => {
    expect(bestStreak(S('2026-11-01', '2026-11-02', '2026-11-05', '2026-11-06', '2026-11-07'))).toBe(3);
    expect(bestStreak(S())).toBe(0);
    expect(bestStreak(S('2026-12-31', '2027-01-01'))).toBe(2);
  });
  it('이번 달 개수', () => {
    expect(countInMonth(S('2026-11-01', '2026-11-30', '2026-12-01'), 2026, 11)).toBe(2);
  });
  it('미래 날짜는 찍을 수 없고, 다시 누르면 지워진다', () => {
    expect(toggle(S(), '2026-11-24', '2026-11-23').size).toBe(0);
    const a = toggle(S(), '2026-11-23', '2026-11-23');
    expect(a.has('2026-11-23')).toBe(true);
    expect(toggle(a, '2026-11-23', '2026-11-23').size).toBe(0);
  });
  it('다음 배지', () => {
    expect(nextBadge(0)).toBe(3);
    expect(nextBadge(7)).toBe(14);
    expect(nextBadge(100)).toBeNull();
  });
});

describe('52주 저축', () => {
  it('n주 차 금액과 총액', () => {
    expect(weekAmount(1000, 1)).toBe(1000);
    expect(weekAmount(1000, 52)).toBe(52000);
    expect(weekAmount(1000, 1, true)).toBe(52000);
    expect(goalTotal(1000)).toBe(1_378_000);
    expect(goalTotal(10000)).toBe(13_780_000);
  });
  it('채운 주만 더한다', () => {
    expect(savedTotal(1000, new Set([1, 2, 3]))).toBe(6000);
    expect(savedTotal(1000, new Set([1, 99]))).toBe(1000);
    expect(savedTotal(1000, new Set(Array.from({ length: 52 }, (_, i) => i + 1)), true)).toBe(1_378_000);
  });
  it('몇 주 차인지', () => {
    expect(weekNow('2026-11-23', '2026-11-23')).toBe(1);
    expect(weekNow('2026-11-23', '2026-11-30')).toBe(2);
    expect(weekNow('2026-11-23', '2028-01-01')).toBe(52);
    expect(weekNow('2026-11-23', '2026-11-01')).toBe(1);
  });
});

describe('저장값', () => {
  it('정상값 복원, 이상한 값 정리', () => {
    const raw = JSON.stringify({ version: 1, noSpend: ['2026-11-23', '2026-11-23', 'x', '2026-02-30'], monthlyGoal: 99, weekly: { base: 1000, reverse: false, start: '2026-11-23', done: [1, 1, 60, 2] } });
    const v = restore(raw);
    expect(v.noSpend).toEqual(['2026-11-23']);
    expect(v.monthlyGoal).toBe(10);
    expect(v.weekly?.done).toEqual([1, 2]);
    expect(restore('{').noSpend).toEqual([]);
    expect(restore(JSON.stringify({ version: 1, weekly: { base: 777 } })).weekly).toBeNull();
  });
  it('금액 표시', () => {
    expect(won(1000)).toBe('1,000원');
    expect(won(1_378_000)).toBe('137만 8,000원');
    expect(won(13_780_000)).toBe('1,378만원');
  });
});
