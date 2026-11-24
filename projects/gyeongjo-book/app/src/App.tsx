import { useEffect, useMemo, useState } from 'react';
import { BottomSheet, Button, ListHeader, ListRow, Paragraph, SegmentedControl, Switch, TextField, Top } from '@toss/tds-mobile';
import { EVENT_NAME, RELATION_NAME, advise, byPerson, restore, totals, won, type Direction, type Entry, type EventType, type Relation } from './lib/ledger';
import { appLink, loadItem, saveItem, shareText } from './lib/toss';

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

function Chips<T extends string>({ value, options, names, onChange }: { value: T; options: T[]; names: Record<T, string>; onChange: (v: T) => void }) {
  return (
    <div className="chips">
      {options.map((o) => (
        <Button key={o} size="small" variant={value === o ? 'fill' : 'weak'} color={value === o ? 'primary' : 'dark'} onClick={() => onChange(o)}>
          {names[o]}
        </Button>
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
  const [who, setWho] = useState('');
  const [relation, setRelation] = useState<Relation>('friend');
  const [event, setEvent] = useState<EventType>('wedding');
  const [attend, setAttend] = useState(true);
  const [hotel, setHotel] = useState(false);
  const [companions, setCompanions] = useState(0);
  const [year] = useState(() => new Date().getFullYear());

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
  const sum = useMemo(() => totals(entries, year), [entries, year]);
  const suggestions = who.trim() ? people.filter((p) => p.name.replace(/\s/g, '').includes(who.replace(/\s/g, '')) && p.name !== who).slice(0, 4) : [];

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

  const share = async () => {
    const text = `[경조사비 장부] ${who.trim() ? `${who.trim()}님 ` : ''}${RELATION_NAME[relation]} ${EVENT_NAME[event]}, 얼마 낼까? → ${won(advice.amount)}\n${await appLink()}`;
    const r = await shareText(text);
    setStatus(r === 'shared' ? '' : r === 'copied' ? '문구를 복사했어요.' : '공유가 막혔어요.');
  };

  return (
    <div className="page">
      <Top title={<Top.TitleParagraph size={22}>경조사비 장부</Top.TitleParagraph>} subtitleBottom={<Top.SubtitleParagraph>"그 사람이 우리 결혼식에 얼마 냈더라?"</Top.SubtitleParagraph>} />

      <div className="stats">
        <div>
          <span>{year}년 낸 돈</span>
          <b>{won(sum.gave)}</b>
        </div>
        <div>
          <span>{year}년 받은 돈</span>
          <b>{won(sum.received)}</b>
        </div>
        <div>
          <span>기록한 사람</span>
          <b>{people.length}명</b>
        </div>
      </div>

      <div className="pad">
        <SegmentedControl value={tab} onChange={(v) => setTab(v as Tab)}>
          <SegmentedControl.Item value="advise">얼마 낼까</SegmentedControl.Item>
          <SegmentedControl.Item value="book">장부</SegmentedControl.Item>
          <SegmentedControl.Item value="people">사람별</SegmentedControl.Item>
        </SegmentedControl>
      </div>

      {tab === 'advise' && (
        <>
          <div className="card">
            <TextField variant="box" label="누구 경조사예요?" labelOption="sustain" placeholder="이름이나 별명 (장부에서 찾아봐요)" value={who} maxLength={30} onChange={(e) => setWho(e.target.value)} />
            {suggestions.length > 0 && (
              <div className="chips">
                {suggestions.map((p) => (
                  <Button
                    key={p.name}
                    size="small"
                    variant="weak"
                    onClick={() => {
                      setWho(p.name);
                      setRelation(p.relation);
                    }}
                  >
                    {`📒 ${p.name}`}
                  </Button>
                ))}
              </div>
            )}
            <p className="label">어떤 경조사?</p>
            <Chips value={event} options={EVENTS} names={EVENT_NAME} onChange={setEvent} />
            <p className="label">어떤 사이?</p>
            <Chips value={relation} options={RELATIONS} names={RELATION_NAME} onChange={setRelation} />
          </div>

          {event === 'wedding' && (
            <ul className="list">
              <ListRow contents={<ListRow.Texts type="1RowTypeA" top="직접 가서 식사해요" />} right={<Switch checked={attend} onChange={(e) => setAttend(e.target.checked)} />} />
              {attend && <ListRow contents={<ListRow.Texts type="1RowTypeA" top="호텔 등 식대가 비싼 곳이에요" />} right={<Switch checked={hotel} onChange={(e) => setHotel(e.target.checked)} />} />}
              {attend && (
                <ListRow
                  contents={<ListRow.Texts type="1RowTypeA" top="같이 가는 사람" />}
                  right={
                    <span className="stepper">
                      <Button size="small" variant="weak" color="dark" aria-label="한 명 빼기" onClick={() => setCompanions((n) => Math.max(0, n - 1))}>
                        −
                      </Button>
                      <b>{companions}명</b>
                      <Button size="small" variant="weak" color="dark" aria-label="한 명 더하기" onClick={() => setCompanions((n) => Math.min(5, n + 1))}>
                        +
                      </Button>
                    </span>
                  }
                />
              )}
            </ul>
          )}

          <div className="answer">
            <Paragraph.Text typography="t6" color="var(--sub)">
              추천 금액
            </Paragraph.Text>
            <strong>{won(advice.amount)}</strong>
            {advice.range && advice.range[0] !== advice.range[1] && <Paragraph.Text typography="t7" color="var(--sub)">{`보통 ${won(advice.range[0])} ~ ${won(advice.range[1])}`}</Paragraph.Text>}
            {advice.basis && <span className="basis">장부 기록 기준</span>}
            <ul className="reasons">
              {advice.reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
          <div className="actions">
            <Button display="block" onClick={() => setDraft(blankDraft({ name: who.trim(), relation, event, direction: 'gave', amountMan: String(advice.amount / 10_000) }))}>
              이 금액으로 냈어요
            </Button>
            <Button display="block" variant="weak" onClick={share}>
              공유하기
            </Button>
          </div>
        </>
      )}

      {tab === 'book' && (
        <>
          <div className="actions">
            <Button display="block" onClick={() => setDraft(blankDraft({ direction: 'received' }))}>
              기록 추가
            </Button>
          </div>
          {entries.length === 0 ? (
            <p className="empty">아직 기록이 없어요. 내 결혼식·돌잔치 방명록부터 옮겨 적어 보세요.</p>
          ) : (
            <ul className="list">
              {[...entries]
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((e) => (
                  <ListRow
                    key={e.id}
                    onClick={() => setDraft({ ...e, amountMan: String(e.amount / 10_000) })}
                    left={<span className={`tag ${e.direction}`}>{e.direction === 'gave' ? '냄' : '받음'}</span>}
                    contents={<ListRow.Texts type="2RowTypeA" top={e.name} bottom={`${e.date.replace(/-/g, '.')} · ${EVENT_NAME[e.event]} · ${RELATION_NAME[e.relation]}`} />}
                    right={
                      <Paragraph.Text typography="t5" fontWeight="bold">
                        {won(e.amount)}
                      </Paragraph.Text>
                    }
                  />
                ))}
            </ul>
          )}
        </>
      )}

      {tab === 'people' && (
        <>
          {people.length === 0 ? (
            <p className="empty">장부에 기록하면 사람별로 주고받은 돈이 정리돼요.</p>
          ) : (
            <>
              <ListHeader title={<ListHeader.TitleParagraph typography="t5" fontWeight="bold">사람별 정리</ListHeader.TitleParagraph>} />
              <ul className="list">
                {people.map((p) => (
                  <div key={p.name}>
                    <ListRow
                      onClick={() => setOpenPerson(openPerson === p.name ? null : p.name)}
                      contents={<ListRow.Texts type="2RowTypeA" top={p.name} bottom={`${RELATION_NAME[p.relation]} · 받음 ${won(p.received)} · 냄 ${won(p.gave)}`} />}
                      right={
                        <Paragraph.Text typography="t6" fontWeight="bold" color={p.balance > 0 ? 'var(--blue)' : 'var(--sub)'}>
                          {p.balance > 0 ? `갚을 마음 ${won(p.balance)}` : p.balance < 0 ? `더 냄 ${won(-p.balance)}` : '딱 맞음'}
                        </Paragraph.Text>
                      }
                    />
                    {openPerson === p.name && (
                      <ul className="history">
                        {p.entries.map((e) => (
                          <li key={e.id}>
                            {e.date.replace(/-/g, '.')} {EVENT_NAME[e.event]} · {e.direction === 'gave' ? '내가 냄' : '받음'} {won(e.amount)}
                            {e.memo && <small> ({e.memo})</small>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </ul>
            </>
          )}
        </>
      )}

      <p className="note" role="status">
        {status}
      </p>
      <p className="foot">추천 금액은 여러 안내 글의 공통 범위를 바탕으로 한 참고값이에요. 장부는 이 기기에만 저장돼요.</p>

      <BottomSheet open={draft !== null} onClose={() => setDraft(null)} header={<BottomSheet.Header>{draft?.id ? '기록 고치기' : '기록 추가'}</BottomSheet.Header>} cta={<BottomSheet.CTA onClick={saveDraft}>저장</BottomSheet.CTA>}>
        {draft && (
          <div className="sheet">
            <SegmentedControl value={draft.direction} onChange={(v) => setDraft({ ...draft, direction: v as Direction })}>
              <SegmentedControl.Item value="received">받았어요</SegmentedControl.Item>
              <SegmentedControl.Item value="gave">냈어요</SegmentedControl.Item>
            </SegmentedControl>
            <TextField variant="box" label="이름" labelOption="sustain" value={draft.name} maxLength={30} placeholder="이름이나 별명" onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            <TextField variant="box" label="금액" labelOption="sustain" inputMode="decimal" suffix="만원" value={draft.amountMan} placeholder="예: 10" onChange={(e) => setDraft({ ...draft, amountMan: e.target.value.replace(/[^\d.]/g, '') })} />
            <p className="label">경조사</p>
            <Chips value={draft.event} options={EVENTS} names={EVENT_NAME} onChange={(v) => setDraft({ ...draft, event: v })} />
            <p className="label">관계</p>
            <Chips value={draft.relation} options={RELATIONS} names={RELATION_NAME} onChange={(v) => setDraft({ ...draft, relation: v })} />
            <TextField variant="box" type="date" label="날짜" labelOption="sustain" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
            <TextField variant="box" label="메모(선택)" labelOption="sustain" value={draft.memo} maxLength={100} placeholder="예: 부부 같이 옴" onChange={(e) => setDraft({ ...draft, memo: e.target.value })} />
            {draftError && <p className="error">{draftError}</p>}
            {draft.id && (
              <Button
                display="block"
                variant="weak"
                color="danger"
                onClick={() => {
                  setEntries((list) => list.filter((e) => e.id !== draft.id));
                  setDraft(null);
                }}
              >
                이 기록 지우기
              </Button>
            )}
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
