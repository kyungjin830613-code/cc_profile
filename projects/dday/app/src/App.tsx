import { useEffect, useState } from 'react';
import { BottomCTA, BottomSheet, Button, ListHeader, ListRow, Paragraph, SegmentedControl, TextField, Top } from '@toss/tds-mobile';
import { ddayLabel, dayOf, diffDays, progress, restore, sinceCount, sortEvents, upcomingMilestones, weekdayKo, type Event, type Kind } from './lib/dday';
import { appLink, loadItem, saveItem, shareText } from './lib/toss';

const STORE_KEY = 'dday.v1';
const EMOJIS = ['📚', '💕', '🪖', '👶', '✈️', '🎂', '💼', '🎉'];
const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const dot = (d: string) => d.replace(/-/g, '.');

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
  const label = (e: Event) => (e.kind === 'countdown' ? ddayLabel(e.date, today) : `${sinceCount(e.date, today).toLocaleString('ko-KR')}일째`);

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
  const quickList: [string, string, string][] = (
    [
      ['설날', '2027-02-06', '🧧'],
      ['크리스마스', nextOn(today, '12-25'), '🎄'],
      ['새해', nextOn(today, '01-01'), '🎉'],
    ] as [string, string, string][]
  ).filter(([t, d]) => !events.some((x) => x.title === t && x.date === d));

  const share = async (e: Event) => {
    const text = e.kind === 'countdown' ? `${e.emoji} ${e.title}까지 ${ddayLabel(e.date, today)}!` : `${e.emoji} ${e.title} 오늘로 ${sinceCount(e.date, today).toLocaleString('ko-KR')}일째`;
    await shareText(`[디데이 모아보기] ${text}\n${await appLink()}`);
  };
  const edit = (e: Event) => setDraft({ id: e.id, title: e.title, date: e.date, kind: e.kind, emoji: e.emoji, start: e.start ?? '', pinned: !!e.pinned });

  return (
    <div className="page">
      <Top
        title={<Top.TitleParagraph size={22}>디데이 모아보기</Top.TitleParagraph>}
        subtitleBottom={<Top.SubtitleParagraph>{`오늘은 ${dot(today)} (${weekdayKo(today)})`}</Top.SubtitleParagraph>}
      />

      {hero ? (
        <section className="hero" onClick={() => edit(hero)} role="button" tabIndex={0} aria-label={`${hero.title} 고치기`}>
          <span className="emoji" aria-hidden>
            {hero.emoji}
          </span>
          <Paragraph.Text typography="t5" fontWeight="semibold" color="var(--hero-sub)">
            {hero.title}
          </Paragraph.Text>
          <strong className="big">{label(hero)}</strong>
          <Paragraph.Text typography="t7" color="var(--hero-sub)">
            {`${dot(hero.date)} (${weekdayKo(hero.date)})${hero.kind === 'since' ? ' 부터' : ''}`}
          </Paragraph.Text>
          {hero.kind === 'countdown' && hero.start && (
            <div className="prog">
              <span className="bar">
                <i style={{ width: `${progress(hero.start, hero.date, today)}%` }} />
              </span>
              <Paragraph.Text typography="t7" color="var(--hero-sub)">{`${progress(hero.start, hero.date, today)}% 지나왔어요`}</Paragraph.Text>
            </div>
          )}
          {hero.kind === 'since' && (
            <ul className="miles">
              {upcomingMilestones(hero.date, today).map((m) => (
                <li key={m.label}>
                  <b>{m.label}</b> {dot(m.date)} <span>{m.left === 0 ? '오늘!' : `D-${m.left}`}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="hero-actions" onClick={(ev) => ev.stopPropagation()}>
            <Button size="small" variant="weak" color="primary" onClick={() => share(hero)}>
              공유하기
            </Button>
          </div>
        </section>
      ) : (
        <div className="empty">
          <Paragraph.Text typography="t5" color="var(--sub)">
            첫 디데이를 만들어 볼까요?
          </Paragraph.Text>
        </div>
      )}

      {rest.length > 0 && (
        <>
          <ListHeader title={<ListHeader.TitleParagraph typography="t5" fontWeight="bold">내 디데이</ListHeader.TitleParagraph>} />
          <ul className="list">
            {rest.map((e) => {
              const past = e.kind === 'countdown' && diffDays(today, e.date) < 0;
              return (
                <ListRow
                  key={e.id}
                  onClick={() => edit(e)}
                  left={<span className="row-emoji">{e.emoji}</span>}
                  contents={<ListRow.Texts type="2RowTypeA" top={e.title} bottom={`${dot(e.date)} (${weekdayKo(e.date)})`} />}
                  right={
                    <Paragraph.Text typography="t4" fontWeight="bold" color={past ? 'var(--sub)' : 'var(--blue)'}>
                      {label(e)}
                    </Paragraph.Text>
                  }
                />
              );
            })}
          </ul>
        </>
      )}

      {quickList.length > 0 && (
        <div className="quick">
          {quickList.map(([t, d, em]) => (
            <Button key={t} size="small" variant="weak" onClick={() => quick(t, d, em)}>
              {`${em} ${t} 추가`}
            </Button>
          ))}
        </div>
      )}

      <p className="foot">디데이는 이 기기에만 저장돼요.</p>

      <BottomCTA onClick={() => setDraft(blank(today))}>디데이 추가</BottomCTA>

      <BottomSheet open={draft !== null} onClose={() => setDraft(null)} header={<BottomSheet.Header>{draft?.id ? '디데이 고치기' : '디데이 추가'}</BottomSheet.Header>} cta={<BottomSheet.CTA onClick={save}>저장</BottomSheet.CTA>}>
        {draft && (
          <div className="sheet">
            <SegmentedControl value={draft.kind} onChange={(v) => setDraft({ ...draft, kind: v as Kind, emoji: v === 'since' && draft.emoji === '📚' ? '💕' : draft.emoji })}>
              <SegmentedControl.Item value="countdown">다가오는 날</SegmentedControl.Item>
              <SegmentedControl.Item value="since">시작한 날부터</SegmentedControl.Item>
            </SegmentedControl>
            <TextField variant="box" label="이름" labelOption="sustain" value={draft.title} maxLength={20} placeholder={draft.kind === 'countdown' ? '예: 토익 시험, 전역일' : '예: 우리 사귄 날, 입사일'} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            <TextField variant="box" type="date" label={draft.kind === 'countdown' ? '목표 날짜' : '시작한 날'} labelOption="sustain" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
            {draft.kind === 'countdown' && (
              <TextField variant="box" type="date" label="시작일(선택, 진행률 표시)" labelOption="sustain" value={draft.start} onChange={(e) => setDraft({ ...draft, start: e.target.value })} />
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
            {error && <p className="error">{error}</p>}
            {draft.id && (
              <Button
                size="medium"
                variant="weak"
                color="danger"
                display="block"
                onClick={() => {
                  setEvents((l) => l.filter((x) => x.id !== draft.id));
                  setDraft(null);
                }}
              >
                이 디데이 지우기
              </Button>
            )}
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
