import { describe, expect, it } from 'vitest';
// @ts-expect-error 타입 선언이 없는 검증용 라이브러리
import { Lunar, Solar } from 'lunar-javascript';
import { GAN_HANJA, ZHI_HANJA, pillarsOf } from './saju';
import { MONTHS, isSamjae, monthFortunes, tenGod, ttiRelation, yearFortune } from './newyear';

const JIEQI = ['立春', '惊蛰', '清明', '立夏', '芒种', '小暑', '立秋', '白露', '寒露', '立冬', '大雪', '小寒'];

describe('2027 세운과 월주', () => {
  it('2027년은 丁未년이다', () => {
    expect(Solar.fromYmd(2027, 6, 1).getLunar().getYearInGanZhiByLiChun()).toBe('丁未');
  });
  it('12달 월주와 시작 절기 날짜가 만세력과 같다', () => {
    MONTHS.forEach((m, i) => {
      const [y, mo] = m.start.split('-').map(Number);
      const mid = Solar.fromYmd(y, mo, 20).getLunar().getMonthInGanZhiExact();
      expect(GAN_HANJA[m.gan] + ZHI_HANJA[m.zhi], m.label).toBe(mid);
      const table = Lunar.fromYmd(i === 11 ? 2028 : 2027, 1, 1).getJieQiTable();
      // 라이브러리는 중국 표준시(UTC+8). 한국(UTC+9)으로 한 시간 더한 날짜와 비교한다
      const t = table[JIEQI[i]];
      const kst = new Date(Date.UTC(t.getYear(), t.getMonth() - 1, t.getDay(), t.getHour() + 1 - 9, t.getMinute()));
      const kstDate = new Date(kst.getTime() + 9 * 3600e3).toISOString().slice(0, 10);
      expect(kstDate, m.label).toBe(m.start);
    });
  });
});

describe('십신', () => {
  it('교과서 예시와 같다', () => {
    // 甲(0) 기준: 甲 비견, 乙 겁재, 丙 식신, 丁 상관, 戊 편재, 己 정재, 庚 편관, 辛 정관, 壬 편인, 癸 정인
    expect([...Array(10).keys()].map((o) => tenGod(0, o))).toEqual(['비견', '겁재', '식신', '상관', '편재', '정재', '편관', '정관', '편인', '정인']);
    // 壬(8) 일간에게 丁(3)은 정재
    expect(tenGod(8, 3)).toBe('정재');
    // 丁(3) 일간에게 丁은 비견, 癸(9) 일간에게 丁은 편재
    expect(tenGod(3, 3)).toBe('비견');
    expect(tenGod(9, 3)).toBe('편재');
  });
});

describe('띠와 삼재', () => {
  it('未와의 관계', () => {
    expect(ttiRelation(6)).toBe('liuhe');
    expect(ttiRelation(11)).toBe('sanhe');
    expect(ttiRelation(3)).toBe('sanhe');
    expect(ttiRelation(1)).toBe('chong');
    expect(ttiRelation(0)).toBe('hai');
    expect(ttiRelation(10)).toBe('xing');
    expect(ttiRelation(7)).toBe('self');
    expect(ttiRelation(2)).toBe('none');
  });
  it('2027 삼재는 돼지·토끼·양띠', () => {
    expect([...Array(12).keys()].filter(isSamjae)).toEqual([3, 7, 11]);
  });
});

describe('별점', () => {
  it('모든 일주에서 별점은 1~5이고 최고·조심 달이 정해진다', () => {
    const d = new Date('1980-01-01T00:00:00Z');
    for (let i = 0; i < 60; i++) {
      const p = pillarsOf(d.toISOString().slice(0, 10));
      for (const m of monthFortunes(p)) {
        expect(m.stars).toBeGreaterThanOrEqual(1);
        expect(m.stars).toBeLessThanOrEqual(5);
      }
      const y = yearFortune(p);
      expect(y.best.stars).toBeGreaterThanOrEqual(y.careful.stars);
      d.setUTCDate(d.getUTCDate() + 1);
    }
  });
});
