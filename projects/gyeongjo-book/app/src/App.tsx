import { useEffect, useMemo, useState } from 'react';
import {
  EVENT_NAME,
  RELATION_NAME,
  advise,
  byPerson,
  restore,
  totals,
  won,
  type Direction,
  type Entry,
  type EventType,
  type Relation,
} from './lib/ledger';
import { appLink, inToss, loadItem, saveItem, shareText } from './lib/toss';

const STORE_KEY = 'entries.v1';
type Tab = 'advise' | 'book' | 'people';
const EVENTS = Object.keys(EVENT_NAME) as EventType[];
const RELATIONS = Object.keys(RELATION_NAME) as Relation[];
const today = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

function Chips<T extends string>({ value, options, names, onChange, label }: { value: T; options: T[]; names: Record<T, string>; onChange: (v: T) => void; label: string }) {
  return (
    <div className="chips" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o} type="button" role="radio" aria-checked={value === o} className={value === o ? 'on' : ''} onClick={() => onChange(o)}>
          {names[o]}
        </button>
      ))}
    </div>
  );
}

interface Draft {
  id: string | null;
  name: string;
  relation: Relation;
  event: EventType;
  direction: Direction;
  amountMan: string;
  date: string;
  memo: string;
}

const blankDraft = (o: Partial<Draft> = {}): Draft => ({ id: null, name: '', relation: 'friend', event: 'wedding', direction: 'gave', amountMan: '', date: today(), memo: '', ...o });

