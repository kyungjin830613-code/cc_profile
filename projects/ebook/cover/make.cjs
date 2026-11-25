const { chromium } = require('playwright');
const SP = process.argv[2];
const F = `file://${SP}/fonts/node_modules/pretendard/dist/web/static/woff2`;
const P = '/home/user/cc_profile/projects';
const apps = ['daily-words','water-habit','no-spend','nbbang','lunch-roulette','utility-bill','gyeongjo-book','money-habit','dday','pyeong','focus-timer','wish-lantern'];
const font = `@font-face{font-family:P;src:url(${F}/Pretendard-Regular.woff2)}@font-face{font-family:P;font-weight:700;src:url(${F}/Pretendard-Bold.woff2)}@font-face{font-family:P;font-weight:800;src:url(${F}/Pretendard-ExtraBold.woff2)}@font-face{font-family:P;font-weight:900;src:url(${F}/Pretendard-Black.woff2)}*{box-sizing:border-box;margin:0}body{font-family:P;width:1200px;height:900px;overflow:hidden;word-break:keep-all}`;
const tiles = (n, size) => apps.slice(0, n).map(a => `<img src="file://${P}/${a}/assets/logo-600.png" style="width:${size}px;height:${size}px;border-radius:${size*0.23}px;box-shadow:0 6px 18px #0003">`).join('');

const A = `<style>${font}
.w{width:1200px;height:900px;background:#111;color:#fff;padding:70px 80px;position:relative}
.tag{display:inline-block;background:#ffd400;color:#111;font-weight:800;font-size:30px;padding:10px 22px;border-radius:8px}
h1{font-size:72px;font-weight:900;line-height:1.16;margin-top:30px;letter-spacing:-2px}
.big{color:#ffd400}
.sub{font-size:34px;color:#cfcfcf;margin-top:26px;font-weight:700}
.nums{position:absolute;left:80px;right:80px;bottom:70px;display:flex;gap:22px}
.n{flex:1;border:3px solid #333;border-radius:18px;padding:18px 20px}
.n b{display:block;font-size:56px;font-weight:900;color:#ffd400;line-height:1}
.n span{font-size:24px;color:#bbb;font-weight:700}
.red{color:#ff4d4d}</style>
<div class="w"><span class="tag">비개발자 실전 기록</span>
<h1>AI와 둘이서<br><span class="big">하루 반 만에</span><br>토스 미니앱 출시하기</h1>
<p class="sub">정책 판정 · 토스 디자인 · 등록 막힘 · 홍보까지 전부</p>
<div style="margin-top:44px;display:flex;gap:14px">${tiles(12, 70)}</div>
<div class="nums"><div class="n"><b>14개</b><span>앱 등록</span></div><div class="n"><b>2개</b><span>출시</span></div><div class="n"><b class="red">9번</b><span>이름 때문에 등록 막힘</span></div><div class="n"><b>0원</b><span>개발자 고용비</span></div></div></div>`;

const B = `<style>${font}
.w{width:1200px;height:900px;background:linear-gradient(160deg,#e8f3ff 0%,#f9fbff 60%);color:#191f28;display:grid;grid-template-columns:1fr 470px;align-items:center;padding:0 0 0 80px;overflow:hidden}
.tag{display:inline-block;background:#3182f6;color:#fff;font-weight:800;font-size:26px;padding:9px 20px;border-radius:999px}
h1{font-size:66px;font-weight:900;line-height:1.2;margin-top:28px;letter-spacing:-1.5px}
h1 em{font-style:normal;color:#3182f6}
.sub{font-size:28px;color:#4e5968;margin-top:24px;font-weight:700;line-height:1.45}
.foot{margin-top:40px;font-size:24px;color:#8b95a1;font-weight:700}
.phone{width:400px;height:800px;background:#191f28;border-radius:56px;padding:16px;transform:rotate(-6deg) translate(30px,40px);box-shadow:0 30px 60px #3182f640}
.scr{width:100%;height:100%;background:#f2f4f6;border-radius:42px;padding:60px 28px;display:grid;grid-template-columns:repeat(3,1fr);gap:26px;align-content:start;justify-items:center}</style>
<div class="w"><div><span class="tag">코딩 몰라도 · AI와 함께</span>
<h1>앱 <em>14개</em> 등록,<br><em>2개</em> 출시까지<br>하루 반</h1>
<p class="sub">토스 미니앱, 만들기 전에 반려를 피하고<br>출시한 날부터 사람을 모으는 실전 순서</p>
<p class="foot">지시문 16개 · 체크리스트 · 판정표 수록</p></div>
<div class="phone"><div class="scr">${tiles(12, 92)}</div></div></div>`;

const C = `<style>${font}
.w{width:1200px;height:900px;background:#fff8e6;color:#1d1d1d;padding:64px 80px;position:relative;overflow:hidden}
.top{display:flex;justify-content:space-between;align-items:center}
.tag{background:#1d1d1d;color:#fff;font-weight:800;font-size:26px;padding:9px 20px;border-radius:8px}
.stamp{border:6px solid #e5322d;color:#e5322d;font-weight:900;font-size:34px;padding:8px 18px;border-radius:12px;transform:rotate(8deg)}
h1{font-size:70px;font-weight:900;line-height:1.2;margin-top:34px;letter-spacing:-1.5px}
h1 u{text-decoration:none;background:linear-gradient(transparent 62%,#ffd400 62%)}
.log{margin-top:36px;background:#fff;border-radius:22px;padding:26px 32px;box-shadow:0 10px 30px #0001;font-size:27px;line-height:1.7;font-weight:700}
.log div{display:grid;grid-template-columns:200px 1fr;gap:12px}
.log .k{color:#e5322d}
.log .ok{color:#1b64da}</style>
<div class="w"><div class="top"><span class="tag">막힌 곳 전부 공개</span><span class="stamp">반려 피하기</span></div>
<h1>다 만들고 접은 앱 <u>1개</u>,<br>하룻밤에 다시 만든 앱 <u>11개</u></h1>
<div class="log">
<div><span class="k">✕ 증상</span><span>이름 때문에 등록 막힘 — 9번</span></div>
<div><span class="k">✕ 원인</span><span>검수 기준 TDS를 몰랐다</span></div>
<div><span class="ok">✓ 고친 값</span><span>정책 사전 검사 → TDS → 한 번에 출시</span></div></div>
<div style="margin-top:40px;display:flex;gap:16px">${tiles(10, 82)}</div>
<p style="margin-top:34px;font-size:32px;font-weight:800">AI와 둘이서 토스 미니앱 출시하기 <span style="color:#8b8b8b;font-weight:700">· 비개발자 실전 기록</span></p></div>`;

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1 });
  for (const [n, h] of [['A', A], ['B', B], ['C', C]]) {
    require('fs').writeFileSync(`${SP}/cover/${n}.html`, `<html><head><meta charset="utf-8"></head><body>${h}</body></html>`);
    await p.goto(`file://${SP}/cover/${n}.html`, { waitUntil: 'load' });
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(300);
    await p.screenshot({ path: `${SP}/cover/cover_${n}.png` });
  }
  await b.close();
})();
