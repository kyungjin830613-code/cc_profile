// 나의 돈 습관 결산: 질문 10개 → 소비·저축 습관 유형 6가지 중 하나. 재미용 테스트(금융 조언 아님).

export type TypeId = 'squirrel' | 'peacock' | 'owl' | 'cat' | 'fox' | 'penguin';

export interface HabitType {
  id: TypeId;
  animal: string;
  emoji: string;
  name: string;
  /** 카드 배경색 */
  color: string;
  summary: string;
  good: string;
  watch: string;
  /** 2027년 돈 목표 추천 3개 */
  goals: [string, string, string];
  /** 잘 맞는 유형(공유 문구용) */
  buddy: TypeId;
}

export const TYPES: Record<TypeId, HabitType> = {
  squirrel: {
    id: 'squirrel',
    animal: '다람쥐',
    emoji: '🐿️',
    name: '도토리 모으는 다람쥐',
    color: '#f2a65a',
    summary: '들어온 돈은 일단 숨겨 두는 저축 본능의 소유자. 통장 잔고가 늘어날 때 제일 행복해요.',
    good: '위기가 와도 버틸 비상금이 있어요.',
    watch: '아끼느라 나를 위한 경험까지 미루고 있진 않나요?',
    goals: ['한 달에 한 번은 나를 위한 "계획된 플렉스" 하기', '모은 돈에 이름 붙이기(여행비, 내 집 마련비 등)', '비상금은 생활비 3~6개월 치까지만, 그 이상은 목표별로 나누기'],
    buddy: 'peacock',
  },
  peacock: {
    id: 'peacock',
    animal: '공작새',
    emoji: '🦚',
    name: '화려한 플렉스 공작새',
    color: '#3bb3a6',
    summary: '좋은 건 바로 사고, 기분 좋은 날엔 한턱 쏘는 타입. 지금 이 순간의 행복을 아는 사람이에요.',
    good: '돈을 쓸 줄 알아서 주변에 사람이 많아요.',
    watch: '월말 카드값 문자를 보고 놀란 적, 올해 몇 번이었나요?',
    goals: ['월급날 자동이체로 "먼저 저축, 남은 돈으로 플렉스"', '살까 말까 고민되면 장바구니에 하루 묵혀 두기', '한턱 쏘기 예산을 한 달 금액으로 정해 두기'],
    buddy: 'squirrel',
  },
  owl: {
    id: 'owl',
    animal: '부엉이',
    emoji: '🦉',
    name: '계획 세우는 부엉이',
    color: '#7a6cc4',
    summary: '예산표와 가계부가 있어야 마음이 편한 계획파. 돈의 흐름을 꿰뚫고 있어요.',
    good: '큰 지출도 미리 준비해서 흔들리지 않아요.',
    watch: '계획에서 벗어난 작은 지출에 너무 스트레스받지 않기!',
    goals: ['가계부 항목을 줄이고 큰 흐름만 보기', '1년에 한 번 고정비(통신비·구독료) 점검의 날 만들기', '계획 밖 지출용 "자유 예산" 칸 만들기'],
    buddy: 'cat',
  },
  cat: {
    id: 'cat',
    animal: '고양이',
    emoji: '🐱',
    name: '기분 따라 고양이',
    color: '#e86f8a',
    summary: '계획보다 그날 기분이 먼저! 자유로운 영혼이지만 통장은 가끔 미스터리예요.',
    good: '돈 때문에 인생을 피곤하게 만들지 않아요.',
    watch: '내 돈이 어디로 갔는지 한 달에 한 번은 들여다보기.',
    goals: ['한 달에 딱 한 번 "돈 어디 갔지?" 10분 점검', '자동이체로 저축이 저절로 되게 만들기', '충동구매가 잦은 시간대(새벽·월급날) 알아 두기'],
    buddy: 'owl',
  },
  fox: {
    id: 'fox',
    animal: '여우',
    emoji: '🦊',
    name: '혜택 사냥꾼 여우',
    color: '#e8833a',
    summary: '쿠폰·포인트·할인은 절대 놓치지 않는 정보통. 같은 걸 사도 제일 싸게 사요.',
    good: '똑같이 써도 남들보다 덜 써요.',
    watch: '할인 때문에 필요 없는 걸 사는 "할인의 함정" 조심!',
    goals: ['할인이어도 원래 사려던 것만 사기', '쌓인 포인트·마일리지 연말에 한 번 정리하기', '아낀 돈은 따로 모아 "아낀 돈 통장" 만들기'],
    buddy: 'penguin',
  },
  penguin: {
    id: 'penguin',
    animal: '펭귄',
    emoji: '🐧',
    name: '소확행 펭귄',
    color: '#4a8fd9',
    summary: '큰돈은 아끼지만 커피·간식 같은 작은 행복엔 아낌없는 타입. 균형 감각이 좋아요.',
    good: '스트레스 없이 오래 가는 돈 습관을 가졌어요.',
    watch: '작은 지출도 모이면 커요. 1년 치를 한 번 계산해 보기!',
    goals: ['자주 사는 작은 행복 하나를 1년 금액으로 계산해 보기', '작은 지출 중 진짜 행복한 것만 남기기', '소확행 예산을 주 단위로 정하기'],
    buddy: 'fox',
  },
};

export const TYPE_IDS = Object.keys(TYPES) as TypeId[];

export interface Option {
  text: string;
  /** 이 답을 고르면 점수를 받는 유형들 */
  to: TypeId[];
}
export interface Question {
  q: string;
  options: [Option, Option, Option, Option];
}

