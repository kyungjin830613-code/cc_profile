# 토스 미니앱(앱인토스) 시장 조사와 개발 계획

작성: 리야(클라우드 작업본부), 2026-11-23. PC 채팅에서도 이 파일을 기준으로 작업한다.

## 1. 시장 현황 (2026년 11월 기준, 대부분 토스 발표 인용 기사)

- 미니앱 1만 5천 개 이상, 월간 이용자 약 400만 명. 파트너의 67%가 1인 개발자.
- 토스 담당자: "실제로 쓰는 좋은 앱은 1%도 안 된다." 좋은 앱의 기준은 **유저가 계속 다시 쓰는가**.
- 공식 인기 순위는 공개되지 않음. 토스 앱 '전체' 탭에서 개인화 추천.

| 카테고리 | 대표 앱 | 성과 |
|---|---|---|
| 게임(방치형 키우기) | 용사단 키우기, 거지키우기, 돌돌디, 억만장자 키우기 | 용사단 키우기 1.5개월 80만 명, 돌돌디 월 매출 2.1억 |
| 운세·종교 | 산사(온라인 사찰), 점신, 자몽다 | 산사 인기 1위·월 108만 명, 자몽다 6개월 35만 명 |
| 혜택·절약 | 피카(카드 혜택), 디스팟(할인쿠폰) | 디스팟 첫 달 매출 1,000만 원 |
| 실생활 서비스 | 코심(eSIM), 안전집사(부동산) | 코심 첫 주 매출 260만 원 |

## 2. 꼭 지킬 토스 정책

- 같은 워크스페이스에서는 **목적이 완전히 다른 앱만** 새로 등록 가능. 구조가 비슷하면 반려.
- 같은 이름·로고·색으로 비슷한 앱을 여러 개 내는 것 금지. 반복 위반 시 워크스페이스 전체 제한.
- 실제 사례: AI 사주·AI 궁합·AI 점성술을 따로 냈다가 통합 요구받음. → **운세 앱은 지금 2개(지갑궁합·신년운세)에서 멈춘다.**
- 노출: 10/22부터 출시 → 추천 → 부스팅 3단계. 기준은 **재방문율·전환율**.
- 게임은 출시 전 **게임 등급분류** 필수(게임물관리위원회 또는 스토어 자체등급). 국내 서비스는 개인사업자도 **게임제작업 등록**이 일반적으로 필요.

## 3. 전략: "비슷하게 100개" 대신 "다르게 20~30개"

1. 앱마다 목적이 다르게(운세, 게임, 절약, 습관, 계산기 등 서로 다른 칸에 하나씩).
2. 매일 다시 오는 구조(키우기, 출석, 기록, 연속 일수).
3. 서버 없이 기기 안에서만 동작(개인정보 서버 전송 없음).
4. 출시 후 2주 지표를 보고 잘 되는 앱에 집중.
5. 수익화: 사업자 없이 인앱 광고부터(누적 예상수익 5천 원까지 유예) → 보상형 광고 1지면 → 이후 유료 기능.

## 4. 1차 후보 10개와 진행 상태

