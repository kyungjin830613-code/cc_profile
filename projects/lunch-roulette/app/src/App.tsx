import { useEffect, useMemo, useState } from 'react';
import { BASE_MENUS, CATEGORY_COLOR, CATEGORY_NAME, addCustom, addEaten, candidates, dayOf, pick, wheelSlots, type Category, type Eaten, type Menu } from './lib/menu';
import { appLink, inToss, loadItem, saveItem, shareText } from './lib/toss';

const STORE_KEY = 'lunch.v1';
const CATS = Object.keys(CATEGORY_NAME) as Category[];

interface Saved {
  off: Category[];
  avoidDays: number;
  custom: Menu[];
  eaten: Eaten[];
}
const DEFAULT: Saved = { off: [], avoidDays: 3, custom: [], eaten: [] };

function restore(raw: string | null): Saved {
  try {
    const v = raw ? JSON.parse(raw) : null;
    if (!v) return DEFAULT;
    return {
      off: Array.isArray(v.off) ? v.off.filter((c: Category) => CATS.includes(c)) : [],
      avoidDays: [0, 3, 7].includes(v.avoidDays) ? v.avoidDays : 3,
      custom: Array.isArray(v.custom) ? v.custom.filter((x: Menu) => x && typeof x.name === 'string' && CATS.includes(x.cat)).slice(0, 30) : [],
      eaten: Array.isArray(v.eaten) ? v.eaten.filter((e: Eaten) => e && typeof e.name === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(e.day)).slice(0, 30) : [],
    };
  } catch {
    return DEFAULT;
  }
}

function Wheel({ slots, rotation }: { slots: Menu[]; rotation: number }) {
  const n = Math.max(1, slots.length);
  const a = (2 * Math.PI) / n;
  const r = 150;
  return (
    <div className="wheel-wrap">
      <div className="pointer" aria-hidden>
        ▼
      </div>
      <svg viewBox="-160 -160 320 320" className="wheel" style={{ transform: `rotate(${rotation}deg)` }} aria-hidden>
        {slots.map((s, i) => {
          // 0번 칸의 가운데가 위(12시)에 오도록
          const start = i * a - a / 2 - Math.PI / 2;
          const end = start + a;
          const large = a > Math.PI ? 1 : 0;
          const x1 = r * Math.cos(start);
          const y1 = r * Math.sin(start);
          const x2 = r * Math.cos(end);
          const y2 = r * Math.sin(end);
          const mid = start + a / 2;
          const tx = 98 * Math.cos(mid);
          const ty = 98 * Math.sin(mid);
          return (
            <g key={s.name}>
              {n === 1 ? <circle r={r} fill={CATEGORY_COLOR[s.cat]} /> : <path d={`M0 0 L${x1} ${y1} A${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`} fill={CATEGORY_COLOR[s.cat]} stroke="#fff" strokeWidth="3" />}
              <text x={tx} y={ty} transform={`rotate(${(mid * 180) / Math.PI + 90} ${tx} ${ty})`} textAnchor="middle" dominantBaseline="middle" fontSize={s.name.length > 5 ? 13 : 16} fontWeight="800" fill="#fff">
                {s.name}
              </text>
            </g>
          );
        })}
        <circle r="26" fill="#fff" stroke="#2b2b2b" strokeWidth="5" />
      </svg>
    </div>
  );
}

