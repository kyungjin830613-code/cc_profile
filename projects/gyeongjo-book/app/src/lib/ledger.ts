// 경조사비 장부: 기록 저장 형식, 사람별 정리, "얼마 낼까" 추천 규칙.
// 추천 금액은 2026년 여러 안내 글에서 공통으로 말하는 범위를 따른다(정답이 아니라 참고값).
// 가장 확실한 기준은 "상대가 나에게 냈던 금액"이라 장부 기록이 있으면 그걸 먼저 쓴다.

export type EventType = 'wedding' | 'funeral' | 'firstBirthday' | 'other';
export type Direction = 'gave' | 'received';
export type Relation = 'family' | 'bestFriend' | 'friend' | 'closeCoworker' | 'coworker' | 'acquaintance';

export const EVENT_NAME: Record<EventType, string> = {
  wedding: '결혼식',
  funeral: '장례식',
  firstBirthday: '돌잔치',
  other: '기타',
};

export const RELATION_NAME: Record<Relation, string> = {
  family: '가족·친척',
  bestFriend: '아주 친한 친구',
  friend: '친구',
  closeCoworker: '같은 팀·친한 동료',
  coworker: '직장 동료',
  acquaintance: '지인·얼굴만 아는 사이',
};

export interface Entry {
  id: string;
  name: string;
  relation: Relation;
  event: EventType;
  direction: Direction;
  /** 원 */
  amount: number;
  /** YYYY-MM-DD */
  date: string;
  memo: string;
}

const MAN = 10_000;

/** 관계별 흔히 말하는 범위 [최소, 최대] (만원). 결혼식 기준. */
const WEDDING: Record<Relation, [number, number]> = {
  family: [10, 30],
  bestFriend: [10, 20],
  friend: [5, 10],
  closeCoworker: [5, 10],
  coworker: [5, 5],
  acquaintance: [3, 5],
};

/** 장례식(조의금) 범위 (만원) */
const FUNERAL: Record<Relation, [number, number]> = {
  family: [10, 30],
  bestFriend: [10, 20],
  friend: [5, 10],
  closeCoworker: [5, 10],
  coworker: [3, 5],
  acquaintance: [3, 5],
};

export interface AdviceInput {
  name: string;
  relation: Relation;
  event: EventType;
  /** 결혼식: 직접 가서 식사하는지 */
  attend: boolean;
  /** 결혼식: 호텔 등 식대가 비싼 곳 */
  hotel: boolean;
  /** 결혼식: 나 말고 같이 가서 식사하는 사람 수 */
  companions: number;
}

export interface Advice {
  /** 추천 금액(원) */
  amount: number;
  /** 범위(원), 기록 기준일 때는 없음 */
  range: [number, number] | null;
  reasons: string[];
  /** 장부에서 찾은 이 사람이 나에게 낸 기록 */
  basis: Entry | null;
}

const norm = (s: string) => s.replace(/\s+/g, '').toLowerCase();

export function sameName(a: string, b: string): boolean {
  return norm(a) !== '' && norm(a) === norm(b);
}

/** 이 사람이 나에게 낸 가장 최근 기록. 같은 종류 경조사를 먼저 찾는다. */
export function lastReceived(entries: Entry[], name: string, event: EventType): Entry | null {
  const mine = entries.filter((e) => e.direction === 'received' && sameName(e.name, name)).sort((a, b) => b.date.localeCompare(a.date));
  return mine.find((e) => e.event === event) ?? mine[0] ?? null;
}

/** 경조사에서 흔히 쓰는 금액 단위로 맞춘다: 3·5·7·10만, 그 위로는 5만 단위 */
export function roundAmount(won: number): number {
  const man = won / MAN;
  if (man <= 3) return 3 * MAN;
  if (man <= 5) return 5 * MAN;
  if (man <= 7) return 7 * MAN;
  if (man <= 10) return 10 * MAN;
  return Math.ceil(man / 5) * 5 * MAN;
}

