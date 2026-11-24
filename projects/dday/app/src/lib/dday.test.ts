import { describe, expect, it } from 'vitest';
import { ddayLabel, diffDays, nthDay, progress, restore, sinceCount, sortEvents, upcomingMilestones, weekdayKo, type Event } from './dday';

const T = '2026-11-24';

describe('날짜 차이', () => {
  it('월말·윤년·연도 넘김', () => {
    expect(diffDays('2026-11-24', '2026-12-25')).toBe(31);
    expect(diffDays('2028-02-28', '2028-03-01')).toBe(2);
    expect(diffDays('2026-12-31', '2027-01-01')).toBe(1);
  });
  it('D-표시', () => {
    expect(ddayLabel('2026-11-26', T)).toBe('D-2');
    expect(ddayLabel(T, T)).toBe('D-Day');
    expect(ddayLabel('2026-11-20', T)).toBe('D+4');
  });
  it('2026 수능(11/19) 지나고, 설날 2027-02-06까지 74일', () => {
    expect(ddayLabel('2027-02-06', T)).toBe('D-74');
  });
});

describe('세는 날(시작일 포함)', () => {
  it('시작일이 1일째, 100일째는 시작일+99일', () => {
    expect(sinceCount(T, T)).toBe(1);
    expect(sinceCount('2026-08-17', T)).toBe(100);
    expect(nthDay('2026-08-17', 100)).toBe(T);
  });
  it('다음 기념일: 100일 단위와 주년을 가까운 순으로', () => {
    const m = upcomingMilestones('2026-08-17', T, 4);
    expect(m[0]).toEqual({ label: '100일', date: T, left: 0 });
    expect(m[1].label).toBe('200일');
    expect(m.find((x) => x.label === '1주년')?.date).toBe('2027-08-17');
  });
  it('2월 29일 시작이면 평년 주년은 3월 1일', () => {
    const m = upcomingMilestones('2028-02-29', '2028-03-01', 10);
    expect(m.find((x) => x.label === '1주년')?.date).toBe('2029-03-01');
  });
});

describe('진행률', () => {
  it('0~100으로 자른다', () => {
    expect(progress('2026-11-01', '2026-12-01', '2026-11-16')).toBe(50);
    expect(progress('2026-11-01', '2026-12-01', '2026-10-01')).toBe(0);
    expect(progress('2026-11-01', '2026-12-01', '2027-01-01')).toBe(100);
    expect(progress('2026-12-01', '2026-11-01', T)).toBe(100);
  });
  it('요일', () => {
    expect(weekdayKo('2026-11-24')).toBe('화');
  });
});

describe('정렬과 저장', () => {
  const e = (o: Partial<Event>): Event => ({ id: Math.random().toString(36), title: 'x', date: T, kind: 'countdown', emoji: '📅', ...o });
  it('고정 → 다가오는 날 가까운 순 → 지난 날 → 세는 날', () => {
    const list = [e({ title: 'since', kind: 'since', date: '2025-01-01' }), e({ title: 'far', date: '2027-01-01' }), e({ title: 'past', date: '2026-01-01' }), e({ title: 'near', date: '2026-12-01' }), e({ title: 'pin', date: '2028-01-01', pinned: true })];
    expect(sortEvents(list, T).map((x) => x.title)).toEqual(['pin', 'near', 'far', 'past', 'since']);
  });
  it('저장값 정리', () => {
    const good = e({ id: 'a', title: '수능', start: '2026-01-01' });
    const raw = JSON.stringify([good, { ...good, id: 'b', date: '2026-02-30' }, { ...good, id: 'c', kind: 'x' }, null]);
    expect(restore(raw)).toEqual([good]);
    expect(restore('{')).toEqual([]);
  });
});
