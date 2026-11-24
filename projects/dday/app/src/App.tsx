import { useEffect, useState } from 'react';
import { ddayLabel, dayOf, diffDays, progress, restore, sinceCount, sortEvents, upcomingMilestones, weekdayKo, type Event, type Kind } from './lib/dday';
import { appLink, inToss, loadItem, saveItem, shareText } from './lib/toss';

const STORE_KEY = 'dday.v1';
const EMOJIS = ['📚', '💕', '🪖', '👶', '✈️', '🎂', '💼', '🎉'];
const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

interface Draft {
  id: string | null;
  title: string;
  date: string;
  kind: Kind;
  emoji: string;
  start: string;
  pinned: boolean;
}
const blank = (today: string): Draft => ({ id: null, title: '', date: today, kind: 'countdown', emoji: '📚', start: '', pinned: false });

function nextOn(today: string, mmdd: string): string {
  const y = Number(today.slice(0, 4));
  const d = `${y}-${mmdd}`;
  return d >= today ? d : `${y + 1}-${mmdd}`;
}

export default function App() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [today, setToday] = useState(() => dayOf(new Date()));
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    loadItem(STORE_KEY).then((raw) => {
      setEvents(restore(raw));
      setLoaded(true);
    });
    const t = setInterval(() => setToday(dayOf(new Date())), 60_000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (loaded) saveItem(STORE_KEY, JSON.stringify(events));
  }, [events, loaded]);

  const sorted = sortEvents(events, today);
  const hero = sorted[0];
  const rest = sorted.slice(1);

  const save = () => {
    if (!draft) return;
    const title = draft.title.trim().slice(0, 20);
    if (!title) return setError('이름을 적어 주세요.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date)) return setError('날짜를 골라 주세요.');
    if (draft.kind === 'countdown' && draft.start && draft.start > draft.date) return setError('시작일은 목표일보다 앞이어야 해요.');
    const ev: Event = { id: draft.id ?? newId(), title, date: draft.date, kind: draft.kind, emoji: draft.emoji, ...(draft.kind === 'countdown' && draft.start ? { start: draft.start } : {}), ...(draft.pinned ? { pinned: true } : {}) };
    setEvents((l) => {
      const base = ev.pinned ? l.map((x) => ({ ...x, pinned: undefined })) : l;
      return draft.id ? base.map((x) => (x.id === draft.id ? ev : x)) : [...base, ev];
    });
    setDraft(null);
    setError('');
  };

  const quick = (title: string, date: string, emoji: string) => setEvents((l) => (l.some((x) => x.title === title && x.date === date) ? l : [...l, { id: newId(), title, date, kind: 'countdown', emoji }]));

  const label = (e: Event) => (e.kind === 'countdown' ? ddayLabel(e.date, today) : `${sinceCount(e.date, today).toLocaleString('ko-KR')}일째`);

  const share = async (e: Event) => {
    const text = e.kind === 'countdown' ? `[디데이] ${e.emoji} ${e.title}까지 ${ddayLabel(e.date, today)}!` : `[디데이] ${e.emoji} ${e.title} 오늘로 ${sinceCount(e.date, today).toLocaleString('ko-KR')}일째 💕`;
    const r = await shareText(`${text}\n나도 디데이 만들기: ${await appLink()}`);
    setStatus(r === 'shared' ? '' : r === 'copied' ? '문구를 복사했어요.' : '공유가 막혔어요.');
  };

  const edit = (e: Event) => setDraft({ id: e.id, title: e.title, date: e.date, kind: e.kind, emoji: e.emoji, start: e.start ?? '', pinned: !!e.pinned });

  return (
    <main className="app">
      <header className="top">
        <h1>디데이 모아보기</h1>
        <p>
          오늘은 {today.replace(/-/g, '.')} ({weekdayKo(today)})
        </p>
      </header>

      {hero ? (
        <section className="hero">
          <button type="button" className="hero-body" onClick={() => edit(hero)} aria-label={`${hero.title} 고치기`}>
            <span className="emoji" aria-hidden>
              {hero.emoji}
            </span>
            <span className="title">{hero.title}</span>
            <strong>{label(hero)}</strong>
            <span className="date">
              {hero.date.replace(/-/g, '.')} ({weekdayKo(hero.date)}){hero.kind === 'since' ? ' 부터' : ''}
            </span>
          </button>
          {hero.kind === 'countdown' && hero.start && (
            <div className="prog">
              <span className="bar">
                <i style={{ width: `${progress(hero.start, hero.date, today)}%` }} />
              </span>
              <small>{progress(hero.start, hero.date, today)}% 지나왔어요</small>
            </div>
          )}
          {hero.kind === 'since' && (
            <ul className="miles">
              {upcomingMilestones(hero.date, today).map((m) => (
                <li key={m.label}>
                  <b>{m.label}</b> {m.date.replace(/-/g, '.')} <span>{m.left === 0 ? '오늘!' : `D-${m.left}`}</span>
                </li>
              ))}
            </ul>
          )}
          <button className="share" type="button" onClick={() => share(hero)}>
            공유하기
          </button>
        </section>
      ) : (
        <section className="card empty">
          <p>첫 디데이를 만들어 볼까요? 아래에서 바로 골라도 돼요.</p>
        </section>
      )}

      {rest.length > 0 && (
        <ul className="list">
          {rest.map((e) => {
            const past = e.kind === 'countdown' && diffDays(today, e.date) < 0;
            return (
              <li key={e.id}>
                <button type="button" className={`item ${past ? 'past' : ''}`} onClick={() => edit(e)}>
                  <span className="emoji" aria-hidden>
                    {e.emoji}
                  </span>
                  <span className="who">
                    <b>{e.title}</b>
                    <small>
                      {e.date.replace(/-/g, '.')} ({weekdayKo(e.date)})
                    </small>
                  </span>
                  <span className="d">{label(e)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="quick" aria-label="빠른 추가">
        {[
          ['설날', '2027-02-06', '🧧'],
          ['크리스마스', nextOn(today, '12-25'), '🎄'],
          ['새해', nextOn(today, '01-01'), '🎉'],
        ]
          .filter(([t, d]) => !events.some((x) => x.title === t && x.date === d))
          .map(([t, d, em]) => (
            <button key={t} type="button" onClick={() => quick(t, d, em)}>
              {em} {t} 추가
            </button>
          ))}
      </div>

      <button className="primary" type="button" onClick={() => setDraft(blank(today))}>
        + 디데이 추가
      </button>
      <p className="note" role="status">
        {status}
      </p>
      <footer className="foot">디데이는 이 기기에만 저장돼요.{!inToss() && ' 지금은 토스 밖 미리보기 화면이에요.'}</footer>

      {draft && (
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="d-title" onClick={() => setDraft(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <h2 id="d-title">{draft.id ? '디데이 고치기' : '디데이 추가'}</h2>
            <div className="seg">
              <button type="button" className={draft.kind === 'countdown' ? 'on' : ''} onClick={() => setDraft({ ...draft, kind: 'countdown' })}>
                다가오는 날 (D-)
              </button>
              <button type="button" className={draft.kind === 'since' ? 'on' : ''} onClick={() => setDraft({ ...draft, kind: 'since', emoji: draft.emoji === '📚' ? '💕' : draft.emoji })}>
                시작한 날부터 (+일)
              </button>
            </div>
            <label htmlFor="t">이름</label>
            <input id="t" value={draft.title} maxLength={20} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder={draft.kind === 'countdown' ? '예: 토익 시험, 전역일' : '예: 우리 사귄 날, 입사일'} />
            <label htmlFor="dt">{draft.kind === 'countdown' ? '목표 날짜' : '시작한 날'}</label>
            <input id="dt" type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
            {draft.kind === 'countdown' && (
              <>
                <label htmlFor="st">시작일(선택, 진행률 표시)</label>
                <input id="st" type="date" value={draft.start} onChange={(e) => setDraft({ ...draft, start: e.target.value })} />
              </>
            )}
            <div className="emojis" role="radiogroup" aria-label="아이콘">
              {EMOJIS.map((em) => (
                <button key={em} type="button" role="radio" aria-checked={draft.emoji === em} className={draft.emoji === em ? 'on' : ''} onClick={() => setDraft({ ...draft, emoji: em })}>
                  {em}
                </button>
              ))}
            </div>
            <label className="check">
              <input type="checkbox" checked={draft.pinned} onChange={(e) => setDraft({ ...draft, pinned: e.target.checked })} />
              <span>맨 위에 크게 보기</span>
            </label>
            <p className="error" role="alert">
              {error}
            </p>
            <button className="primary" type="button" onClick={save}>
              저장
            </button>
            {draft.id && (
              <button
                className="link"
                type="button"
                onClick={() => {
                  setEvents((l) => l.filter((x) => x.id !== draft.id));
                  setDraft(null);
                }}
              >
                이 디데이 지우기
              </button>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
