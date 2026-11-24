import { useEffect, useMemo, useState } from 'react';
import { Button, ListHeader, Paragraph, ProgressBar, SegmentedControl, Switch } from '@toss/tds-mobile';
import {
  WEEKS,
  bestStreak,
  countInMonth,
  currentStreak,
  dayOf,
  emptyData,
  goalTotal,
  monthGrid,
  nextBadge,
  restore,
  savedTotal,
  toggle,
  weekAmount,
  weekNow,
  won,
  type SaveData,
} from './lib/challenge';
import { appLink, inToss, loadItem, saveItem, shareText } from './lib/toss';

const STORE_KEY = 'challenge.v1';
type Tab = 'nospend' | 'weekly';
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export default function App() {
  const [data, setData] = useState<SaveData>(emptyData);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState<Tab>('nospend');
  const [today, setToday] = useState(() => dayOf(new Date()));
  const [view, setView] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() + 1 };
  });
  const [base, setBase] = useState(1000);
  const [reverse, setReverse] = useState(false);
  const [status, setStatus] = useState('');
  const [celebrate, setCelebrate] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    loadItem(STORE_KEY).then((raw) => {
      setData(restore(raw));
      setLoaded(true);
    });
    // 자정이 지나면 날짜를 바꾼다
    const t = setInterval(() => setToday(dayOf(new Date())), 60_000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (loaded) saveItem(STORE_KEY, JSON.stringify(data));
  }, [data, loaded]);

  const days = useMemo(() => new Set(data.noSpend), [data.noSpend]);
  const streak = currentStreak(days, today);
  const best = bestStreak(days);
  const [ty, tm] = today.split('-').map(Number);
  const monthCount = countInMonth(days, ty, tm);
  const badge = nextBadge(streak);
  const stampedToday = days.has(today);

  const setDays = (next: Set<string>) => setData((d) => ({ ...d, noSpend: [...next].sort() }));

  const stampToday = () => {
    const next = toggle(days, today, today);
    setDays(next);
    const s = currentStreak(next, today);
    setCelebrate(s >= 2 ? `${s}일 연속 무지출! 🔥` : '오늘 무지출 성공! 🎉');
  };

  const share = async () => {
    const msg = tab === 'nospend' ? `[무지출 도장판] 이번 달 무지출 ${monthCount}일째, ${streak}일 연속 도전 중! 💪` : `[52주 저축 챌린지] 지금까지 ${won(savedTotal(data.weekly!.base, new Set(data.weekly!.done), data.weekly!.reverse))} 모았어요! 🐷`;
    const r = await shareText(`${msg}\n같이 해요: ${await appLink()}`);
    setStatus(r === 'shared' ? '' : r === 'copied' ? '문구를 복사했어요.' : '공유가 막혔어요.');
  };

  const grid = monthGrid(view.y, view.m);
  const moveMonth = (n: number) =>
    setView((v) => {
      const d = new Date(v.y, v.m - 1 + n, 1);
      return { y: d.getFullYear(), m: d.getMonth() + 1 };
    });
  const isThisMonth = view.y === ty && view.m === tm;

  const w = data.weekly;
  const wNow = w ? weekNow(w.start, today) : 1;
  const wDone = new Set(w?.done ?? []);
  const wSaved = w ? savedTotal(w.base, wDone, w.reverse) : 0;
  const wGoal = w ? goalTotal(w.base) : 0;

  const toggleWeek = (n: number) => {
    if (!w || n > wNow) return;
    const next = new Set(wDone);
    if (next.has(n)) next.delete(n);
    else next.add(n);
    setData((d) => ({ ...d, weekly: { ...d.weekly!, done: [...next].sort((a, b) => a - b) } }));
  };

  return (
    <div className="page">
      <div className="head">
        <h1>무지출 도장판</h1>
        <Paragraph.Text typography="t6" color="var(--sub)">
          돈 안 쓴 날엔 도장 쾅! 52주 저축까지 함께해요
        </Paragraph.Text>
      </div>

      <div className="pad">
        <SegmentedControl value={tab} onChange={(v: string) => setTab(v as Tab)}>
          <SegmentedControl.Item value="nospend">무지출 달력</SegmentedControl.Item>
          <SegmentedControl.Item value="weekly">52주 저축</SegmentedControl.Item>
        </SegmentedControl>
      </div>

      {tab === 'nospend' && (
        <>
          <section className="hero">
            <span className="hero-emoji" aria-hidden>
              {streak >= 3 ? '🔥' : '🌱'}
            </span>
            <div className="hero-text">
              <Paragraph.Text typography="t6" color="var(--sub2)">
                연속 무지출
              </Paragraph.Text>
              <strong className="big-num">{streak}일</strong>
              <Paragraph.Text typography="t7" color="var(--sub)">
                {`최장 ${best}일 · ${badge ? `다음 배지까지 ${badge - streak}일` : '모든 배지 달성 🏆'}`}
              </Paragraph.Text>
            </div>
          </section>

          <div className="actions">
            <Button display="block" size="xlarge" variant={stampedToday ? 'weak' : 'fill'} onClick={stampToday}>
              {stampedToday ? '오늘은 무지출 ✅ (다시 누르면 취소)' : '오늘 돈 안 썼어요, 도장 찍기'}
            </Button>
          </div>

          <section className="card">
            <div className="goal">
              <span>
                이번 달 목표 <b>{monthCount}</b> / {data.monthlyGoal}일
              </span>
              <span className="stepper">
                <Button size="small" variant="weak" color="dark" aria-label="목표 하루 줄이기" onClick={() => setData((d) => ({ ...d, monthlyGoal: Math.max(1, d.monthlyGoal - 1) }))}>
                  −
                </Button>
                <Button size="small" variant="weak" color="dark" aria-label="목표 하루 늘리기" onClick={() => setData((d) => ({ ...d, monthlyGoal: Math.min(31, d.monthlyGoal + 1) }))}>
                  +
                </Button>
              </span>
            </div>
            <ProgressBar progress={Math.min(1, monthCount / data.monthlyGoal)} size="bold" animate />
          </section>

          <section className="card">
            <div className="cal-head">
              <button type="button" className="nav" aria-label="이전 달" onClick={() => moveMonth(-1)}>
                ‹
              </button>
              <b>
                {view.y}년 {view.m}월
              </b>
              <button type="button" className="nav" aria-label="다음 달" onClick={() => moveMonth(1)} disabled={isThisMonth}>
                ›
              </button>
            </div>
            <div className="cal">
              {WEEKDAYS.map((d) => (
                <span key={d} className="wd">
                  {d}
                </span>
              ))}
              {grid.map((d, i) =>
                d ? (
                  <button
                    key={d}
                    type="button"
                    className={`day${days.has(d) ? ' on' : ''}${d === today ? ' today' : ''}`}
                    disabled={d > today}
                    aria-pressed={days.has(d)}
                    aria-label={`${Number(d.slice(8))}일 ${days.has(d) ? '무지출' : ''}`}
                    onClick={() => setDays(toggle(days, d, today))}
                  >
                    <span>{Number(d.slice(8))}</span>
                    {days.has(d) && <em aria-hidden>쾅</em>}
                  </button>
                ) : (
                  <span key={`e${i}`} />
                ),
              )}
            </div>
            <Paragraph.Text typography="t7" color="var(--sub)">
              지난날도 눌러서 도장을 찍거나 지울 수 있어요.
            </Paragraph.Text>
          </section>
        </>
      )}

      {tab === 'weekly' && !w && (
        <>
          <ListHeader title={<ListHeader.TitleParagraph typography="t5" fontWeight="bold">52주 저축 챌린지</ListHeader.TitleParagraph>} />
          <section className="card">
            <Paragraph.Text typography="t6" color="var(--sub2)">
              1주 차엔 1천 원, 2주 차엔 2천 원… 매주 조금씩 늘려 넣으면 1년 뒤 목돈이 돼요.
            </Paragraph.Text>
            <p className="label">한 주에 늘릴 금액</p>
            <div className="chips">
              {[1000, 5000, 10000].map((b) => (
                <Button key={b} size="medium" variant={base === b ? 'fill' : 'weak'} color={base === b ? 'primary' : 'dark'} onClick={() => setBase(b)}>
                  {won(b)}
                </Button>
              ))}
            </div>
            <div className="setrow">
              <span>거꾸로 하기 (처음에 크게)</span>
              <Switch checked={reverse} onChange={() => setReverse((r) => !r)} aria-label="거꾸로 하기" />
            </div>
            <table className="kv">
              <tbody>
                <tr>
                  <th>1주 차</th>
                  <td>{won(weekAmount(base, 1, reverse))}</td>
                </tr>
                <tr>
                  <th>52주 차</th>
                  <td>{won(weekAmount(base, 52, reverse))}</td>
                </tr>
                <tr className="sum">
                  <th>1년 뒤 모이는 돈</th>
                  <td>{won(goalTotal(base))}</td>
                </tr>
              </tbody>
            </table>
          </section>
          <div className="actions">
            <Button display="block" size="large" onClick={() => setData((d) => ({ ...d, weekly: { base, reverse, start: today, done: [] } }))}>
              오늘부터 시작하기
            </Button>
          </div>
          <p className="note">실제 돈은 내 통장이나 저금통에 직접 넣고, 여기서는 기록만 해요.</p>
        </>
      )}

      {tab === 'weekly' && w && (
        <>
          <section className="hero">
            <span className="hero-emoji" aria-hidden>
              🐷
            </span>
            <div className="hero-text">
              <Paragraph.Text typography="t6" color="var(--sub2)">
                지금까지 모은 돈
              </Paragraph.Text>
              <strong className="big-num">{won(wSaved)}</strong>
              <Paragraph.Text typography="t7" color="var(--sub)">{`목표 ${won(wGoal)} · ${Math.floor((wSaved / wGoal) * 100)}% 달성`}</Paragraph.Text>
            </div>
          </section>
          <div className="actions">
            <Button display="block" size="xlarge" variant={wDone.has(wNow) ? 'weak' : 'fill'} onClick={() => toggleWeek(wNow)}>
              {wDone.has(wNow) ? `${wNow}주 차 ${won(weekAmount(w.base, wNow, w.reverse))} 넣었어요 ✅` : `${wNow}주 차 ${won(weekAmount(w.base, wNow, w.reverse))} 넣고 체크`}
            </Button>
          </div>
          <ListHeader title={<ListHeader.TitleParagraph typography="t5" fontWeight="bold">52주 도장판</ListHeader.TitleParagraph>} />
          <section className="card">
            <div className="weeks">
              {Array.from({ length: WEEKS }, (_, i) => i + 1).map((n) => (
                <button key={n} type="button" className={`wk${wDone.has(n) ? ' on' : ''}${n === wNow ? ' now' : ''}`} disabled={n > wNow} aria-pressed={wDone.has(n)} aria-label={`${n}주 차 ${won(weekAmount(w.base, n, w.reverse))}`} onClick={() => toggleWeek(n)}>
                  {n}
                </button>
              ))}
            </div>
            <Paragraph.Text typography="t7" color="var(--sub)">{`밀린 주도 눌러서 채울 수 있어요. 시작일 ${w.start}`}</Paragraph.Text>
          </section>
          <div className="actions">
            {!confirmReset ? (
              <Button display="block" size="medium" variant="weak" color="dark" onClick={() => setConfirmReset(true)}>
                처음부터 다시 하기
              </Button>
            ) : (
              <div className="row2">
                <Button
                  display="block"
                  color="danger"
                  onClick={() => {
                    setData((d) => ({ ...d, weekly: null }));
                    setConfirmReset(false);
                  }}
                >
                  기록 지우고 다시
                </Button>
                <Button display="block" variant="weak" color="dark" onClick={() => setConfirmReset(false)}>
                  취소
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      {(tab === 'nospend' || w) && (
        <div className="actions">
          <Button display="block" variant="weak" onClick={share}>
            친구에게 자랑하기
          </Button>
        </div>
      )}
      <p className="note" role="status">
        {status}
      </p>

      <p className="foot">기록은 이 기기에만 저장되고 서버로 보내지 않아요. 실제 돈은 움직이지 않는 습관 기록장이에요.{!inToss() && ' 지금은 토스 밖 미리보기 화면이에요.'}</p>

      {celebrate && (
        <div className="toast" role="status" onAnimationEnd={() => setCelebrate('')}>
          {celebrate}
        </div>
      )}
    </div>
  );
}
