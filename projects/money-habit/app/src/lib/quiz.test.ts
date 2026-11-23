import { describe, expect, it } from 'vitest';
import { QUESTIONS, TYPES, TYPE_IDS, mix, resultOf, score } from './quiz';

function* allAnswers(): Generator<number[]> {
  // 4^10 = 1,048,576가지 전부
  const n = QUESTIONS.length;
  const a = new Array(n).fill(0);
  while (true) {
    yield a;
    let i = n - 1;
    while (i >= 0 && a[i] === 3) a[i--] = 0;
    if (i < 0) return;
    a[i]++;
  }
}

describe('질문 구성', () => {
  it('질문 10개, 보기 4개, 모든 보기가 실제 유형을 가리킨다', () => {
    expect(QUESTIONS).toHaveLength(10);
    for (const q of QUESTIONS) {
      expect(q.options).toHaveLength(4);
      for (const o of q.options) {
        expect(o.to.length).toBeGreaterThan(0);
        for (const t of o.to) expect(TYPE_IDS).toContain(t);
      }
    }
  });
  it('유형마다 잘 맞는 짝이 실제 유형이고 자기 자신이 아니다', () => {
    for (const t of TYPE_IDS) {
      expect(TYPE_IDS).toContain(TYPES[t].buddy);
      expect(TYPES[t].buddy).not.toBe(t);
    }
  });
});

describe('결과', () => {
  it('모든 답 조합(약 105만 가지)에서 6가지 유형이 다 나오고, 한 유형이 지나치게 몰리지 않는다', () => {
    const count = Object.fromEntries(TYPE_IDS.map((t) => [t, 0])) as Record<string, number>;
    let total = 0;
    for (const a of allAnswers()) {
      count[resultOf(a)]++;
      total++;
    }
    for (const t of TYPE_IDS) {
      const share = count[t] / total;
      expect(share, t).toBeGreaterThan(0.05);
      expect(share, t).toBeLessThan(0.35);
    }
  }, 60_000);

  it('한 유형만 계속 고르면 그 유형이 나온다', () => {
    for (const t of TYPE_IDS) {
      const answers = QUESTIONS.map((q) => {
        const i = q.options.findIndex((o) => o.to.length === 1 && o.to[0] === t);
        const j = q.options.findIndex((o) => o.to.includes(t));
        return i >= 0 ? i : Math.max(j, 0);
      });
      expect(resultOf(answers), t).toBe(t);
    }
  });

  it('점수 합은 답한 질문 수와 같고, 비율 상위 3개 합은 100 이하', () => {
    const a = [0, 1, 2, 3, 0, 1, 2, 3, 0, 1];
    const s = score(a);
    expect(Object.values(s).reduce((x, y) => x + y, 0)).toBeCloseTo(10);
    const m = mix(a);
    expect(m).toHaveLength(3);
    expect(m[0].pct).toBeGreaterThanOrEqual(m[1].pct);
    expect(m.reduce((x, y) => x + y.pct, 0)).toBeLessThanOrEqual(101);
  });

  it('잘못된 답 번호는 무시한다', () => {
    expect(() => resultOf([9, -1, 0])).not.toThrow();
  });
});
