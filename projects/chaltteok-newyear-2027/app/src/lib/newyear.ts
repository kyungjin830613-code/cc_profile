// 2027 정미년 신년운세 계산: 십신(나와 올해 기운의 관계), 띠와 未의 관계, 삼재, 12달 운세 별점.
import { controls, generates, type Pillars } from './saju';

export const YEAR = 2027;
/** 2027 세운 丁未: 천간 丁(3), 지지 未(7) */
export const YEAR_GAN = 3;
export const YEAR_ZHI = 7;

export const TEN_GODS = ['비견', '겁재', '식신', '상관', '편재', '정재', '편관', '정관', '편인', '정인'] as const;
export type TenGod = (typeof TEN_GODS)[number];

/** 일간(day)에서 본 다른 천간(other)의 십신 */
export function tenGod(day: number, other: number): TenGod {
  const ed = Math.floor(day / 2);
  const eo = Math.floor(other / 2);
  const same = day % 2 === other % 2;
  if (eo === ed) return same ? '비견' : '겁재';
  if (eo === generates(ed)) return same ? '식신' : '상관';
  if (eo === controls(ed)) return same ? '편재' : '정재';
  if (ed === controls(eo)) return same ? '편관' : '정관';
  return same ? '편인' : '정인';
}

export type TtiRelation = 'liuhe' | 'sanhe' | 'chong' | 'hai' | 'xing' | 'self' | 'none';

/** 내 띠(연지)와 未의 관계 */
export function ttiRelation(tti: number): TtiRelation {
  if (tti === YEAR_ZHI) return 'self';
  if ((tti + YEAR_ZHI) % 12 === 1) return 'liuhe'; // 午未
  if (tti % 4 === YEAR_ZHI % 4) return 'sanhe'; // 亥卯未
  if (Math.abs(tti - YEAR_ZHI) === 6) return 'chong'; // 丑未
  if (tti === 0) return 'hai'; // 子未 해
  if (tti === 10) return 'xing'; // 戌未 형
  return 'none';
}

/** 2027(未년)은 亥卯未 띠의 나가는 삼재 */
export const isSamjae = (tti: number) => tti === 11 || tti === 3 || tti === 7;

export interface MonthPillar {
  /** 표시용 달 이름 */
  label: string;
  /** 이 달이 시작하는 절기 날짜(한국 시간 기준 날짜) */
  start: string;
  gan: number;
  zhi: number;
}

// 절기 기준 2027년 12달. 만세력 라이브러리로 검증(newyear.test.ts).
export const MONTHS: MonthPillar[] = [
  { label: '2월', start: '2027-02-04', gan: 8, zhi: 2 },
  { label: '3월', start: '2027-03-06', gan: 9, zhi: 3 },
  { label: '4월', start: '2027-04-05', gan: 0, zhi: 4 },
  { label: '5월', start: '2027-05-06', gan: 1, zhi: 5 },
  { label: '6월', start: '2027-06-06', gan: 2, zhi: 6 },
  { label: '7월', start: '2027-07-07', gan: 3, zhi: 7 },
  { label: '8월', start: '2027-08-08', gan: 4, zhi: 8 },
  { label: '9월', start: '2027-09-08', gan: 5, zhi: 9 },
  { label: '10월', start: '2027-10-08', gan: 6, zhi: 10 },
  { label: '11월', start: '2027-11-08', gan: 7, zhi: 11 },
  { label: '12월', start: '2027-12-07', gan: 8, zhi: 0 },
  { label: '1월', start: '2028-01-06', gan: 9, zhi: 1 },
];

const GOD_BONUS: Record<TenGod, number> = {
  비견: 0, 겁재: -1, 식신: 1, 상관: 0, 편재: 1, 정재: 1, 편관: -1, 정관: 1, 편인: 0, 정인: 1,
};

export interface MonthFortune {
  month: MonthPillar;
  god: TenGod;
  stars: number;
  clash: boolean;
  harmony: boolean;
}

export function monthFortunes(p: Pillars): MonthFortune[] {
  return MONTHS.map((month) => {
    const god = tenGod(p.gan, month.gan);
    const harmony = Math.abs(p.gan - month.gan) === 5 || (p.zhi + month.zhi) % 12 === 1 || (p.zhi !== month.zhi && p.zhi % 4 === month.zhi % 4);
    const clash = Math.abs(p.zhi - month.zhi) === 6;
    const stars = Math.max(1, Math.min(5, 3 + GOD_BONUS[god] + (harmony ? 1 : 0) - (clash ? 1 : 0)));
    return { month, god, stars, clash, harmony };
  });
}

export interface YearFortune {
  god: TenGod;
  tti: TtiRelation;
  samjae: boolean;
  months: MonthFortune[];
  best: MonthFortune;
  careful: MonthFortune;
}

export function yearFortune(p: Pillars): YearFortune {
  const months = monthFortunes(p);
  const best = months.reduce((a, b) => (b.stars > a.stars ? b : a));
  const careful = months.reduce((a, b) => (b.stars < a.stars ? b : a));
  return { god: tenGod(p.gan, YEAR_GAN), tti: ttiRelation(p.tti), samjae: isSamjae(p.tti), months, best, careful };
}
