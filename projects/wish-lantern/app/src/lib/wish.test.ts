import { describe, expect, it } from 'vitest';
import { MAX_TEXT, MAX_WISHES, addDays, addWish, checkIn, checkedToday, daysToNewYear, glow, makeWish, restore, streak } from './wish';

const T = '2026-11-24';

describe('소원 만들기', () => {
  it('공백 정리, 40자 제한, 빈 소원 거절', () => {
    expect(makeWish('  건강하게   운동하기 ', 'health', T, 'a')?.text).toBe('건강하게 운동하기');
    expect(makeWish('가'.repeat(60), 'money', T, 'b')?.text).toHaveLength(MAX_TEXT);
    expect(makeWish('   ', 'money', T, 'c')).toBeNull();
    expect(makeWish('x', 'magic' as never, T, 'd')).toBeNull();
  });
  it('최대 7개까지', () => {
    let list = [] as ReturnType<typeof addWish>;
    for (let i = 0; i < 10; i++) list = addWish(list, makeWish(`소원${i}`, 'love', T, String(i)));
    expect(list).toHaveLength(MAX_WISHES);
  });
});

describe('다짐 확인', () => {
  const w = makeWish('저축 500만원', 'money', T, 'w')!;
  it('하루 한 번만', () => {
    const a = checkIn(checkIn(w, T), T);
    expect(a.checks).toEqual([T]);
    expect(checkedToday(a, T)).toBe(true);
  });
  it('연속 일수(오늘 안 했으면 어제부터), 월말 넘기기', () => {
    let a = w;
    for (const d of ['2026-11-28', '2026-11-29', '2026-11-30', '2026-12-01']) a = checkIn(a, d);
    expect(streak(a, '2026-12-01')).toBe(4);
    expect(streak(a, '2026-12-02')).toBe(4);
    expect(streak(a, '2026-12-03')).toBe(0);
  });
  it('밝기: 최근 7일 비율, 최소 0.25', () => {
    expect(glow(w, T)).toBe(0.25);
    let a = w;
    for (let i = 0; i < 7; i++) a = checkIn(a, addDays(T, -i));
    expect(glow(a, T)).toBe(1);
  });
});

describe('새해까지', () => {
  it('남은 날', () => {
    expect(daysToNewYear('2026-12-31')).toBe(1);
    expect(daysToNewYear('2027-01-01')).toBe(0);
    expect(daysToNewYear('2026-11-24')).toBe(38);
  });
});

describe('저장값', () => {
  it('정상값 살리고 이상한 값 버리기', () => {
    const good = { id: 'a', text: '여행 가기', topic: 'family', created: T, checks: [T, T, 'x'] };
    const raw = JSON.stringify([good, { ...good, id: 'b', topic: 'zzz' }, { ...good, id: 'c', text: '  ' }, null]);
    expect(restore(raw)).toEqual([{ ...good, checks: [T] }]);
    expect(restore('{')).toEqual([]);
  });
});
