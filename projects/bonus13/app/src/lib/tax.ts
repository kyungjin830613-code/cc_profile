// 13월의 월급 미리보기: 2026년 귀속(2027년 1~2월 정산) 근로소득 연말정산 간이 추정.
// 정확한 세액이 아니라 "대략 돌려받을지, 더 낼지"를 미리 보는 용도. 공식 계산은 홈택스 연말정산 미리보기.
// 금액 단위는 모두 원. 2026년 8월 세제개편안처럼 확정되지 않은 내용은 넣지 않았다.
//
// 반영: 근로소득공제, 인적공제(1인 150만), 4대보험 소득공제, 신용·체크카드 소득공제(자녀 수에 따른 한도),
//       종합소득세율, 근로소득세액공제와 한도, 자녀세액공제, 연금계좌 세액공제, 월세 세액공제, 표준세액공제, 지방소득세.
// 빼먹은 것: 보험료·의료비·교육비·기부금 세액공제(대신 표준세액공제 13만), 전통시장·대중교통 추가공제,
//            주택자금, 추가공제(경로·장애인·부녀자·한부모) 등.

const MAN = 10_000;

export interface TaxInput {
  /** 1년 총급여(비과세 제외) */
  salary: number;
  /** 본인 포함 기본공제 인원 */
  people: number;
  /** 18세 미만 기본공제 대상 자녀 수(카드 공제 한도 가산용) */
  kidsUnder18: number;
  /** 자녀세액공제 대상 자녀 수(아동수당을 받지 않는 20세 이하 기본공제 자녀) */
  kidsForCredit: number;
  /** 국민연금·건강·고용보험 본인 부담 연간 합계. 모르면 null(총급여의 9%로 추정) */
  insurance: number | null;
  credit: number;
  /** 체크카드·현금영수증 */
  debit: number;
  /** 연금저축 + IRP 납입액 */
  pension: number;
  /** 연금저축만의 납입액(연금저축 단독 한도 600만 확인용) */
  pensionSavingsOnly: number;
  /** 무주택 세대주 월세 연간 합계(조건이 안 되면 0) */
  rent: number;
  /** 회사가 1년 동안 미리 떼 간 소득세(지방소득세 제외) */
  prepaid: number;
}

export const INSURANCE_GUESS_RATE = 0.09;

/** 근로소득공제(한도 2,000만) */
export function earnedIncomeDeduction(salary: number): number {
  const s = salary;
  let d: number;
  if (s <= 500 * MAN) d = s * 0.7;
  else if (s <= 1_500 * MAN) d = 350 * MAN + (s - 500 * MAN) * 0.4;
  else if (s <= 4_500 * MAN) d = 750 * MAN + (s - 1_500 * MAN) * 0.15;
  else if (s <= 10_000 * MAN) d = 1_200 * MAN + (s - 4_500 * MAN) * 0.05;
  else d = 1_475 * MAN + (s - 10_000 * MAN) * 0.02;
  return Math.floor(Math.min(d, 2_000 * MAN));
}

const BRACKETS: [number, number, number][] = [
  // [과세표준 상한, 세율, 누진공제]
  [1_400 * MAN, 0.06, 0],
  [5_000 * MAN, 0.15, 126 * MAN],
  [8_800 * MAN, 0.24, 576 * MAN],
  [15_000 * MAN, 0.35, 1_544 * MAN],
  [30_000 * MAN, 0.38, 1_994 * MAN],
  [50_000 * MAN, 0.4, 2_594 * MAN],
  [100_000 * MAN, 0.42, 3_594 * MAN],
  [Infinity, 0.45, 6_594 * MAN],
];

/** 종합소득세 산출세액 */
export function incomeTax(base: number): number {
  if (base <= 0) return 0;
  const [, rate, minus] = BRACKETS.find(([max]) => base <= max)!;
  return Math.floor(base * rate - minus);
}

/** 근로소득세액공제(총급여별 한도 적용) */
export function earnedIncomeCredit(computedTax: number, salary: number): number {
  const raw = computedTax <= 130 * MAN ? computedTax * 0.55 : 71.5 * MAN + (computedTax - 130 * MAN) * 0.3;
  let cap: number;
  if (salary <= 3_300 * MAN) cap = 74 * MAN;
  else if (salary <= 7_000 * MAN) cap = Math.max(74 * MAN - (salary - 3_300 * MAN) * 0.008, 66 * MAN);
  else if (salary <= 12_000 * MAN) cap = Math.max(66 * MAN - (salary - 7_000 * MAN) * 0.5, 50 * MAN);
  else cap = Math.max(50 * MAN - (salary - 12_000 * MAN) * 0.5, 20 * MAN);
  return Math.floor(Math.min(raw, cap));
}

/** 신용카드 등 소득공제 기본 한도(2026년 귀속: 18세 미만 자녀 수에 따라 가산) */
export function cardLimit(salary: number, kidsUnder18: number): number {
  const k = Math.min(kidsUnder18, 2);
  return salary <= 7_000 * MAN ? [300, 350, 400][k] * MAN : [250, 275, 300][k] * MAN;
}