export const QUESTIONS: Question[] = [
  {
    q: '월급이 들어온 날, 나는?',
    options: [
      { text: '저축 통장으로 바로 이체한다', to: ['squirrel', 'owl'] },
      { text: '고생한 나에게 선물을 산다', to: ['peacock'] },
      { text: '딱히 하는 건 없다, 평소처럼', to: ['cat'] },
      { text: '이번 달 쓸 카드 혜택부터 확인한다', to: ['fox'] },
    ],
  },
  {
    q: '친구가 "오늘 한잔 어때?" 하면',
    options: [
      { text: '좋아! 오늘은 내가 쏠게', to: ['peacock'] },
      { text: '이번 달 예산 남았나 먼저 본다', to: ['owl'] },
      { text: '기분 좋으면 가고 아니면 안 간다', to: ['cat'] },
      { text: '할인되는 가게를 찾아서 가자고 한다', to: ['fox'] },
    ],
  },
  {
    q: '가계부를 쓰나요?',
    options: [
      { text: '항목별로 꼼꼼히 쓴다', to: ['owl'] },
      { text: '잔고만 보면 된다', to: ['squirrel'] },
      { text: '쓰다가 3일 만에 포기했다', to: ['cat', 'penguin'] },
      { text: '카드 앱이 알아서 정리해 준다', to: ['fox'] },
    ],
  },
  {
    q: '하루 중 가장 자주 쓰는 돈은?',
    options: [
      { text: '커피·간식 같은 작은 행복', to: ['penguin'] },
      { text: '거의 안 쓴다, 도시락파', to: ['squirrel'] },
      { text: '그때그때 다르다', to: ['cat'] },
      { text: '배달·택시 같은 편리함', to: ['peacock'] },
    ],
  },
  {
    q: '갖고 싶은 비싼 물건이 생기면',
    options: [
      { text: '돈을 모아서 계획대로 산다', to: ['owl', 'squirrel'] },
      { text: '할부로 일단 산다', to: ['peacock'] },
      { text: '최저가와 할인 쿠폰을 찾을 때까지 기다린다', to: ['fox'] },
      { text: '며칠 지나면 잊어버린다', to: ['cat', 'penguin'] },
    ],
  },
  {
    q: '내 통장 잔고, 지금 대충 얼마인지 안다',
    options: [
      { text: '원 단위까지 안다', to: ['owl'] },
      { text: '만 원 단위로 안다', to: ['squirrel', 'penguin'] },
      { text: '보기 무섭다', to: ['peacock', 'cat'] },
      { text: '포인트 잔액은 정확히 안다', to: ['fox'] },
    ],
  },
  {
    q: '올해 가장 후회되는 소비는?',
    options: [
      { text: '후회되는 소비가 별로 없다', to: ['squirrel', 'owl'] },
      { text: '충동적으로 산 비싼 물건', to: ['peacock', 'cat'] },
      { text: '할인이라서 산 안 쓰는 물건', to: ['fox'] },
      { text: '모아 보니 꽤 큰 커피값', to: ['penguin'] },
    ],
  },
  {
    q: '보너스 100만 원이 생긴다면?',
    options: [
      { text: '전부 저축', to: ['squirrel'] },
      { text: '여행이나 갖고 싶던 것에 쓴다', to: ['peacock'] },
      { text: '반은 저축, 반은 쓴다', to: ['owl', 'penguin'] },
      { text: '어디에 쓰면 혜택이 제일 클지 알아본다', to: ['fox'] },
    ],
  },
  {
    q: '쇼핑 앱 장바구니 상태는?',
    options: [
      { text: '텅 비어 있다', to: ['squirrel'] },
      { text: '가득 차 있고 자주 결제한다', to: ['peacock', 'cat'] },
      { text: '할인 알림 받으려고 담아 둔다', to: ['fox'] },
      { text: '작은 것만 몇 개 있다', to: ['penguin', 'owl'] },
    ],
  },
  {
    q: '내년에 돈과 관련해 제일 바라는 것은?',
    options: [
      { text: '목표 금액 모으기', to: ['squirrel', 'owl'] },
      { text: '돈 걱정 없이 하고 싶은 거 하기', to: ['peacock', 'cat'] },
      { text: '같은 돈으로 더 똑똑하게 쓰기', to: ['fox'] },
      { text: '작은 행복을 지키면서 조금씩 모으기', to: ['penguin'] },
    ],
  },
];

export type Scores = Record<TypeId, number>;

export function score(answers: number[]): Scores {
  const s = Object.fromEntries(TYPE_IDS.map((t) => [t, 0])) as Scores;
  answers.forEach((a, i) => {
    const opt = QUESTIONS[i]?.options[a];
    if (!opt) return;
    for (const t of opt.to) s[t] += 1 / opt.to.length;
  });
  return s;
}

/** 가장 높은 유형. 동점이면 마지막 질문에서 고른 쪽, 그래도 같으면 TYPE_IDS 순서. */
export function resultOf(answers: number[]): TypeId {
  const s = score(answers);
  const best = Math.max(...TYPE_IDS.map((t) => s[t]));
  const tied = TYPE_IDS.filter((t) => Math.abs(s[t] - best) < 1e-9);
  if (tied.length === 1) return tied[0];
  for (let i = answers.length - 1; i >= 0; i--) {
    const opt = QUESTIONS[i]?.options[answers[i]];
    const hit = opt?.to.find((t) => tied.includes(t));
    if (hit) return hit;
  }
  return tied[0];
}

/** 유형별 비율(%) 상위 3개 — "나는 다람쥐 50%, 부엉이 30%…" */
export function mix(answers: number[]): { id: TypeId; pct: number }[] {
  const s = score(answers);
  const total = TYPE_IDS.reduce((a, t) => a + s[t], 0) || 1;
  return TYPE_IDS.map((id) => ({ id, pct: Math.round((s[id] / total) * 100) }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 3);
}
