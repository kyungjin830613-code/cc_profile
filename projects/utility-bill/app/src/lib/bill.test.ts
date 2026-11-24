import { describe, expect, it } from 'vitest';
import { electricBill, gasBill, isSummer, m3ToMj, superSeason, tiers } from './bill';

describe('전기요금: 공개 자료 예시와 대조', () => {
  it('저압 350kWh(기타계절) 전기요금계 62,690원', () => {
    const b = electricBill(350, 'low', 11);
    expect(b.tier).toBe(2);
    expect(b.base).toBe(1600);
    expect(b.energy).toBe(56_190);
    expect(b.subtotal).toBe(62_690);
  });
  it('저압 400kWh(기타계절) 청구 합계 83,530원', () => {
    const b = electricBill(400, 'low', 11);
    expect(b.subtotal).toBe(74_120);
    expect(b.total).toBe(83_530);
  });
});

describe('전기요금: 구간과 계절', () => {
  it('하계는 300/450, 기타계절은 200/400', () => {
    expect(isSummer(7) && isSummer(8) && !isSummer(9)).toBe(true);
    expect(tiers('low', 8).map((t) => t.upto)).toEqual([300, 450, Infinity]);
    expect(tiers('low', 3).map((t) => t.upto)).toEqual([200, 400, Infinity]);
    expect(electricBill(300, 'low', 8).tier).toBe(1);
    expect(electricBill(300, 'low', 3).tier).toBe(2);
  });
  it('기본요금은 도달한 단계 한 번만', () => {
    expect(electricBill(150, 'low', 5).base).toBe(910);
    expect(electricBill(500, 'low', 5).base).toBe(7300);
    expect(electricBill(0, 'low', 5).total).toBe(0);
  });
  it('3단계 전력량요금 = 200×120 + 200×214.6 + 나머지×307.3', () => {
    expect(electricBill(500, 'low', 5).energy).toBe(Math.floor(200 * 120 + 200 * 214.6 + 100 * 307.3));
  });
  it('고압(아파트)이 저압보다 싸다', () => {
    for (const k of [100, 250, 350, 600]) expect(electricBill(k, 'high', 5).total).toBeLessThan(electricBill(k, 'low', 5).total);
  });
  it('슈퍼유저는 하계·동계 1,000kWh 초과분만', () => {
    expect(superSeason(1) && superSeason(12) && superSeason(7) && !superSeason(5)).toBe(true);
    const winter = electricBill(1100, 'low', 1).energy;
    const spring = electricBill(1100, 'low', 5).energy;
    expect(winter - spring).toBe(Math.floor(100 * (736.2 - 307.3)));
  });
  it('사용량이 늘면 요금이 줄지 않는다(모든 달·전압)', () => {
    for (const v of ['low', 'high'] as const)
      for (let m = 1; m <= 12; m++) {
        let prev = -1;
        for (let k = 0; k <= 1300; k += 5) {
          const t = electricBill(k, v, m).total;
          expect(t, `${v} ${m}월 ${k}kWh`).toBeGreaterThanOrEqual(prev);
          prev = t;
        }
      }
  });
  it('다음 단계까지 남은 양', () => {
    expect(electricBill(190, 'low', 5).toNextTier).toBe(11);
    expect(electricBill(500, 'low', 5).toNextTier).toBeNull();
  });
});

describe('도시가스', () => {
  it('서울 기준 1,000MJ', () => {
    const g = gasBill(1000);
    expect(g.usage).toBe(22_526);
    expect(g.base).toBe(1250);
    expect(g.vat).toBe(2_378);
    expect(g.total).toBe(26_150);
  });
  it('안 쓰면 0원, 단가 바꾸기', () => {
    expect(gasBill(0).total).toBe(0);
    expect(gasBill(100, 20, 1000).total).toBe(Math.floor((2000 + 1000) * 1.1 / 10) * 10);
  });
  it('m³ → MJ', () => {
    expect(m3ToMj(100)).toBe(4270);
    expect(m3ToMj(100, 43)).toBe(4300);
  });
});