| 순위 | 앱 | 카테고리 | 다시 오는 이유 / 시기 | 상태 |
|---|---|---|---|---|
| 1 | 찰떡 떡집 키우기 (방치형 게임) | 게임 | 매일 수확, 출석 | ✅ 기획서·코드·로고 완성 `projects/chaltteok-ricecake` · 출시 전 등급분류·게임제작업 등록 필요 |
| 2 | 13월의 월급 (연말정산 미리보기) | 금융·세금 | 12~2월 성수기 | ✅ 코드·로고 완성 `projects/bonus13` (appName `bonus13`) · 토스 콘솔 등록 진행 중 |
| 3 | 경조사비 장부 (세뱃돈 계산기 대신) | 생활·기록 | 1년 내내 결혼식·장례식·돌잔치, 기록이 쌓여 재방문 | ✅ 기획서·코드·로고 완성 `projects/gyeongjo-book` (appName `gyeongjo-memo`) |
| 4 | 무지출 챌린지 + 52주 저축 챌린지(한 앱) | 절약 습관 | 매일 도장, 매주 저축 체크 | ✅ 기획서·코드·로고 완성 `projects/no-spend` (appName `mujichul-dojangpan`) |
| 5 | N빵 정산기 (더치페이) | 생활 도구 | 모임마다, 정산 문구 공유로 확산 | ✅ 기획서·코드·로고 완성 `projects/nbbang` (appName `nbbang-jeongsan-gi`) |
| 6 | 물 한 잔 습관 (물 마시기 + 건강 체크) | 건강 습관 | 하루 여러 번, 연속 일수 | ✅ 기획서·코드·로고 완성 `projects/water-habit` (appName `water-cup-habit`) |
| 7 | 오늘 점심 룰렛 | 재미·생활 | 매일 점심시간, 최근 먹은 메뉴 기록 | ✅ 기획서·코드·로고 완성 `projects/lunch-roulette` (appName `lunch-roulette-today`) |
| 8 | 월급 실수령액 계산기 | 금융 계산 | 토스 사용자와 맞는 주제 | ⬜ (13월의 월급과 기능이 겹치지 않게 주의) |
| 9 | 단어·상식 하루 퀴즈 | 퀴즈 게임 | 매일 새 문제 | ⬜ (게임으로 분류되면 등급분류 필요) |
| 10 | 우리집 공과금 계산 (전기·가스요금) | 절약 | 겨울 난방철·여름 냉방철 | ✅ 기획서·코드·로고 완성 `projects/utility-bill` (appName `urizip-gonggwagum`) |

### 정책 사전 검사 결과 (2026-11-23, 앱 만들기 창 첫 판정)

- 13월의 월급: **CARNIVAL**(토스가 연말정산·절세 서비스를 직접 준비 중 → 반려 가능성 높음) → **보류**. 월급 실수령액 계산기(8번)도 같은 이유로 제외.
- 아래 8개는 모두 **APPROVED**: 연말 돈 습관 테스트, 경조사비 장부, 무지출·52주 저축 챌린지, 더치페이 정산기, 건강 습관 도장, 점심 메뉴 룰렛, 상식·단어 퀴즈, 전기·가스요금 계산기.
- 앞으로 새 앱은 **개발 전에 정책 사전 검사**(설명만 넣고 만들기는 누르지 않음)부터 한다.

## 5. 이미 등록·출시 관련 현황

| 앱 | 폴더 | appName | 상태 |
|---|---|---|---|
| 찰떡 지갑궁합 | `projects/chaltteok-wallet` | chaltteok-wallet | 토스 검수 승인 → 출시하기 대기 |
| 찰떡 신년운세 | `projects/chaltteok-newyear-2027` | chaltteok-newyear | 토스 검수 승인 → 출시하기 대기 |
| 13월의 월급 | `projects/bonus13` | bonus13 | **보류**(토스 정책 CARNIVAL) |
| 경조사비 장부 | `projects/gyeongjo-book` | gyeongjo-memo | 검토 요청 직전 |
| 나의 돈 습관 결산 | `projects/money-habit` | money-habit-test | 검토 요청 직전(서약·휴대폰 테스트 대기) |
| 무지출 도장판 | `projects/no-spend` | mujichul-dojangpan | 콘솔 등록 진행 중(앱 이름 '무지출 챌린지'는 토스 서비스명이라 불가) |
| N빵 정산기 | `projects/nbbang` | nbbang-jeongsan-gi | 코드·로고·PRD 완성, 콘솔 등록 대기 |
| 물 한 잔 습관 | `projects/water-habit` | water-cup-habit | 검토 요청 직전 |
| 오늘 점심 룰렛 | `projects/lunch-roulette` | lunch-roulette-today | 검토 요청 직전 |
| 우리집 공과금 계산 | `projects/utility-bill` | urizip-gonggwagum | 검토 요청 직전 |
| 새해 소원 등불 | `projects/wish-lantern` | saehae-wish-lantern | 콘솔 등록 진행 중 |
| 디데이 모아보기 | `projects/dday` | dday-countdown-kr | 콘솔 등록 진행 중 |
| 평수 계산기 | `projects/pyeong` | pyeongsu-calc-kr | 콘솔 등록 진행 중 |
| 집중 타이머 | `projects/focus-timer` | jipjung-timer-kr | 코드·로고·PRD 완성, 콘솔 등록 대기 |
| 찰떡 떡집 키우기 | `projects/chaltteok-ricecake` | chaltteok-ricecake | 사업자 업종 추가(홈택스) → 게임제작업 등록 → 등급분류 후 등록 |

