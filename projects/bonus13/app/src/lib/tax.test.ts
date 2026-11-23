import { describe, expect, it } from 'vitest';
import {
  cardDeduction,
  cardLimit,
  cardThresholdLeft,
  childCredit,
  earnedIncomeCredit,
  earnedIncomeDeduction,
  estimate,
  incomeTax,
  pensionCredit,
  rentCredit,
  won,
  type TaxInput,
} from './tax';

const M = 10_000;
const base: TaxInput = {
  salary: 5_000 * M,
  people: 1,
  kidsUnder18: 0,
  kidsForCredit: 0,
  insurance: 450 * M,
  credit: 0,
  debit: 0,
  pension: 0,
  pensionSavingsOnly: 0,
  rent: 0,
  prepaid: 200 * M,
};

describe('근로소득공제', () => {
  it('구간별 공식', () => {
    expect(earnedIncomeDeduction(400 * M)).toBe(280 * M);
    expect(earnedIncomeDeduction(1_000 * M)).toBe(550 * M);
    expect(earnedIncomeDeduction(3_000 * M)).toBe(975 * M);
    expect(earnedIncomeDeduction(5_000 * M)).toBe(1_225 * M);
    expect(earnedIncomeDeduction(12_000 * M)).toBe(1_515 * M);
  });
  it('한도 2,000만', () => {
    expect(earnedIncomeDeduction(100_000 * M)).toBe(2_000 * M);
  });
});

describe('세율', () => {
  it('구간 경계에서 이어진다(누진공제 확인)', () => {
    expect(incomeTax(0)).toBe(0);
    expect(incomeTax(1_400 * M)).toBe(84 * M);
    expect(incomeTax(5_000 * M)).toBe(624 * M);
    expect(Math.round(8_800 * M * 0.24 - 576 * M)).toBe(Math.round(8_800 * M * 0.35 - 1_544 * M));
    expect(Math.round(15_000 * M * 0.35 - 1_544 * M)).toBe(Math.round(15_000 * M * 0.38 - 1_994 * M));
    expect(Math.round(30_000 * M * 0.38 - 1_994 * M)).toBe(Math.round(30_000 * M * 0.4 - 2_594 * M));
    expect(Math.round(50_000 * M * 0.4 - 2_594 * M)).toBe(Math.round(50_000 * M * 0.42 - 3_594 * M));
    expect(Math.round(100_000 * M * 0.42 - 3_594 * M)).toBe(Math.round(100_000 * M * 0.45 - 6_594 * M));
  });
});

describe('근로소득세액공제', () => {
  it('130만 이하 55%, 넘으면 71.5만 + 30%', () => {
    expect(earnedIncomeCredit(100 * M, 2_000 * M)).toBe(55 * M);
    expect(earnedIncomeCredit(130 * M, 2_000 * M)).toBe(715_000);
  });
  it('총급여별 한도', () => {
    expect(earnedIncomeCredit(500 * M, 3_000 * M)).toBe(74 * M);
    expect(earnedIncomeCredit(500 * M, 5_000 * M)).toBe(66 * M);
    expect(earnedIncomeCredit(500 * M, 3_500 * M)).toBe(724_000);
    expect(earnedIncomeCredit(900 * M, 7_200 * M)).toBe(50 * M); // 66만 - 초과분의 1/2, 최소 50만
    expect(earnedIncomeCredit(900 * M, 9_000 * M)).toBe(50 * M);
    expect(earnedIncomeCredit(9_000 * M, 30_000 * M)).toBe(20 * M);
  });
});

describe('카드 소득공제', () => {
  it('총급여 25% 넘게 쓴 부분부터, 신용카드로 문턱을 먼저 채운다', () => {
    expect(cardDeduction(4_000 * M, 900 * M, 0, 0)).toBe(0);
    expect(cardDeduction(4_000 * M, 1_500 * M, 500 * M, 0)).toBe(225 * M);
    expect(cardDeduction(4_000 * M, 500 * M, 1_000 * M, 0)).toBe(150 * M);
  });
  it('한도는 자녀 수에 따라 늘어난다', () => {
    expect(cardLimit(5_000 * M, 0)).toBe(300 * M);
    expect(cardLimit(5_000 * M, 1)).toBe(350 * M);
    expect(cardLimit(5_000 * M, 3)).toBe(400 * M);
    expect(cardLimit(8_000 * M, 0)).toBe(250 * M);
    expect(cardLimit(8_000 * M, 2)).toBe(300 * M);
    expect(cardDeduction(4_000 * M, 1_000 * M, 3_000 * M, 0)).toBe(300 * M);
  });
  it('문턱까지 남은 금액', () => {
    expect(cardThresholdLeft(4_000 * M, 600 * M, 100 * M)).toBe(300 * M);
    expect(cardThresholdLeft(4_000 * M, 2_000 * M, 0)).toBe(0);
  });
});

describe('세액공제', () => {
  it('자녀', () => {
    expect([0, 1, 2, 3, 4].map(childCredit)).toEqual([0, 25 * M, 55 * M, 95 * M, 135 * M]);
  });
  it('연금계좌: 연금저축 600만·합산 900만, 5,500만 기준 15%/12%', () => {
    expect(pensionCredit(5_000 * M, 600 * M, 600 * M)).toBe(90 * M);
    expect(pensionCredit(5_000 * M, 1_000 * M, 1_000 * M)).toBe(90 * M);
    expect(pensionCredit(5_000 * M, 1_200 * M, 300 * M)).toBe(135 * M);
    expect(pensionCredit(6_000 * M, 900 * M, 0)).toBe(108 * M);
  });
  it('월세: 8,000만 넘으면 없음, 한도 1,000만', () => {
    expect(rentCredit(4_000 * M, 600 * M)).toBe(102 * M);
    expect(rentCredit(7_000 * M, 1_200 * M)).toBe(150 * M);
    expect(rentCredit(9_000 * M, 600 * M)).toBe(0);
  });
});

describe('전체 추정', () => {
  it('총급여 5,000만 1인 가구 손계산과 같다', () => {
    const r = estimate(base);
    expect(r.earnedIncome).toBe(3_775 * M);
    expect(r.base).toBe(3_175 * M);
    expect(r.computed).toBe(3_502_500);
    expect(r.credits.earned).toBe(66 * M);
    expect(r.decided).toBe(2_712_500);
    expect(r.decidedWithLocal).toBe(2_983_750);
    expect(r.refund).toBe(2_200_000 - 2_983_750);
  });
  it('공제가 커도 결정세액은 0 아래로 안 내려간다', () => {
    const r = estimate({ ...base, salary: 2_400 * M, people: 4, kidsForCredit: 2, pension: 900 * M, pensionSavingsOnly: 600 * M, prepaid: 30 * M });
    expect(r.decided).toBe(0);
    expect(r.refund).toBe(33 * M);
  });
  it('4대보험을 모르면 총급여 9%로 추정', () => {
    const r = estimate({ ...base, insurance: null });
    expect(r.insuranceGuessed).toBe(true);
    expect(r.insurance).toBe(450 * M);
  });
  it('이상한 입력은 0으로 본다', () => {
    const r = estimate({ ...base, salary: Number.NaN, people: -3, credit: -1 });
    expect(r.decided).toBe(0);
    expect(r.personal).toBe(150 * M);
  });
});

describe('금액 표시', () => {
  it('만 단위로 읽기 쉽게', () => {
    expect(won(0)).toBe('0원');
    expect(won(5_000)).toBe('5,000원');
    expect(won(1_230_000)).toBe('123만원');
    expect(won(-783_750)).toBe('78만 3,750원');
  });
});
