import { describe, expect, it } from 'vitest';
import { advise, byPerson, lastReceived, restore, roundAmount, sameName, totals, won, type AdviceInput, type Entry } from './ledger';

const M = 10_000;
const e = (o: Partial<Entry>): Entry => ({ id: Math.random().toString(36), name: '김민수', relation: 'friend', event: 'wedding', direction: 'received', amount: 10 * M, date: '2025-05-10', memo: '', ...o });
const ask = (o: Partial<AdviceInput>): AdviceInput => ({ name: '', relation: 'friend', event: 'wedding', attend: true, hotel: false, companions: 0, ...o });

describe('얼마 낼까: 장부 기록이 있으면 받은 만큼', () => {
  const book = [e({ amount: 15 * M, date: '2024-03-01' }), e({ amount: 10 * M, date: '2025-05-10', event: 'funeral' })];
  it('같은 종류 경조사 기록을 먼저 쓴다', () => {
    const a = advise(book, ask({ name: '김 민수', event: 'wedding' }));
    expect(a.amount).toBe(15 * M);
    expect(a.basis?.date).toBe('2024-03-01');
    expect(a.range).toBeNull();
  });
  it('같은 종류가 없으면 가장 최근 기록', () => {
    expect(lastReceived(book, '김민수', 'firstBirthday')?.date).toBe('2025-05-10');
  });
  it('내가 낸 기록은 기준으로 쓰지 않는다', () => {
    const a = advise([e({ direction: 'gave', amount: 50 * M })], ask({ name: '김민수' }));
    expect(a.basis).toBeNull();
  });
});

describe('얼마 낼까: 기록이 없을 때 관계별 기준', () => {
  it('결혼식 참석·식사하면 친구 10만, 안 가면 5만', () => {
    expect(advise([], ask({ attend: true })).amount).toBe(10 * M);
    expect(advise([], ask({ attend: false })).amount).toBe(5 * M);
  });
  it('직장 동료는 5만, 지인 불참은 3만', () => {
    expect(advise([], ask({ relation: 'coworker' })).amount).toBe(5 * M);
    expect(advise([], ask({ relation: 'acquaintance', attend: false })).amount).toBe(3 * M);
  });
  it('호텔이면 10만 이상, 동행 1명당 5만 추가', () => {
    expect(advise([], ask({ relation: 'coworker', hotel: true })).amount).toBe(10 * M);
    expect(advise([], ask({ relation: 'friend', companions: 1 })).amount).toBe(15 * M);
  });
  it('조의금: 동료 5만, 친구 5만, 지인 3만, 가족 10만', () => {
    expect(advise([], ask({ event: 'funeral', relation: 'coworker' })).amount).toBe(5 * M);
    expect(advise([], ask({ event: 'funeral', relation: 'friend' })).amount).toBe(5 * M);
    expect(advise([], ask({ event: 'funeral', relation: 'acquaintance' })).amount).toBe(3 * M);
    expect(advise([], ask({ event: 'funeral', relation: 'family' })).amount).toBe(10 * M);
  });
  it('추천은 항상 범위 안', () => {
    for (const relation of ['family', 'bestFriend', 'friend', 'closeCoworker', 'coworker', 'acquaintance'] as const)
      for (const event of ['wedding', 'funeral', 'firstBirthday', 'other'] as const)
        for (const attend of [true, false]) {
          const a = advise([], ask({ relation, event, attend }));
          expect(a.amount).toBeGreaterThanOrEqual(a.range![0]);
          expect(a.amount).toBeLessThanOrEqual(a.range![1]);
          expect(a.reasons.length).toBeGreaterThan(0);
        }
  });
});

describe('금액 단위 맞춤', () => {
  it('3·5·7·10만, 그 위로는 5만 단위', () => {
    expect([2, 4, 6, 9, 12, 16].map((m) => roundAmount(m * M) / M)).toEqual([3, 5, 7, 10, 15, 20]);
  });
});

describe('사람별 정리', () => {
  it('이름 띄어쓰기가 달라도 같은 사람, 받은 것-낸 것', () => {
    const list = byPerson([e({ amount: 10 * M }), e({ name: '김 민수', direction: 'gave', amount: 5 * M, date: '2026-01-01' }), e({ name: '이영희', date: '2024-01-01' })]);
    expect(list).toHaveLength(2);
    expect(list[0].name).toBe('김 민수');
    expect(list[0].received).toBe(10 * M);
    expect(list[0].gave).toBe(5 * M);
    expect(list[0].balance).toBe(5 * M);
    expect(sameName('', '')).toBe(false);
  });
  it('연도별 합계', () => {
    const list = [e({ date: '2026-02-01', direction: 'gave', amount: 5 * M }), e({ date: '2025-02-01' })];
    expect(totals(list, 2026)).toEqual({ gave: 5 * M, received: 0, count: 1 });
    expect(totals(list).count).toBe(2);
  });
});

describe('저장값', () => {
  it('정상 기록은 살리고 깨진 기록은 버린다', () => {
    const good = e({});
    const raw = JSON.stringify([good, { ...good, amount: -1 }, { ...good, date: '2026/1/1' }, { ...good, relation: 'boss' }, null]);
    expect(restore(raw)).toEqual([good]);
    expect(restore('{')).toEqual([]);
    expect(restore(null)).toEqual([]);
  });
  it('금액 표시', () => {
    expect(won(50_000)).toBe('5만원');
    expect(won(0)).toBe('0원');
    expect(won(123_000)).toBe('123,000원');
  });
});
