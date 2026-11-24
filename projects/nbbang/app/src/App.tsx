import { useEffect, useMemo, useState } from 'react';
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
const DEFAULT: Saved = { title: '', names: ['나', '친구1', '친구2'], items: [], unit: 1 };

function restore(raw: string | null): Saved {
  try {
    const v = raw ? JSON.parse(raw) : null;
    if (!v || !Array.isArray(v.names) || !Array.isArray(v.items)) return DEFAULT;
    const names = v.names.filter((x: unknown) => typeof x === 'string').slice(0, 20);
    if (names.length < 2) return DEFAULT;
    const items = v.items.filter(
      (i: Item) => i && typeof i.id === 'string' && typeof i.name === 'string' && Number.isFinite(i.amount) && Number.isInteger(i.payer) && Array.isArray(i.sharers),
    );
    return { title: typeof v.title === 'string' ? v.title.slice(0, 20) : '', names, items, unit: [1, 10, 100, 1000].includes(v.unit) ? v.unit : 1 };
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

  const setName = (i: number, v: string) => setData((d) => ({ ...d, names: d.names.map((n, j) => (j === i ? v.slice(0, 10) : n)) }));
  const addPerson = () => setData((d) => (d.names.length >= 20 ? d : { ...d, names: [...d.names, `친구${d.names.length}`] }));
  const removePerson = (i: number) =>
    setData((d) => {
      if (d.names.length <= 2) return d;
      // 지운 사람이 낸 항목은 빼고, 나눠 낼 사람 번호를 당긴다
      const items = d.items
        .filter((it) => it.payer !== i)
        .map((it) => ({ ...it, payer: it.payer > i ? it.payer - 1 : it.payer, sharers: it.sharers.filter((s) => s !== i).map((s) => (s > i ? s - 1 : s)) }));
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
    setData((d) => ({ ...d, items: [...d.items, { id: newId(), name: itemName.trim().slice(0, 20) || `${d.items.length + 1}차`, amount, payer: Math.min(itemPayer, d.names.length - 1), sharers }] }));
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
    <main className="app">
      <header className="top">
        <h1>N빵 정산기</h1>
        <p>모임 끝나고 "누가 누구한테 얼마?" 1분이면 끝나요.</p>
      </header>

      <nav className="tabs" role="tablist">
        <button role="tab" aria-selected={mode === 'simple'} className={mode === 'simple' ? 'on' : ''} type="button" onClick={() => setMode('simple')}>
          간단 N빵
        </button>
        <button role="tab" aria-selected={mode === 'detail'} className={mode === 'detail' ? 'on' : ''} type="button" onClick={() => setMode('detail')}>
          항목별 정산
        </button>
      </nav>

      {mode === 'simple' && (
        <section className="card">
          <label htmlFor="total">총 금액</label>
          <div className="input-row">
            <input id="total" inputMode="numeric" value={total ? num(total).toLocaleString('ko-KR') : ''} onChange={(e) => setTotal(e.target.value)} placeholder="0" />
            <span>원</span>
          </div>
          <div className="stepper">
            <span>인원</span>
            <button type="button" aria-label="한 명 빼기" onClick={() => setPeople((n) => Math.max(2, n - 1))}>
              −
            </button>
            <b>{people}명</b>
            <button type="button" aria-label="한 명 더하기" onClick={() => setPeople((n) => Math.min(50, n + 1))}>
              +
            </button>
          </div>
          <p className="label">끝자리 맞추기</p>
          <div className="chips">
            {[1, 100, 1000].map((u) => (
              <button key={u} type="button" className={simpleUnit === u ? 'on' : ''} onClick={() => setSimpleUnit(u)}>
                {u === 1 ? '1원까지' : `${won(u)} 단위`}
              </button>
            ))}
          </div>
          <div className="answer">
            <small>1인당</small>
            <strong>{won(simple.each)}</strong>
            {simple.diff > 0 && <small>총무가 {won(simple.diff)} 더 걷어요(커피값 이득 ☕)</small>}
          </div>
          <button className="primary" type="button" onClick={shareSimple} disabled={!num(total)}>
            단톡방에 보내기
          </button>
        </section>
      )}

      {mode === 'detail' && (
        <>
          <section className="card">
            <label htmlFor="title">모임 이름(선택)</label>
            <input id="title" className="plain" value={data.title} maxLength={20} onChange={(e) => setData((d) => ({ ...d, title: e.target.value }))} placeholder="예: 금요일 회식" />
            <p className="label">사람 ({data.names.length}명)</p>
            <ul className="people">
              {data.names.map((n, i) => (
                <li key={i}>
                  <input aria-label={`${i + 1}번 이름`} value={n} maxLength={10} onChange={(e) => setName(i, e.target.value)} />
                  <button type="button" aria-label={`${names[i]} 빼기`} onClick={() => removePerson(i)} disabled={data.names.length <= 2}>
                    ×
                  </button>
                </li>
              ))}
            </ul>
            <button className="ghost" type="button" onClick={addPerson}>
              + 사람 추가
            </button>
          </section>

          <section className="card">
            <h2>항목 추가</h2>
            <input className="plain" aria-label="항목 이름" value={itemName} maxLength={20} onChange={(e) => setItemName(e.target.value)} placeholder="예: 1차 고기집" />
            <div className="input-row">
              <input aria-label="금액" inputMode="numeric" value={itemAmount ? num(itemAmount).toLocaleString('ko-KR') : ''} onChange={(e) => setItemAmount(e.target.value)} placeholder="0" />
              <span>원</span>
            </div>
            <p className="label">누가 냈어요?</p>
            <div className="chips wrap">
              {names.map((n, i) => (
                <button key={i} type="button" className={itemPayer === i ? 'on' : ''} onClick={() => setItemPayer(i)}>
                  {n}
                </button>
              ))}
            </div>
            <p className="label">누가 나눠 내요? (안 고르면 전원)</p>
            <div className="chips wrap">
              {names.map((n, i) => (
                <button
                  key={i}
                  type="button"
                  className={itemSharers.includes(i) ? 'on soft' : ''}
                  aria-pressed={itemSharers.includes(i)}
                  onClick={() => setItemSharers((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]))}
                >
                  {n}
                </button>
              ))}
            </div>
            <button className="primary" type="button" onClick={addItem}>
              항목 넣기
            </button>
          </section>

          {data.items.length > 0 && (
            <section className="card">
              <h2>항목 ({won(result.total)})</h2>
              <ul className="items">
                {data.items.map((it) => (
                  <li key={it.id}>
                    <span>
                      <b>{it.name}</b>
                      <small>
                        {names[it.payer]} 냄 · {it.sharers.length ? it.sharers.map((s) => names[s]).join(', ') : '전원'}
                      </small>
                    </span>
                    <span className="amt">{won(it.amount)}</span>
                    <button type="button" aria-label={`${it.name} 지우기`} onClick={() => setData((d) => ({ ...d, items: d.items.filter((x) => x.id !== it.id) }))}>
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {data.items.length > 0 && (
            <section className="card result">
              <h2>💸 이렇게 보내면 끝</h2>
              {result.transfers.length ? (
                <ul className="transfers">
                  {result.transfers.map((t, i) => (
                    <li key={i}>
                      <b>{names[t.from]}</b> → <b>{names[t.to]}</b>
                      <span>{won(t.amount)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>주고받을 돈이 없어요 👍</p>
              )}
              <p className="label">보낼 돈 끝자리</p>
              <div className="chips">
                {[1, 10, 100, 1000].map((u) => (
                  <button key={u} type="button" className={data.unit === u ? 'on' : ''} onClick={() => setData((d) => ({ ...d, unit: u }))}>
                    {u === 1 ? '1원' : won(u)}
                  </button>
                ))}
              </div>
              {data.unit > 1 && <p className="note">끝전은 받는 사람이 부담해요.</p>}
              <details>
                <summary>사람별 부담액 보기</summary>
                <table>
                  <tbody>
                    {names.map((n, i) => (
                      <tr key={i}>
                        <th>{n}</th>
                        <td>부담 {won(result.owe[i])}</td>
                        <td>낸 돈 {won(result.paid[i])}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
              <button className="primary" type="button" onClick={shareDetail}>
                단톡방에 정산 문구 보내기
              </button>
              <button className="ghost" type="button" onClick={() => setData((d) => ({ ...d, items: [], title: '' }))}>
                새 모임 시작(항목 지우기)
              </button>
            </section>
          )}
        </>
      )}

      <p className="note" role="status">
        {status}
      </p>
      <footer className="foot">계산만 해 드려요. 실제 송금은 각자 은행·송금 앱에서 해 주세요. 입력한 내용은 이 기기에만 저장돼요.{!inToss() && ' 지금은 토스 밖 미리보기 화면이에요.'}</footer>
    </main>
  );
}