/** 신용카드 등 소득공제: 총급여 25% 넘게 쓴 부분부터. 문턱은 신용카드 사용분으로 먼저 채운다. */
export function cardDeduction(salary: number, credit: number, debit: number, kidsUnder18: number): number {
  const threshold = salary * 0.25;
  if (credit + debit <= threshold) return 0;
  const creditOver = Math.max(0, credit - threshold);
  const debitOver = credit >= threshold ? debit : debit - (threshold - credit);
  const raw = creditOver * 0.15 + Math.max(0, debitOver) * 0.3;
  return Math.floor(Math.min(raw, cardLimit(salary, kidsUnder18)));
}

/** 자녀세액공제: 1명 25만, 2명 55만, 3명 이상 55만 + 셋째부터 1명당 40만 */
export function childCredit(n: number): number {
  if (n <= 0) return 0;
  if (n === 1) return 25 * MAN;
  return 55 * MAN + (n - 2) * 40 * MAN;
}

/** 연금계좌 세액공제(연금저축 600만, 합산 900만, 총급여 5,500만 이하 15% / 초과 12%) */
export function pensionCredit(salary: number, total: number, savingsOnly: number): number {
  const counted = Math.min(Math.min(savingsOnly, 600 * MAN) + Math.max(0, total - savingsOnly), 900 * MAN);
  return Math.floor(counted * (salary <= 5_500 * MAN ? 0.15 : 0.12));
}

/** 월세 세액공제(총급여 8,000만 이하, 한도 1,000만, 5,500만 이하 17% / 초과 15%) */
export function rentCredit(salary: number, rent: number): number {
  if (salary > 8_000 * MAN || rent <= 0) return 0;
  return Math.floor(Math.min(rent, 1_000 * MAN) * (salary <= 5_500 * MAN ? 0.17 : 0.15));
}

export const STANDARD_CREDIT = 13 * MAN;

export interface TaxResult {
  earnedDeduction: number;
  earnedIncome: number;
  personal: number;
  insurance: number;
  insuranceGuessed: boolean;
  card: number;
  base: number;
  computed: number;
  credits: { earned: number; child: number; pension: number; rent: number; standard: number };
  /** 결정세액(소득세) */
  decided: number;
  /** 지방소득세 포함 결정세액 */
  decidedWithLocal: number;
  prepaidWithLocal: number;
  /** 양수면 돌려받음, 음수면 더 냄(지방소득세 포함) */
  refund: number;
}

const nonNeg = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);

export function estimate(input: TaxInput): TaxResult {
  const salary = nonNeg(input.salary);
  const earnedDeduction = earnedIncomeDeduction(salary);
  const earnedIncome = salary - earnedDeduction;
  const personal = Math.max(1, Math.floor(nonNeg(input.people))) * 150 * MAN;
  const insuranceGuessed = input.insurance === null;
  const insurance = Math.floor(insuranceGuessed ? salary * INSURANCE_GUESS_RATE : nonNeg(input.insurance!));
  const card = cardDeduction(salary, nonNeg(input.credit), nonNeg(input.debit), Math.floor(nonNeg(input.kidsUnder18)));
  const base = Math.max(0, earnedIncome - personal - insurance - card);
  const computed = incomeTax(base);

  const earned = earnedIncomeCredit(computed, salary);
  const child = childCredit(Math.floor(nonNeg(input.kidsForCredit)));
  const pension = pensionCredit(salary, nonNeg(input.pension), Math.min(nonNeg(input.pensionSavingsOnly), nonNeg(input.pension)));
  const rent = rentCredit(salary, nonNeg(input.rent));
  const standard = STANDARD_CREDIT;
  const decided = Math.max(0, computed - earned - child - pension - rent - standard);

  // 지방소득세는 소득세의 10%
  const decidedWithLocal = decided + Math.floor(decided * 0.1);
  const prepaid = nonNeg(input.prepaid);
  const prepaidWithLocal = prepaid + Math.floor(prepaid * 0.1);
  return {
    earnedDeduction,
    earnedIncome,
    personal,
    insurance,
    insuranceGuessed,
    card,
    base,
    computed,
    credits: { earned, child, pension, rent, standard },
    decided,
    decidedWithLocal,
    prepaidWithLocal,
    refund: prepaidWithLocal - decidedWithLocal,
  };
}

/** 카드를 얼마 더 써야 공제가 시작되는지 */
export function cardThresholdLeft(salary: number, credit: number, debit: number): number {
  return Math.max(0, Math.ceil(salary * 0.25 - credit - debit));
}

/** 원 → '123만 4,000원' 식 */
export function won(n: number): string {
  const v = Math.round(Math.abs(n));
  const man = Math.floor(v / MAN);
  const rest = v % MAN;
  if (!man) return `${rest.toLocaleString('ko-KR')}원`;
  return `${man.toLocaleString('ko-KR')}만${rest ? ` ${rest.toLocaleString('ko-KR')}` : ''}원`;
}
