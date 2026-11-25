// 냉장고 유통기한 관리: 날짜 계산·정렬·통계. 화면과 분리해 테스트한다.
export type Storage = 'fridge' | 'freezer' | 'room';
export type Category = 'veg' | 'fruit' | 'meat' | 'fish' | 'dairy' | 'egg' | 'side' | 'sauce' | 'etc';

export const STORAGE_NAME: Record<Storage, string> = { fridge: '냉장', freezer: '냉동', room: '실온' };
export const CATEGORY: Record<Category, { name: string; emoji: string }> = {
  veg: { name: '채소', emoji: '🥬' },
  fruit: { name: '과일', emoji: '🍎' },
  meat: { name: '고기', emoji: '🥩' },
  fish: { name: '생선', emoji: '🐟' },
  dairy: { name: '유제품', emoji: '🥛' },
  egg: { name: '달걀·두부', emoji: '🥚' },
  side: { name: '반찬', emoji: '🍱' },
  sauce: { name: '소스·양념', emoji: '🧂' },
  etc: { name: '기타', emoji: '📦' },
};

/** 빠른 입력. days는 '날짜를 모를 때 쓰는 입력 기본값'일 뿐, 포장에 적힌 날짜가 우선이다 */
export const PRESETS: { name: string; cat: Category; storage: Storage; days: number }[] = [
  { name: '우유', cat: 'dairy', storage: 'fridge', days: 7 },
  { name: '달걀', cat: 'egg', storage: 'fridge', days: 14 },
  { name: '두부', cat: 'egg', storage: 'fridge', days: 5 },
  { name: '대파', cat: 'veg', storage: 'fridge', days: 7 },
  { name: '양파', cat: 'veg', storage: 'room', days: 14 },
  { name: '김치', cat: 'side', storage: 'fridge', days: 30 },
  { name: '돼지고기', cat: 'meat', storage: 'fridge', days: 3 },
  { name: '닭고기', cat: 'meat', storage: 'fridge', days: 2 },
  { name: '냉동만두', cat: 'etc', storage: 'freezer', days: 90 },
  { name: '요거트', cat: 'dairy', storage: 'fridge', days: 7 },
  { name: '사과', cat: 'fruit', storage: 'fridge', days: 14 },
  { name: '반찬', cat: 'side', storage: 'fridge', days: 3 },
];

export interface Item {
  id: string;
  name: string;
  cat: Category;
  storage: Storage;
  expires: string; // YYYY-MM-DD
  added: string;
}
export interface Done {
  name: string;
  day: string;
  result: 'ate' | 'wasted';
}
export interface Data {
  items: Item[];
  done: Done[];
}
export const emptyData = (): Data => ({ items: [], done: [] });

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function dayOf(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function addDays(day: string, n: number): string {
  const [y, m, d] = day.split('-').map(Number);
  return dayOf(new Date(y, m - 1, d + n));
}
/** 남은 날(오늘이 마감이면 0, 지났으면 음수) */
export function daysLeft(expires: string, today: string): number {
  const [y1, m1, d1] = today.split('-').map(Number);
  const [y2, m2, d2] = expires.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
}

export type Level = 'over' | 'urgent' | 'soon' | 'ok';
/** 지남 / 오늘·내일 / 3일 이내 / 여유 */
export function levelOf(left: number): Level {
  if (left < 0) return 'over';
  if (left <= 1) return 'urgent';
  if (left <= 3) return 'soon';
  return 'ok';
}
export function label(left: number): string {
  if (left < 0) return `${-left}일 지남`;
  if (left === 0) return '오늘까지';
  return `D-${left}`;
}

/** 임박한 순(같으면 먼저 넣은 순) */
export function sortItems(items: Item[]): Item[] {
  return [...items].sort((a, b) => (a.expires === b.expires ? a.added.localeCompare(b.added) || a.id.localeCompare(b.id) : a.expires.localeCompare(b.expires)));
}

/** 오늘 먹어야 할 것: 오늘·내일 마감(지난 것은 따로 보여 준다) */
export function eatToday(items: Item[], today: string): Item[] {
  return sortItems(items).filter((i) => {
    const l = daysLeft(i.expires, today);
    return l >= 0 && l <= 1;
  });
}

export function addItem(data: Data, item: Omit<Item, 'name'> & { name: string }): Data {
  const name = item.name.trim().slice(0, 20);
  if (!name || !DAY_RE.test(item.expires)) return data;
  if (data.items.length >= 200) return data;
  return { ...data, items: [...data.items, { ...item, name }] };
}

/** 다 먹음/버림 처리: 목록에서 빼고 기록을 남긴다 */
export function finish(data: Data, id: string, result: Done['result'], today: string): Data {
  const it = data.items.find((i) => i.id === id);
  if (!it) return data;
  return { items: data.items.filter((i) => i.id !== id), done: [{ name: it.name, day: today, result }, ...data.done].slice(0, 500) };
}

/** 이번 달 다 먹은 것·버린 것 */
export function monthStats(done: Done[], today: string) {
  const ym = today.slice(0, 7);
  const m = done.filter((d) => d.day.startsWith(ym));
  const ate = m.filter((d) => d.result === 'ate').length;
  const wasted = m.length - ate;
  return { ate, wasted, rate: m.length ? Math.round((ate / m.length) * 100) : null };
}

export function counts(items: Item[], today: string) {
  const c = { over: 0, urgent: 0, soon: 0, ok: 0 };
  for (const i of items) c[levelOf(daysLeft(i.expires, today))]++;
  return c;
}

export function restore(raw: string | null): Data {
  try {
    const v = raw ? JSON.parse(raw) : null;
    if (!v || typeof v !== 'object') return emptyData();
    const items: Item[] = Array.isArray(v.items)
      ? v.items
          .filter((i: Item) => i && typeof i.id === 'string' && typeof i.name === 'string' && i.name.trim() && DAY_RE.test(i.expires) && i.cat in CATEGORY && i.storage in STORAGE_NAME)
          .map((i: Item) => ({ id: i.id, name: i.name.slice(0, 20), cat: i.cat, storage: i.storage, expires: i.expires, added: DAY_RE.test(i.added) ? i.added : i.expires }))
          .slice(0, 200)
      : [];
    const done: Done[] = Array.isArray(v.done) ? v.done.filter((d: Done) => d && typeof d.name === 'string' && DAY_RE.test(d.day) && (d.result === 'ate' || d.result === 'wasted')).slice(0, 500) : [];
    return { items, done };
  } catch {
    return emptyData();
  }
}
