import { useEffect, useState } from 'react';
import { MAX_TEXT, MAX_WISHES, TOPICS, addWish, checkIn, checkedToday, dayOf, daysToNewYear, glow, makeWish, restore, streak, type Topic, type Wish } from './lib/wish';
import { appLink, inToss, loadItem, saveImage, saveItem, shareText } from './lib/toss';

const STORE_KEY = 'wishes.v1';
const TOPIC_IDS = Object.keys(TOPICS) as Topic[];
const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

function lanternSvg(color: string, bright: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 130">
<defs><radialGradient id="g" cx="50%" cy="55%" r="60%"><stop offset="0" stop-color="#fff6c8" stop-opacity="${bright}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient></defs>
<circle cx="50" cy="62" r="50" fill="url(#g)"/>
<path d="M28 30 Q50 18 72 30 L78 92 Q50 104 22 92 Z" fill="${color}" stroke="#3a2a1a" stroke-width="3" stroke-linejoin="round"/>
<path d="M50 24 V96" stroke="#00000022" stroke-width="2"/><path d="M38 27 Q34 60 33 96" stroke="#00000018" stroke-width="2" fill="none"/><path d="M62 27 Q66 60 67 96" stroke="#00000018" stroke-width="2" fill="none"/>
<ellipse cx="50" cy="66" rx="13" ry="17" fill="#fff6c8" opacity="${0.35 + bright * 0.6}"/>
<rect x="38" y="94" width="24" height="7" rx="3" fill="#3a2a1a"/><path d="M50 101 v14" stroke="#3a2a1a" stroke-width="2"/>
</svg>`;
}
const uri = (s: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(s)}`;

async function drawCard(w: Wish): Promise<string> {
  const c = document.createElement('canvas');
  c.width = 1080;
  c.height = 1350;
  const x = c.getContext('2d')!;
  const g = x.createLinearGradient(0, 0, 0, 1350);
  g.addColorStop(0, '#0d1b3e');
  g.addColorStop(1, '#3b2a5e');
  x.fillStyle = g;
  x.fillRect(0, 0, 1080, 1350);
  x.fillStyle = '#ffffff';
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  for (let i = 0; i < 80; i++) {
    x.globalAlpha = 0.3 + rnd() * 0.7;
    x.fillRect(rnd() * 1080, rnd() * 760, 3, 3);
  }
  x.globalAlpha = 1;
  const img = await new Promise<HTMLImageElement | null>((res) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = () => res(null);
    i.src = uri(lanternSvg(TOPICS[w.topic].color, 1));
  });
  if (img) x.drawImage(img, 290, 160, 500, 650);
  x.textAlign = 'center';
  x.fillStyle = '#ffe9a8';
  x.font = '700 44px system-ui, sans-serif';
  x.fillText('2027 나의 소원 등불', 540, 110);
  x.fillStyle = '#ffffff';
  x.font = '800 60px system-ui, sans-serif';
  let line = '';
  let y = 900;
  for (const ch of w.text) {
    if (x.measureText(line + ch).width > 900) {
      x.fillText(line, 540, y);
      line = '';
      y += 80;
    }
    line += ch;
  }
  x.fillText(line, 540, y);
  x.fillStyle = '#ffe9a8';
  x.font = '40px system-ui, sans-serif';
  x.fillText(`${TOPICS[w.topic].emoji} ${TOPICS[w.topic].label}`, 540, y + 90);
  x.fillStyle = '#c9c3e6';
  x.font = '34px system-ui, sans-serif';
  x.fillText('토스에서 「새해 소원 등불」', 540, 1290);
  return c.toDataURL('image/png');
}

