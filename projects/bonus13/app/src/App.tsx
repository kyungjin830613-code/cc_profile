import { useEffect, useMemo, useState } from 'react';
import { cardThresholdLeft, estimate, pensionCredit, won, type TaxInput } from './lib/tax';
import { appLink, inToss, loadItem, saveItem, shareText } from './lib/toss';

const STORE_KEY = 'inputs.v1';
const M = 10_000;

/** 화면 입력값(금액은 만원 단위 문자열) */
interface Form {
  salary: string;
  prepaidMonthly: string;
  people: string;
  kidsUnder18: string;
  kidsForCredit: string;
  insurance: string;
  credit: string;
  debit: string;
  pensionSavings: string;
  irp: string;
  rent: string;
  homeless: boolean;
}

const EMPTY: Form = {
  salary: '',
  prepaidMonthly: '',
  people: '1',
  kidsUnder18: '0',
  kidsForCredit: '0',
  insurance: '',
  credit: '',
  debit: '',
  pensionSavings: '',
  irp: '',
  rent: '',
  homeless: false,
};

const num = (s: string) => {
  const n = Number(s.replace(/,/g, ''));
  return Number.isFinite(n) && n > 0 ? n : 0;
};

function toInput(f: Form): TaxInput {
  const pensionSavings = num(f.pensionSavings) * M;
  return {
    salary: num(f.salary) * M,
    people: Math.max(1, Math.floor(num(f.people))),
    kidsUnder18: Math.floor(num(f.kidsUnder18)),
    kidsForCredit: Math.floor(num(f.kidsForCredit)),
    insurance: f.insurance.trim() === '' ? null : num(f.insurance) * M,
    credit: num(f.credit) * M,
    debit: num(f.debit) * M,
    pension: pensionSavings + num(f.irp) * M,
    pensionSavingsOnly: pensionSavings,
    rent: f.homeless ? num(f.rent) * M : 0,
    // 급여명세서의 월 소득세 × 12. 원 단위로 받는다.
    prepaid: num(f.prepaidMonthly) * 12,
  };
}

function Field({ id, label, hint, unit, value, onChange }: { id: keyof Form; label: string; hint?: string; unit: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="input-row">
        <input id={id} inputMode="numeric" autoComplete="off" value={value} onChange={(e) => onChange(e.target.value.replace(/[^\d,]/g, ''))} placeholder="0" />
        <span>{unit}</span>
      </div>
      {hint && <p className="hint">{hint}</p>}
    </div>
  );
}