export default function App() {
  const [data, setData] = useState<Saved>(DEFAULT);
  const [loaded, setLoaded] = useState(false);
  const [today, setToday] = useState(() => dayOf(new Date()));
  const [slots, setSlots] = useState<Menu[]>(() => BASE_MENUS.slice(0, 8));
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<Menu | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCat, setNewCat] = useState<Category>('korean');
  const [status, setStatus] = useState('');

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

  const menus = useMemo(() => [...BASE_MENUS, ...data.custom], [data.custom]);
  const pool = candidates(menus, { off: data.off, avoidDays: data.avoidDays }, data.eaten, today);
  const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const spin = () => {
    if (spinning) return;
    const w = pick(pool);
    if (!w) {
      setStatus('고를 메뉴가 없어요. 종류를 하나 이상 켜 주세요.');
      return;
    }
    setStatus('');
    setWinner(null);
    const s = wheelSlots(pool, w, 8);
    setSlots(s);
    const slot = 360 / s.length;
    const jitter = (Math.random() - 0.5) * slot * 0.6;
    // 지금 각도에서 최소 5바퀴 더 돌고, 0번 칸(당첨)이 위로 오게
    const base = Math.ceil(rotation / 360) * 360;
    setRotation(base + 360 * (reduce ? 1 : 5) + jitter);
    setSpinning(true);
    setTimeout(
      () => {
        setSpinning(false);
        setWinner(w);
      },
      reduce ? 300 : 3200,
    );
  };

  const eat = () => {
    if (!winner) return;
    setData((d) => ({ ...d, eaten: addEaten(d.eaten, winner.name, today) }));
    setStatus(`오늘 점심은 ${winner.name}! 맛있게 드세요 😋`);
  };

  const share = async () => {
    if (!winner) return;
    const r = await shareText(`[오늘 점심 룰렛] 오늘 점심은 ${winner.emoji} ${winner.name}! 같이 갈 사람? 🙋\n나도 돌려 보기: ${await appLink()}`);
    setStatus(r === 'shared' ? '' : r === 'copied' ? '문구를 복사했어요.' : '공유가 막혔어요.');
  };

  return (
    <main className="app">
      <header className="top">
        <div>
          <h1>오늘 점심 룰렛</h1>
          <p>
            고민은 룰렛에게! 후보 {pool.length}개{data.avoidDays ? ` · 최근 ${data.avoidDays}일 먹은 메뉴 빼고` : ''}
          </p>
        </div>
        <button className="icon" type="button" aria-label="메뉴 설정" aria-expanded={showSettings} onClick={() => setShowSettings((s) => !s)}>
          ⚙️
        </button>
      </header>

      {showSettings && (
        <section className="card">
          <p className="label">먹고 싶은 종류 (끄면 빠져요)</p>
          <div className="chips wrap">
            {CATS.map((c) => {
              const on = !data.off.includes(c);
              return (
                <button key={c} type="button" aria-pressed={on} className={on ? 'on' : ''} style={on ? { background: CATEGORY_COLOR[c], borderColor: CATEGORY_COLOR[c] } : undefined} onClick={() => setData((d) => ({ ...d, off: on ? [...d.off, c] : d.off.filter((x) => x !== c) }))}>
                  {CATEGORY_NAME[c]}
                </button>
              );
            })}
          </div>
          <p className="label">최근 먹은 메뉴 빼기</p>
          <div className="chips">
            {[0, 3, 7].map((n) => (
              <button key={n} type="button" className={data.avoidDays === n ? 'on dark' : ''} onClick={() => setData((d) => ({ ...d, avoidDays: n }))}>
                {n === 0 ? '안 빼기' : `${n}일`}
              </button>
            ))}
          </div>
          <p className="label">나만의 메뉴 추가</p>
          <div className="add">
            <input value={newName} maxLength={12} onChange={(e) => setNewName(e.target.value)} placeholder="예: 회사 앞 백반" aria-label="메뉴 이름" />
            <select value={newCat} onChange={(e) => setNewCat(e.target.value as Category)} aria-label="메뉴 종류">
              {CATS.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_NAME[c]}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                setData((d) => ({ ...d, custom: addCustom([...BASE_MENUS, ...d.custom], newName, newCat).filter((x) => x.custom) }));
                setNewName('');
              }}
            >
              추가
            </button>
          </div>
          {data.custom.length > 0 && (
            <div className="chips wrap">
              {data.custom.map((x) => (
                <button key={x.name} type="button" className="mine" aria-label={`${x.name} 지우기`} onClick={() => setData((d) => ({ ...d, custom: d.custom.filter((y) => y.name !== x.name) }))}>
                  ⭐ {x.name} ×
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="stage">
        <Wheel slots={slots} rotation={rotation} />
        <button className="spin" type="button" onClick={spin} disabled={spinning}>
          {spinning ? '두구두구…' : winner ? '다시 돌리기' : '룰렛 돌리기 🎯'}
        </button>
      </section>

      {winner && !spinning && (
        <section className="result" aria-live="polite">
          <span className="emoji" aria-hidden>
            {winner.emoji}
          </span>
          <p>오늘 점심은</p>
          <h2>{winner.name}</h2>
          <small>{CATEGORY_NAME[winner.cat]}</small>
          <div className="row">
            <button className="primary" type="button" onClick={eat}>
              이걸로 먹을래요
            </button>
            <button className="ghost" type="button" onClick={share}>
              같이 먹자고 공유
            </button>
          </div>
        </section>
      )}

      <p className="note" role="status">
        {status}
      </p>

      {data.eaten.length > 0 && (
        <section className="card">
          <h2>최근 먹은 메뉴</h2>
          <ul className="history">
            {data.eaten.slice(0, 7).map((e) => (
              <li key={e.day + e.name}>
                <span>{e.day.slice(5).replace('-', '/')}</span> {e.name}
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="foot">메뉴 이름만 골라 드려요. 기록은 이 기기에만 저장돼요.{!inToss() && ' 지금은 토스 밖 미리보기 화면이에요.'}</footer>
    </main>
  );
}
