import { useEffect, useMemo, useState } from 'react';
import { BottomCTA, BottomSheet, Button, ListHeader, ListRow, Paragraph, SegmentedControl, TextField } from '@toss/tds-mobile';
import { CATEGORY, PRESETS, STORAGE_NAME, addDays, addItem, counts, dayOf, daysLeft, eatToday, emptyData, finish, label, levelOf, monthStats, restore, sortItems, type Category, type Data, type Item, type Level, type Storage } from './lib/fridge';
import { appLink, inToss, loadItem, saveItem, shareText } from './lib/toss';

const STORE_KEY = 'fridge.v1';
const CATS = Object.keys(CATEGORY) as Category[];
const STORAGES = Object.keys(STORAGE_NAME) as Storage[];
const QUICK = [0, 3, 7, 14, 30];
const GROUPS: { level: Level; title: string }[] = [
  { level: 'over', title: '날짜가 지났어요' },
  { level: 'urgent', title: '오늘·내일까지' },
  { level: 'soon', title: '3일 안에 먹어요' },
  { level: 'ok', title: '여유 있어요' },
];
const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const md = (day: string) => `${Number(day.slice(5, 7))}/${Number(day.slice(8))}`;

export default function App() {
  const [data, setData] = useState<Data>(emptyData);
  const [loaded, setLoaded] = useState(false);
  const [today, setToday] = useState(() => dayOf(new Date()));
  const [filter, setFilter] = useState<'all' | Storage>('all');
  const [adding, setAdding] = useState(false);
  const [sel, setSel] = useState<Item | null>(null);
  const [status, setStatus] = useState('');
  // 추가 폼
  const [name, setName] = useState('');
  const [cat, setCat] = useState<Category>('veg');
  const [storage, setStorage] = useState<Storage>('fridge');
  const [expires, setExpires] = useState(() => addDays(dayOf(new Date()), 7));

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

  const shown = useMemo(() => sortItems(data.items.filter((i) => filter === 'all' || i.storage === filter)), [data.items, filter]);
  const c = counts(data.items, today);
  const todayList = eatToday(data.items, today);
  const st = monthStats(data.done, today);

  const openAdd = () => {
    setName('');
    setCat('veg');
    setStorage('fridge');
    setExpires(addDays(today, 7));
    setAdding(true);
  };
  const save = () => {
    if (!name.trim()) {
      setStatus('이름을 적어 주세요.');
      return;
    }
    setData((d) => addItem(d, { id: newId(), name, cat, storage, expires, added: today }));
    setStatus(`'${name.trim()}' 넣었어요.`);
    setAdding(false);
  };
  const done = (result: 'ate' | 'wasted') => {
    if (!sel) return;
    setData((d) => finish(d, sel.id, result, today));
    setStatus(result === 'ate' ? `'${sel.name}' 다 먹었어요 👏` : `'${sel.name}' 버렸어요. 다음엔 먼저 먹어요!`);
    setSel(null);
  };
  const share = async () => {
    const text = st.rate === null ? `[냉장고 유통기한] 냉장고 정리 시작! 유통기한 임박한 것부터 챙겨 먹는 중이에요 🥬` : `[냉장고 유통기한] 이번 달 냉장고 알뜰률 ${st.rate}% (다 먹음 ${st.ate} · 버림 ${st.wasted}) 🥬`;
    const r = await shareText(`${text}\n나도 정리해 보기: ${await appLink()}`);
    setStatus(r === 'shared' ? '' : r === 'copied' ? '문구를 복사했어요.' : '공유가 막혔어요.');
  };

  const left = daysLeft(expires, today);

  return (
    <div className="page has-cta">
      <div className="head">
        <h1>냉장고 유통기한</h1>
        <Paragraph.Text typography="t6" color="var(--sub)">
          {data.items.length ? `${data.items.length}개 보관 중 · 임박 ${c.urgent + c.soon}개${c.over ? ` · 지남 ${c.over}개` : ''}` : '넣은 식재료를 적고 임박한 것부터 챙겨요'}
        </Paragraph.Text>
      </div>

      <section className={`hero ${todayList.length ? 'warn' : ''}`}>
        <span className="hero-emoji" aria-hidden>
          {todayList.length ? '⏰' : c.over ? '🗑️' : '🥗'}
        </span>
        <div className="hero-text">
          <Paragraph.Text typography="t6" color="var(--sub2)">
            오늘 먹을 것
          </Paragraph.Text>
          <strong className="hero-main">{todayList.length ? todayList.map((i) => i.name).join(', ') : '급한 건 없어요'}</strong>
          <Paragraph.Text typography="t7" color="var(--sub)">
            {todayList.length ? '오늘·내일까지인 식재료예요' : c.over ? `날짜 지난 것 ${c.over}개를 확인해 주세요` : '여유 있게 먹어도 돼요'}
          </Paragraph.Text>
        </div>
      </section>

      <div className="pad">
        <SegmentedControl value={filter} onChange={(v: string) => setFilter(v as 'all' | Storage)}>
          <SegmentedControl.Item value="all">전체</SegmentedControl.Item>
          {STORAGES.map((s) => (
            <SegmentedControl.Item key={s} value={s}>
              {STORAGE_NAME[s]}
            </SegmentedControl.Item>
          ))}
        </SegmentedControl>
      </div>

      {shown.length === 0 && <p className="empty">{data.items.length ? '이 칸은 비어 있어요.' : '아직 넣은 식재료가 없어요.\n아래 버튼으로 첫 식재료를 넣어 보세요.'}</p>}

      {GROUPS.map((g) => {
        const list = shown.filter((i) => levelOf(daysLeft(i.expires, today)) === g.level);
        if (!list.length) return null;
        return (
          <div key={g.level}>
            <ListHeader title={<ListHeader.TitleParagraph typography="t5" fontWeight="bold">{`${g.title} ${list.length}`}</ListHeader.TitleParagraph>} />
            <ul className="list">
              {list.map((i) => {
                const l = daysLeft(i.expires, today);
                return (
                  <ListRow
                    key={i.id}
                    onClick={() => setSel(i)}
                    left={<span className="row-emoji">{CATEGORY[i.cat].emoji}</span>}
                    contents={<ListRow.Texts type="2RowTypeA" top={i.name} bottom={`${STORAGE_NAME[i.storage]} · ${md(i.expires)}까지`} />}
                    right={<span className={`badge ${levelOf(l)}`}>{label(l)}</span>}
                    withArrow
                  />
                );
              })}
            </ul>
          </div>
        );
      })}

      <ListHeader title={<ListHeader.TitleParagraph typography="t5" fontWeight="bold">이번 달 기록</ListHeader.TitleParagraph>} />
      <section className="card stats">
        <div>
          <b>{st.ate}</b>
          <span>다 먹음</span>
        </div>
        <div>
          <b className="red">{st.wasted}</b>
          <span>버림</span>
        </div>
        <div>
          <b className="blue">{st.rate === null ? '-' : `${st.rate}%`}</b>
          <span>알뜰률</span>
        </div>
      </section>
      <div className="actions">
        <Button display="block" variant="weak" onClick={share}>
          친구에게 자랑하기
        </Button>
      </div>
      <p className="note" role="status">
        {status}
      </p>
      <p className="foot">유통기한은 포장에 적힌 날짜를 넣어 주세요. 빠른 입력 날짜는 입력을 돕는 기본값일 뿐 식품 안전을 보장하지 않아요. 기록은 이 기기에만 저장돼요.{!inToss() && ' 지금은 토스 밖 미리보기 화면이에요.'}</p>

      <BottomCTA onClick={openAdd}>식재료 넣기</BottomCTA>

      <BottomSheet open={adding} onClose={() => setAdding(false)} header={<BottomSheet.Header>식재료 넣기</BottomSheet.Header>} cta={<BottomSheet.CTA onClick={save}>넣기</BottomSheet.CTA>}>
        <div className="sheet">
          <p className="label">자주 넣는 것</p>
          <div className="chips">
            {PRESETS.map((p) => (
              <Button
                key={p.name}
                size="small"
                variant="weak"
                color="dark"
                onClick={() => {
                  setName(p.name);
                  setCat(p.cat);
                  setStorage(p.storage);
                  setExpires(addDays(today, p.days));
                }}
              >
                {`${CATEGORY[p.cat].emoji} ${p.name}`}
              </Button>
            ))}
          </div>
          <div className="tf">
            <TextField variant="box" label="이름" labelOption="sustain" placeholder="예: 우유" maxLength={20} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <p className="label">종류</p>
          <div className="chips">
            {CATS.map((k) => (
              <Button key={k} size="small" variant={cat === k ? 'fill' : 'weak'} color={cat === k ? 'primary' : 'dark'} onClick={() => setCat(k)}>
                {`${CATEGORY[k].emoji} ${CATEGORY[k].name}`}
              </Button>
            ))}
          </div>
          <p className="label">보관</p>
          <SegmentedControl value={storage} onChange={(v: string) => setStorage(v as Storage)}>
            {STORAGES.map((s) => (
              <SegmentedControl.Item key={s} value={s}>
                {STORAGE_NAME[s]}
              </SegmentedControl.Item>
            ))}
          </SegmentedControl>
          <p className="label">{`유통기한 · ${md(expires)}까지 (${label(left)})`}</p>
          <div className="chips">
            {QUICK.map((n) => (
              <Button key={n} size="small" variant={expires === addDays(today, n) ? 'fill' : 'weak'} color={expires === addDays(today, n) ? 'primary' : 'dark'} onClick={() => setExpires(addDays(today, n))}>
                {n === 0 ? '오늘' : `+${n}일`}
              </Button>
            ))}
          </div>
          <label className="date">
            <span>날짜 직접 고르기</span>
            <input type="date" value={expires} onChange={(e) => e.target.value && setExpires(e.target.value)} />
          </label>
        </div>
      </BottomSheet>

      <BottomSheet open={!!sel} onClose={() => setSel(null)} header={<BottomSheet.Header>{sel ? `${CATEGORY[sel.cat].emoji} ${sel.name}` : ''}</BottomSheet.Header>}>
        {sel && (
          <div className="sheet">
            <Paragraph.Text typography="t6" color="var(--sub2)">{`${STORAGE_NAME[sel.storage]} · ${md(sel.expires)}까지 · ${label(daysLeft(sel.expires, today))} · ${md(sel.added)}에 넣음`}</Paragraph.Text>
            <div className="row2">
              <Button display="block" onClick={() => done('ate')}>
                다 먹었어요
              </Button>
              <Button display="block" variant="weak" color="danger" onClick={() => done('wasted')}>
                버렸어요
              </Button>
            </div>
            <Button
              display="block"
              size="medium"
              variant="weak"
              color="dark"
              onClick={() => {
                setData((d) => ({ ...d, items: d.items.filter((x) => x.id !== sel.id) }));
                setSel(null);
              }}
            >
              잘못 넣었어요 (기록 없이 지우기)
            </Button>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
