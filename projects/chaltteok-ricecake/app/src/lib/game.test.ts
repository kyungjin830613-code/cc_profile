import { describe, expect, it } from 'vitest';
import {
  CAKES,
  HELPERS,
  OFFLINE_MAX_SEC,
  applyOffline,
  buyHelper,
  buyTap,
  canCheckIn,
  checkIn,
  fmt,
  fmtDuration,
  helperCost,
  multiplier,
  newGame,
  perSec,
  restore,
  tap,
  tapValue,
  tick,
  unlockedCakes,
} from './game';

const T0 = new Date(2026, 10, 23, 9, 0, 0).getTime();
const HOUR = 3600_000;

describe('기본 규칙', () => {
  it('새 게임은 0개에서 시작하고 한 번 누르면 1개', () => {
    const s = newGame(T0);
    expect(tapValue(s)).toBe(1);
    expect(tap(s).coins).toBe(1);
    expect(tap(s).total).toBe(1);
  });

  it('돈이 모자라면 살 수 없고, 사면 가격만큼 빠진다', () => {
    const s = newGame(T0);
    expect(buyHelper(s, 'apprentice')).toBeNull();
    const rich = { ...s, coins: 100 };
    const after = buyHelper(rich, 'apprentice')!;
    expect(after.coins).toBe(100 - 15);
    expect(after.helpers.apprentice).toBe(1);
    expect(perSec(after)).toBe(1);
    expect(buyHelper(rich, 'nope')).toBeNull();
  });

  it('도우미 가격은 살 때마다 15%씩 오른다', () => {
    const h = HELPERS[0];
    expect(helperCost(h, 0)).toBe(15);
    expect(helperCost(h, 1)).toBe(18);
    expect(helperCost(h, 10)).toBe(Math.ceil(15 * 1.15 ** 10));
  });

  it('절구 강화로 한 번에 버는 떡이 늘어난다', () => {
    const s = { ...newGame(T0), coins: 30 };
    const up = buyTap(s)!;
    expect(up.coins).toBe(0);
    expect(tapValue(up)).toBe(2);
    expect(buyTap(up)).toBeNull();
  });

  it('도우미 가격은 단계마다 커지고 생산량도 커진다', () => {
    for (let i = 1; i < HELPERS.length; i++) {
      expect(HELPERS[i].baseCost).toBeGreaterThan(HELPERS[i - 1].baseCost);
      expect(HELPERS[i].perSec).toBeGreaterThan(HELPERS[i - 1].perSec);
    }
  });
});

describe('떡 메뉴 해금', () => {
  it('누적 판매량에 따라 열리고, 하나 열릴 때마다 10%씩 더 번다', () => {
    expect(unlockedCakes(0)).toBe(1);
    expect(unlockedCakes(199)).toBe(1);
    expect(unlockedCakes(200)).toBe(2);
    expect(unlockedCakes(1e12)).toBe(CAKES.length);
    expect(multiplier({ ...newGame(T0), total: 2_000 })).toBeCloseTo(1.2);
  });
  it('해금 기준은 점점 커진다', () => {
    for (let i = 1; i < CAKES.length; i++) expect(CAKES[i].unlockAt).toBeGreaterThan(CAKES[i - 1].unlockAt);
  });
});

describe('시간 흐름', () => {
  const s = { ...newGame(T0), helpers: { apprentice: 10 } }; // 초당 10개

  it('켜 둔 동안은 초당 생산량만큼 쌓인다', () => {
    expect(tick(s, T0 + 5000).coins).toBeCloseTo(50);
  });

  it('시계가 뒤로 가면 아무것도 안 쌓인다', () => {
    const back = tick(s, T0 - HOUR);
    expect(back.coins).toBe(0);
    expect(back.lastTick).toBe(T0);
  });

  it('비운 동안은 절반 속도, 최대 8시간까지만', () => {
    const one = applyOffline(s, T0 + HOUR);
    expect(one.amount).toBe(10 * 3600 * 0.5);
    expect(one.state.lastTick).toBe(T0 + HOUR);
    const long = applyOffline(s, T0 + 48 * HOUR);
    expect(long.sec).toBe(OFFLINE_MAX_SEC);
    expect(long.amount).toBe(10 * OFFLINE_MAX_SEC * 0.5);
  });
});

describe('출석', () => {
  it('하루 한 번만, 이어서 오면 연속 일수가 오른다', () => {
    const s = newGame(T0);
    const d1 = checkIn(s, T0)!;
    expect(d1.streak).toBe(1);
    expect(d1.reward).toBe(50);
    expect(canCheckIn(d1.state, T0 + HOUR)).toBe(false);
    expect(checkIn(d1.state, T0 + HOUR)).toBeNull();
    const d2 = checkIn(d1.state, T0 + 24 * HOUR)!;
    expect(d2.streak).toBe(2);
    expect(d2.reward).toBe(100);
  });

  it('하루 빠지면 1일부터 다시', () => {
    const d1 = checkIn(newGame(T0), T0)!;
    const d3 = checkIn(d1.state, T0 + 48 * HOUR)!;
    expect(d3.streak).toBe(1);
  });

  it('밤 11시 출석 후 다음 날 새벽 1시도 다음 날로 친다', () => {
    const night = new Date(2026, 10, 23, 23, 0).getTime();
    const d1 = checkIn(newGame(night), night)!;
    const d2 = checkIn(d1.state, night + 2 * HOUR)!;
    expect(d2.streak).toBe(2);
  });

  it('월말에서 월초로 넘어가도 연속으로 친다', () => {
    const end = new Date(2026, 10, 30, 12).getTime();
    const d1 = checkIn(newGame(end), end)!;
    expect(checkIn(d1.state, new Date(2026, 11, 1, 12).getTime())!.streak).toBe(2);
  });
});

describe('저장값 복원', () => {
  it('정상 저장값은 그대로 되살린다', () => {
    const s = { ...newGame(T0), coins: 123, total: 456, helpers: { apprentice: 2 }, lastCheckIn: '2026-11-23', streak: 3 };
    expect(restore(JSON.stringify(s))).toEqual(s);
  });
  it('깨지거나 이상한 값은 버린다', () => {
    for (const bad of [null, '', '{', '{"version":2}', JSON.stringify({ ...newGame(T0), coins: -1 }), JSON.stringify({ ...newGame(T0), helpers: { apprentice: 1.5 } })])
      expect(restore(bad)).toBeNull();
  });
  it('모르는 도우미 키는 무시한다', () => {
    const s = { ...newGame(T0), helpers: { apprentice: 1, hacker: 999 } };
    expect(restore(JSON.stringify(s))!.helpers).toEqual({ apprentice: 1 });
  });
});

describe('숫자 표시', () => {
  it('만·억·조 단위로 줄여 보여 준다', () => {
    expect(fmt(0)).toBe('0');
    expect(fmt(1234.9)).toBe('1,234');
    expect(fmt(12_345)).toBe('1.2만');
    expect(fmt(3_000_000)).toBe('300만');
    expect(fmt(1_234_567)).toBe('123만');
    expect(fmt(300_000_000)).toBe('3억');
    expect(fmt(2.5e12)).toBe('2.5조');
  });
  it('시간을 읽기 쉽게', () => {
    expect(fmtDuration(30)).toBe('1분 미만');
    expect(fmtDuration(600)).toBe('10분');
    expect(fmtDuration(3600 * 3 + 720)).toBe('3시간 12분');
    expect(fmtDuration(7200)).toBe('2시간');
  });
});
