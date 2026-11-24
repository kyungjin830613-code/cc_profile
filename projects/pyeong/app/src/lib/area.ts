// 평수 계산기: 1평 = 400/121 ㎡ (약 3.3058㎡). 전용·공급면적 관계는 '전용률'(전용/공급)로 대략 계산한다.

export const SQM_PER_PYEONG = 400 / 121;

export function pyeongToSqm(p: number): number {
  return p * SQM_PER_PYEONG;
}
export function sqmToPyeong(m2: number): number {
  return m2 / SQM_PER_PYEONG;
}

/** 소수 n자리 반올림 */
export function round(n: number, digits = 1): number {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

/** 아파트 흔한 전용면적(㎡) */
export const COMMON_UNITS = [39, 49, 59, 74, 84, 101, 114, 135];

/** 전용률 기본값: 아파트는 보통 70~80%대(74%면 전용 59㎡≈24평형, 84㎡≈34평형). 공급 = 전용 / 전용률 */
export const DEFAULT_EXCLUSIVE_RATIO = 0.74;

export function supplyFromExclusive(exclusiveSqm: number, ratio = DEFAULT_EXCLUSIVE_RATIO): number {
  const r = Math.min(1, Math.max(0.5, ratio));
  return exclusiveSqm / r;
}

export function exclusiveFromSupply(supplySqm: number, ratio = DEFAULT_EXCLUSIVE_RATIO): number {
  const r = Math.min(1, Math.max(0.5, ratio));
  return supplySqm * r;
}

/** 방 가로·세로(m) → 넓이 */
export function roomArea(widthM: number, depthM: number): { sqm: number; pyeong: number } {
  const w = Math.max(0, widthM);
  const d = Math.max(0, depthM);
  const sqm = w * d;
  return { sqm, pyeong: sqmToPyeong(sqm) };
}

/** 평형을 사람들이 부르는 이름으로: 공급 평 기준 '24평형' 같은 정수 */
export function typeName(supplyPyeong: number): string {
  return `${Math.round(supplyPyeong)}평형`;
}

/** 입력 문자열 → 양수(콤마 허용), 아니면 0 */
export function parse(s: string): number {
  const n = Number(String(s).replace(/,/g, ''));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** 숫자 표시: 소수 1자리, 끝 0 제거 */
export function fmt(n: number, digits = 1): string {
  return round(n, digits).toLocaleString('ko-KR', { maximumFractionDigits: digits });
}
