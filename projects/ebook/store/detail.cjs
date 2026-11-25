// 크몽 상세페이지 이미지(세로 860px 섹션) 만들기: node detail.cjs <fonts node_modules> <출력 폴더>
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const NM = process.argv[2], OUT = process.argv[3];
const F = `file://${NM}/pretendard/dist/web/static/woff2`;
const P = path.join(__dirname, '..', '..');
const E = path.join(__dirname, '..');
const apps = ['daily-words','water-habit','no-spend','nbbang','lunch-roulette','utility-bill','gyeongjo-book','money-habit','dday','pyeong','focus-timer','wish-lantern'];
const icon = (a, s) => `<img src="file://${P}/${a}/assets/logo-600.png" style="width:${s}px;height:${s}px;border-radius:${s*0.24}px">`;
const base = `@font-face{font-family:P;font-weight:500;src:url(${F}/Pretendard-Medium.woff2)}@font-face{font-family:P;font-weight:700;src:url(${F}/Pretendard-Bold.woff2)}@font-face{font-family:P;font-weight:800;src:url(${F}/Pretendard-ExtraBold.woff2)}@font-face{font-family:P;font-weight:900;src:url(${F}/Pretendard-Black.woff2)}
*{box-sizing:border-box;margin:0}body{font-family:P;width:860px;word-break:keep-all}
.s{padding:80px 60px}.dark{background:#111;color:#fff}.light{background:#fff;color:#111}.cream{background:#fff8e6;color:#111}
.tag{display:inline-block;background:#ffd400;color:#111;font-weight:800;font-size:22px;padding:8px 18px;border-radius:8px}
h2{font-size:46px;font-weight:900;line-height:1.25;margin:26px 0 18px;letter-spacing:-1px}
.y{color:#ffd400}.hl{background:linear-gradient(transparent 60%,#ffd400 60%)}
p{font-size:22px;line-height:1.7;font-weight:500}
.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:18px;margin-top:34px}
.box{border:3px solid #333;border-radius:18px;padding:24px}
.box b{display:block;font-size:52px;font-weight:900;color:#ffd400;line-height:1.1}
.box span{font-size:20px;color:#bbb;font-weight:700}
.list{margin-top:30px;display:grid;gap:14px}
.item{display:grid;grid-template-columns:56px 1fr;gap:16px;align-items:start;background:#f6f6f6;border-radius:16px;padding:20px 22px}
.dark .item{background:#1e1e1e}
.num{width:56px;height:56px;border-radius:14px;background:#111;color:#ffd400;font-weight:900;font-size:26px;display:grid;place-items:center}
.dark .num{background:#ffd400;color:#111}
.item h4{font-size:24px;font-weight:800;margin-bottom:4px}.item p{font-size:19px;line-height:1.6;color:#555}.dark .item p{color:#bbb}
table{width:100%;border-collapse:collapse;margin-top:30px;font-size:20px}
th{background:#111;color:#fff;padding:14px;text-align:left}td{padding:14px;border-bottom:1px solid #ddd;vertical-align:top}
.price{font-size:34px;font-weight:900}.strike{color:#999;text-decoration:line-through;font-size:20px}
.icons{display:flex;flex-wrap:wrap;gap:14px;margin-top:34px}
.shot{display:flex;gap:20px;margin-top:30px;justify-content:center}.shot img{width:360px;border-radius:16px;border:1px solid #ddd}`;

