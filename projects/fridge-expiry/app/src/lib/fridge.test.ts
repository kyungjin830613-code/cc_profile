import { describe, expect, it } from 'vitest';
import { addDays, addItem, counts, daysLeft, eatToday, emptyData, finish, label, levelOf, monthStats, restore, sortItems, type Item } from './fridge';

const T = '2026-11-25';
const it0 = (id: string, name: string, expires: string, added = T): Item => ({ id, name, cat: 'veg', storage: 'fridge', expires, added });

describe('날짜', () => {
  it('남은 날과 표시', () => {
    expect(daysLeft('2026-11-25', T)).toBe(0);
    expect(daysLeft('2026-11-26', T)).toBe(1);
    expect(daysLeft('2026-11-23', T)).toBe(-2);
    expect(daysLeft('2027-01-01', '2026-12-31')).toBe(1);
    expect(label(0)).toBe('오늘까지');
    expect(label(3)).toBe('D-3');
    expect(label(-2)).toBe('2일 지남');
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
  });
  it('단계: 지남/오늘·내일/3일 이내/여유', () => {
    expect([-1, 0, 1, 2, 3, 4].map(levelOf)).toEqual(['over', 'urgent', 'urgent', 'soon', 'soon', 'ok']);
  });
});

describe('목록', () => {
  it('임박한 순, 같은 날은 먼저 넣은 순', () => {
    const s = sortItems([it0('a', '우유', '2026-11-30'), it0('b', '두부', '2026-11-26', '2026-11-20'), it0('c', '대파', '2026-11-26', '2026-11-10')]);
    expect(s.map((i) => i.name)).toEqual(['대파', '두부', '우유']);
  });
  it('오늘 먹을 것은 오늘·내일 마감만(지난 것 제외)', () => {
    const items = [it0('a', '지난것', '2026-11-24'), it0('b', '오늘', T), it0('c', '내일', '2026-11-26'), it0('d', '모레', '2026-11-27')];
    expect(eatToday(items, T).map((i) => i.name)).toEqual(['오늘', '내일']);
    expect(counts(items, T)).toEqual({ over: 1, urgent: 2, soon: 1, ok: 0 });
  });
  it('추가: 빈 이름·잘못된 날짜는 무시, 이름 다듬기', () => {
    let d = addItem(emptyData(), it0('a', '  우유  ', '2026-11-30'));
    expect(d.items[0].name).toBe('우유');
    d = addItem(d, it0('b', '   ', '2026-11-30'));
    d = addItem(d, it0('c', '두부', '11/30'));
    expect(d.items).toHaveLength(1);
  });
});

describe('다 먹음·버림', () => {
  it('목록에서 빠지고 이번 달 통계에 잡힘', () => {
    let d = addItem(emptyData(), it0('a', '우유', '2026-11-30'));
    d = addItem(d, it0('b', '두부', '2026-11-26'));
    d = addItem(d, it0('c', '대파', '2026-11-27'));
    d = finish(d, 'a', 'ate', T);
    d = finish(d, 'b', 'wasted', T);
    d = finish(d, 'c', 'ate', T);
    expect(d.items).toHaveLength(0);
    expect(monthStats(d.done, T)).toEqual({ ate: 2, wasted: 1, rate: 67 });
    expect(monthStats(d.done, '2026-12-01')).toEqual({ ate: 0, wasted: 0, rate: null });
  });
});

describe('복원', () => {
  it('깨진 항목은 버림', () => {
    const d = restore(JSON.stringify({ items: [it0('a', '우유', '2026-11-30'), { id: 'x', name: '', expires: T, cat: 'veg', storage: 'fridge' }, { id: 'y', name: '이상', expires: T, cat: 'zzz', storage: 'fridge' }], done: [{ name: '두부', day: T, result: 'ate' }, { name: '?', day: T, result: 'lost' }] }));
    expect(d.items.map((i) => i.name)).toEqual(['우유']);
    expect(d.done).toHaveLength(1);
    expect(restore('{bad').items).toEqual([]);
  });
});