export default function App() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState<Tab>('advise');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [draftError, setDraftError] = useState('');
  const [openPerson, setOpenPerson] = useState<string | null>(null);
  const [status, setStatus] = useState('');

  // 얼마 낼까 입력
  const [who, setWho] = useState('');
  const [relation, setRelation] = useState<Relation>('friend');
  const [event, setEvent] = useState<EventType>('wedding');
  const [attend, setAttend] = useState(true);
  const [hotel, setHotel] = useState(false);
  const [companions, setCompanions] = useState(0);

  useEffect(() => {
    loadItem(STORE_KEY).then((raw) => {
      setEntries(restore(raw));
      setLoaded(true);
    });
  }, []);
  useEffect(() => {
    if (loaded) saveItem(STORE_KEY, JSON.stringify(entries));
  }, [entries, loaded]);

  const people = useMemo(() => byPerson(entries), [entries]);
  const advice = useMemo(() => advise(entries, { name: who, relation, event, attend, hotel, companions }), [entries, who, relation, event, attend, hotel, companions]);
  const [year] = useState(() => new Date().getFullYear());
  const sum = useMemo(() => totals(entries, year), [entries, year]);
  const suggestions = who.trim() ? people.filter((p) => p.name.replace(/\s/g, '').includes(who.replace(/\s/g, ''))).slice(0, 4) : [];

  const saveDraft = () => {
    if (!draft) return;
    const name = draft.name.trim().slice(0, 30);
    const amount = Math.round(Number(draft.amountMan.replace(/,/g, '')) * 10_000);
    if (!name) return setDraftError('이름을 적어 주세요.');
    if (!Number.isFinite(amount) || amount <= 0) return setDraftError('금액을 만원 단위로 적어 주세요.');
    if (amount > 100_000_000) return setDraftError('금액이 너무 커요.');
    const entry: Entry = { id: draft.id ?? newId(), name, relation: draft.relation, event: draft.event, direction: draft.direction, amount, date: draft.date || today(), memo: draft.memo.slice(0, 100) };
    setEntries((list) => (draft.id ? list.map((e) => (e.id === draft.id ? entry : e)) : [entry, ...list]));
    setDraft(null);
    setDraftError('');
  };

  const remove = (id: string) => {
    setEntries((list) => list.filter((e) => e.id !== id));
    setDraft(null);
  };

  const share = async () => {
    const text = `[경조사비 장부] ${who.trim() ? `${who.trim()}님 ` : ''}${RELATION_NAME[relation]} ${EVENT_NAME[event]}, 얼마 낼까? → ${won(advice.amount)}\n나도 계산해 보기: ${await appLink()}`;
    const r = await shareText(text);
    setStatus(r === 'shared' ? '' : r === 'copied' ? '문구를 복사했어요.' : '공유가 막혔어요.');
  };

  return (
    <main className="app">
      <header className="top">
        <h1>경조사비 장부</h1>
        <p>"그 사람이 우리 결혼식에 얼마 냈더라?" 이제 기억 안 해도 돼요.</p>
      </header>

      <section className="stats">
        <div>
          <small>{year}년 낸 돈</small>
          <b>{won(sum.gave)}</b>
        </div>
        <div>
          <small>{year}년 받은 돈</small>
          <b>{won(sum.received)}</b>
        </div>
        <div>
          <small>기록한 사람</small>
          <b>{people.length}명</b>
        </div>
      </section>

      <nav className="tabs" role="tablist">
        {(
          [
            ['advise', '얼마 낼까'],
            ['book', '장부'],
            ['people', '사람별'],
          ] as [Tab, string][]
        ).map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'on' : ''} type="button" onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </nav>

      {tab === 'advise' && (
        <section className="card">
          <label htmlFor="who">누구 경조사예요? (장부에서 찾아봐요)</label>
          <input id="who" value={who} maxLength={30} onChange={(e) => setWho(e.target.value)} placeholder="이름이나 별명" autoComplete="off" />
          {suggestions.length > 0 && (
            <div className="suggest">
              {suggestions.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => {
                    setWho(p.name);
                    setRelation(p.relation);
                  }}
                >
                  {p.name} · {RELATION_NAME[p.relation]}
                </button>
              ))}
            </div>
          )}
          <p className="label">어떤 경조사?</p>
          <Chips label="경조사 종류" value={event} options={EVENTS} names={EVENT_NAME} onChange={setEvent} />
          <p className="label">어떤 사이?</p>
          <Chips label="관계" value={relation} options={RELATIONS} names={RELATION_NAME} onChange={setRelation} />
          {event === 'wedding' && (
            <div className="opts">
              <label className="check">
                <input type="checkbox" checked={attend} onChange={(e) => setAttend(e.target.checked)} />
                <span>직접 가서 식사해요</span>
              </label>
              {attend && (
                <>
                  <label className="check">
                    <input type="checkbox" checked={hotel} onChange={(e) => setHotel(e.target.checked)} />
                    <span>호텔 등 식대가 비싼 곳이에요</span>
                  </label>
                  <div className="stepper">
                    <span>같이 가는 사람</span>
                    <button type="button" aria-label="한 명 빼기" onClick={() => setCompanions((n) => Math.max(0, n - 1))}>
                      −
                    </button>
                    <b>{companions}명</b>
                    <button type="button" aria-label="한 명 더하기" onClick={() => setCompanions((n) => Math.min(5, n + 1))}>
                      +
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="answer">
            <small>추천 금액</small>
            <strong>{won(advice.amount)}</strong>
            {advice.range && advice.range[0] !== advice.range[1] && (
              <small>
                보통 {won(advice.range[0])} ~ {won(advice.range[1])}
              </small>
            )}
            {advice.basis && <small className="basis">📒 장부 기록 기준</small>}
          </div>
          <ul className="reasons">
            {advice.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <div className="row">
            <button
              className="primary"
              type="button"
              onClick={() => setDraft(blankDraft({ name: who.trim(), relation, event, direction: 'gave', amountMan: String(advice.amount / 10_000) }))}
            >
              이 금액으로 냈어요
            </button>
            <button className="ghost" type="button" onClick={share}>
              공유
            </button>
          </div>
          <p className="note" role="status">
            {status}
          </p>
        </section>
      )}

      {tab === 'book' && (
        <section className="list">
          <button className="primary" type="button" onClick={() => setDraft(blankDraft({ direction: 'received' }))}>
            + 기록 추가
          </button>
          {entries.length === 0 && <p className="empty">아직 기록이 없어요. 내 결혼식·돌잔치 방명록부터 옮겨 적어 보세요.</p>}
          {[...entries]
            .sort((a, b) => b.date.localeCompare(a.date))
            .map((e) => (
              <button key={e.id} type="button" className="item" onClick={() => setDraft({ ...e, amountMan: String(e.amount / 10_000) })}>
                <span className={`dir ${e.direction}`}>{e.direction === 'gave' ? '냄' : '받음'}</span>
                <span className="who">
                  <b>{e.name}</b>
                  <small>
                    {e.date} · {EVENT_NAME[e.event]} · {RELATION_NAME[e.relation]}
                  </small>
                </span>
                <span className="amt">{won(e.amount)}</span>
              </button>
            ))}
        </section>
      )}

      {tab === 'people' && (
        <section className="list">
          {people.length === 0 && <p className="empty">장부에 기록하면 사람별로 주고받은 돈이 정리돼요.</p>}
          {people.map((p) => (
            <div key={p.name} className="person">
              <button type="button" className="item" aria-expanded={openPerson === p.name} onClick={() => setOpenPerson(openPerson === p.name ? null : p.name)}>
                <span className="who">
                  <b>{p.name}</b>
                  <small>
                    {RELATION_NAME[p.relation]} · 받음 {won(p.received)} · 냄 {won(p.gave)}
                  </small>
                </span>
                <span className={`bal ${p.balance > 0 ? 'owe' : ''}`}>{p.balance > 0 ? `갚을 마음 ${won(p.balance)}` : p.balance < 0 ? `더 냄 ${won(-p.balance)}` : '딱 맞음'}</span>
              </button>
              {openPerson === p.name && (
                <ul className="history">
                  {p.entries.map((e) => (
                    <li key={e.id}>
                      {e.date} {EVENT_NAME[e.event]} — {e.direction === 'gave' ? '내가 냄' : '받음'} {won(e.amount)}
                      {e.memo && <small> ({e.memo})</small>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      <footer className="foot">
        추천 금액은 여러 안내 글의 공통 범위를 바탕으로 한 참고값이에요. 지역·모임 문화에 따라 달라요. 장부는 이 기기에만 저장되고 서버로 보내지 않아요.
        {!inToss() && ' 지금은 토스 밖 미리보기 화면이에요.'}
      </footer>

      {draft && (
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="draft-title" onClick={() => setDraft(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <h2 id="draft-title">{draft.id ? '기록 고치기' : '기록 추가'}</h2>
            <Chips label="주고받음" value={draft.direction} options={['received', 'gave'] as Direction[]} names={{ received: '받았어요', gave: '냈어요' }} onChange={(v) => setDraft({ ...draft, direction: v })} />
            <label htmlFor="d-name">이름</label>
            <input id="d-name" value={draft.name} maxLength={30} onChange={(e) => setDraft({ ...draft, name: e.target.value })} autoComplete="off" />
            <label htmlFor="d-amt">금액(만원)</label>
            <input id="d-amt" inputMode="decimal" value={draft.amountMan} onChange={(e) => setDraft({ ...draft, amountMan: e.target.value.replace(/[^\d.]/g, '') })} placeholder="예: 10" />
            <p className="label">경조사</p>
            <Chips label="경조사 종류" value={draft.event} options={EVENTS} names={EVENT_NAME} onChange={(v) => setDraft({ ...draft, event: v })} />
            <p className="label">관계</p>
            <Chips label="관계" value={draft.relation} options={RELATIONS} names={RELATION_NAME} onChange={(v) => setDraft({ ...draft, relation: v })} />
            <label htmlFor="d-date">날짜</label>
            <input id="d-date" type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
            <label htmlFor="d-memo">메모(선택)</label>
            <input id="d-memo" value={draft.memo} maxLength={100} onChange={(e) => setDraft({ ...draft, memo: e.target.value })} placeholder="예: 부부 같이 옴" />
            <p className="error" role="alert">
              {draftError}
            </p>
            <button className="primary" type="button" onClick={saveDraft}>
              저장
            </button>
            {draft.id && (
              <button className="danger" type="button" onClick={() => remove(draft.id!)}>
                이 기록 지우기
              </button>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
