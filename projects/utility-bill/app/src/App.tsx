import { useEffect, useState } from 'react';
import { DEFAULT_MJ_PER_M3, SEOUL_GAS_BASE, SEOUL_GAS_UNIT, electricBill, gasBill, isSummer, m3ToMj, tiers, won, type Voltage } from './lib/bill';
import { appLink, inToss, loadItem, saveItem, shareText } from './lib/toss';

const STORE_KEY = 'bill.v1';
type Tab = 'electric' | 'gas';

interface Saved {
  kwh: string;
  voltage: Voltage;
  gasMode: 'mj' | 'm3';
  gasAmount: string;
  unit: string;
  base: string;
  mjPerM3: string;
}
const DEFAULT: Saved = { kwh: '', voltage: 'high', gasMode: 'mj', gasAmount: '', unit: String(SEOUL_GAS_UNIT), base: String(SEOUL_GAS_BASE), mjPerM3: String(DEFAULT_MJ_PER_M3) };

const num = (s: string) => {
  const n = Number(String(s).replace(/,/g, ''));
  return Number.isFinite(n) && n > 0 ? n : 0;
};

function Field({ id, label, unit, value, onChange, hint, decimal }: { id: string; label: string; unit: string; value: string; onChange: (v: string) => void; hint?: string; decimal?: boolean }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="input-row">
        <input id={id} inputMode={decimal ? 'decimal' : 'numeric'} value={value} onChange={(e) => onChange(e.target.value.replace(decimal ? /[^\d.]/g : /[^\d]/g, ''))} placeholder="0" autoComplete="off" />
        <span>{unit}</span>
      </div>
      {hint && <p className="hint">{hint}</p>}
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState<Tab>('electric');
  const [data, setData] = useState<Saved>(DEFAULT);
  const [loaded, setLoaded] = useState(false);
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [status, setStatus] = useState('');

  useEffect(() => {
    loadItem(STORE_KEY).then((raw) => {
      try {
        const v = raw ? JSON.parse(raw) : null;
        if (v && typeof v === 'object') setData({ ...DEFAULT, ...Object.fromEntries(Object.entries(v).filter(([k, x]) => k in DEFAULT && typeof x === 'string')) });
      } catch {
        /* 무시 */
      }
      setLoaded(true);
    });
  }, []);
  useEffect(() => {
    if (loaded) saveItem(STORE_KEY, JSON.stringify(data));
  }, [data, loaded]);
  const set = (k: keyof Saved) => (v: string) => setData((d) => ({ ...d, [k]: v }));

  const e = electricBill(num(data.kwh), data.voltage, month);
  const ts = tiers(data.voltage, month);
  const mj = data.gasMode === 'mj' ? num(data.gasAmount) : m3ToMj(num(data.gasAmount), num(data.mjPerM3) || DEFAULT_MJ_PER_M3);
  const g = gasBill(mj, num(data.unit), num(data.base));

  const share = async () => {
    const text =
      tab === 'electric'
        ? `[우리집 공과금 계산] ${month}월 전기 ${e.kwh}kWh → 예상 ${won(e.total)} (누진 ${e.tier}단계)`
        : `[우리집 공과금 계산] 도시가스 ${Math.round(mj).toLocaleString('ko-KR')}MJ → 예상 ${won(g.total)}`;
    const r = await shareText(`${text}\n우리 집도 계산해 보기: ${await appLink()}`);
    setStatus(r === 'shared' ? '' : r === 'copied' ? '문구를 복사했어요.' : '공유가 막혔어요.');
  };

  return (
    <main className="app">
      <header className="top">
        <h1>우리집 공과금 계산</h1>
        <p>전기 몇 kWh, 가스 몇 MJ 쓰면 얼마 나올까? 고지서 전에 미리 계산해요.</p>
      </header>

      <nav className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'electric'} className={tab === 'electric' ? 'on' : ''} type="button" onClick={() => setTab('electric')}>
          ⚡ 전기요금
        </button>
        <button role="tab" aria-selected={tab === 'gas'} className={tab === 'gas' ? 'on' : ''} type="button" onClick={() => setTab('gas')}>
          🔥 도시가스
        </button>
      </nav>

      {tab === 'electric' && (
        <>
          <section className="card">
            <p className="label">사는 곳</p>
            <div className="chips">
              <button type="button" className={data.voltage === 'high' ? 'on' : ''} onClick={() => setData((d) => ({ ...d, voltage: 'high' }))}>
                아파트(고압)
              </button>
              <button type="button" className={data.voltage === 'low' ? 'on' : ''} onClick={() => setData((d) => ({ ...d, voltage: 'low' }))}>
                단독·빌라(저압)
              </button>
            </div>
            <p className="hint">아파트 대부분은 고압이에요. 정확한 건 고지서의 '계약종별'에서 확인하세요.</p>
            <label htmlFor="month" className="label">
              몇 월 요금?
            </label>
            <select id="month" value={month} onChange={(ev) => setMonth(Number(ev.target.value))}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {m}월{isSummer(m) ? ' (여름 누진 완화)' : ''}
                </option>
              ))}
            </select>
            <Field id="kwh" label="한 달 사용량" unit="kWh" value={data.kwh} onChange={set('kwh')} hint="고지서나 한전ON 앱의 '사용량'이에요. 1인 가구는 보통 150~250kWh." />
          </section>

          <section className="result">
            <small>예상 전기요금</small>
            <strong>{won(e.total)}</strong>
            <span className={`tier t${e.tier}`}>누진 {e.tier}단계</span>
            <div className="meter" aria-hidden>
              {ts.map((_, i) => (
                <i key={i} className={e.tier > i ? 'on' : ''} />
              ))}
            </div>
            {e.toNextTier !== null && e.kwh > 0 && <p>{e.toNextTier}kWh 더 쓰면 {e.tier + 1}단계로 올라가요.</p>}
            {e.tier === 3 && <p>3단계 구간이에요. 사용량을 조금만 줄여도 요금이 크게 줄어요.</p>}
          </section>

          <details className="card">
            <summary>계산 내역 보기</summary>
            <table>
              <tbody>
                <tr><th>기본요금({e.tier}단계)</th><td>{won(e.base)}</td></tr>
                <tr><th>전력량요금</th><td>{won(e.energy)}</td></tr>
                <tr><th>기후환경요금(9원/kWh)</th><td>{won(e.climate)}</td></tr>
                <tr><th>연료비조정요금(5원/kWh)</th><td>{won(e.fuel)}</td></tr>
                <tr className="sum"><th>전기요금계</th><td>{won(e.subtotal)}</td></tr>
                <tr><th>부가가치세(10%)</th><td>{won(e.vat)}</td></tr>
                <tr><th>전력산업기반기금(2.7%)</th><td>{won(e.fund)}</td></tr>
                <tr className="sum"><th>청구 예상액</th><td>{won(e.total)}</td></tr>
              </tbody>
            </table>
            <p className="hint">
              {isSummer(month) ? '7~8월은 1단계 300kWh, 2단계 450kWh까지예요.' : '1단계 200kWh, 2단계 400kWh까지예요.'} 하계·동계에 1,000kWh를 넘으면 초과분에 슈퍼유저 요금이 붙어요.
            </p>
          </details>
        </>
      )}

      {tab === 'gas' && (
        <>
          <section className="card">
            <p className="label">사용량 단위</p>
            <div className="chips">
              <button type="button" className={data.gasMode === 'mj' ? 'on' : ''} onClick={() => setData((d) => ({ ...d, gasMode: 'mj' }))}>
                MJ(메가줄)
              </button>
              <button type="button" className={data.gasMode === 'm3' ? 'on' : ''} onClick={() => setData((d) => ({ ...d, gasMode: 'm3' }))}>
                m³(검침량)
              </button>
            </div>
            <Field id="gas" label="한 달 사용량" unit={data.gasMode === 'mj' ? 'MJ' : 'm³'} value={data.gasAmount} onChange={set('gasAmount')} decimal />
            {data.gasMode === 'm3' && <Field id="mjm3" label="열량(고지서의 MJ/m³)" unit="MJ/m³" value={data.mjPerM3} onChange={set('mjPerM3')} decimal hint="고지서에 적힌 값을 쓰면 정확해요. 모르면 42.7로 두세요." />}
            <details>
              <summary>지역 단가 바꾸기 (기본: 서울)</summary>
              <Field id="unit" label="MJ당 단가" unit="원/MJ" value={data.unit} onChange={set('unit')} decimal hint="서울 주택용 22.5268원(2026년 11월). 다른 지역은 고지서의 단가를 넣어 주세요." />
              <Field id="base" label="기본요금" unit="원" value={data.base} onChange={set('base')} />
            </details>
          </section>

          <section className="result gas">
            <small>예상 가스요금</small>
            <strong>{won(g.total)}</strong>
            {data.gasMode === 'm3' && mj > 0 && <p>{Math.round(mj).toLocaleString('ko-KR')}MJ로 계산했어요.</p>}
            <table>
              <tbody>
                <tr><th>기본요금</th><td>{won(g.base)}</td></tr>
                <tr><th>사용요금</th><td>{won(g.usage)}</td></tr>
                <tr><th>부가가치세(10%)</th><td>{won(g.vat)}</td></tr>
              </tbody>
            </table>
          </section>
          <p className="hint center">난방비 절약: 실내 온도 1℃만 낮춰도 가스 사용량이 줄어요. 외출할 땐 '외출' 모드를 쓰세요.</p>
        </>
      )}

      <button className="ghost" type="button" onClick={share}>
        가족에게 공유하기
      </button>
      <p className="note" role="status">
        {status}
      </p>
      <footer className="foot">2026년 11월 기준 공개 요금표로 계산한 예상액이에요. 복지 할인, 대가족 할인, 검침일, 지역별 단가에 따라 실제 고지서와 다를 수 있어요. 입력값은 이 기기에만 저장돼요.{!inToss() && ' 지금은 토스 밖 미리보기 화면이에요.'}</footer>
    </main>
  );
}
