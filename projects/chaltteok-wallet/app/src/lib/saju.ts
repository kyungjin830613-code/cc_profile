// 찰떡 지갑궁합 사주 엔진: 일주(태어난 날의 간지), 띠(입춘 기준), 두 사람 궁합 점수.
// 태어난 시간은 쓰지 않는다. 일주 공식은 만세력 라이브러리와 1921~2039년 전 날짜를 대조해 검증한다(saju.test.ts).

export const GAN = '갑을병정무기경신임계';
export const GAN_HANJA = '甲乙丙丁戊己庚辛壬癸';
export const ZHI = '자축인묘진사오미신유술해';
export const ZHI_HANJA = '子丑寅卯辰巳午未申酉戌亥';
export const TTI = ['쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'];
export const ELEMENT = ['목', '화', '토', '금', '수'] as const;
export const ELEMENT_NAME = ['나무', '불', '흙', '쇠', '물'] as const;

export const MIN_DATE = '1921-01-01';
export const MAX_DATE = '2039-12-31';

// 입춘이 2월 며칠인지: 1920~2040년. lunar-javascript의 절기 계산으로 미리 뽑아 둔 값.
const LICHUN =
  '5445544554455445544554455444544454445444544454445444544454445444444444444444444444444444444444444344434443444344434443444';

export type Element = 0 | 1 | 2 | 3 | 4;

export interface Pillars {
  /** 일간(천간) 0~9 */
  gan: number;
  /** 일지(지지) 0~11 */
  zhi: number;
  /** 일간 오행 0~4 */
  element: Element;
  /** 띠(입춘 기준 연지) 0~11 */
  tti: number;
  /** 입춘 당일 출생이라 시각에 따라 띠가 바뀔 수 있음 */
  onLichun: boolean;
}

function julianDay(y: number, m: number, d: number): number {
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
}

export function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < MIN_DATE || value > MAX_DATE) return false;
  const [y, m, d] = value.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/** 양력 'YYYY-MM-DD' → 일주와 띠 */
export function pillarsOf(date: string): Pillars {
  if (!isValidDate(date)) throw new RangeError(`지원하지 않는 날짜: ${date}`);
  const [y, m, d] = date.split('-').map(Number);
  const idx = (((julianDay(y, m, d) + 49) % 60) + 60) % 60;
  const gan = idx % 10;
  const zhi = idx % 12;
  const lichun = Number(LICHUN[y - 1920]);
  const sajuYear = m < 2 || (m === 2 && d < lichun) ? y - 1 : y;
  return {
    gan,
    zhi,
    element: Math.floor(gan / 2) as Element,
    tti: (((sajuYear - 4) % 12) + 12) % 12,
    onLichun: m === 2 && d === lichun,
  };
}

/** 오행 상생: a가 낳는 오행 */
export const generates = (a: number) => (a + 1) % 5;
/** 오행 상극: a가 이기는 오행 */
export const controls = (a: number) => (a + 2) % 5;

const isLiuhe = (a: number, b: number) => (a + b) % 12 === 1;
const isChong = (a: number, b: number) => Math.abs(a - b) === 6;
const isSanhe = (a: number, b: number) => a !== b && a % 4 === b % 4;

export interface Reason {
  text: string;
  delta: number;
}

export interface Match {
  score: number;
  reasons: Reason[];
  /** 정렬된 오행 짝 키, 예: '1-2' */
  pairKey: string;
  /** a 기준 관계 */
  relation: 'same' | 'aFeedsB' | 'bFeedsA' | 'aHoldsB' | 'bHoldsA';
}

export const BASE_SCORE = 72;
export const MIN_SCORE = 52;
export const MAX_SCORE = 99;

export function match(a: Pillars, b: Pillars): Match {
  const reasons: Reason[] = [];
  const add = (delta: number, text: string) => reasons.push({ delta, text });

  if (Math.abs(a.gan - b.gan) === 5) add(16, `일간 ${GAN[a.gan]}·${GAN[b.gan]} 천간합: 서로 끌어당기는 자석`);
  else if (a.element === b.element) add(6, `일간 오행이 둘 다 ${ELEMENT[a.element]}: 친구 같은 사이`);
  else if (generates(a.element) === b.element || generates(b.element) === a.element)
    add(10, `오행 상생 ${ELEMENT[a.element]}·${ELEMENT[b.element]}: 한쪽이 다른 쪽을 키워 줌`);
  else add(-4, `오행 상극 ${ELEMENT[a.element]}·${ELEMENT[b.element]}: 부딪치며 단련되는 사이`);

  if (isLiuhe(a.zhi, b.zhi)) add(9, `일지 ${ZHI[a.zhi]}·${ZHI[b.zhi]} 육합: 생활 리듬 찰떡`);
  else if (isChong(a.zhi, b.zhi)) add(-8, `일지 ${ZHI[a.zhi]}·${ZHI[b.zhi]} 충: 생활 방식 정반대`);
  else if (isSanhe(a.zhi, b.zhi)) add(6, `일지 ${ZHI[a.zhi]}·${ZHI[b.zhi]} 삼합: 같은 팀 기운`);
  else if (a.zhi === b.zhi) add(2, `일지가 둘 다 ${ZHI[a.zhi]}: 닮은꼴`);

  if (isLiuhe(a.tti, b.tti) || isSanhe(a.tti, b.tti)) add(4, `${TTI[a.tti]}띠·${TTI[b.tti]}띠: 잘 맞는 띠`);
  else if (isChong(a.tti, b.tti)) add(-4, `${TTI[a.tti]}띠·${TTI[b.tti]}띠: 티격태격 띠`);

  const raw = reasons.reduce((s, r) => s + r.delta, BASE_SCORE);
  const score = Math.max(MIN_SCORE, Math.min(MAX_SCORE, raw));

  let relation: Match['relation'];
  if (a.element === b.element) relation = 'same';
  else if (generates(a.element) === b.element) relation = 'aFeedsB';
  else if (generates(b.element) === a.element) relation = 'bFeedsA';
  else if (controls(a.element) === b.element) relation = 'aHoldsB';
  else relation = 'bHoldsA';

  const lo = Math.min(a.element, b.element);
  const hi = Math.max(a.element, b.element);
  return { score, reasons, pairKey: `${lo}-${hi}`, relation };
}

// 초대 링크용 코드: 생일 대신 계산 결과(일간·일지·띠)만 담는다. 예: '5b3'
export function encodeCode(p: Pillars): string {
  return `${p.gan.toString(36)}${p.zhi.toString(36)}${p.tti.toString(36)}`;
}

export function decodeCode(code: string | null | undefined): Pillars | null {
  if (!code || !/^[0-9][0-9ab][0-9ab]$/.test(code)) return null;
  const gan = parseInt(code[0], 36);
  const zhi = parseInt(code[1], 36);
  const tti = parseInt(code[2], 36);
  // 일간과 일지는 홀짝이 같아야 실제 60갑자에 있는 조합이다
  if (gan > 9 || zhi > 11 || tti > 11 || gan % 2 !== zhi % 2) return null;
  return { gan, zhi, tti, element: Math.floor(gan / 2) as Element, onLichun: false };
}
