import { useEffect, useMemo, useState } from 'react';
import { Button, ListHeader, ListRow, Paragraph, SegmentedControl, TextField } from '@toss/tds-mobile';
import { settle, simpleSplit, summaryText, won, type Item } from './lib/settle';
import { appLink, inToss, loadItem, saveItem, shareText } from './lib/toss';

const STORE_KEY = 'nbbang.v1';
type Mode = 'simple' | 'detail';
const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const num = (s: string) => {
  const n = Number(s.replace(/[^\d]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

interface Saved {
  title: string;
  names: string[];
  items: Item[];
  unit: number;
}
const DEFAULT: Saved = {
  title: '',
  names: ['나', '친구1', '친구2'],
  items: [],
  unit: 1,
};

function restore(raw: string | null): Saved {
  try {
    const v = raw ? JSON.parse(raw) : null;
    if (!v || !Array.isArray(v.names) || !Array.isArray(v.items)) return DEFAULT;
    const names = v.names.filter((x: unknown) => typeof x === 'string').slice(0, 20);
    if (names.length < 2) return DEFAULT;
    const items = v.items.filter((i: Item) => i && typeof i.id === 'string' && typeof i.name === 'string' && Number.isFinite(i.amount) && Number.isInteger(i.payer) && Array.isArray(i.sharers));
    return {
      title: typeof v.title === 'string' ? v.title.slice(0, 20) : '',
      names,
      items,
      unit: [1, 10, 100, 1000].includes(v.unit) ? v.unit : 1,
    };
  } catch {
    return DEFAULT;
  }
}

export default function App() {
  const [mode, setMode] = useState<Mode>('simple');
  const [loaded, setLoaded] = useState(false);
  const [data, setData] = useState<Saved>(DEFAULT);
  const [status, setStatus] = useState('');

  // 간단 N빵
  const [total, setTotal] = useState('');
  const [people, setPeople] = useState(4);
  const [simpleUnit, setSimpleUnit] = useState(100);

  // 항목 입력
  const [itemName, setItemName] = useState('');
  const [itemAmount, setItemAmount] = useState('');
  const [itemPayer, setItemPayer] = useState(0);
  const [itemSharers, setItemSharers] = useState<number[]>([]);

  useEffect(() => {
    loadItem(STORE_KEY).then((raw) => {
      setData(restore(raw));
      setLoaded(true);
    });
  }, []);
  useEffect(() => {
    if (loaded) saveItem(STORE_KEY, JSON.stringify(data));
  }, [data, loaded]);

  const simple = simpleSplit(num(total), people, simpleUnit);
  const result = useMemo(() => settle(data.names.length, data.items, data.unit), [data]);
  const names = data.names.map((n, i) => n.trim() || `${i + 1}번`);

  const setName = (i: number, v: string) =>
    setData((d) => ({
      ...d,
      names: d.names.map((n, j) => (j === i ? v.slice(0, 10) : n)),
    }));
  const addPerson = () => setData((d) => (d.names.length >= 20 ? d : { ...d, names: [...d.names, `친구${d.names.length}`] }));
  const removePerson = (i: number) =>
    setData((d) => {
      if (d.names.length <= 2) return d;
      // 지운 사람이 낸 항목은 빼고, 나눠 낼 사람 번호를 당긴다
      const items = d.items
        .filter((it) => it.payer !== i)
        .map((it) => ({
          ...it,
          payer: it.payer > i ? it.payer - 1 : it.payer,
          sharers: it.sharers.filter((s) => s !== i).map((s) => (s > i ? s - 1 : s)),
        }));
      return { ...d, names: d.names.filter((_, j) => j !== i), items };
    });

  const addItem = () => {
    const amount = num(itemAmount);
    if (!amount) {
      setStatus('금액을 넣어 주세요.');
      return;
    }
    const all = data.names.map((_, i) => i);
    const sharers = itemSharers.length === 0 || itemSharers.length === all.length ? [] : itemSharers;
    setData((d) => ({
      ...d,
      items: [
        ...d.items,
        {
          id: newId(),
          name: itemName.trim().slice(0, 20) || `${d.items.length + 1}차`,
          amount,
          payer: Math.min(itemPayer, d.names.length - 1),
          sharers,
        },
      ],
    }));
    setItemName('');
    setItemAmount('');
    setItemSharers([]);
    setStatus('');
  };

  const shareSimple = async () => {
    const text = `[N빵] 총 ${won(num(total))} ÷ ${people}명 = 1인당 ${won(simple.each)}${simple.diff ? ` (총무 +${won(simple.diff)})` : ''}\n정산기: ${await appLink()}`;
    const r = await shareText(text);
    setStatus(r === 'shared' ? '' : r === 'copied' ? '정산 문구를 복사했어요. 단톡방에 붙여 넣으세요.' : '공유가 막혔어요.');
  };
  const shareDetail = async () => {
    const text = `${summaryText(data.title, names, result, data.unit)}\n\n정산기: ${await appLink()}`;
    const r = await shareText(text);
    setStatus(r === 'shared' ? '' : r === 'copied' ? '정산 문구를 복사했어요. 단톡방에 붙여 넣으세요.' : '공유가 막혔어요.');
  };

  return (
    <div className="page">
      <div className="head">
        <h1>N빵 정산기</h1>
        <Paragraph.Text typography="t6" color="var(--sub)">
          모임 끝나고 "누가 누구한테 얼마?" 1분이면 끝나요
        </Paragraph.Text>
      </div>

      <div className="pad">
        <SegmentedControl value={mode} onChange={(v: string) => setMode(v as Mode)}>
          <SegmentedControl.Item value="simple">간단 N빵</SegmentedControl.Item>
          <SegmentedControl.Item value="detail">항목별 정산</SegmentedControl.Item>
        </SegmentedControl>
      </div>

      {mode === 'simple' && (
        <>
          <section className="card">
            <div className="tf">
              <TextField
                variant="box"
                label="총 금액"
                labelOption="sustain"
                suffix="원"
                inputMode="numeric"
                placeholder="0"
                value={total ? num(total).toLocaleString('ko-KR') : ''}
                onChange={(e) => setTotal(e.target.value)}
              />
            </div>
            <div className="setrow">
              <span>인원</span>
              <span className="stepper">
                <Button size="small" variant="weak" color="dark" aria-label="한 명 빼기" onClick={() => setPeople((n) => Math.max(2, n - 1))}>
                  −
                </Button>
                <b>{people}명</b>
                <Button size="small" variant="weak" color="dark" aria-label="한 명 더하기" onClick={() => setPeople((n) => Math.min(50, n + 1))}>
                  +
                </Button>
              </span>
            </div>
            <p className="label">끝자리 맞추기</p>
            <div className="tf">
              <SegmentedControl value={String(simpleUnit)} onChange={(v: string) => setSimpleUnit(Number(v))}>
                <SegmentedControl.Item value="1">1원까지</SegmentedControl.Item>
                <SegmentedControl.Item value="100">100원 단위</SegmentedControl.Item>
                <SegmentedControl.Item value="1000">천원 단위</SegmentedControl.Item>
              </SegmentedControl>
            </div>
          </section>
          <section className="result" aria-live="polite">
            <Paragraph.Text typography="t6" color="var(--sub2)">
              1인당
            </Paragraph.Text>
            <strong className="big-num">{won(simple.each)}</strong>
            {simple.diff > 0 && <Paragraph.Text typography="t7" color="var(--sub)">{`총무가 ${won(simple.diff)} 더 걷어요 (커피값 이득 ☕)`}</Paragraph.Text>}
          </section>
          <div className="actions">
            <Button display="block" size="large" onClick={shareSimple} disabled={!num(total)}>
              단톡방에 보내기
            </Button>
          </div>
        </>
      )}

      {mode === 'detail' && (
        <>
          <section className="card">
            <div className="tf">
              <TextField
                variant="box"
                label="모임 이름 (선택)"
                labelOption="sustain"
                placeholder="예: 금요일 회식"
                maxLength={20}
                value={data.title}
                onChange={(e) => setData((d) => ({ ...d, title: e.target.value }))}
              />
            </div>
            <p className="label">{`사람 (${data.names.length}명)`}</p>
            <ul className="people">
              {data.names.map((n, i) => (
                <li key={i}>
                  <input aria-label={`${i + 1}번 이름`} value={n} maxLength={10} onChange={(e) => setName(i, e.target.value)} />
                  <Button size="small" variant="weak" color="dark" aria-label={`${names[i]} 빼기`} onClick={() => removePerson(i)} disabled={data.names.length <= 2}>
                    ×
                  </Button>
                </li>
              ))}
            </ul>
            <Button display="block" size="medium" variant="weak" onClick={addPerson}>
              사람 추가
            </Button>
          </section>

          <ListHeader
            title={
              <ListHeader.TitleParagraph typography="t5" fontWeight="bold">
                항목 추가
              </ListHeader.TitleParagraph>
            }
          />
          <section className="card">
            <div className="tf">
              <TextField variant="box" label="항목 이름" labelOption="sustain" placeholder="예: 1차 고기집" maxLength={20} value={itemName} onChange={(e) => setItemName(e.target.value)} />
            </div>
            <div className="tf">
              <TextField
                variant="box"
                label="금액"
                labelOption="sustain"
                suffix="원"
                inputMode="numeric"
                placeholder="0"
                value={itemAmount ? num(itemAmount).toLocaleString('ko-KR') : ''}
                onChange={(e) => setItemAmount(e.target.value)}
              />
            </div>
            <p className="label">누가 냈어요?</p>
            <div className="chips">
              {names.map((n, i) => (
                <Button key={i} size="small" variant={itemPayer === i ? 'fill' : 'weak'} color={itemPayer === i ? 'primary' : 'dark'} onClick={() => setItemPayer(i)}>
                  {n}
                </Button>
              ))}
            </div>
            <p className="label">누가 나눠 내요? (안 고르면 전원)</p>
            <div className="chips">
              {names.map((n, i) => (
                <Button
                  key={i}
                  size="small"
                  variant={itemSharers.includes(i) ? 'fill' : 'weak'}
                  color={itemSharers.includes(i) ? 'primary' : 'dark'}
                  aria-pressed={itemSharers.includes(i)}
                  onClick={() => setItemSharers((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]))}
                >
                  {n}
                </Button>
              ))}
            </div>
            <Button display="block" size="large" onClick={addItem}>
              항목 넣기
            </Button>
          </section>

          {data.items.length > 0 && (
            <>
              <ListHeader title={<ListHeader.TitleParagraph typography="t5" fontWeight="bold">{`항목 · 총 ${won(result.total)}`}</ListHeader.TitleParagraph>} />
              <ul className="list">
                {data.items.map((it) => (
                  <ListRow
                    key={it.id}
                    contents={
                      <ListRow.Texts
                        type="2RowTypeA"
                        top={`${it.name} · ${won(it.amount)}`}
                        bottom={`${names[it.payer]} 냄 · ${it.sharers.length ? it.sharers.map((s) => names[s]).join(', ') : '전원'}`}
                      />
                    }
                    right={
                      <Button
                        size="small"
                        variant="weak"
                        color="dark"
                        aria-label={`${it.name} 지우기`}
                        onClick={() =>
                          setData((d) => ({
                            ...d,
                            items: d.items.filter((x) => x.id !== it.id),
                          }))
                        }
                      >
                        삭제
                      </Button>
                    }
                  />
                ))}
              </ul>

              <ListHeader
                title={
                  <ListHeader.TitleParagraph typography="t5" fontWeight="bold">
                    이렇게 보내면 끝
                  </ListHeader.TitleParagraph>
                }
              />
              {result.transfers.length ? (
                <ul className="list">
                  {result.transfers.map((t, i) => (
                    <ListRow
                      key={i}
                      left={<span className="row-emoji">💸</span>}
                      contents={<ListRow.Texts type="1RowTypeA" top={`${names[t.from]} → ${names[t.to]}`} />}
                      right={<b className="amt">{won(t.amount)}</b>}
                    />
                  ))}
                </ul>
              ) : (
                <p className="empty">주고받을 돈이 없어요 👍</p>
              )}
              <section className="card">
                <p className="label">보낼 돈 끝자리</p>
                <div className="tf">
                  <SegmentedControl value={String(data.unit)} onChange={(v: string) => setData((d) => ({ ...d, unit: Number(v) }))}>
                    <SegmentedControl.Item value="1">1원</SegmentedControl.Item>
                    <SegmentedControl.Item value="10">10원</SegmentedControl.Item>
                    <SegmentedControl.Item value="100">100원</SegmentedControl.Item>
                    <SegmentedControl.Item value="1000">천원</SegmentedControl.Item>
                  </SegmentedControl>
                </div>
                {data.unit > 1 && (
                  <Paragraph.Text typography="t7" color="var(--sub)">
                    끝전은 받는 사람이 부담해요.
                  </Paragraph.Text>
                )}
                <details>
                  <summary>사람별 부담액 보기</summary>
                  <table className="kv">
                    <tbody>
                      {names.map((n, i) => (
                        <tr key={i}>
                          <th>{n}</th>
                          <td>{`부담 ${won(result.owe[i])} · 낸 돈 ${won(result.paid[i])}`}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </details>
              </section>
              <div className="actions">
                <Button display="block" size="large" onClick={shareDetail}>
                  단톡방에 정산 문구 보내기
                </Button>
                <Button display="block" size="medium" variant="weak" color="dark" onClick={() => setData((d) => ({ ...d, items: [], title: '' }))}>
                  새 모임 시작 (항목 지우기)
                </Button>
              </div>
            </>
          )}
        </>
      )}

      <p className="note" role="status">
        {status}
      </p>
      <p className="foot">
        계산만 해 드려요. 실제 송금은 각자 은행·송금 앱에서 해 주세요. 입력한 내용은 이 기기에만 저장돼요.
        {!inToss() && ' 지금은 토스 밖 미리보기 화면이에요.'}
      </p>
    </div>
  );
}
