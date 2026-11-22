import { ELEMENT_NAME } from './lib/saju';

export const ELEMENT_COLOR = ['#43b95f', '#ff6a3d', '#d99a3b', '#9aa8b8', '#2f9bf0'];

const TOPS = [
  '<path d="M100 38c-6-18 4-30 18-32-2 14-8 22-18 32zm0 0c4-16-6-26-18-28 0 12 6 20 18 28z" fill="#2e8a43"/>',
  '<path d="M70 70c-6-30 18-40 22-62 14 22 32 30 26 62z" fill="#ffb340"/>',
  '<path d="M60 64q40-26 80 0z" fill="#b97a26"/>',
  '<path d="M100 22l14 22-14 22-14-22z" fill="#e9eef3" stroke="#6f7d8c" stroke-width="3"/>',
  '<path d="M100 18c10 16 20 26 20 38a20 20 0 0 1-40 0c0-12 10-22 20-38z" fill="#8fd3ff"/>',
];

/** 오행 캐릭터 SVG 문자열. 카드 이미지(canvas)에서도 같은 그림을 쓴다. */
export function creatureSvg(element: number, flip = false): string {
  const f = flip ? 'transform="translate(200 0) scale(-1 1)"' : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><g ${f}>
<ellipse cx="100" cy="186" rx="62" ry="10" fill="#000" opacity=".15"/>${TOPS[element]}
<path d="M40 130c0-44 26-70 60-70s60 26 60 70c0 30-26 50-60 50s-60-20-60-50z" fill="${ELEMENT_COLOR[element]}" stroke="#2b1720" stroke-width="5"/>
<path d="M58 118c4-22 18-36 34-40" stroke="#fff" stroke-width="7" stroke-linecap="round" fill="none" opacity=".45"/>
<circle cx="82" cy="124" r="8" fill="#2b1720"/><circle cx="122" cy="124" r="8" fill="#2b1720"/>
<circle cx="85" cy="121" r="2.6" fill="#fff"/><circle cx="125" cy="121" r="2.6" fill="#fff"/>
<ellipse cx="68" cy="140" rx="9" ry="5" fill="#ff8fb4" opacity=".8"/><ellipse cx="136" cy="140" rx="9" ry="5" fill="#ff8fb4" opacity=".8"/>
<path d="M94 142q8 8 16 0" stroke="#2b1720" stroke-width="4" fill="none" stroke-linecap="round"/>
<rect x="128" y="150" width="40" height="28" rx="6" fill="#ffd84d" stroke="#2b1720" stroke-width="4"/>
<path d="M128 162h40" stroke="#2b1720" stroke-width="3"/>
</g></svg>`;
}

export function Creature({ element, flip, className }: { element: number; flip?: boolean; className?: string }) {
  return (
    <img
      className={className}
      src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(creatureSvg(element, flip))}`}
      alt={`${ELEMENT_NAME[element]} 캐릭터`}
      width={200}
      height={200}
    />
  );
}
