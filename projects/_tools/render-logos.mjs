import { createRequire } from 'node:module'; const { chromium } = createRequire('/tmp/x.js')('playwright');
import { readFileSync, mkdirSync } from 'node:fs';
const grab = (file, fn) => { const s = readFileSync(file, 'utf8'); const i = s.indexOf('`<svg'); const j = s.indexOf('</svg>`', i); return s.slice(i + 1, j + 6); };
const creatureTpl = grab('chaltteok-wallet/app/src/Creature.tsx');
const tops = [...readFileSync('chaltteok-wallet/app/src/Creature.tsx','utf8').matchAll(/  '(<path[^']+)',?\n/g)].map(m=>m[1]);
const colors = ['#43b95f', '#ff6a3d', '#d99a3b', '#9aa8b8', '#2f9bf0'];
const creature = (e, flip) => creatureTpl.replace('${f}', flip ? 'transform="translate(200 0) scale(-1 1)"' : '').replace('${TOPS[element]}', tops[e]).replace('${ELEMENT_COLOR[element]}', colors[e]);
const sheepSrc = readFileSync('chaltteok-newyear-2027/app/src/Sheep.tsx','utf8');
const puffs = [[62,96,26],[88,80,28],[118,80,28],[142,98,26],[52,124,24],[150,126,24],[70,146,26],[100,152,28],[130,146,26],[100,112,34]];
let sheep = sheepSrc.slice(sheepSrc.indexOf('`<svg')+1, sheepSrc.indexOf('</svg>`')+6);
sheep = sheep.replace(/\$\{puffs\.map\(\(\[x, y, r\]\) => `<circle cx="\$\{x\}" cy="\$\{y\}" r="\$\{r\}" fill="#ff4d4d" stroke="#2b1720" stroke-width="4"\/>`\)\.join\(''\)\}/, puffs.map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}" fill="#ff4d4d" stroke="#2b1720" stroke-width="4"/>`).join(''))
             .replace(/\$\{puffs\.map\(\(\[x, y, r\]\) => `<circle cx="\$\{x\}" cy="\$\{y\}" r="\$\{r - 4\}" fill="#ff4d4d"\/>`\)\.join\(''\)\}/, puffs.map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r-4}" fill="#ff4d4d"/>`).join(''));
const uri = s => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
const wallet = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 100"><rect x="6" y="18" width="108" height="74" rx="14" fill="#ffd84d" stroke="#2b1720" stroke-width="7"/><path d="M6 42h108" stroke="#2b1720" stroke-width="6"/><path d="M60 58c-8-10-22-4-16 8 4 7 16 14 16 14s12-7 16-14c6-12-8-18-16-8z" fill="#ff3d7f" stroke="#2b1720" stroke-width="4"/></svg>`;
const pages = {
  wallet: `<div style="position:absolute;inset:0;background:#ff5c93;display:grid;place-items:center">
    <img src="${uri(creature(1,false))}" style="position:absolute;left:4%;top:24%;width:52%">
    <img src="${uri(creature(2,true))}" style="position:absolute;right:4%;top:24%;width:52%">
    <img src="${uri(wallet)}" style="position:absolute;left:31%;top:58%;width:38%">
    <div style="position:absolute;top:7%;width:100%;text-align:center;font:900 150px 'Jua',sans-serif;color:#fff;-webkit-text-stroke:10px #2b1720;paint-order:stroke">찰떡</div></div>`,
  newyear: `<div style="position:absolute;inset:0;background:#c8102e;display:grid;place-items:center">
    <img src="${uri(sheep)}" style="position:absolute;left:6%;top:8%;width:88%">
    <div style="position:absolute;top:6%;width:100%;text-align:center;font:900 170px 'Jua',sans-serif;color:#ffd84d;-webkit-text-stroke:12px #2b1720;paint-order:stroke">2027</div></div>`,
};
const b = await chromium.launch();
for (const [name, body] of Object.entries(pages)) {
  const dir = name === 'wallet' ? 'chaltteok-wallet/assets' : 'chaltteok-newyear-2027/assets'; mkdirSync(dir, { recursive: true });
  const p = await b.newPage({ viewport: { width: 1024, height: 1024 } });
  await p.setContent(`<html><head><link href="https://fonts.googleapis.com/css2?family=Jua&display=swap" rel="stylesheet"></head><body style="margin:0">${body}</body></html>`);
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${dir}/logo-1024.png` });
  await p.setViewportSize({ width: 1024, height: 1024 });
  console.log(name, await p.evaluate(() => document.fonts.check("40px Jua")));
}
await b.close();
