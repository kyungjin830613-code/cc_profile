/** 2027 붉은 양 마스코트 SVG 문자열 (카드 이미지에서도 씀) */
export function sheepSvg(): string {
  const puffs = [
    [62, 96, 26], [88, 80, 28], [118, 80, 28], [142, 98, 26], [52, 124, 24], [150, 126, 24], [70, 146, 26], [100, 152, 28], [130, 146, 26], [100, 112, 34],
  ];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
<ellipse cx="100" cy="188" rx="64" ry="9" fill="#000" opacity=".15"/>
<rect x="68" y="160" width="14" height="26" rx="6" fill="#2b1720"/><rect x="118" y="160" width="14" height="26" rx="6" fill="#2b1720"/>
${puffs.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#ff4d4d" stroke="#2b1720" stroke-width="4"/>`).join('')}
${puffs.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r - 4}" fill="#ff4d4d"/>`).join('')}
<path d="M66 108c-14 0-22 8-22 18" stroke="#ffd84d" stroke-width="9" fill="none" stroke-linecap="round"/>
<path d="M134 108c14 0 22 8 22 18" stroke="#ffd84d" stroke-width="9" fill="none" stroke-linecap="round"/>
<ellipse cx="100" cy="124" rx="34" ry="30" fill="#ffe7d6" stroke="#2b1720" stroke-width="4"/>
<circle cx="88" cy="120" r="6" fill="#2b1720"/><circle cx="112" cy="120" r="6" fill="#2b1720"/>
<circle cx="90" cy="118" r="2" fill="#fff"/><circle cx="114" cy="118" r="2" fill="#fff"/>
<ellipse cx="78" cy="134" rx="7" ry="4" fill="#ff8fb4"/><ellipse cx="122" cy="134" rx="7" ry="4" fill="#ff8fb4"/>
<path d="M94 136q6 6 12 0" stroke="#2b1720" stroke-width="3.5" fill="none" stroke-linecap="round"/>
</svg>`;
}

export function Sheep({ className }: { className?: string }) {
  return (
    <img
      className={className}
      src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(sheepSvg())}`}
      alt="2027 붉은 양 캐릭터"
      width={200}
      height={200}
    />
  );
}
