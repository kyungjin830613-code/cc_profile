import { describe, expect, it } from 'vitest';
import { DAILY, INTERVALS, addDays, dueReviews, emptyData, grade, makeQuestion, pickToday, restore, seeded, stats, streak, wrongNote } from './study';
import { WORDS } from './words';

describe('단어장', () => {
  it('180개, 아이디 중복 없음', () => {
    expect(WORDS.length).toBe(180);
    expect(new Set(WORDS.map((w) => w.id)).size).toBe(180);
  });
});

describe('오늘의 단어', () => {
  it('같은 날은 같은 5개, 날이 바뀌면 달라짐, 배운 단어는 빠짐', () => {
    const d = emptyData();
    const a = pickToday(d, '2026-11-24');
    expect(a).toHaveLength(DAILY);
    expect(pickToday(d, '2026-11-24')).toEqual(a);
    expect(pickToday(d, '2026-11-25')).not.toEqual(a);
    let g = d;
    for (const id of a) g = grade(g, id, true, '2026-11-24');
    const b = pickToday(g, '2026-11-24'.replace('24', '26'));
    expect(b.some((id) => a.includes(id))).toBe(false);
    expect(a.every((id) => id.startsWith('basic:'))).toBe(true);
  });
  it('저장된 오늘 단어가 있으면 그대로', () => {
    const d = { ...emptyData(), today: { day: '2026-11-24', ids: ['basic:borrow'] } };
    expect(pickToday(d, '2026-11-24')).toEqual(['basic:borrow']);
  });
});

describe('복습 간격', () => {
  it('맞히면 1→3→7→14→30일, 다섯 번 맞히면 외움', () => {
    let d = emptyData();
    let day = '2026-11-24';
    const gaps: number[] = [];
    for (let i = 0; i < 5; i++) {
      d = grade(d, 'basic:borrow', true, day);
      const due = d.cards['basic:borrow'].due;
      const [y1, m1, d1] = day.split('-').map(Number);
      const [y2, m2, d2] = due.split('-').map(Number);
      gaps.push(Math.round((new Date(y2, m2 - 1, d2).getTime() - new Date(y1, m1 - 1, d1).getTime()) / 86400000));
      day = due;
    }
    expect(gaps).toEqual(INTERVALS);
    expect(d.cards['basic:borrow'].stage).toBe(5);
    expect(dueReviews(d, '2027-12-31')).toEqual([]);
    expect(stats(d).mastered).toBe(1);
  });
  it('틀리면 처음 단계로, 내일 다시, 오답 노트에 올라감', () => {
    let d = grade(emptyData(), 'basic:lend', true, '2026-11-24');
    d = grade(d, 'basic:lend', false, '2026-11-25');
    expect(d.cards['basic:lend']).toEqual({ stage: 0, due: '2026-11-26', wrong: 1 });
    expect(dueReviews(d, '2026-11-25')).toEqual([]);
    expect(dueReviews(d, '2026-11-26')).toEqual(['basic:lend']);
    expect(wrongNote(d).map((w) => w.en)).toEqual(['lend']);
  });
});

describe('연속 공부', () => {
  it('오늘 안 했어도 어제까지 이어지면 유지', () => {
    expect(streak(['2026-11-22', '2026-11-23'], '2026-11-24')).toBe(2);
    expect(streak(['2026-11-22', '2026-11-23', '2026-11-24'], '2026-11-24')).toBe(3);
    expect(streak(['2026-11-21'], '2026-11-24')).toBe(0);
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });
});

describe('문제', () => {
  it('보기 4개, 정답 1개, 중복 없음', () => {
    const rnd = seeded('t');
    for (const w of WORDS) {
      const q = makeQuestion(w.id, rnd);
      expect(q.choices).toHaveLength(4);
      expect(new Set(q.choices).size).toBe(4);
      expect(q.choices[q.answer]).toBe(w.ko);
    }
  });
});

describe('복원', () => {
  it('깨진 값은 버림', () => {
    const d = restore(JSON.stringify({ level: 'x', cards: { 'basic:borrow': { stage: 2, due: '2026-11-30', wrong: 1 }, nope: { stage: 1, due: '2026-11-30' } }, days: ['2026-11-24', 3] }));
    expect(d.level).toBe('basic');
    expect(Object.keys(d.cards)).toEqual(['basic:borrow']);
    expect(d.days).toEqual(['2026-11-24']);
    expect(restore('{bad').cards).toEqual({});
  });
});