export default function App() {
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [today, setToday] = useState(() => dayOf(new Date()));
  const [text, setText] = useState('');
  const [topic, setTopic] = useState<Topic>('health');
  const [writing, setWriting] = useState(false);
  const [rising, setRising] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [image, setImage] = useState('');

  useEffect(() => {
    loadItem(STORE_KEY).then((raw) => {
      setWishes(restore(raw));
      setLoaded(true);
    });
    const t = setInterval(() => setToday(dayOf(new Date())), 60_000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (loaded) saveItem(STORE_KEY, JSON.stringify(wishes));
  }, [wishes, loaded]);

  const dday = daysToNewYear(today);
  const pending = wishes.filter((w) => !checkedToday(w, today)).length;
  const sel = wishes.find((w) => w.id === open) ?? null;

  const release = () => {
    const w = makeWish(text, topic, today, newId());
    if (!w) {
      setStatus('소원을 적어 주세요.');
      return;
    }
    if (wishes.length >= MAX_WISHES) {
      setStatus(`소원은 ${MAX_WISHES}개까지 띄울 수 있어요.`);
      return;
    }
    setWishes((l) => addWish(l, w));
    setRising(w.id);
    setTimeout(() => setRising(null), 1600);
    setText('');
    setWriting(false);
    setStatus('등불을 띄웠어요. 매일 한 번 다짐을 확인하면 등불이 더 밝아져요 ✨');
  };

  const share = async (w: Wish) => {
    const r = await shareText(`[새해 소원 등불] 2027년 내 소원: "${w.text}" 🏮\n너도 소원 등불 띄워 봐: ${await appLink()}`);
    setStatus(r === 'shared' ? '' : r === 'copied' ? '문구를 복사했어요.' : '공유가 막혔어요.');
  };
  const save = async (w: Wish) => {
    setStatus('카드를 만드는 중이에요…');
    const url = await drawCard(w);
    if (await saveImage(url, 'wish-lantern.png')) setStatus('사진첩에 저장했어요.');
    else {
      setImage(url);
      setStatus('이미지를 길게 눌러 저장해 주세요.');
    }
  };

  return (
    <main className="app">
      <header className="top">
        <p className="dday">{dday === 0 ? '🎉 새해 복 많이 받으세요!' : `${Number(today.slice(0, 4)) + (today.slice(5) === '01-01' ? 0 : 1)}년까지 D-${dday}`}</p>
        <h1>새해 소원 등불</h1>
        <p>소원을 적어 밤하늘에 띄우고, 매일 한 번 다짐을 확인해요.</p>
      </header>

      <section className="sky" aria-label={`띄운 등불 ${wishes.length}개`}>
        {wishes.length === 0 && <p className="empty">아직 띄운 등불이 없어요.<br />첫 소원을 적어 볼까요?</p>}
        {wishes.map((w, i) => {
          const b = glow(w, today);
          return (
            <button
              key={w.id}
              type="button"
              className={`lantern ${rising === w.id ? 'rise' : ''}`}
              style={{ left: `${8 + ((i * 29) % 78)}%`, top: `${12 + ((i * 41) % 52)}%`, animationDelay: `${i * 0.7}s` }}
              aria-label={`${w.text}, ${streak(w, today)}일 연속 다짐`}
              onClick={() => setOpen(w.id)}
            >
              <img src={uri(lanternSvg(TOPICS[w.topic].color, b))} alt="" width={64} height={83} />
            </button>
          );
        })}
        <div className="stars" aria-hidden />
      </section>

      {wishes.length > 0 && (
        <section className="card">
          <h2>오늘의 다짐 {pending ? `(${pending}개 남음)` : '완료 ✅'}</h2>
          <ul className="list">
            {wishes.map((w) => {
              const done = checkedToday(w, today);
              return (
                <li key={w.id}>
                  <button type="button" className="text" onClick={() => setOpen(w.id)}>
                    <span aria-hidden>{TOPICS[w.topic].emoji}</span> {w.text}
                    <small>{streak(w, today)}일 연속</small>
                  </button>
                  <button type="button" className={`check ${done ? 'done' : ''}`} disabled={done} onClick={() => setWishes((l) => l.map((x) => (x.id === w.id ? checkIn(x, today) : x)))}>
                    {done ? '다짐 완료' : '오늘도 다짐'}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {!writing ? (
        <button className="primary" type="button" onClick={() => setWriting(true)} disabled={wishes.length >= MAX_WISHES}>
          {wishes.length >= MAX_WISHES ? `소원은 ${MAX_WISHES}개까지예요` : '🏮 새 소원 적기'}
        </button>
      ) : (
        <section className="card write">
          <label htmlFor="wish">2027년 나의 소원</label>
          <textarea id="wish" maxLength={MAX_TEXT} value={text} onChange={(e) => setText(e.target.value)} placeholder="예: 매주 세 번 운동하기" rows={2} />
          <small className="count">
            {text.length}/{MAX_TEXT}
          </small>
          <div className="chips">
            {TOPIC_IDS.map((t) => (
              <button key={t} type="button" className={topic === t ? 'on' : ''} style={topic === t ? { background: TOPICS[t].color, borderColor: TOPICS[t].color } : undefined} onClick={() => setTopic(t)}>
                {TOPICS[t].emoji} {TOPICS[t].label}
              </button>
            ))}
          </div>
          <div className="row">
            <button className="primary" type="button" onClick={release}>
              등불 띄우기
            </button>
            <button className="ghost" type="button" onClick={() => setWriting(false)}>
              취소
            </button>
          </div>
        </section>
      )}

      <p className="note" role="status">
        {status}
      </p>
      {image && <img className="shot" src={image} alt="소원 등불 카드" />}

      <footer className="foot">소원과 다짐은 이 기기에만 저장되고 서버로 보내지 않아요.{!inToss() && ' 지금은 토스 밖 미리보기 화면이에요.'}</footer>

      {sel && (
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="sel-title" onClick={() => setOpen(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <img src={uri(lanternSvg(TOPICS[sel.topic].color, glow(sel, today)))} alt="" width={90} height={117} />
            <h2 id="sel-title">{sel.text}</h2>
            <p>
              {TOPICS[sel.topic].emoji} {TOPICS[sel.topic].label} · {sel.created} 띄움 · 다짐 {sel.checks.length}일 · {streak(sel, today)}일 연속
            </p>
            <div className="row">
              <button className="primary" type="button" onClick={() => share(sel)}>
                친구에게 공유
              </button>
              <button className="ghost" type="button" onClick={() => save(sel)}>
                카드 저장
              </button>
            </div>
            <button
              className="link"
              type="button"
              onClick={() => {
                setWishes((l) => l.filter((x) => x.id !== sel.id));
                setOpen(null);
              }}
            >
              이 소원 내려놓기(지우기)
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
