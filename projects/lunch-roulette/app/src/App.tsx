import { useEffect, useMemo, useState } from 'react';
import { BottomSheet, Button, ListHeader, ListRow, Paragraph, SegmentedControl, TextField } from '@toss/tds-mobile';
import { BASE_MENUS, CATEGORY_COLOR, CATEGORY_NAME, addCustom, addEaten, candidates, dayOf, pick, wheelSlots, type Category, type Eaten, type Menu } from './lib/menu';
import { appLink, loadItem, saveItem, shareText } from './lib/toss';

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
    <div className="page">
      <div className="head">
        <div>
          <h1>오늘 점심 룰렛</h1>
          <Paragraph.Text typography="t6" color="var(--sub)">
            {`후보 ${pool.length}개${data.avoidDays ? ` · 최근 ${data.avoidDays}일 먹은 메뉴 빼고` : ''}`}
          </Paragraph.Text>
        </div>
        <Button size="small" variant="weak" color="dark" onClick={() => setShowSettings(true)}>
          메뉴 설정
        </Button>
      </div>

      <section className="stage">
        <Wheel slots={slots} rotation={rotation} />
        <Button display="block" size="xlarge" onClick={spin} disabled={spinning}>
          {spinning ? '두구두구…' : winner ? '다시 돌리기' : '룰렛 돌리기'}
        </Button>
      </section>

      {winner && !spinning && (
        <section className="result" aria-live="polite">
          <span className="emoji" aria-hidden>
            {winner.emoji}
          </span>
          <Paragraph.Text typography="t6" color="var(--sub)">
            오늘 점심은
          </Paragraph.Text>
          <strong className="win">{winner.name}</strong>
          <Paragraph.Text typography="t7" color="var(--sub)">
            {CATEGORY_NAME[winner.cat]}
          </Paragraph.Text>
          <div className="row2 full">
            <Button display="block" onClick={eat}>
              이걸로 먹기
            </Button>
            <Button display="block" variant="weak" onClick={share}>
              같이 먹자 공유
            </Button>
          </div>
        </section>
      )}

      <p className="note" role="status">
        {status}
      </p>

      {data.eaten.length > 0 && (
        <>
          <ListHeader title={<ListHeader.TitleParagraph typography="t5" fontWeight="bold">최근 먹은 메뉴</ListHeader.TitleParagraph>} />
          <ul className="list">
            {data.eaten.slice(0, 7).map((e) => (
              <ListRow key={e.day + e.name} contents={<ListRow.Texts type="1RowTypeA" top={e.name} />} right={<Paragraph.Text typography="t6" color="var(--sub)">{e.day.slice(5).replace('-', '/')}</Paragraph.Text>} />
            ))}
          </ul>
        </>
      )}

      <p className="foot">메뉴 이름만 골라 드려요. 기록은 이 기기에만 저장돼요.</p>

      <BottomSheet open={showSettings} onClose={() => setShowSettings(false)} header={<BottomSheet.Header>메뉴 설정</BottomSheet.Header>} cta={<BottomSheet.CTA onClick={() => setShowSettings(false)}>완료</BottomSheet.CTA>}>
        <div className="sheet">
          <p className="label">먹고 싶은 종류 (끄면 빠져요)</p>
          <div className="chips">
            {CATS.map((c) => {
              const on = !data.off.includes(c);
              return (
                <Button key={c} size="small" variant={on ? 'fill' : 'weak'} color={on ? 'primary' : 'dark'} onClick={() => setData((d) => ({ ...d, off: on ? [...d.off, c] : d.off.filter((x) => x !== c) }))}>
                  {CATEGORY_NAME[c]}
                </Button>
              );
            })}
          </div>
          <p className="label">최근 먹은 메뉴 빼기</p>
          <SegmentedControl value={String(data.avoidDays)} onChange={(v) => setData((d) => ({ ...d, avoidDays: Number(v) }))}>
            <SegmentedControl.Item value="0">안 빼기</SegmentedControl.Item>
            <SegmentedControl.Item value="3">3일</SegmentedControl.Item>
            <SegmentedControl.Item value="7">7일</SegmentedControl.Item>
          </SegmentedControl>
          <p className="label">나만의 메뉴 추가</p>
          <TextField variant="box" placeholder="예: 회사 앞 백반" value={newName} maxLength={12} onChange={(e) => setNewName(e.target.value)} />
          <div className="chips">
            {CATS.map((c) => (
              <Button key={c} size="small" variant={newCat === c ? 'fill' : 'weak'} color={newCat === c ? 'primary' : 'dark'} onClick={() => setNewCat(c)}>
                {CATEGORY_NAME[c]}
              </Button>
            ))}
          </div>
          <Button
            display="block"
            variant="weak"
            disabled={!newName.trim()}
            onClick={() => {
              setData((d) => ({ ...d, custom: addCustom([...BASE_MENUS, ...d.custom], newName, newCat).filter((x) => x.custom) }));
              setNewName('');
            }}
          >
            메뉴 추가
          </Button>
          {data.custom.length > 0 && (
            <div className="chips">
              {data.custom.map((x) => (
                <Button key={x.name} size="small" variant="weak" color="dark" aria-label={`${x.name} 지우기`} onClick={() => setData((d) => ({ ...d, custom: d.custom.filter((y) => y.name !== x.name) }))}>
                  {`${x.name} ×`}
                </Button>
              ))}
            </div>
          )}
        </div>
      </BottomSheet>
    </div>
  );
}