export function advise(entries: Entry[], input: AdviceInput): Advice {
  const reasons: string[] = [];
  const got = input.name.trim() ? lastReceived(entries, input.name, input.event) : null;

  if (got) {
    reasons.push(`${got.name}님이 ${got.date.slice(0, 4)}년 ${EVENT_NAME[got.event]}에 ${won(got.amount)}을 냈어요. 받은 만큼 돌려주는 게 가장 무난해요.`);
    if (input.event === 'wedding' && input.attend && input.companions > 0)
      reasons.push(`같이 가는 ${input.companions}명의 식대를 생각하면 조금 더 얹어도 좋아요.`);
    return { amount: got.amount, range: null, reasons, basis: got };
  }

  if (input.event === 'firstBirthday' || input.event === 'other') {
    // 공통 기준을 찾지 못한 경조사: 결혼식 범위의 아래쪽을 쓰고 기록을 권한다
    const [lo] = WEDDING[input.relation];
    reasons.push(`${EVENT_NAME[input.event]}은 정해진 기준이 뚜렷하지 않아서 ${RELATION_NAME[input.relation]} 결혼식 축의금의 낮은 쪽을 참고했어요.`);
    reasons.push('받은 금액을 장부에 적어 두면 다음부터는 그 기록을 기준으로 알려 드려요.');
    return { amount: lo * MAN, range: [lo * MAN, WEDDING[input.relation][1] * MAN], reasons, basis: null };
  }

  const table = input.event === 'wedding' ? WEDDING : FUNERAL;
  let [lo, hi] = table[input.relation];
  let pick = lo;
  reasons.push(`${RELATION_NAME[input.relation]} ${input.event === 'wedding' ? '축의금' : '조의금'}은 보통 ${lo === hi ? `${lo}만원` : `${lo}~${hi}만원`}이에요.`);

  if (input.event === 'wedding') {
    if (!input.attend) {
      reasons.push('직접 가지 않고 보내기만 하면 범위의 낮은 쪽이면 충분해요.');
    } else {
      if (input.relation !== 'acquaintance' && input.relation !== 'coworker') pick = Math.max(lo, Math.min(hi, 10));
      else pick = hi;
      if (input.hotel) {
        pick = Math.max(pick, 10);
        hi = Math.max(hi, 10);
        reasons.push('호텔처럼 식대가 비싼 곳이면 10만원 이상이 무난해요.');
      }
      const extra = Math.max(0, Math.floor(input.companions)) * 5;
      if (extra) {
        pick += extra;
        hi += extra;
        reasons.push(`같이 식사하는 사람 ${input.companions}명분으로 1명당 5만원쯤 더했어요.`);
      }
      reasons.push('가서 식사까지 하면 식대를 생각해 범위의 가운데 이상을 추천해요.');
    }
  } else {
    // 직장 동료는 3~5만 중 5만이 가장 흔하다는 안내가 많고, 나머지는 범위의 낮은 쪽부터
    pick = input.relation === 'coworker' ? 5 : lo;
  }

  return { amount: roundAmount(pick * MAN), range: [lo * MAN, hi * MAN], reasons, basis: null };
}

export interface PersonSummary {
  name: string;
  relation: Relation;
  gave: number;
  received: number;
  /** 받은 것 - 낸 것 (양수면 내가 갚을 마음의 빚) */
  balance: number;
  last: string;
  entries: Entry[];
}

export function byPerson(entries: Entry[]): PersonSummary[] {
  const map = new Map<string, PersonSummary>();
  for (const e of [...entries].sort((a, b) => b.date.localeCompare(a.date))) {
    const key = norm(e.name);
    if (!key) continue;
    let p = map.get(key);
    if (!p) {
      p = { name: e.name.trim(), relation: e.relation, gave: 0, received: 0, balance: 0, last: e.date, entries: [] };
      map.set(key, p);
    }
    if (e.direction === 'gave') p.gave += e.amount;
    else p.received += e.amount;
    p.entries.push(e);
  }
  return [...map.values()].map((p) => ({ ...p, balance: p.received - p.gave })).sort((a, b) => b.last.localeCompare(a.last));
}

export function totals(entries: Entry[], year?: number): { gave: number; received: number; count: number } {
  const list = year ? entries.filter((e) => e.date.startsWith(`${year}-`)) : entries;
  return {
    gave: list.filter((e) => e.direction === 'gave').reduce((s, e) => s + e.amount, 0),
    received: list.filter((e) => e.direction === 'received').reduce((s, e) => s + e.amount, 0),
    count: list.length,
  };
}

const EVENTS = Object.keys(EVENT_NAME) as EventType[];
const RELATIONS = Object.keys(RELATION_NAME) as Relation[];

export function validEntry(v: unknown): v is Entry {
  if (!v || typeof v !== 'object') return false;
  const e = v as Record<string, unknown>;
  return (
    typeof e.id === 'string' &&
    typeof e.name === 'string' &&
    e.name.trim().length > 0 &&
    e.name.length <= 30 &&
    RELATIONS.includes(e.relation as Relation) &&
    EVENTS.includes(e.event as EventType) &&
    (e.direction === 'gave' || e.direction === 'received') &&
    typeof e.amount === 'number' &&
    Number.isFinite(e.amount) &&
    e.amount > 0 &&
    e.amount <= 100_000_000 &&
    typeof e.date === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(e.date) &&
    typeof e.memo === 'string' &&
    e.memo.length <= 100
  );
}

/** 저장값 복원: 깨진 기록은 버리고 나머지는 살린다 */
export function restore(raw: string | null): Entry[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter(validEntry) : [];
  } catch {
    return [];
  }
}

export function won(n: number): string {
  const v = Math.round(n);
  if (v !== 0 && v % MAN === 0) return `${(v / MAN).toLocaleString('ko-KR')}만원`;
  return `${v.toLocaleString('ko-KR')}원`;
}