export default function App() {
  const [form, setForm] = useState<Form>(EMPTY);
  const [shown, setShown] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    loadItem(STORE_KEY).then((raw) => {
      if (!raw) return;
      try {
        const v = JSON.parse(raw);
        if (v && typeof v === 'object') setForm({ ...EMPTY, ...Object.fromEntries(Object.entries(v).filter(([k]) => k in EMPTY)) });
      } catch {
        /* 무시 */
      }
    });
  }, []);

  const set = (k: keyof Form) => (v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));
  const input = useMemo(() => toInput(form), [form]);
  const r = useMemo(() => estimate(input), [input]);
  const ready = input.salary > 0 && input.prepaid > 0;

  const submit = () => {
    if (!ready) {
      setStatus('연봉과 월 소득세를 넣어 주세요.');
      return;
    }
    setStatus('');
    setShown(true);
    saveItem(STORE_KEY, JSON.stringify(form));
    setTimeout(() => document.getElementById('result')?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  // 절세 팁
  const tips: string[] = [];
  if (ready) {
    const left = cardThresholdLeft(input.salary, input.credit, input.debit);
    if (left > 0) tips.push(`카드를 ${won(left)} 더 써야 카드 소득공제가 시작돼요. 그 전까지는 혜택 좋은 신용카드, 넘으면 체크카드·현금영수증(공제율 2배)이 유리해요.`);
    else tips.push('카드 공제 문턱(총급여의 25%)을 넘었어요. 남은 기간은 체크카드·현금영수증을 쓰면 공제율이 신용카드의 2배예요.');
    const room = Math.max(0, 900 * M - input.pension);
    if (room > 0) {
      const more = Math.min(room, 100 * M);
      const gain = pensionCredit(input.salary, input.pension + more, Math.min(input.pensionSavingsOnly + more, 600 * M)) - r.credits.pension;
      if (gain > 0 && r.decided > 0) tips.push(`12월 31일 전에 연금저축·IRP에 ${won(more)} 더 넣으면 세금이 최대 약 ${won(Math.min(gain, r.decided) * 1.1)} 줄어요(지방소득세 포함).`);
    }
    if (!form.homeless && input.salary <= 8_000 * M) tips.push('무주택 세대주이고 월세를 산다면 월세 세액공제(최대 17%)를 꼭 챙기세요.');
    tips.push('보험료·의료비·교육비·기부금이 많으면 표준세액공제(13만원)보다 더 돌려받을 수 있어요. 홈택스 간소화 자료로 확인하세요.');
  }

  const share = async () => {
    const msg =
      r.refund >= 0
        ? `[13월의 월급 미리보기] 올해 연말정산, 대략 ${won(r.refund)} 돌려받을 것 같아요 💸`
        : `[13월의 월급 미리보기] 올해 연말정산, 대략 ${won(r.refund)} 더 낼 것 같아요 😭 지금이라도 절세 준비!`;
    const res = await shareText(`${msg}\n나도 계산해 보기: ${await appLink()}`);
    setStatus(res === 'shared' ? '' : res === 'copied' ? '문구를 복사했어요.' : '공유가 막혔어요.');
  };

  return (
    <main className="app">
      <header className="top">
        <p className="badge">2026년 귀속 · 2027년 1월 정산</p>
        <h1>13월의 월급 미리보기</h1>
        <p>연봉과 카드 사용액만 넣으면, 연말정산에서 돌려받을지 더 낼지 1분 만에 미리 봐요.</p>
      </header>

      <section className="card">
        <h2>1. 월급</h2>
        <Field id="salary" label="올해 총급여(세전 연봉, 비과세 제외)" unit="만원" value={form.salary} onChange={set('salary')} hint="성과급 포함. 식대 같은 비과세 수당은 빼고 넣어요." />
        <Field id="prepaidMonthly" label="급여명세서의 월 소득세" unit="원" value={form.prepaidMonthly} onChange={set('prepaidMonthly')} hint="지방소득세 말고 '소득세' 칸이에요. 달마다 다르면 평균을 넣어요." />
        <Field id="insurance" label="4대보험 연간 합계(국민연금+건강+고용)" unit="만원" value={form.insurance} onChange={set('insurance')} hint="모르면 비워 두세요. 총급여의 9%로 어림잡아요." />
      </section>

      <section className="card">
        <h2>2. 가족</h2>
        <Field id="people" label="기본공제 받는 사람 수(나 포함)" unit="명" value={form.people} onChange={set('people')} hint="소득이 거의 없는 배우자·자녀·부모님 등. 1인 가구면 1." />
        <Field id="kidsUnder18" label="그중 18세 미만 자녀" unit="명" value={form.kidsUnder18} onChange={set('kidsUnder18')} hint="카드 공제 한도가 늘어나요." />
        <Field id="kidsForCredit" label="자녀세액공제 대상 자녀" unit="명" value={form.kidsForCredit} onChange={set('kidsForCredit')} hint="아동수당을 받지 않는 20세 이하 자녀예요." />
      </section>

      <section className="card">
        <h2>3. 올해 쓴 돈·모은 돈</h2>
        <Field id="credit" label="신용카드 사용액(1년)" unit="만원" value={form.credit} onChange={set('credit')} />
        <Field id="debit" label="체크카드 + 현금영수증(1년)" unit="만원" value={form.debit} onChange={set('debit')} />
        <Field id="pensionSavings" label="연금저축 납입액" unit="만원" value={form.pensionSavings} onChange={set('pensionSavings')} />
        <Field id="irp" label="IRP 납입액" unit="만원" value={form.irp} onChange={set('irp')} />
        <label className="check">
          <input type="checkbox" checked={form.homeless} onChange={(e) => set('homeless')(e.target.checked)} />
          <span>집이 없는 세대주이고 월세를 내요</span>
        </label>
        {form.homeless && <Field id="rent" label="올해 낸 월세 합계" unit="만원" value={form.rent} onChange={set('rent')} hint="총급여 8,000만원 이하만 공제돼요." />}
      </section>

      <button className="primary" type="button" onClick={submit}>
        내 13월의 월급 계산하기
      </button>
      <p className="error" role="alert">
        {status && !shown ? status : ''}
      </p>

      {shown && ready && (
        <section id="result" className="result">
          <div className={`big ${r.refund >= 0 ? 'plus' : 'minus'}`}>
            <p>연말정산 예상</p>
            <strong>{won(r.refund)}</strong>
            <span className="verb">{r.refund >= 0 ? '돌려받아요' : '더 내요'}</span>
            <small>지방소득세 포함 · 대략적인 추정이에요</small>
          </div>

          <div className="card">
            <h2>이렇게 계산했어요</h2>
            <table>
              <tbody>
                <tr><th>총급여</th><td>{won(input.salary)}</td></tr>
                <tr><th>− 근로소득공제</th><td>{won(r.earnedDeduction)}</td></tr>
                <tr><th>− 인적공제({input.people}명)</th><td>{won(r.personal)}</td></tr>
                <tr><th>− 4대보험{r.insuranceGuessed ? '(추정)' : ''}</th><td>{won(r.insurance)}</td></tr>
                <tr><th>− 카드 소득공제</th><td>{won(r.card)}</td></tr>
                <tr className="sum"><th>= 과세표준</th><td>{won(r.base)}</td></tr>
                <tr><th>산출세액</th><td>{won(r.computed)}</td></tr>
                <tr><th>− 근로소득세액공제</th><td>{won(r.credits.earned)}</td></tr>
                {r.credits.child > 0 && <tr><th>− 자녀세액공제</th><td>{won(r.credits.child)}</td></tr>}
                {r.credits.pension > 0 && <tr><th>− 연금계좌 세액공제</th><td>{won(r.credits.pension)}</td></tr>}
                {r.credits.rent > 0 && <tr><th>− 월세 세액공제</th><td>{won(r.credits.rent)}</td></tr>}
                <tr><th>− 표준세액공제</th><td>{won(r.credits.standard)}</td></tr>
                <tr className="sum"><th>= 낼 세금(지방세 포함)</th><td>{won(r.decidedWithLocal)}</td></tr>
                <tr><th>이미 낸 세금(지방세 포함)</th><td>{won(r.prepaidWithLocal)}</td></tr>
              </tbody>
            </table>
          </div>

          <div className="card">
            <h2>남은 기간 절세 팁</h2>
            <ul className="tips">
              {tips.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>

          <button className="ghost" type="button" onClick={share}>
            친구에게 공유하기
          </button>
          <p className="note" role="status">
            {status}
          </p>
        </section>
      )}

      <footer className="foot">
        <p>
          2026년 귀속 세법 기준의 간이 계산이에요. 보험료·의료비·교육비·기부금, 주택자금, 전통시장·대중교통 추가공제 등은 넣지 않았어요. 정확한 금액은 회사 연말정산이나 홈택스
          「연말정산 미리보기」로 확인하세요. 세무 상담이 아니에요.
        </p>
        <p>입력한 금액은 이 기기에만 저장되고 서버로 보내지 않아요.{!inToss() && ' 지금은 토스 밖 미리보기 화면이에요.'}</p>
      </footer>
    </main>
  );
}
