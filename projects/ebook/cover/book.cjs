const { chromium } = require('playwright');
const SP = process.argv[2];
const F = `file://${SP}/fonts/node_modules/pretendard/dist/web/static/woff2`;
const P = '/home/user/cc_profile/projects';
const apps = ['daily-words','water-habit','no-spend','nbbang','lunch-roulette','utility-bill','gyeongjo-book','money-habit','dday','pyeong','focus-timer','wish-lantern'];
const tiles = apps.map(a => `<img src="file://${P}/${a}/assets/logo-600.png">`).join('');
const html = `<html><head><meta charset="utf-8"><style>
@font-face{font-family:P;font-weight:500;src:url(${F}/Pretendard-Medium.woff2)}@font-face{font-family:P;font-weight:700;src:url(${F}/Pretendard-Bold.woff2)}@font-face{font-family:P;font-weight:800;src:url(${F}/Pretendard-ExtraBold.woff2)}@font-face{font-family:P;font-weight:900;src:url(${F}/Pretendard-Black.woff2)}
*{box-sizing:border-box;margin:0}body{font-family:P;width:1240px;height:1754px;overflow:hidden;word-break:keep-all}
.w{width:1240px;height:1754px;background:#111;color:#fff;padding:100px 100px 80px;display:flex;flex-direction:column;align-items:flex-start}
.tag{display:inline-block;background:#ffd400;color:#111;font-weight:800;font-size:38px;padding:14px 28px;border-radius:10px}
h1{font-size:104px;font-weight:900;line-height:1.12;margin-top:48px;letter-spacing:-3px}
.y{color:#ffd400}
.sub{font-size:40px;color:#d0d0d0;margin-top:36px;font-weight:700;line-height:1.45}
.grid{width:100%;margin-top:60px;display:grid;grid-template-columns:repeat(6,1fr);gap:26px}
.grid img{width:100%;aspect-ratio:1;border-radius:26%;box-shadow:0 10px 24px #0006}
.nums{width:100%;margin-top:52px;display:grid;grid-template-columns:repeat(4,1fr);gap:22px}
.n{border:3px solid #333;border-radius:22px;padding:26px 22px}
.n b{display:block;font-size:72px;font-weight:900;color:#ffd400;line-height:1}
.n span{display:block;margin-top:10px;font-size:27px;color:#bbb;font-weight:700;line-height:1.3}
.bottom{width:100%;margin-top:auto;display:flex;justify-content:space-between;align-items:flex-end;border-top:2px solid #333;padding-top:34px}
.bottom .l{font-size:32px;font-weight:700;color:#e6e6e6;line-height:1.5}
.bottom .r{font-size:28px;font-weight:700;color:#888;text-align:right;line-height:1.5}
</style></head><body><div class="w">
<span class="tag">비개발자 실전 기록</span>
<h1>AI와 둘이서<br><span class="y">하루 반 만에</span><br>토스 미니앱<br>출시하기</h1>
<p class="sub">정책 판정 · 토스 디자인 · 등록 막힘 · 출시 후 홍보까지<br>막힌 곳 전부와 고친 방법</p>
<div class="grid">${tiles}</div>
<div class="nums"><div class="n"><b>14개</b><span>앱 등록</span></div><div class="n"><b>2개</b><span>출시</span></div><div class="n"><b>9번</b><span>이름 때문에<br>등록 막힘</span></div><div class="n"><b>0원</b><span>개발자<br>고용비</span></div></div>
<div class="bottom"><div class="l">AI 지시문 16개 · 체크리스트 · 정책 판정표 수록</div><div class="r">2026년 11월 기준<br>무료 개정판 제공</div></div>
</div></body></html>`;
(async () => {
  require('fs').writeFileSync(`${SP}/cover/book.html`, html);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1240, height: 1754 }, deviceScaleFactor: 1 });
  await p.goto(`file://${SP}/cover/book.html`, { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
  await p.screenshot({ path: `${SP}/cover/book_cover_A.png` });
  await b.close();
})();
