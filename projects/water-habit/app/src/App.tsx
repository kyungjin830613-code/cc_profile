import { useEffect, useState } from 'react';
import { BottomSheet, Button, ListHeader, ListRow, Paragraph, Switch } from '@toss/tds-mobile';
import { CHECKS, CUP_SIZES, addCup, dayLog, dayOf, emptyData, goalStreak, lastWeek, ml, restore, toggleCheck, weekAverage, type CheckId, type Data } from './lib/water';
import { appLink, loadItem, saveItem, shareText } from './lib/toss';

const STORE_KEY = 'water.v1';
const WD = ['일', '월', '화', '수', '목', '금', '토'];

function Glass({ level }: { level: number }) {
  // level 0~1
  const h = Math.round(172 * Math.min(1, level));
  return (
    <svg viewBox="0 0 160 200" className="glass" aria-hidden>
      <defs>
        <clipPath id="g">
          <path d="M20 20h120l-14 165a10 10 0 0 1-10 9H44a10 10 0 0 1-10-9z" />
        </clipPath>
      </defs>
      <g clipPath="url(#g)">
        <rect x="0" y="0" width="160" height="200" fill="#eef7ff" />
        <rect className="water" x="0" y={194 - h} width="160" height={h + 6} fill="#4aa8ff" />
        <path className="wave" d={`M0 ${194 - h} q20 -8 40 0 t40 0 t40 0 t40 0 v12 h-160z`} fill="#7cc2ff" />
      </g>
      <path d="M20 20h120l-14 165a10 10 0 0 1-10 9H44a10 10 0 0 1-10-9z" fill="none" stroke="#1f3b57" strokeWidth="6" strokeLinejoin="round" />
    </svg>
  );
}

