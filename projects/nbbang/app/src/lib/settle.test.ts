import { describe, expect, it } from 'vitest';
import { settle, simpleSplit, splitAmount, summaryText, transfersOf, type Item } from './settle';

const it_ = (amount: number, payer: number, sharers: number[] = [], name = '항목'): Item => ({ id: Math.random().toString(36), name, amount, payer, sharers });

describe('나누기', () => {
  it('나머지 1원은 낸 사람이 먼저 부담', () => {
    const m = splitAmount(10_000, [0, 1, 2], 1);
    expect([m.get(0), m.get(1), m.get(2)]).toEqual([3333, 3334, 3333]);
    const m2 = splitAmount(10, [0, 1, 2], 5);
    expect([m2.get(0), m2.get(1), m2.get(2)]).toEqual([4, 3, 3]);
  });
});

describe('정산', () => {
  it('한 명이 다 내면 나머지가 그 사람에게 보낸다', () => {
    const s = settle(3, [it_(30_000, 0)]);
    expect(s.owe).toEqual([10_000, 10_000, 10_000]);
    expect(s.balance).toEqual([20_000, -10_000, -10_000]);
    expect(s.transfers).toEqual([
      { from: 1, to: 0, amount: 10_000 },
      { from: 2, to: 0, amount: 10_000 },
    ]);
  });
  it('항목별로 먹은 사람만 나눈다(술 안 마신 사람 빼기)', () => {
    const s = settle(3, [it_(60_000, 0, [], '고기'), it_(20_000, 1, [0, 1], '술')]);
    expect(s.owe).toEqual([30_000, 30_000, 20_000]);
    expect(s.total).toBe(80_000);
  });
  it('항상 잔액 합은 0이고, 보낼 돈을 다 보내면 모두 0이 된다', () => {
    for (let seed = 1; seed < 300; seed++) {
      let r = seed;
      const rnd = (n: number) => ((r = (r * 1103515245 + 12345) % 2147483648), r % n);
      const n = 2 + rnd(7);
      const items = Array.from({ length: 1 + rnd(6) }, () => {
        const sh = Array.from({ length: n }, (_, i) => i).filter(() => rnd(3) > 0);
        return it_(1 + rnd(200_000), rnd(n), sh);
      });
      const s = settle(n, items);
      expect(s.balance.reduce((a, b) => a + b, 0)).toBe(0);
      expect(s.owe.reduce((a, b) => a + b, 0)).toBe(s.total);
      const after = [...s.balance];
      for (const t of s.transfers) {
        after[t.from] += t.amount;
        after[t.to] -= t.amount;
      }
      expect(after.every((v) => v === 0)).toBe(true);
      expect(s.transfers.length).toBeLessThanOrEqual(n - 1);
    }
  });
  it('100원 단위로 내리면 끝전만 남는다', () => {
    const t = transfersOf([6_667, -3_333, -3_334], 100);
    expect(t).toEqual([
      { from: 2, to: 0, amount: 3_300 },
      { from: 1, to: 0, amount: 3_300 },
    ]);
  });
  it('이상한 항목은 무시한다', () => {
    const s = settle(2, [it_(-5, 0), it_(1000, 9), it_(1000, 0, [7, 8])]);
    expect(s.total).toBe(0);
    expect(s.transfers).toEqual([]);
  });
});

describe('단순 N빵', () => {
  it('100원 단위 올림과 총무 차액', () => {
    expect(simpleSplit(100_000, 3, 100)).toEqual({ each: 33_400, collected: 100_200, diff: 200 });
    expect(simpleSplit(90_000, 3, 1000)).toEqual({ each: 30_000, collected: 90_000, diff: 0 });
    expect(simpleSplit(1000, 0, 100).each).toBe(1000);
  });
});

describe('정산 문구', () => {
  it('보낼 돈 줄이 들어간다', () => {
    const s = settle(2, [it_(20_000, 0)]);
    const txt = summaryText('회식', ['민수', '영희'], s, 1);
    expect(txt).toContain('영희 → 민수 10,000원');
    expect(txt).toContain('[회식 정산] 총 20,000원');
  });
});
