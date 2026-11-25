// 전자책 PDF 조판: node build.cjs <폰트·marked node_modules 폴더> <출력 PDF>
// 원고 manuscript/*.md → A4 HTML(표지 A안 디자인) → PDF
const fs = require('fs');
const path = require('path');
const NM = process.argv[2];
const OUT = process.argv[3] || path.join(__dirname, '..', 'dist', 'ebook.pdf');
const { marked } = require(path.join(NM, 'marked'));
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const FONT = `file://${NM}/pretendard/dist/web/static/woff2`;
const ONLY = process.env.ONLY; // 예: ONLY=03 → 무료 맛보기
const files = fs.readdirSync(path.join(ROOT, 'manuscript')).filter((f) => f.endsWith('.md') && (!ONLY || f.startsWith(ONLY))).sort();

const fig = (id) => {
  const p = path.join(ROOT, 'figures', `fig_${id}.png`);
  return fs.existsSync(p) ? `file://${p}` : null;
};

function convert(md) {
  md = md.replace(/^> v0\.\d[^\n]*\n\n?/m, ''); // 버전 메모 제거
  // [그림 x-y] / [그림 x-y, x-z] / [그림 x-y: 설명]
  md = md.replace(/\[그림 ([0-9]+-[0-9]+)(?:, ([0-9]+-[0-9]+))?(?:: ([^\]]+))?\]/g, (m, a, b, cap) => {
    const ids = [a, b].filter(Boolean);
    const blocks = ids.map((id) => {
      const src = fig(id);
      return src ? `<figure><img src="${src}"><figcaption>그림 ${id}${cap && id === a ? ` · ${cap}` : ''}</figcaption></figure>` : '';
    }).join('');
    return blocks ? `\n\n${blocks}\n\n` : '';
  });
  // 한글 바로 앞뒤의 **굵게**는 marked가 못 읽어서 직접 바꾼다
  md = md.replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>');
  let html = marked.parse(md, { gfm: true });
  html = html.replace(/<li>\[ \] /g, '<li class="chk">').replace(/<li>\s*<p>\[ \] /g, '<li class="chk"><p>');
  html = html.replace(/\[ \]/g, '<span class="box"></span>');
  html = html.replace(/<pre><code>/g, '<pre class="prompt"><span class="plabel">AI 지시문</span><code>');
  return html;
}

