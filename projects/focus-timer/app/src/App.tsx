import { useEffect, useRef, useState } from 'react';
import { PRESETS, advance, clock, dayOf, hm, lastWeek, newTimer, pause, remaining, reset, restoreLog, restoreTimer, setPreset, skip, start, streak, type Log, type TimerState } from './lib/timer';
import { appLink, inToss, loadItem, saveItem, shareText } from './lib/toss';

const STORE_KEY = 'focus.v1';
const WD = ['일', '월', '화', '수', '목', '금', '토'];
const R = 120;
const CIRC = 2 * Math.PI * R;

export default function App() {
  const [timer, setTimer] = useState<TimerState>(() => newTimer());
  const [log, setLog] = useState<Log>({ minutes: {}, sessions: {} });
  const [goal, setGoal] = useState(4);
  const [loaded, setLoaded] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [toast, setToast] = useState('');
  const [status, setStatus] = useState('');
  const ref = useRef({ timer, log });
  useEffect(() => {
    ref.current = { timer, log };
  }, [timer, log]);

  useEffect(() => {
    loadItem(STORE_KEY).then((raw) => {
      try {
        const v = raw ? JSON.parse(raw) : null;
        if (v) {
          setTimer(restoreTimer(v.timer));
          setLog(restoreLog(v.log));
          if (Number.isInteger(v.goal) && v.goal >= 1 && v.goal <= 16) setGoal(v.goal);
        }
      } catch {
        /* 무시 */
      }
      setLoaded(true);
    });
  }, []);
  useEffect(() => {
    if (loaded) saveItem(STORE_KEY, JSON.stringify({ timer, log, goal }));
  }, [timer, log, goal, loaded]);

  // 0.25초마다 시계, 끝나면 다음 단계로
  useEffect(() => {
    const t = setInterval(() => {
      const n = Date.now();
      setNow(n);
      const r = advance(ref.current.timer, ref.current.log, n);
      if (r.finished) {
        setTimer(r.state);
        setLog(r.log);
        setToast(r.finished === 'focus' ? '집중 완료! 잠깐 쉬어요 ☕' : '휴식 끝! 다시 집중해 볼까요? 💪');
        try {
          navigator.vibrate?.(200);
        } catch {
          /* 진동 없음 */
        }
      }
    }, 250);
    return () => clearInterval(t);
  }, []);

  const today = dayOf(now);
  const left = remaining(timer, now);
  const total = (timer.phase === 'focus' ? timer.focusMin : timer.restMin) * 60_000;
  const frac = total ? 1 - left / total : 0;
  const running = timer.endsAt !== null;
  const todaySessions = log.sessions[today] ?? 0;
  const todayMin = log.minutes[today] ?? 0;
  const week = lastWeek(log, today);
  const maxMin = Math.max(60, ...week.map((w) => w.minutes));
  const st = streak(log, today);

  const share = async () => {
    const r = await shareText(`[집중 타이머] 오늘 ${hm(todayMin)} 집중했어요 🍅 ${st ? `${st}일 연속!` : ''}\n같이 집중해요: ${await appLink()}`);
    setStatus(r === 'shared' ? '' : r === 'copied' ? '문구를 복사했어요.' : '공유가 막혔어요.');
  };

  return (
    <main className={`app ${timer.phase}`}>
      <header className="top">
        <h1>집중 타이머</h1>
        <p>
          오늘 {todaySessions}회 · {hm(todayMin)} {st > 0 && `· 🔥 ${st}일 연속`}
        </p>
      </header>

      <section className="stage">
        <div className="ring" role="timer" aria-label={`${timer.phase === 'focus' ? '집중' : '휴식'} ${clock(left)} 남음`}>
          <svg viewBox="0 0 280 280" aria-hidden>
            <circle cx="140" cy="140" r={R} className="track" />
            <circle cx="140" cy="140" r={R} className="fill" strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - frac)} transform="rotate(-90 140 140)" />
          </svg>
          <div className="center">
            <small>{timer.phase === 'focus' ? '🍅 집중' : '☕ 휴식'}</small>
            <strong>{clock(left)}</strong>
          </div>
        </div>
        <div className="controls">
          {running ? (
            <button className="primary" type="button" onClick={() => setTimer((t) => pause(t, Date.now()))}>
              일시정지
            </button>
          ) : (
            <button className="primary" type="button" onClick={() => setTimer((t) => start(t, Date.now()))}>
              {left < total ? '이어서 시작' : timer.phase === 'focus' ? '집중 시작' : '휴식 시작'}
            </button>
          )}
          <div className="row">
            <button className="ghost" type="button" onClick={() => setTimer((t) => reset(t))}>
              처음부터
            </button>
            <button className="ghost" type="button" onClick={() => setTimer((t) => skip(t))}>
              {timer.phase === 'focus' ? '휴식으로 건너뛰기' : '휴식 건너뛰기'}
            </button>
          </div>
        </div>
        <div className="presets" role="radiogroup" aria-label="시간 설정">
          {PRESETS.map((p) => (
            <button key={p.label} type="button" role="radio" aria-checked={timer.focusMin === p.focus} className={timer.focusMin === p.focus ? 'on' : ''} disabled={running} onClick={() => setTimer(setPreset(p.focus, p.rest))}>
              {p.label}분
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="goal">
          <span>
            오늘 목표 <b>{todaySessions}</b> / {goal}회
          </span>
          <span className="stepper">
            <button type="button" aria-label="목표 줄이기" onClick={() => setGoal((g) => Math.max(1, g - 1))}>
              −
            </button>
            <button type="button" aria-label="목표 늘리기" onClick={() => setGoal((g) => Math.min(16, g + 1))}>
              +
            </button>
          </span>
        </div>
        <div className="tomatoes" aria-hidden>
          {Array.from({ length: goal }, (_, i) => (
            <span key={i} className={i < todaySessions ? 'on' : ''}>
              🍅
            </span>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>최근 7일</h2>
        <div className="bars" role="img" aria-label={`최근 7일 집중 분: ${week.map((w) => w.minutes).join(', ')}`}>
          {week.map((w) => {
            const [y, m, d] = w.day.split('-').map(Number);
            return (
              <div key={w.day} className={`bar ${w.day === today ? 'today' : ''}`}>
                <span className="n">{w.minutes ? `${w.minutes}` : ''}</span>
                <span className="col">
                  <i style={{ height: `${(w.minutes / maxMin) * 100}%` }} />
                </span>
                <span className="d">{WD[new Date(y, m - 1, d).getDay()]}</span>
              </div>
            );
          })}
        </div>
        <p className="note">막대 위 숫자는 분이에요. 끝까지 마친 집중만 기록돼요.</p>
      </section>

      <button className="ghost" type="button" onClick={share}>
        오늘 집중 시간 공유
      </button>
      <p className="note" role="status">
        {status}
      </p>
      <footer className="foot">앱을 닫아도 시간은 계속 흘러요. 다시 열면 남은 시간이 맞게 보여요. 기록은 이 기기에만 저장돼요.{!inToss() && ' 지금은 토스 밖 미리보기 화면이에요.'}</footer>

      {toast && (
        <div key={toast + todaySessions} className="toast" role="status" onAnimationEnd={() => setToast('')}>
          {toast}
        </div>
      )}
    </main>
  );
}