## 6. 공통 규칙

- 공통 앱 구조: Vite + React + TypeScript, `@apps-in-toss/web-framework`, `src/lib/toss.ts`(토스 밖에서는 웹 대체 동작), 핵심 계산은 `src/lib/*.ts`로 분리해 vitest 테스트.
- 빌드: `npm test` → `npm run build:toss`(.ait 생성).
- 로그인·인증·공개·검수 제출·결제는 사용자가 직접.
- 사실(세법 등)은 출처 2곳 이상 확인. 확정 안 된 개편안은 넣지 않는다.

## 출처

- 미니앱 1만 개·MAU 400만: https://www.thepowernews.co.kr/view.php?ud=202608140939081205de3f0aa1be_7 , https://www.ajunews.com/view/20260814135958226
- 앱인토스 PO 인터뷰(1%·재방문): https://maily.so/josh/posts/2qzpel5jo4x
- 산사·인기 앱: https://supple.kr/news/cmw4hk7a69mu4al9pt1hopbik , https://www.insight.co.kr/news/568211
- 게임 흥행: https://toss.im/apps-in-toss/blog/manababa , https://www.sidae.com/article/2026050614424215602
- 디스팟: https://toss.im/apps-in-toss/blog/discountspot
- 유사 앱 정책: https://developers-apps-in-toss.toss.im/landing-page/landing-page-en/intro/guide , https://techchat-apps-in-toss.toss.im/t/topic/2834
- 노출 정책: https://toss.im/apps-in-toss/blog/update-26-09-23 , https://toss.im/apps-in-toss/blog/mini-app-exposure-faq
- 광고 사업자 유예: https://toss.im/apps-in-toss/blog/update-26-08-27
- 게임 등급분류·제작업: https://toss.im/apps-in-toss/blog/game_rating_classification , https://toss.im/apps-in-toss/blog/game-developer-registration-guide

## 7. 출시 10개 목표 (2026-11-24~)

1~2 지갑궁합·신년운세(승인, 약관 동의 후 출시) / 3~9 경조사비 장부·돈 습관 결산·물 한 잔 습관·오늘 점심 룰렛·무지출 도장판·N빵 정산기·우리집 공과금 계산(검토 요청 직전) / 10 새해 소원 등불(개발 완료). 다음 후보: 디데이 계산기(정책 APPROVED).
- TDS 전환(11-24): 비게임 웹뷰 미니앱은 TDS(@toss/tds-mobile) 사용이 검수 기준이라, 위 3~10번과 디데이·평수·집중 타이머 11개를 React 18 + TDS 2.5.1로 다시 만들었다. 콘솔에 이미 올린 번들은 `npm install` → `npm test` → `npm run build:toss`로 새로 만들어 다시 올려야 한다. 지갑궁합·신년운세는 다음 업데이트 때 전환.
- 사업자: 앤비드(일반과세자), 업종에 응용 소프트웨어·모바일 게임 소프트웨어 개발 및 공급업 추가 완료(11-24). 토스 콘솔 사업자 정보 등록 신청함(검토 영업일 1~2일).