const chapters = files.map((f) => {
  const md = fs.readFileSync(path.join(ROOT, 'manuscript', f), 'utf8');
  const title = (md.match(/^# (.+)$/m) || [, f])[1];
  return { f, title, html: convert(md) };
});

const toc = chapters.map((c) => `<li>${c.title.replace(/^(\d+장\.|프롤로그\.|부록)/, '<b>$1</b>')}</li>`).join('');

const css = `
@font-face{font-family:P;font-weight:400;src:url(${FONT}/Pretendard-Regular.woff2)}
@font-face{font-family:P;font-weight:500;src:url(${FONT}/Pretendard-Medium.woff2)}
@font-face{font-family:P;font-weight:700;src:url(${FONT}/Pretendard-Bold.woff2)}
@font-face{font-family:P;font-weight:800;src:url(${FONT}/Pretendard-ExtraBold.woff2)}
@font-face{font-family:P;font-weight:900;src:url(${FONT}/Pretendard-Black.woff2)}
@page{size:A4;margin:22mm 20mm 22mm 20mm}
@page :first{margin:0}
*{box-sizing:border-box}
body{font-family:P;font-size:10.6pt;line-height:1.78;color:#1d1d1f;word-break:keep-all;margin:0}
.cover{page-break-after:always;width:210mm;height:297mm;margin:0;padding:0}
.cover img{width:210mm;height:297mm;object-fit:cover;display:block}
.front{page-break-after:always;padding-top:40mm}
.front h1{font-size:30pt;font-weight:900;line-height:1.25;margin:0 0 6mm}
.front h1 span{background:linear-gradient(transparent 60%,#ffd400 60%)}
.front p{font-size:12pt;color:#555}
.toc{page-break-after:always}
.toc h2{font-size:20pt;font-weight:900;border-bottom:3px solid #111;padding-bottom:3mm}
.toc ol{list-style:none;padding:0;font-size:12.5pt;line-height:2.3}
.toc b{display:inline-block;min-width:22mm;color:#111;font-weight:900}
.chapter{page-break-before:always}
.chapter h1{font-size:24pt;font-weight:900;line-height:1.3;margin:0 0 9mm;padding:9mm 8mm 9mm;background:#111;color:#fff;border-left:10px solid #ffd400;border-radius:4px}
h2{font-size:15pt;font-weight:800;margin:10mm 0 3mm;padding-bottom:2mm;border-bottom:2px solid #ffd400;page-break-after:avoid}
h3{font-size:12.5pt;font-weight:800;margin:7mm 0 2mm;page-break-after:avoid}
p{margin:0 0 3.2mm}
strong{font-weight:800}
hr{border:0;border-top:1px dashed #ccc;margin:7mm 0}
blockquote{margin:4mm 0;padding:3mm 5mm;background:#fff8d6;border-left:5px solid #ffd400;border-radius:3px}
blockquote p{margin:1mm 0}
table{width:100%;border-collapse:collapse;margin:3mm 0 5mm;font-size:9.4pt;line-height:1.55;page-break-inside:auto}
tr{page-break-inside:avoid}
th{background:#111;color:#fff;font-weight:700;text-align:left;padding:2mm 2.5mm}
td{border-bottom:1px solid #e3e3e3;padding:2mm 2.5mm;vertical-align:top}
tr:nth-child(even) td{background:#fafafa}
code{font-family:P;background:#f1f1f1;padding:0 1.2mm;border-radius:3px;font-size:9.6pt}
pre.prompt{position:relative;background:#16181d;color:#f5f5f5;border-radius:6px;padding:9mm 5mm 4mm;margin:4mm 0;white-space:pre-wrap;font-size:9.6pt;line-height:1.65;page-break-inside:avoid}
pre.prompt code{background:none;color:inherit;padding:0;font-size:inherit}
.plabel{position:absolute;top:2.5mm;left:5mm;background:#ffd400;color:#111;font-weight:800;font-size:8.5pt;padding:0.5mm 2.5mm;border-radius:3px}
ul,ol{padding-left:6mm;margin:0 0 3mm}
li{margin:0.8mm 0}
li.chk{list-style:none;margin-left:-5mm}
li.chk::before{content:'';display:inline-block;width:3.6mm;height:3.6mm;border:1.6px solid #111;border-radius:1mm;margin-right:2.5mm;vertical-align:-0.5mm}
.box{display:inline-block;width:3.4mm;height:3.4mm;border:1.5px solid #111;border-radius:1mm}
figure{margin:5mm 0;text-align:center;page-break-inside:avoid}
figure img{max-width:100%;max-height:120mm;border:1px solid #ddd;border-radius:4px}
figcaption{font-size:8.8pt;color:#666;margin-top:1.5mm}
em{font-style:normal;color:#666;font-size:9pt}
.colophon{page-break-before:always;padding-top:150mm;font-size:9.5pt;color:#444;line-height:1.9}
.colophon h3{font-size:12pt}
`;

const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>${css}</style></head><body>
<section class="cover"><img src="file://${ROOT}/cover/book_cover_A.png"></section>
<section class="front"><h1>AI와 둘이서<br><span>하루 반 만에</span><br>토스 미니앱 출시하기</h1>
<p>비개발자가 31시간 만에 앱 14개를 등록하고 2개를 출시한 실전 기록.<br>정책 판정 · 토스 디자인(TDS) · 등록 막힘 · 검수 · 출시 후 홍보까지.</p>
<p style="margin-top:20mm;font-size:10pt;color:#888">2026년 11월 기준 · 토스 정책이나 화면이 바뀌면 개정판을 무료로 드립니다.</p></section>
${ONLY ? `<section class="toc"><h2>무료 맛보기</h2><p>이 PDF는 전자책의 3장 전문입니다. 전체 목차: 프롤로그 · 1장 왜 토스 미니앱인가 · 2장 시작 준비 · <b>3장 무엇을 만들까</b> · 4장 AI에게 일 맡기기 · 5장 TDS로 만들기 · 6장 콘솔 등록 막힘 전부 · 7장 검수와 출시 · 8장 여러 앱 한 번에 · 9장 출시 후 홍보 · 10장 결과와 회고 · 부록 7종</p><p>전체 책 보기: 리틀리·크몽에서 「AI와 둘이서 하루 반 만에 토스 미니앱 출시하기」</p></section>` : `<section class="toc"><h2>차례</h2><ol>${toc}</ol></section>`}
${chapters.map((c) => `<section class="chapter">${c.html}</section>`).join('\n')}
<section class="colophon"><h3>AI와 둘이서 하루 반 만에 토스 미니앱 출시하기</h3>
<p>초판 발행 2026년 12월<br>이 책의 내용은 2026년 11월 기준입니다. 앱인토스의 정책·화면은 바뀔 수 있으며, 최신 정보는 앱인토스 공식 문서를 확인해 주세요.<br>
이 책은 토스(비바리퍼블리카)와 관계없는 독립 출판물이며, 토스의 공식 안내서가 아닙니다.<br>
이 책의 저작권은 저자에게 있으며, 무단 복제·배포·재판매를 금합니다.<br>수익을 보장하지 않으며, 사례의 숫자는 저자의 실제 기록입니다.</p></section>
</body></html>`;

(async () => {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  const tmp = path.join(path.dirname(OUT), 'ebook.html');
  fs.writeFileSync(tmp, html);
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto(`file://${tmp}`, { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(500);
  await p.pdf({
    path: OUT, format: 'A4', printBackground: true, preferCSSPageSize: true,
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: '<div style="width:100%;font-size:8px;color:#999;text-align:center;font-family:sans-serif"><span class="pageNumber"></span></div>',
  });
  await b.close();
  console.log('PDF:', OUT);
})();
