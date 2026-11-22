import { describe, expect, it } from 'vitest';
// @ts-expect-error 타입 선언이 없는 검증용 라이브러리
import { Solar } from 'lunar-javascript';
import { GAN_HANJA, ZHI_HANJA, decodeCode, encodeCode, isValidDate, match, pillarsOf, MIN_SCORE, MAX_SCORE } from './saju';

const ZHI_ORDER = '子丑寅卯辰巳午未申酉戌亥';

function* everyDay(from: string, to: string) {
  const d = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  while (d <= end) {
    yield d.toISOString().slice(0, 10);
    d.setUTCDate(d.getUTCDate() + 1);
  }
}

describe('일주와 띠: 만세력 라이브러리와 전 날짜 대조', () => {
  it('1921-01-01 ~ 2039-12-31 모든 날짜의 일주가 일치한다', () => {
    let checked = 0;
    for (const date of everyDay('1921-01-01', '2039-12-31')) {
      const [y, m, d] = date.split('-').map(Number);
      const lunar = Solar.fromYmd(y, m, d).getLunar();
      const p = pillarsOf(date);
      expect(GAN_HANJA[p.gan] + ZHI_HANJA[p.zhi], date).toBe(lunar.getDayInGanZhi());
      // 입춘 당일은 시각에 따라 달라지므로 비교에서 뺀다
      if (!p.onLichun) expect(ZHI_ORDER[p.tti], date).toBe(lunar.getYearZhiByLiChun());
      checked++;
    }
    expect(checked).toBe(43464);
  });
});

describe('입력 검증', () => {
  it('없는 날짜와 범위 밖 날짜를 거른다', () => {
    expect(isValidDate('1995-02-30')).toBe(false);
    expect(isValidDate('1920-12-31')).toBe(false);
    expect(isValidDate('2040-01-01')).toBe(false);
    expect(isValidDate('1995-3-12')).toBe(false);
    expect(isValidDate('2000-02-29')).toBe(true);
    expect(() => pillarsOf('1900-01-01')).toThrow();
  });
});

describe('궁합 점수', () => {
  it('항상 52~99점 안이고, 순서를 바꿔도 같은 점수다', () => {
    const dates = [...everyDay('1990-01-01', '1990-03-01')];
    for (const a of dates) for (const b of dates.slice(0, 20)) {
      const pa = pillarsOf(a), pb = pillarsOf(b);
      const s = match(pa, pb).score;
      expect(s).toBeGreaterThanOrEqual(MIN_SCORE);
      expect(s).toBeLessThanOrEqual(MAX_SCORE);
      expect(match(pb, pa).score).toBe(s);
    }
  });
});

describe('초대 코드', () => {
  it('인코딩한 코드를 그대로 되돌린다', () => {
    for (const date of everyDay('1995-01-01', '1995-03-01')) {
      const p = pillarsOf(date);
      const q = decodeCode(encodeCode(p))!;
      expect([q.gan, q.zhi, q.tti, q.element]).toEqual([p.gan, p.zhi, p.tti, p.element]);
    }
  });
  it('잘못된 코드는 거절한다', () => {
    for (const bad of [null, '', 'zzz', '0c0', '1a0', '9b', '01234']) expect(decodeCode(bad as string)).toBeNull();
  });
});
