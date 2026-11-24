import { useState } from 'react';
import { COMMON_UNITS, DEFAULT_EXCLUSIVE_RATIO, fmt, parse, pyeongToSqm, roomArea, sqmToPyeong, supplyFromExclusive, typeName } from './lib/area';
import { appLink, inToss, shareText } from './lib/toss';

type Tab = 'convert' | 'apt' | 'room';

export default function App() {
  const [tab, setTab] = useState<Tab>('convert');
  const [pyeong, setPyeong] = useState('');
  const [sqm, setSqm] = useState('');
  const [exclusive, setExclusive] = useState('84');
  const [ratio, setRatio] = useState(Math.round(DEFAULT_EXCLUSIVE_RATIO * 100));
  const [w, setW] = useState('');
  const [d, setD] = useState('');
  const [status, setStatus] = useState('');

  const onPyeong = (v: string) => {
    const s = v.replace(/[^\d.,]/g, '');
    setPyeong(s);
    setSqm(parse(s) ? fmt(pyeongToSqm(parse(s)), 2) : '');
  };
  const onSqm = (v: string) => {
    const s = v.replace(/[^\d.,]/g, '');
    setSqm(s);
    setPyeong(parse(s) ? fmt(sqmToPyeong(parse(s)), 2) : '');
  };

  const ex = parse(exclusive);
  const supply = supplyFromExclusive(ex, ratio / 100);
  const room = roomArea(parse(w), parse(d));

  const share = async () => {
    const text =
      tab === 'apt' && ex
        ? `[평수 계산기] 전용 ${fmt(ex)}㎡(${fmt(sqmToPyeong(ex))}평) → 공급 약 ${fmt(sqmToPyeong(supply))}평, ${typeName(sqmToPyeong(supply))}`
        : tab === 'room' && room.sqm
          ? `[평수 계산기] 방 ${w}m × ${d}m = ${fmt(room.sqm)}㎡, 약 ${fmt(room.pyeong)}평`
          : `[평수 계산기] ${pyeong || 0}평 = ${sqm || 0}㎡`;
    const r = await shareText(`${text}\n평수 계산해 보기: ${await appLink()}`);
    setStatus(r === 'shared' ? '' : r === 'copied' ? '문구를 복사했어요.' : '공유가 막혔어요.');
  };

  return (
    <main className="app">
      <header className="top">
        <h1>평수 계산기</h1>
        <p>평 ↔ ㎡ 바꾸기, 아파트 전용·공급면적, 방 크기까지</p>
      </header>

      <nav className="tabs" role="tablist">
        {(
          [
            ['convert', '평 ↔ ㎡'],
            ['apt', '아파트 평형'],
            ['room', '방 넓이'],
          ] as [Tab, string][]
        ).map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'on' : ''} type="button" onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </nav>

      {tab === 'convert' && (
        <section className="card">
          <label htmlFor="py">평</label>
          <div className="input-row">
            <input id="py" inputMode="decimal" value={pyeong} onChange={(e) => onPyeong(e.target.value)} placeholder="0" />
            <span>평</span>
          </div>
          <p className="swap" aria-hidden>
            ⇅
          </p>
          <label htmlFor="m2">제곱미터</label>
          <div className="input-row">
            <input id="m2" inputMode="decimal" value={sqm} onChange={(e) => onSqm(e.target.value)} placeholder="0" />
            <span>㎡</span>
          </div>
          <p className="hint">1평 = 3.3058㎡ (400/121㎡). 어느 칸에 넣어도 바로 바뀌어요.</p>
        </section>
      )}

      {tab === 'apt' && (
        <>
          <section className="card">
            <label htmlFor="ex">전용면적 (분양 공고·등기부의 ㎡)</label>
            <div className="input-row">
              <input id="ex" inputMode="decimal" value={exclusive} onChange={(e) => setExclusive(e.target.value.replace(/[^\d.]/g, ''))} placeholder="84" />
              <span>㎡</span>
            </div>
            <div className="chips">
              {COMMON_UNITS.map((u) => (
                <button key={u} type="button" className={parse(exclusive) === u ? 'on' : ''} onClick={() => setExclusive(String(u))}>
                  {u}
                </button>
              ))}
            </div>
            <label htmlFor="ratio">
              전용률 <b>{ratio}%</b> <small>(아파트는 보통 70~80%)</small>
            </label>
            <input id="ratio" type="range" min={60} max={90} value={ratio} onChange={(e) => setRatio(Number(e.target.value))} />
          </section>
          {ex > 0 && (
            <section className="result">
              <small>흔히 부르는 크기</small>
              <strong>{typeName(sqmToPyeong(supply))}</strong>
              <table>
                <tbody>
                  <tr>
                    <th>전용면적</th>
                    <td>
                      {fmt(ex)}㎡ · {fmt(sqmToPyeong(ex))}평
                    </td>
                  </tr>
                  <tr>
                    <th>공급면적(약)</th>
                    <td>
                      {fmt(supply)}㎡ · {fmt(sqmToPyeong(supply))}평
                    </td>
                  </tr>
                </tbody>
              </table>
              <p className="hint">공급면적 = 전용 + 계단·복도 같은 주거공용. 단지마다 전용률이 달라 정확한 값은 분양 공고를 확인하세요.</p>
            </section>
          )}
        </>
      )}

      {tab === 'room' && (
        <>
          <section className="card">
            <div className="two">
              <div>
                <label htmlFor="w">가로</label>
                <div className="input-row">
                  <input id="w" inputMode="decimal" value={w} onChange={(e) => setW(e.target.value.replace(/[^\d.]/g, ''))} placeholder="3" />
                  <span>m</span>
                </div>
              </div>
              <div>
                <label htmlFor="d">세로</label>
                <div className="input-row">
                  <input id="d" inputMode="decimal" value={d} onChange={(e) => setD(e.target.value.replace(/[^\d.]/g, ''))} placeholder="3.5" />
                  <span>m</span>
                </div>
              </div>
            </div>
            <p className="hint">줄자로 잰 cm는 100으로 나눠 m로 넣어요. 예: 350cm → 3.5</p>
          </section>
          {room.sqm > 0 && (
            <section className="result">
              <small>방 넓이</small>
              <strong>{fmt(room.pyeong)}평</strong>
              <p>{fmt(room.sqm, 2)}㎡</p>
            </section>
          )}
        </>
      )}

      <button className="ghost" type="button" onClick={share}>
        결과 공유하기
      </button>
      <p className="note" role="status">
        {status}
      </p>
      <footer className="foot">계산 참고용이에요. 계약·세금 신고에는 등기부·분양 공고의 공식 면적을 쓰세요.{!inToss() && ' 지금은 토스 밖 미리보기 화면이에요.'}</footer>
    </main>
  );
}