export default function App() {
  const [data, setData] = useState<Data>(emptyData);
  const [loaded, setLoaded] = useState(false);
  const [today, setToday] = useState(() => dayOf(new Date()));
  const [settings, setSettings] = useState(false);
  const [status, setStatus] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    loadItem(STORE_KEY).then((raw) => {
      setData(restore(raw));
      setLoaded(true);
    });
    const t = setInterval(() => setToday(dayOf(new Date())), 60_000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (loaded) saveItem(STORE_KEY, JSON.stringify(data));
  }, [data, loaded]);

  const log = dayLog(data, today);
  const streak = goalStreak(data, today);
  const week = lastWeek(data, today);
  const avg = weekAverage(data, today);
  const maxBar = Math.max(data.goal, ...week.map((w) => w.cups));

  const drink = () => {
    const before = log.cups;
    setData((d) => addCup(d, today));
    if (before + 1 === data.goal) setToast('오늘 목표 달성! 💧🎉');
    else if (before + 1 < data.goal) setToast(`${data.goal - before - 1}잔 남았어요`);
  };

  const share = async () => {
    const r = await shareText(`[물 한 잔 습관] 오늘 물 ${log.cups}잔(${ml(log.cups, data.cupMl)}) 마셨어요 💧 목표 연속 ${streak}일째!\n같이 해요: ${await appLink()}`);
    setStatus(r === 'shared' ? '' : r === 'copied' ? '문구를 복사했어요.' : '공유가 막혔어요.');
  };

  return (
    <div className="page">
      <div className="head">
        <div>
          <h1>물 한 잔 습관</h1>
          <Paragraph.Text typography="t6" color="var(--sub)">
            {`${streak > 0 ? `목표 달성 ${streak}일 연속 🔥` : '오늘도 한 잔부터 시작해요'} · 7일 평균 ${avg}잔`}
          </Paragraph.Text>
        </div>
        <Button size="small" variant="weak" color="dark" onClick={() => setSettings(true)}>
          설정
        </Button>
      </div>

      <section className="hero">
        <Glass level={log.cups / data.goal} />
        <div className="count">
          <strong>
            {log.cups}
            <small>/{data.goal}잔</small>
          </strong>
          <Paragraph.Text typography="t6" color="var(--sub2)">
            {ml(log.cups, data.cupMl)}
          </Paragraph.Text>
          <div className="drink">
            <Button display="block" size="large" onClick={drink}>
              한 잔 마셨어요
            </Button>
            <Button display="block" size="small" variant="weak" color="dark" onClick={() => setData((d) => addCup(d, today, -1))} disabled={log.cups === 0}>
              한 잔 취소
            </Button>
          </div>
        </div>
      </section>

      {data.enabled.length > 0 && (
        <>
          <ListHeader title={<ListHeader.TitleParagraph typography="t5" fontWeight="bold">오늘의 건강 체크</ListHeader.TitleParagraph>} />
          <ul className="list">
            {CHECKS.filter((c) => data.enabled.includes(c.id)).map((c) => {
              const on = log.checks.includes(c.id as CheckId);
              return (
                <ListRow
                  key={c.id}
                  left={<span className="row-emoji">{c.emoji}</span>}
                  contents={<ListRow.Texts type="1RowTypeA" top={c.label} />}
                  right={<Switch checked={on} onChange={() => setData((d) => toggleCheck(d, today, c.id))} aria-label={c.label} />}
                />
              );
            })}
          </ul>
        </>
      )}

      <ListHeader title={<ListHeader.TitleParagraph typography="t5" fontWeight="bold">최근 7일</ListHeader.TitleParagraph>} />
      <div className="card">
        <div className="bars" role="img" aria-label={`최근 7일 물 마신 잔 수: ${week.map((w) => w.cups).join(', ')}, 목표 ${data.goal}잔`} style={{ ['--goal' as string]: `${(data.goal / maxBar) * 100}%` }}>
          {week.map((w) => {
            const [y, m, d] = w.day.split('-').map(Number);
            return (
              <div key={w.day} className={`bar ${w.reached ? 'ok' : ''} ${w.day === today ? 'today' : ''}`}>
                <span className="n">{w.cups}</span>
                <span className="col">
                  <i style={{ height: `${(w.cups / maxBar) * 100}%` }} />
                </span>
                <span className="d">{WD[new Date(y, m - 1, d).getDay()]}</span>
              </div>
            );
          })}
        </div>
        <Paragraph.Text typography="t7" color="var(--sub)">{`점선은 하루 목표(${data.goal}잔)예요.`}</Paragraph.Text>
      </div>

      <div className="actions">
        <Button display="block" variant="weak" onClick={share}>
          친구에게 자랑하기
        </Button>
      </div>
      <p className="note" role="status">
        {status}
      </p>
      <p className="foot">생활 습관 기록용이에요. 필요한 물의 양은 건강 상태에 따라 다르니 의료 조언이 필요하면 전문가와 상담하세요. 기록은 이 기기에만 저장돼요.</p>

      <BottomSheet open={settings} onClose={() => setSettings(false)} header={<BottomSheet.Header>설정</BottomSheet.Header>} cta={<BottomSheet.CTA onClick={() => setSettings(false)}>완료</BottomSheet.CTA>}>
        <div className="sheet">
          <div className="setrow">
            <span>하루 목표</span>
            <span className="stepper">
              <Button size="small" variant="weak" color="dark" aria-label="목표 한 잔 줄이기" onClick={() => setData((d) => ({ ...d, goal: Math.max(1, d.goal - 1) }))}>
                −
              </Button>
              <b>{data.goal}잔</b>
              <Button size="small" variant="weak" color="dark" aria-label="목표 한 잔 늘리기" onClick={() => setData((d) => ({ ...d, goal: Math.min(20, d.goal + 1) }))}>
                +
              </Button>
            </span>
          </div>
          <p className="label">한 컵 용량</p>
          <div className="chips">
            {CUP_SIZES.map((s) => (
              <Button key={s} size="small" variant={data.cupMl === s ? 'fill' : 'weak'} color={data.cupMl === s ? 'primary' : 'dark'} onClick={() => setData((d) => ({ ...d, cupMl: s }))}>
                {`${s}ml`}
              </Button>
            ))}
          </div>
          <p className="label">같이 챙길 건강 습관</p>
          <div className="chips">
            {CHECKS.map((c) => {
              const on = data.enabled.includes(c.id);
              return (
                <Button key={c.id} size="small" variant={on ? 'fill' : 'weak'} color={on ? 'primary' : 'dark'} onClick={() => setData((d) => ({ ...d, enabled: on ? d.enabled.filter((x) => x !== c.id) : [...d.enabled, c.id] }))}>
                  {`${c.emoji} ${c.label}`}
                </Button>
              );
            })}
          </div>
        </div>
      </BottomSheet>

      {toast && (
        <div key={toast + log.cups} className="toast" role="status" onAnimationEnd={() => setToast('')}>
          {toast}
        </div>
      )}
    </div>
  );
}
