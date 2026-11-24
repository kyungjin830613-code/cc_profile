// N빵 정산기: 모임 비용을 항목별로 나누고, 누가 누구에게 얼마 보내면 되는지 계산한다.
// 금액은 모두 원 단위 정수. 실제 송금은 하지 않는다(정산 문구만 만든다).

export interface Item {
  id: string;
  name: string;
  amount: number;
  /** 낸 사람(사람 목록의 인덱스) */
  payer: number;
  /** 나눠 낼 사람들(인덱스). 비어 있으면 전원 */
  sharers: number[];
}

export interface Transfer {
  from: number;
  to: number;
  amount: number;
}

export interface Settlement {
  /** 사람별 부담액 */
  owe: number[];
  /** 사람별 실제로 낸 돈 */
  paid: number[];
  /** paid - owe (양수면 받을 돈) */
  balance: number[];
  transfers: Transfer[];
  total: number;
}

/** 금액을 k명이 나눈다. 1원 단위 나머지는 낸 사람(payer)이 있으면 그 사람이 먼저, 아니면 앞사람부터 1원씩 더 부담. */
export function splitAmount(amount: number, sharers: number[], payer: number): Map<number, number> {
  const out = new Map<number, number>();
  const k = sharers.length;
  if (k === 0 || amount <= 0) return out;
  const base = Math.floor(amount / k);
  let rest = amount - base * k;
  const order = sharers.includes(payer) ? [payer, ...sharers.filter((s) => s !== payer)] : sharers;
  for (const s of order) {
    out.set(s, base + (rest > 0 ? 1 : 0));
    if (rest > 0) rest--;
  }
  return out;
}

export function settle(peopleCount: number, items: Item[], unit = 1): Settlement {
  const n = Math.max(0, Math.floor(peopleCount));
  const owe = Array(n).fill(0);
  const paid = Array(n).fill(0);
  let total = 0;
  const everyone = Array.from({ length: n }, (_, i) => i);

  for (const it of items) {
    const amount = Math.round(it.amount);
    if (!(amount > 0) || it.payer < 0 || it.payer >= n) continue;
    const sharers = [...new Set((it.sharers.length ? it.sharers : everyone).filter((s) => s >= 0 && s < n))].sort((a, b) => a - b);
    if (sharers.length === 0) continue;
    total += amount;
    paid[it.payer] += amount;
    for (const [s, v] of splitAmount(amount, sharers, it.payer)) owe[s] += v;
  }

  const balance = paid.map((p, i) => p - owe[i]);
  return { owe, paid, balance, transfers: transfersOf(balance, unit), total };
}

/**
 * 적은 횟수로 갚게 짝짓는다(보낼 사람 중 가장 많이 보낼 사람 ↔ 받을 사람 중 가장 많이 받을 사람).
 * unit(10원·100원 등)으로 보낼 금액을 내림하고, 끝전은 받는 사람이 부담한다.
 */
export function transfersOf(balance: number[], unit = 1): Transfer[] {
  const u = Math.max(1, Math.floor(unit));
  const debt = balance.map((b, i) => ({ i, v: -b })).filter((x) => x.v > 0);
  const credit = balance.map((b, i) => ({ i, v: b })).filter((x) => x.v > 0);
  const out: Transfer[] = [];
  while (debt.length && credit.length) {
    debt.sort((a, b) => b.v - a.v || a.i - b.i);
    credit.sort((a, b) => b.v - a.v || a.i - b.i);
    const d = debt[0];
    const c = credit[0];
    const x = Math.min(d.v, c.v);
    const send = Math.floor(x / u) * u;
    if (send > 0) out.push({ from: d.i, to: c.i, amount: send });
    d.v -= x;
    c.v -= x;
    if (d.v === 0) debt.shift();
    if (c.v === 0) credit.shift();
  }
  return out;
}

/** 단순 N빵: 총액 ÷ 인원, unit 단위로 올림. 총무가 덜 걷히거나 더 걷히는 차액도 알려 준다. */
export function simpleSplit(total: number, people: number, unit = 100): { each: number; collected: number; diff: number } {
  const n = Math.max(1, Math.floor(people));
  const u = Math.max(1, Math.floor(unit));
  const t = Math.max(0, Math.round(total));
  const each = Math.ceil(t / n / u) * u;
  return { each, collected: each * n, diff: each * n - t };
}

export function won(n: number): string {
  return `${Math.round(n).toLocaleString('ko-KR')}원`;
}

/** 단톡방에 붙여 넣을 정산 문구 */
export function summaryText(title: string, names: string[], s: Settlement, unit: number): string {
  const lines = [`[${title || '모임'} 정산] 총 ${won(s.total)}`];
  names.forEach((nm, i) => lines.push(`· ${nm}: ${won(s.owe[i])}`));
  if (s.transfers.length) {
    lines.push('', '💸 보낼 돈');
    for (const t of s.transfers) lines.push(`${names[t.from]} → ${names[t.to]} ${won(t.amount)}`);
    if (unit > 1) lines.push(`(${won(unit)} 단위 내림, 끝전은 받는 사람 부담)`);
  } else {
    lines.push('', '주고받을 돈이 없어요 👍');
  }
  return lines.join('\n');
}
