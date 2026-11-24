// 오늘 점심 룰렛: 메뉴 목록과 뽑기 규칙. 가게 추천·광고 없이 메뉴 이름만 고른다.

export type Category = 'korean' | 'chinese' | 'japanese' | 'western' | 'snack' | 'asian' | 'light';

export const CATEGORY_NAME: Record<Category, string> = {
  korean: '한식',
  chinese: '중식',
  japanese: '일식',
  western: '양식',
  snack: '분식',
  asian: '아시안',
  light: '가볍게',
};

export const CATEGORY_COLOR: Record<Category, string> = {
  korean: '#ff7a59',
  chinese: '#e64545',
  japanese: '#4a90d9',
  western: '#f2b134',
  snack: '#ff5fa2',
  asian: '#2bb673',
  light: '#7cc95a',
};

export interface Menu {
  name: string;
  cat: Category;
  emoji: string;
  /** 직접 추가한 메뉴 */
  custom?: boolean;
}

const m = (cat: Category, emoji: string, names: string) => names.split(',').map((name) => ({ name: name.trim(), cat, emoji }));

export const BASE_MENUS: Menu[] = [
  ...m('korean', '🍲', '김치찌개, 된장찌개, 순두부찌개, 부대찌개'),
  ...m('korean', '🍚', '제육볶음, 비빔밥, 불고기 덮밥, 김치볶음밥, 오징어볶음'),
  ...m('korean', '🍜', '칼국수, 냉면, 잔치국수'),
  ...m('korean', '🥘', '국밥, 설렁탕, 갈비탕, 감자탕, 육개장'),
  ...m('chinese', '🥢', '짜장면, 짬뽕, 볶음밥, 탕수육 세트, 마라탕, 마파두부 덮밥'),
  ...m('japanese', '🍣', '초밥, 돈가스, 라멘, 우동, 규동, 카레, 소바'),
  ...m('western', '🍝', '파스타, 피자, 햄버거, 리조또, 오므라이스'),
  ...m('snack', '🍢', '떡볶이, 김밥, 라면, 쫄면, 순대'),
  ...m('asian', '🍜', '쌀국수, 팟타이, 분짜, 나시고랭, 커리'),
  ...m('light', '🥗', '샐러드, 샌드위치, 포케, 토스트'),
];

export interface Filter {
  /** 뺄 종류 */
  off: Category[];
  /** 최근 며칠 먹은 메뉴는 빼기(0이면 안 뺌) */
  avoidDays: number;
}

export interface Eaten {
  name: string;
  /** YYYY-MM-DD */
  day: string;
}

export function dayOf(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  return Math.round((new Date(by, bm - 1, bd, 12).getTime() - new Date(ay, am - 1, ad, 12).getTime()) / 86_400_000);
}

/** 후보: 꺼 둔 종류와 최근 먹은 메뉴를 뺀다. 다 빠지면 최근 먹은 것 제외 조건만 풀어 준다. */
export function candidates(menus: Menu[], filter: Filter, eaten: Eaten[], today: string): Menu[] {
  const byCat = menus.filter((x) => !filter.off.includes(x.cat));
  if (filter.avoidDays <= 0) return byCat;
  const recent = new Set(eaten.filter((e) => { const d = daysBetween(e.day, today); return d >= 0 && d < filter.avoidDays; }).map((e) => e.name));
  const fresh = byCat.filter((x) => !recent.has(x.name));
  return fresh.length ? fresh : byCat;
}

/** rng()는 0 이상 1 미만. 테스트에서는 고정값을 넣는다. */
export function pick<T>(list: T[], rng: () => number = Math.random): T | null {
  if (!list.length) return null;
  const i = Math.min(list.length - 1, Math.floor(rng() * list.length));
  return list[i];
}

/** 룰렛 칸(최대 n칸): 후보 중에서 뽑힌 메뉴를 포함해 섞어 보여 준다 */
export function wheelSlots(list: Menu[], winner: Menu, n = 8, rng: () => number = Math.random): Menu[] {
  const others = list.filter((x) => x.name !== winner.name);
  for (let i = others.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [others[i], others[j]] = [others[j], others[i]];
  }
  const slots = [winner, ...others.slice(0, Math.max(0, n - 1))];
  return slots;
}

/** 먹은 기록: 같은 날 같은 메뉴는 한 번만, 최근 30개만 보관 */
export function addEaten(list: Eaten[], name: string, day: string): Eaten[] {
  const rest = list.filter((e) => !(e.name === name && e.day === day));
  return [{ name, day }, ...rest].slice(0, 30);
}

export function addCustom(menus: Menu[], name: string, cat: Category): Menu[] {
  const n = name.trim().slice(0, 12);
  if (!n || menus.some((x) => x.name === n)) return menus;
  return [...menus, { name: n, cat, emoji: '⭐', custom: true }];
}
