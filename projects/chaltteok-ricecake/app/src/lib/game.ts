// 찰떡 떡집 키우기: 게임 규칙(숫자 계산)만 모은 파일. 화면과 분리해서 테스트한다(game.test.ts).
// 확률형 아이템·도박 요소 없음. 모든 보상은 정해진 규칙으로만 나온다.

export interface Helper {
  id: string;
  name: string;
  desc: string;
  /** 1초에 만드는 떡 */
  perSec: number;
  /** 첫 구매 가격 */
  baseCost: number;
}

export const HELPERS: Helper[] = [
  { id: 'apprentice', name: '견습생 찰떡이', desc: '서툴지만 열심히 떡을 빚어요', perSec: 1, baseCost: 15 },
  { id: 'master', name: '떡메 장인', desc: '쿵덕쿵덕 떡메를 쳐요', perSec: 8, baseCost: 120 },
  { id: 'mill', name: '방앗간 기계', desc: '쌀가루를 쉬지 않고 빻아요', perSec: 50, baseCost: 1_100 },
  { id: 'branch', name: '떡집 2호점', desc: '옆 동네에도 가게를 열어요', perSec: 300, baseCost: 13_000 },
  { id: 'factory', name: '떡 공장', desc: '컨베이어 벨트가 돌아가요', perSec: 2_000, baseCost: 160_000 },
  { id: 'delivery', name: '전국 떡 택배', desc: '전국으로 떡이 배달돼요', perSec: 15_000, baseCost: 2_200_000 },
  { id: 'export', name: '해외 수출', desc: 'K-떡이 세계로 나가요', perSec: 120_000, baseCost: 30_000_000 },
];

export interface Cake {
  name: string;
  /** 누적으로 이만큼 팔면 열린다 */
  unlockAt: number;
  /** 떡 그림 색 [바탕, 무늬] */
  colors: [string, string];
  line: string;
}

export const CAKES: Cake[] = [
  { name: '가래떡', unlockAt: 0, colors: ['#fffaf0', '#e8dcc2'], line: '모든 떡의 시작, 말랑한 가래떡' },
  { name: '인절미', unlockAt: 200, colors: ['#f2d48a', '#d9a94a'], line: '콩고물 솔솔, 고소한 인절미' },
  { name: '꿀떡', unlockAt: 2_000, colors: ['#9be37a', '#ff8fb4'], line: '한입 깨물면 꿀이 톡!' },
  { name: '송편', unlockAt: 20_000, colors: ['#c8f0a8', '#ffffff'], line: '반달 모양 추석의 맛' },
  { name: '백설기', unlockAt: 200_000, colors: ['#ffffff', '#f0f0f0'], line: '눈처럼 하얀 백설기' },
  { name: '무지개떡', unlockAt: 2_000_000, colors: ['#ff9ac1', '#9ad7ff'], line: '알록달록 생일 떡' },
  { name: '찹쌀떡', unlockAt: 20_000_000, colors: ['#ffffff', '#5b2c39'], line: '팥 앙금 가득 찹쌀떡' },
  { name: '약식', unlockAt: 200_000_000, colors: ['#8a4b2a', '#3b1d10'], line: '대추·밤 넣은 귀한 약식' },
  { name: '두텁떡', unlockAt: 2_000_000_000, colors: ['#c98b5a', '#7a4a2a'], line: '임금님이 드시던 두텁떡' },
  { name: '황금 떡', unlockAt: 30_000_000_000, colors: ['#ffd84d', '#ffb800'], line: '전설의 떡집에만 있는 황금 떡' },
];

/** 떡 하나 열 때마다 판매 단가 +10% */
export const CAKE_BONUS = 0.1;
/** 가게를 비운 동안은 이 비율로, 최대 이 시간까지만 쌓인다 */
export const OFFLINE_RATE = 0.5;
export const OFFLINE_MAX_SEC = 8 * 60 * 60;
export const HELPER_GROWTH = 1.15;
export const TAP_BASE_COST = 30;
export const TAP_GROWTH = 2.4;

export interface GameState {
  version: 1;
  coins: number;
  /** 지금까지 판 떡 전체(떡 메뉴 해금 기준) */
  total: number;
  tapLevel: number;
  helpers: Record<string, number>;
  /** 마지막으로 계산한 시각(ms) */
  lastTick: number;
  /** 출석 연속 일수와 마지막 출석 날짜(YYYY-MM-DD, 기기 현지 날짜) */
  streak: number;
  lastCheckIn: string | null;
}

export function newGame(now: number): GameState {
  return { version: 1, coins: 0, total: 0, tapLevel: 0, helpers: {}, lastTick: now, streak: 0, lastCheckIn: null };
}

export function unlockedCakes(total: number): number {
  return CAKES.filter((c) => total >= c.unlockAt).length;
}

export function multiplier(s: GameState): number {
  return 1 + CAKE_BONUS * (unlockedCakes(s.total) - 1);
}

export function basePerSec(s: GameState): number {
  return HELPERS.reduce((sum, h) => sum + h.perSec * (s.helpers[h.id] ?? 0), 0);
}

export function perSec(s: GameState): number {
  return basePerSec(s) * multiplier(s);
}

export function tapValue(s: GameState): number {
  return Math.floor((s.tapLevel + 1) * multiplier(s) + perSec(s) * 0.05 * s.tapLevel);
}

