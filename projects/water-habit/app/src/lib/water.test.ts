import { describe, expect, it } from 'vitest';
import { MAX_CUPS, addCup, addDays, emptyData, goalStreak, lastWeek, ml, reached, restore, toggleCheck, weekAverage } from './water';

const T = '2026-11-24';

describe('컵 기록', () => {
  it('더하고 빼되 0~20 사이', () => {
    let d = emptyData();
    d = addCup(d, T);
    d = addCup(d, T);
    expect(d.log[T].cups).toBe(2);
    d = addCup(d, T, -5);
    expect(d.log[T].cups).toBe(0);
    for (let i = 0; i < 30; i++) d = addCup(d, T);
    expect(d.log[T].cups).toBe(MAX_CUPS);
  });
  it('목표 달성', () => {
    let d = { ...emptyData(), goal: 2 };
    expect(reached(d, T)).toBe(false);
    d = addCup(addCup(d, T), T);
    expect(reached(d, T)).toBe(true);
  });
  it('건강 체크 켜고 끄기', () => {
    let d = toggleCheck(emptyData(), T, 'walk');
    expect(d.log[T].checks).toEqual(['walk']);
    d = toggleCheck(d, T, 'walk');
    expect(d.log[T].checks).toEqual([]);
  });
});

describe('연속·주간', () => {
  const fill = (days: string[], goal = 2) => {
    let d = { ...emptyData(), goal };
    for (const day of days) d = addCup(d, day, goal);
    return d;
  };
  it('오늘 못 채웠으면 어제부터 센다', () => {
    expect(goalStreak(fill([T, addDays(T, -1), addDays(T, -2)]), T)).toBe(3);
    expect(goalStreak(fill([addDays(T, -1), addDays(T, -2)]), T)).toBe(2);
    expect(goalStreak(fill([addDays(T, -3)]), T)).toBe(0);
  });
  it('월말·연말 넘어가기', () => {
    expect(goalStreak(fill(['2027-01-01', '2026-12-31', '2026-12-30']), '2027-01-01')).toBe(3);
  });
  it('최근 7일과 평균', () => {
    const d = fill([T, addDays(T, -6)], 4);
    const w = lastWeek(d, T);
    expect(w).toHaveLength(7);
    expect(w[0].day).toBe(addDays(T, -6));
    expect(w[6].day).toBe(T);
    expect(w.map((x) => x.cups)).toEqual([4, 0, 0, 0, 0, 0, 4]);
    expect(weekAverage(d, T)).toBe(1.1);
  });
});

describe('표시와 저장', () => {
  it('ml·L 표시', () => {
    expect(ml(3, 200)).toBe('600ml');
    expect(ml(8, 250)).toBe('2L');
    expect(ml(7, 250)).toBe('1.8L');
  });
  it('저장값 정리', () => {
    const raw = JSON.stringify({
      version: 1,
      goal: 99,
      cupMl: 777,
      enabled: ['walk', 'hack'],
      log: { [T]: { cups: 50, checks: ['walk', 'walk', 'x'] }, bad: { cups: 1 }, '2026-02-30': { cups: 1, checks: [] } },
    });
    const d = restore(raw);
    expect(d.goal).toBe(8);
    expect(d.cupMl).toBe(200);
    expect(d.enabled).toEqual(['walk']);
    expect(d.log).toEqual({ [T]: { cups: MAX_CUPS, checks: ['walk'] } });
    expect(restore('{').goal).toBe(8);
  });
});
