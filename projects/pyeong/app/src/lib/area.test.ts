import { describe, expect, it } from 'vitest';
import { SQM_PER_PYEONG, exclusiveFromSupply, fmt, parse, pyeongToSqm, roomArea, round, sqmToPyeong, supplyFromExclusive, typeName } from './area';

describe('평 ↔ ㎡', () => {
  it('1평 = 3.3058㎡ (400/121)', () => {
    expect(round(SQM_PER_PYEONG, 4)).toBe(3.3058);
    expect(round(pyeongToSqm(10), 2)).toBe(33.06);
    expect(round(sqmToPyeong(84), 1)).toBe(25.4);
    expect(round(sqmToPyeong(59), 1)).toBe(17.8);
  });
  it('왕복 변환이 같은 값으로 돌아온다', () => {
    for (const p of [1, 7.5, 24, 34, 100]) expect(sqmToPyeong(pyeongToSqm(p))).toBeCloseTo(p, 10);
  });
});

describe('전용·공급', () => {
  it('전용 84㎡, 전용률 74% → 공급 약 34평형', () => {
    const supply = supplyFromExclusive(84);
    expect(round(supply, 1)).toBe(113.5);
    expect(typeName(sqmToPyeong(supply))).toBe('34평형');
  });
  it('전용 59㎡ → 약 24평형', () => {
    expect(typeName(sqmToPyeong(supplyFromExclusive(59)))).toBe('24평형');
  });
  it('전용률은 50~100%로 제한, 왕복 일치', () => {
    expect(supplyFromExclusive(84, 0.1)).toBe(168);
    expect(supplyFromExclusive(84, 2)).toBe(84);
    expect(exclusiveFromSupply(supplyFromExclusive(84, 0.8), 0.8)).toBeCloseTo(84, 10);
  });
});

describe('방 넓이와 입력', () => {
  it('3m × 3.5m = 10.5㎡ ≈ 3.2평', () => {
    const r = roomArea(3, 3.5);
    expect(r.sqm).toBe(10.5);
    expect(round(r.pyeong, 1)).toBe(3.2);
    expect(roomArea(-1, 3).sqm).toBe(0);
  });
  it('입력 파싱과 표시', () => {
    expect(parse('1,234.5')).toBe(1234.5);
    expect(parse('abc')).toBe(0);
    expect(parse('-3')).toBe(0);
    expect(fmt(25.43)).toBe('25.4');
    expect(fmt(25)).toBe('25');
  });
});
