// 우리집 공과금 계산: 주택용 전기요금(누진제)과 도시가스 요금 대략 계산.
// 2026년 11월 기준 공개 요금표(여러 안내 자료에서 일치하는 값). 실제 고지서와 약간 다를 수 있다.
// 전기: 기본요금(도달한 단계 1회) + 구간별 전력량요금 + 기후환경요금 9원/kWh + 연료비조정요금 5원/kWh
//       → 부가가치세 10%, 전력산업기반기금 2.7%(10원 미만 버림) → 합계 10원 미만 버림.

export type Voltage = 'low' | 'high'; // 저압(단독·빌라) / 고압(아파트 대부분)

interface Tier {
  upto: number; // 이 kWh까지(마지막은 Infinity)
  base: number; // 기본요금(원)
  rate: number; // 원/kWh
}

const LOW_RATES = { base: [910, 1600, 7300], rate: [120.0, 214.6, 307.3], super: 736.2 };
const HIGH_RATES = { base: [730, 1260, 6060], rate: [105.0, 174.0, 242.3], super: 574.6 };

export const CLIMATE_RATE = 9; // 원/kWh
export const FUEL_ADJ_RATE = 5; // 원/kWh
export const SUPER_USER_KWH = 1000;

/** 7~8월은 하계(구간 300/450), 나머지는 기타계절(200/400) */
export function isSummer(month: number): boolean {
  return month === 7 || month === 8;
}

/** 슈퍼유저 요금은 하계(7~8월)·동계(12~2월)에만 1,000kWh 초과분에 붙는다 */
export function superSeason(month: number): boolean {
  return month === 7 || month === 8 || month === 12 || month === 1 || month === 2;
}

export function tiers(voltage: Voltage, month: number): Tier[] {
  const r = voltage === 'low' ? LOW_RATES : HIGH_RATES;
  const [b1, b2] = isSummer(month) ? [300, 450] : [200, 400];
  return [
    { upto: b1, base: r.base[0], rate: r.rate[0] },
    { upto: b2, base: r.base[1], rate: r.rate[1] },
    { upto: Infinity, base: r.base[2], rate: r.rate[2] },
  ];
}

export interface ElectricBill {
  kwh: number;
  tier: 1 | 2 | 3;
  base: number;
  energy: number;
  climate: number;
  fuel: number;
  /** 전기요금계(세전) */
  subtotal: number;
  vat: number;
  fund: number;
  total: number;
  /** 다음 단계까지 남은 kWh (3단계면 null) */
  toNextTier: number | null;
}

const floor10 = (n: number) => Math.floor(n / 10) * 10;

export function electricBill(kwhIn: number, voltage: Voltage, month: number): ElectricBill {
  const kwh = Math.max(0, Math.floor(Number.isFinite(kwhIn) ? kwhIn : 0));
  const ts = tiers(voltage, month);
  const r = voltage === 'low' ? LOW_RATES : HIGH_RATES;
  const tierIdx = kwh <= ts[0].upto ? 0 : kwh <= ts[1].upto ? 1 : 2;
  const base = kwh === 0 ? 0 : ts[tierIdx].base;

  let energy = 0;
  let prev = 0;
  for (const t of ts) {
    const used = Math.max(0, Math.min(kwh, t.upto) - prev);
    energy += used * t.rate;
    prev = t.upto;
    if (kwh <= t.upto) break;
  }
  if (superSeason(month) && kwh > SUPER_USER_KWH) energy += (kwh - SUPER_USER_KWH) * (r.super - ts[2].rate);
  energy = Math.floor(energy);

  const climate = kwh * CLIMATE_RATE;
  const fuel = kwh * FUEL_ADJ_RATE;
  const subtotal = base + energy + climate + fuel;
  const vat = Math.round(subtotal * 0.1);
  const fund = floor10(subtotal * 0.027);
  const total = floor10(subtotal + vat + fund);
  return { kwh, tier: (tierIdx + 1) as 1 | 2 | 3, base, energy, climate, fuel, subtotal, vat, fund, total, toNextTier: tierIdx < 2 ? ts[tierIdx].upto - kwh + 1 : null };
}

// ---- 도시가스 ----

/** 서울 주택용(취사·난방 공통) 2026년 11월 기준 */
export const SEOUL_GAS_UNIT = 22.5268; // 원/MJ
export const SEOUL_GAS_BASE = 1250; // 원/월
/** 고지서에 m³만 있을 때 쓰는 대략적인 열량(지역·달마다 조금씩 다름, 고지서의 '열량' 값을 쓰는 게 정확) */
export const DEFAULT_MJ_PER_M3 = 42.7;

export interface GasBill {
  mj: number;
  base: number;
  usage: number;
  vat: number;
  total: number;
}

export function gasBill(mjIn: number, unit = SEOUL_GAS_UNIT, base = SEOUL_GAS_BASE): GasBill {
  const mj = Math.max(0, Number.isFinite(mjIn) ? mjIn : 0);
  const usage = Math.floor(mj * Math.max(0, unit));
  const b = mj > 0 ? Math.max(0, Math.round(base)) : 0;
  const vat = Math.round((usage + b) * 0.1);
  return { mj, base: b, usage, vat, total: floor10(usage + b + vat) };
}

export function m3ToMj(m3: number, mjPerM3 = DEFAULT_MJ_PER_M3): number {
  return Math.round(Math.max(0, m3) * mjPerM3 * 10) / 10;
}

export function won(n: number): string {
  return `${Math.round(n).toLocaleString('ko-KR')}원`;
}
