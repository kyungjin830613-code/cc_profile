import { describe, expect, it } from 'vitest';
import { BASE_MENUS, CATEGORY_NAME, addCustom, addEaten, candidates, pick, wheelSlots } from './menu';

const T = '2026-11-24';

describe('메뉴 목록', () => {
  it('메뉴 이름이 겹치지 않고 모든 종류에 메뉴가 있다', () => {
    const names = BASE_MENUS.map((m) => m.name);
    expect(new Set(names).size).toBe(names.length);
    for (const c of Object.keys(CATEGORY_NAME)) expect(BASE_MENUS.some((m) => m.cat === c), c).toBe(true);
    expect(BASE_MENUS.length).toBeGreaterThanOrEqual(40);
  });
});

describe('후보 고르기', () => {
  it('꺼 둔 종류는 뺀다', () => {
    const c = candidates(BASE_MENUS, { off: ['chinese', 'japanese'], avoidDays: 0 }, [], T);
    expect(c.some((m) => m.cat === 'chinese' || m.cat === 'japanese')).toBe(false);
  });
  it('최근 n일 먹은 메뉴는 뺀다(오늘 포함), 그보다 오래된 건 다시 나온다', () => {
    const eaten = [{ name: '김치찌개', day: T }, { name: '짜장면', day: '2026-11-22' }, { name: '라면', day: '2026-11-20' }];
    const c = candidates(BASE_MENUS, { off: [], avoidDays: 3 }, eaten, T).map((m) => m.name);
    expect(c).not.toContain('김치찌개');
    expect(c).not.toContain('짜장면');
    expect(c).toContain('라면');
  });
  it('다 빠지면 최근 먹은 조건만 풀어 준다', () => {
    const only = [{ name: 'A', cat: 'light' as const, emoji: '' }];
    expect(candidates(only, { off: [], avoidDays: 7 }, [{ name: 'A', day: T }], T)).toEqual(only);
    expect(candidates(only, { off: ['light'], avoidDays: 0 }, [], T)).toEqual([]);
  });
});

describe('뽑기', () => {
  it('rng 값에 따라 정해진 메뉴, 끝값도 안전', () => {
    const list = ['a', 'b', 'c'];
    expect(pick(list, () => 0)).toBe('a');
    expect(pick(list, () => 0.5)).toBe('b');
    expect(pick(list, () => 0.9999999)).toBe('c');
    expect(pick([], () => 0)).toBeNull();
  });
  it('여러 번 뽑으면 모든 메뉴가 나온다(치우침 없음)', () => {
    const counts = new Map<string, number>();
    let s = 7;
    const rng = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
    for (let i = 0; i < 20000; i++) {
      const p = pick(BASE_MENUS, rng)!;
      counts.set(p.name, (counts.get(p.name) ?? 0) + 1);
    }
    expect(counts.size).toBe(BASE_MENUS.length);
    const expected = 20000 / BASE_MENUS.length;
    for (const v of counts.values()) expect(Math.abs(v - expected) / expected).toBeLessThan(0.3);
  });
  it('룰렛 칸에는 뽑힌 메뉴가 맨 앞, 중복 없음', () => {
    const w = BASE_MENUS[3];
    const slots = wheelSlots(BASE_MENUS, w, 8, () => 0.3);
    expect(slots[0]).toBe(w);
    expect(slots).toHaveLength(8);
    expect(new Set(slots.map((x) => x.name)).size).toBe(8);
    expect(wheelSlots([w], w, 8)).toEqual([w]);
  });
});

describe('기록과 나만의 메뉴', () => {
  it('같은 날 같은 메뉴는 한 번, 최대 30개', () => {
    let e = addEaten([], '라면', T);
    e = addEaten(e, '라면', T);
    expect(e).toHaveLength(1);
    for (let i = 0; i < 40; i++) e = addEaten(e, `m${i}`, T);
    expect(e).toHaveLength(30);
    expect(e[0].name).toBe('m39');
  });
  it('나만의 메뉴: 빈 이름·중복은 안 들어간다', () => {
    let m = addCustom(BASE_MENUS, ' 회사 앞 백반 ', 'korean');
    expect(m.at(-1)).toMatchObject({ name: '회사 앞 백반', custom: true });
    expect(addCustom(m, '회사 앞 백반', 'korean')).toBe(m);
    expect(addCustom(m, '   ', 'korean')).toBe(m);
  });
});
