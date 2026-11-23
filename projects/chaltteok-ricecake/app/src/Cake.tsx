// 떡 캐릭터 그림. 떡 종류마다 모양과 색이 다르다. 글자는 넣지 않는다.
import { CAKES } from './lib/game';

const INK = '#2b1720';

function face(cx: number, cy: number, happy: boolean): string {
  const mouth = happy
    ? `<path d="M${cx - 9} ${cy + 10}q9 10 18 0" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round"/>`
    : `<path d="M${cx - 7} ${cy + 12}q7 5 14 0" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  return `<circle cx="${cx - 18}" cy="${cy}" r="6" fill="${INK}"/><circle cx="${cx + 18}" cy="${cy}" r="6" fill="${INK}"/>
<circle cx="${cx - 16}" cy="${cy - 2}" r="2" fill="#fff"/><circle cx="${cx + 20}" cy="${cy - 2}" r="2" fill="#fff"/>
<ellipse cx="${cx - 30}" cy="${cy + 12}" rx="8" ry="5" fill="#ff8fb4" opacity=".8"/><ellipse cx="${cx + 30}" cy="${cy + 12}" rx="8" ry="5" fill="#ff8fb4" opacity=".8"/>${mouth}`;
}

function body(index: number): string {
  const [base, accent] = CAKES[index].colors;
  const st = `stroke="${INK}" stroke-width="5"`;
  switch (index) {
    case 0: // 가래떡: 긴 막대
      return `<rect x="22" y="70" width="156" height="66" rx="33" fill="${base}" ${st}/><path d="M60 78v50M140 78v50" stroke="${accent}" stroke-width="4"/>`;
    case 1: // 인절미: 콩고물 네모
      return `<rect x="36" y="52" width="128" height="100" rx="26" fill="${base}" ${st}/>${[50, 80, 120, 150, 64, 136, 100]
        .map((x, i) => `<circle cx="${x}" cy="${i % 2 ? 66 : 140}" r="3.5" fill="${accent}"/>`)
        .join('')}`;
    case 2: // 꿀떡: 동그란 초록 떡 + 분홍 친구
      return `<circle cx="100" cy="104" r="58" fill="${base}" ${st}/><circle cx="156" cy="146" r="22" fill="${accent}" ${st}/>`;
    case 3: // 송편: 반달
      return `<path d="M30 130 Q100 20 170 130 Z" fill="${base}" ${st} stroke-linejoin="round"/><path d="M60 118 Q100 70 140 118" stroke="${accent}" stroke-width="4" fill="none"/>`;
    case 4: // 백설기: 하얀 네모 + 김
      return `<rect x="34" y="62" width="132" height="92" rx="14" fill="${base}" ${st}/><path d="M80 52q-8-14 0-26M120 52q-8-14 0-26" stroke="#c9c9c9" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    case 5: // 무지개떡: 층
      return `<rect x="34" y="56" width="132" height="100" rx="16" fill="#ffe08a" ${st}/><rect x="36" y="58" width="128" height="24" rx="12" fill="${base}"/><rect x="36" y="128" width="128" height="26" rx="12" fill="${accent}"/><rect x="34" y="56" width="132" height="100" rx="16" fill="none" ${st}/>`;
    case 6: // 찹쌀떡: 하얀 공 + 팥
      return `<ellipse cx="100" cy="108" rx="72" ry="56" fill="${base}" ${st}/><path d="M60 64q40-18 80 0" stroke="${accent}" stroke-width="5" fill="none" opacity=".35" stroke-linecap="round"/>`;
    case 7: // 약식: 갈색 덩어리 + 대추
      return `<rect x="36" y="58" width="128" height="96" rx="30" fill="${base}" ${st}/><circle cx="62" cy="76" r="8" fill="#c0392b"/><circle cx="142" cy="80" r="7" fill="#f4d35e"/><circle cx="134" cy="140" r="7" fill="${accent}"/>`;
    case 8: // 두텁떡: 둥근 봉우리
      return `<path d="M36 150 Q36 60 100 52 Q164 60 164 150 Z" fill="${base}" ${st} stroke-linejoin="round"/><circle cx="100" cy="58" r="10" fill="${accent}" ${st}/>`;
    default: // 황금 떡: 반짝이
      return `<ellipse cx="100" cy="108" rx="72" ry="56" fill="${base}" ${st}/><path d="M100 18l6 16 16 6-16 6-6 16-6-16-16-6 16-6z" fill="${accent}" ${st} stroke-width="3"/><path d="M168 54l4 9 9 4-9 4-4 9-4-9-9-4 9-4z" fill="#fff"/>`;
  }
}

export function cakeSvg(index: number, happy = false): string {
  const i = Math.max(0, Math.min(CAKES.length - 1, index));
  const cy = i === 3 ? 108 : 104;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
<ellipse cx="100" cy="176" rx="70" ry="10" fill="#000" opacity=".12"/>
${body(i)}${face(100, cy, happy)}</svg>`;
}

export function Cake({ index, happy, className, alt }: { index: number; happy?: boolean; className?: string; alt?: string }) {
  return (
    <img
      className={className}
      src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(cakeSvg(index, happy))}`}
      alt={alt ?? ''}
      width={200}
      height={200}
      draggable={false}
    />
  );
}
