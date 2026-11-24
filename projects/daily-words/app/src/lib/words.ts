// 단어장. 형식: 영어|품사|뜻. 품사: 명=명사, 동=동사, 형=형용사, 부=부사
export type Level = 'basic' | 'middle' | 'toeic';
export interface Word {
  id: string;
  en: string;
  pos: string;
  ko: string;
  level: Level;
}

export const LEVEL_NAME: Record<Level, string> = { basic: '기초', middle: '중급', toeic: '토익·실무' };

const RAW: Record<Level, string> = {
  basic: `
borrow|동|빌리다
lend|동|빌려주다
choose|동|고르다, 선택하다
decide|동|결정하다
explain|동|설명하다
forget|동|잊다
remember|동|기억하다
arrive|동|도착하다
leave|동|떠나다, 두고 오다
return|동|돌아오다, 돌려주다
prepare|동|준비하다
protect|동|보호하다
share|동|나누다, 공유하다
spend|동|(돈·시간을) 쓰다
save|동|저축하다, 구하다
invite|동|초대하다
answer|동|대답하다
believe|동|믿다
carry|동|나르다, 들고 다니다
change|동|바꾸다
build|동|짓다, 만들다
grow|동|자라다, 기르다
hurry|동|서두르다
worry|동|걱정하다
wonder|동|궁금해하다
early|형|이른, 일찍
late|형|늦은
busy|형|바쁜
quiet|형|조용한
noisy|형|시끄러운
empty|형|비어 있는
full|형|가득 찬, 배부른
cheap|형|값싼
expensive|형|비싼
safe|형|안전한
dangerous|형|위험한
famous|형|유명한
favorite|형|가장 좋아하는
different|형|다른
same|형|같은
easy|형|쉬운
difficult|형|어려운
healthy|형|건강한
tired|형|피곤한
hungry|형|배고픈
weather|명|날씨
season|명|계절
holiday|명|휴일, 휴가
neighbor|명|이웃
village|명|마을
price|명|가격
gift|명|선물
habit|명|습관
promise|명|약속
health|명|건강
reason|명|이유
always|부|항상
usually|부|보통, 대개
sometimes|부|가끔
never|부|결코 ~않다
`,
  middle: `
achieve|동|이루다, 달성하다
avoid|동|피하다
compare|동|비교하다
consider|동|고려하다
improve|동|개선하다, 나아지다
include|동|포함하다
increase|동|증가하다, 늘리다
reduce|동|줄이다
require|동|필요로 하다, 요구하다
suggest|동|제안하다
encourage|동|격려하다
recognize|동|알아보다, 인정하다
respond|동|대답하다, 반응하다
survive|동|살아남다
manage|동|관리하다, 해내다
admit|동|인정하다
deny|동|부인하다
earn|동|(돈을) 벌다
waste|동|낭비하다
apologize|동|사과하다
complain|동|불평하다
describe|동|묘사하다
depend|동|의존하다, ~에 달려 있다
establish|동|설립하다, 확립하다
predict|동|예측하다
accurate|형|정확한
available|형|이용 가능한
confident|형|자신감 있는
curious|형|호기심 많은
efficient|형|효율적인
essential|형|필수적인
familiar|형|익숙한
generous|형|너그러운, 후한
honest|형|정직한
obvious|형|명백한
patient|형|참을성 있는
public|형|공공의
reliable|형|믿을 만한
similar|형|비슷한
various|형|다양한
ancient|형|고대의, 아주 오래된
anxious|형|불안한
ability|명|능력
advantage|명|장점, 이점
attitude|명|태도
benefit|명|이익, 혜택
challenge|명|도전, 어려운 과제
community|명|공동체, 지역 사회
environment|명|환경
experience|명|경험
opportunity|명|기회
opinion|명|의견
pressure|명|압박, 압력
purpose|명|목적
resource|명|자원
solution|명|해결책
effort|명|노력
recently|부|최근에
eventually|부|결국
rarely|부|좀처럼 ~않는
`,
  toeic: `
postpone|동|연기하다, 미루다
reimburse|동|(비용을) 상환하다, 환급하다
negotiate|동|협상하다
submit|동|제출하다
approve|동|승인하다
attend|동|참석하다
confirm|동|확인하다, 확정하다
deliver|동|배달하다
expand|동|확장하다
implement|동|시행하다
inquire|동|문의하다
launch|동|출시하다, 시작하다
renovate|동|개조하다, 보수하다
schedule|동|일정을 잡다
assign|동|배정하다, 맡기다
evaluate|동|평가하다
hire|동|고용하다
recruit|동|모집하다, 채용하다
retire|동|은퇴하다
qualify|동|자격을 갖추다
allocate|동|할당하다
comply|동|(규정을) 따르다, 준수하다
accommodate|동|수용하다, 숙박시키다
estimate|동|추정하다, 견적을 내다
merge|동|합병하다
mandatory|형|의무적인
tentative|형|잠정적인
eligible|형|자격이 있는
confidential|형|기밀의
complimentary|형|무료의
punctual|형|시간을 엄수하는
temporary|형|일시적인, 임시의
permanent|형|영구적인
considerable|형|상당한
preliminary|형|예비의
outstanding|형|뛰어난, 미지불된
prompt|형|신속한
substantial|형|상당한, 많은
agenda|명|안건, 의제
invoice|명|송장, 청구서
receipt|명|영수증
warranty|명|품질 보증
deadline|명|마감일
budget|명|예산
revenue|명|수익, 매출
expense|명|비용, 지출
inventory|명|재고
quote|명|견적
supervisor|명|관리자, 상사
colleague|명|동료
applicant|명|지원자
candidate|명|후보자
headquarters|명|본사
branch|명|지점
shipment|명|배송, 수송품
subscription|명|구독
refund|명|환불
venue|명|장소, 개최지
promptly|부|즉시, 신속하게
previously|부|이전에
`,
};

export const WORDS: Word[] = (Object.keys(RAW) as Level[]).flatMap((level) =>
  RAW[level]
    .trim()
    .split('\n')
    .map((line) => {
      const [en, pos, ko] = line.split('|');
      return { id: `${level}:${en}`, en, pos, ko, level };
    }),
);

export const BY_ID: Record<string, Word> = Object.fromEntries(WORDS.map((w) => [w.id, w]));