export function helperCost(h: Helper, owned: number): number {
  return Math.ceil(h.baseCost * HELPER_GROWTH ** owned);
}

export function tapCost(level: number): number {
  return Math.ceil(TAP_BASE_COST * TAP_GROWTH ** level);
}

function earn(s: GameState, amount: number): GameState {
  return { ...s, coins: s.coins + amount, total: s.total + amount };
}

export function tap(s: GameState): GameState {
  return earn(s, tapValue(s));
}

/** 가게가 열려 있는 동안 흐른 시간만큼 판다. 시계가 뒤로 가면 아무것도 안 한다. */
export function tick(s: GameState, now: number): GameState {
  const sec = (now - s.lastTick) / 1000;
  if (sec <= 0) return { ...s, lastTick: Math.max(s.lastTick, now) };
  return { ...earn(s, perSec(s) * sec), lastTick: now };
}

/** 앱을 다시 열었을 때: 비운 시간 동안 번 떡(절반 속도, 최대 8시간) */
export function offlineEarnings(s: GameState, now: number): { sec: number; amount: number } {
  const sec = Math.min(Math.max(0, (now - s.lastTick) / 1000), OFFLINE_MAX_SEC);
  return { sec, amount: Math.floor(perSec(s) * sec * OFFLINE_RATE) };
}

export function applyOffline(s: GameState, now: number): { state: GameState; sec: number; amount: number } {
  const { sec, amount } = offlineEarnings(s, now);
  return { state: { ...earn(s, amount), lastTick: now }, sec, amount };
}

export function buyHelper(s: GameState, id: string): GameState | null {
  const h = HELPERS.find((x) => x.id === id);
  if (!h) return null;
  const owned = s.helpers[id] ?? 0;
  const cost = helperCost(h, owned);
  if (s.coins < cost) return null;
  return { ...s, coins: s.coins - cost, helpers: { ...s.helpers, [id]: owned + 1 } };
}

export function buyTap(s: GameState): GameState | null {
  const cost = tapCost(s.tapLevel);
  if (s.coins < cost) return null;
  return { ...s, coins: s.coins - cost, tapLevel: s.tapLevel + 1 };
}

/** 이 도우미가 보이는지: 바로 앞 도우미를 하나라도 샀거나 첫 번째 */
export function helperVisible(s: GameState, index: number): boolean {
  return index === 0 || (s.helpers[HELPERS[index - 1].id] ?? 0) > 0 || s.total >= HELPERS[index].baseCost / 2;
}

/** 기기 현지 날짜 'YYYY-MM-DD' */
export function localDay(now: number): string {
  const d = new Date(now);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function dayBefore(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  return localDay(new Date(y, m - 1, d - 1, 12).getTime());
}

export function canCheckIn(s: GameState, now: number): boolean {
  return s.lastCheckIn !== localDay(now);
}

/** 출석 보상: 연속 일수(최대 7일치)만큼 커진다. 하루 빠지면 1일부터 다시. */
export function checkInReward(s: GameState, streak: number): number {
  const days = Math.min(streak, 7);
  return Math.max(50 * days, Math.floor(perSec(s) * 60 * days));
}

export function checkIn(s: GameState, now: number): { state: GameState; reward: number; streak: number } | null {
  if (!canCheckIn(s, now)) return null;
  const today = localDay(now);
  const streak = s.lastCheckIn === dayBefore(today) ? s.streak + 1 : 1;
  const reward = checkInReward(s, streak);
  return { state: { ...earn(s, reward), streak, lastCheckIn: today }, reward, streak };
}

/** 저장값 검사. 이상하면 null(새 게임). */
export function restore(raw: string | null): GameState | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as GameState;
    const num = (x: unknown) => typeof x === 'number' && Number.isFinite(x) && x >= 0;
    if (v.version !== 1 || !num(v.coins) || !num(v.total) || !num(v.tapLevel) || !num(v.lastTick) || !num(v.streak)) return null;
    if (typeof v.helpers !== 'object' || v.helpers === null) return null;
    const helpers: Record<string, number> = {};
    for (const h of HELPERS) {
      const n = v.helpers[h.id];
      if (n !== undefined) {
        if (!num(n) || !Number.isInteger(n)) return null;
        helpers[h.id] = n;
      }
    }
    const lastCheckIn = typeof v.lastCheckIn === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v.lastCheckIn) ? v.lastCheckIn : null;
    return { ...v, helpers, lastCheckIn };
  } catch {
    return null;
  }
}

const UNITS: [number, string][] = [
  [1e16, '경'],
  [1e12, '조'],
  [1e8, '억'],
  [1e4, '만'],
];

/** 1234 → '1,234', 12345 → '1.2만', 300000000 → '3억' */
export function fmt(n: number): string {
  const v = Math.floor(n);
  for (const [size, unit] of UNITS) {
    if (v >= size) {
      const x = v / size;
      const s = x >= 100 ? Math.floor(x).toLocaleString('ko-KR') : (Math.floor(x * 10) / 10).toString();
      return s + unit;
    }
  }
  return v.toLocaleString('ko-KR');
}

/** 초 → '3시간 12분' */
export function fmtDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  if (m < 1) return '1분 미만';
  const h = Math.floor(m / 60);
  return h ? `${h}시간${m % 60 ? ` ${m % 60}분` : ''}` : `${m}분`;
}