const S = {
'01_hook': `<div class="s dark"><span class="tag">비개발자 실전 기록 · 2026년 11월 기준</span>
<h2>코딩 몰라도<br>AI와 둘이서<br><span class="y">31시간 만에</span><br>토스 미니앱 출시</h2>
<p style="color:#ccc">워크스페이스를 만들고 31시간 뒤, 첫 앱이 토스에 출시됐습니다.<br>그 사이 막힌 곳과 고친 방법을 전부 적었습니다.</p>
<div class="grid"><div class="box"><b>14개</b><span>앱 등록</span></div><div class="box"><b>2개</b><span>출시 · 반려 0건</span></div><div class="box"><b>9번</b><span>이름 때문에 등록 막힘</span></div><div class="box"><b>126개</b><span>자동 테스트로 검증</span></div></div>
<div class="icons">${apps.map(a=>icon(a,108)).join('')}</div>
<p style="color:#888;font-size:17px;margin-top:20px">↑ 이 책을 쓰며 실제로 만든 앱들</p></div>`,
'02_for': `<div class="s light"><span class="tag">이런 분께</span><h2>이 책이 필요한 사람</h2>
<div class="list">
<div class="item"><div class="num">1</div><div><h4>토스 미니앱으로 부업을 시작하고 싶은 분</h4><p>뭘 만들어야 통과하는지부터 막막할 때</p></div></div>
<div class="item"><div class="num">2</div><div><h4>코딩을 몰라 AI에게 맡기고 싶은 분</h4><p>"앱 만들어 줘" 한 줄로는 안 되는 이유와 그대로 쓰는 지시문 16개</p></div></div>
<div class="item"><div class="num">3</div><div><h4>등록하다 이름·입력칸에서 계속 막히는 분</h4><p>콘솔 오류 문구 원문과 고친 값을 한 표로</p></div></div>
<div class="item"><div class="num">4</div><div><h4>출시는 했는데 아무도 안 쓰는 분</h4><p>토스가 밀어주는 기준(재방문)과 출시 당일 홍보 루틴</p></div></div>
<div class="item"><div class="num">5</div><div><h4>앱을 여러 개 굴리고 싶은 분</h4><p>같은 구조로 만들고, 휴대폰으로 PC의 AI에게 일 시키는 법</p></div></div>
</div></div>`,
'03_diff': `<div class="s cream"><span class="tag">다른 책과 다른 점</span><h2>다른 앱인토스 책에<br><span class="hl">없는 5가지</span></h2>
<p>판매 중인 앱인토스 전자책들의 목차를 직접 비교했습니다. 아래 다섯 가지는 이 책에만 한 장씩 들어 있습니다.</p>
<div class="list">
<div class="item"><div class="num">1</div><div><h4>정책 사전 검사 실측표 14건</h4><p>코드 쓰기 전에 판정받는 법. 통과 13건, 보류 1건의 실제 화면과 문구</p></div></div>
<div class="item"><div class="num">2</div><div><h4>토스 디자인(TDS)으로 11개 다시 만든 기록</h4><p>필수인지 권장인지 공식 문서로 확인, 컴포넌트 12개·화면 조합 3가지·함정 7가지</p></div></div>
<div class="item"><div class="num">3</div><div><h4>콘솔 등록 막힘 전부</h4><p>appName 중복 7번, 서비스명 금지 2번, 영문 이름·주요 기능 오류 문구 원문</p></div></div>
<div class="item"><div class="num">4</div><div><h4>여러 앱 한 번에 + 휴대폰 원격 운영</h4><p>14개를 같은 구조로, 번들 일괄 재업로드, 밖에서 지시하고 PC의 AI가 처리</p></div></div>
<div class="item"><div class="num">5</div><div><h4>출시 후 홍보</h4><p>'토스에게 홍보 소재 맡기기'를 고쳐 쓰는 법, 글 하나로 조회수 2,418</p></div></div>
</div></div>`,
'04_toc': `<div class="s light"><span class="tag">목차</span><h2>프롤로그 + 10장 + 부록 7종</h2>
<table><tr><th style="width:90px">장</th><th>내용</th></tr>
<tr><td>프롤로그</td><td>31시간, 앱 14개, 출시 2개</td></tr>
<tr><td>1장</td><td>왜 하필 토스 미니앱인가 — 시장, 노출 3단계, 돈 버는 길</td></tr>
<tr><td>2장</td><td>시작 준비 — 첫날 반나절 세팅, 사람만 하는 일</td></tr>
<tr><td>3장</td><td>무엇을 만들까 — 정책 사전 검사, 재방문 점수표</td></tr>
<tr><td>4장</td><td>AI에게 일 맡기기 — 5단계, AI가 만든 버그 6건</td></tr>
<tr><td>5장</td><td>TDS로 만들기 — 컴포넌트 12개, 로고 공식 규칙</td></tr>
<tr><td>6장</td><td>콘솔 등록에서 막히는 것 전부</td></tr>
<tr><td>7장</td><td>검수와 출시 — 테스트부터 '출시하기'까지 8단계</td></tr>
<tr><td>8장</td><td>여러 앱을 한 번에 — 원격 운영과 상태판</td></tr>
<tr><td>9장</td><td>출시 후 홍보 — 채널별 키트, 7일 루틴</td></tr>
<tr><td>10장</td><td>숫자로 보는 결과와 회고 — 다르게 할 것 9가지</td></tr>
<tr><td>부록</td><td>AI 지시문 16개 · 입력값 체크리스트 · 판정표 · 카테고리표 · 7일 루틴 · 용어집 · 제출 전 체크리스트</td></tr></table></div>`,
'05_proof': `<div class="s dark"><span class="tag">실제 화면</span><h2>말이 아니라<br><span class="y">화면으로</span> 보여 드립니다</h2>
<p style="color:#ccc">책에 넣은 화면은 모두 저자가 실제로 만들고 등록한 앱입니다. (개인정보는 가렸습니다.)</p>
<div class="shot"><img src="file://${E}/figures/fig_5-1.png" style="width:740px"></div>
<p style="color:#888;font-size:17px;margin-top:14px">토스 디자인(TDS)으로 바꾸기 전 / 후</p></div>`,
'06_price': `<div class="s light"><span class="tag">구성과 가격</span><h2>필요한 만큼 고르세요</h2>
<table><tr><th>패키지</th><th>구성</th><th style="width:170px">가격</th></tr>
<tr><td><b>기본</b></td><td>전자책 PDF(본문 + 부록 7종)<br>무료 개정판</td><td><span class="price">29,000원</span><br><span style="color:#d00;font-weight:800">오픈 2주 19,900원</span></td></tr>
<tr><td><b>실전</b></td><td>기본 + AI 지시문 원본 파일<br>+ 콘솔 입력값·제출 체크리스트 엑셀<br>+ 정책 판정표 엑셀</td><td><span class="price">59,000원</span></td></tr></table>
<div class="list" style="margin-top:34px">
<div class="item"><div class="num">✓</div><div><h4>무료 개정판</h4><p>토스 정책·화면이 바뀌면 고친 판을 구매자께 무료로 드립니다.</p></div></div>
<div class="item"><div class="num">!</div><div><h4>수익을 약속하지 않습니다</h4><p>책의 숫자는 저자의 실제 기록입니다. 토스의 공식 안내서가 아닌 독립 출판물입니다.</p></div></div>
</div></div>`,
};
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 860, height: 1000 } });
  for (const [n, h] of Object.entries(S)) {
    const f = path.join(OUT, `${n}.html`);
    fs.writeFileSync(f, `<html><head><meta charset="utf-8"><style>${base}</style></head><body>${h}</body></html>`);
    await p.goto(`file://${f}`, { waitUntil: 'load' });
    await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(200);
    await p.screenshot({ path: path.join(OUT, `detail_${n}.png`), fullPage: true });
    fs.unlinkSync(f);
  }
  await b.close();
})();
