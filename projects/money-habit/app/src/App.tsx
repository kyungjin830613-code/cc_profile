import { useEffect, useState } from 'react';
import { QUESTIONS, TYPES, mix, resultOf, type TypeId } from './lib/quiz';
import { appLink, inToss, loadItem, saveImage, saveItem, shareText } from './lib/toss';

const STORE_KEY = 'result.v1';
type Screen = 'start' | 'quiz' | 'result';

async function drawCard(id: TypeId): Promise<string> {
  const t = TYPES[id];
  const c = document.createElement('canvas');
  c.width = 1080;
  c.height = 1350;
  const x = c.getContext('2d')!;
  x.fillStyle = t.color;
  x.fillRect(0, 0, 1080, 1350);
  x.fillStyle = '#fff';
  x.beginPath();
  x.roundRect(70, 150, 940, 1060, 48);
  x.fill();
  x.textAlign = 'center';
  x.fillStyle = '#fff';
  x.font = '700 52px system-ui, sans-serif';
  x.fillText('2026 나의 돈 습관 결산', 540, 105);
  x.font = '220px system-ui, "Apple Color Emoji", "Noto Color Emoji", sans-serif';
  x.fillText(t.emoji, 540, 410);
  x.fillStyle = '#222';
  x.font = '800 76px system-ui, sans-serif';
  x.fillText(t.name, 540, 540);
  const wrap = (text: string, top: number, size: number, color: string, width = 820): number => {
    x.fillStyle = color;
    x.font = `${size}px system-ui, sans-serif`;
    let line = '';
    let y = top;
    for (const w of text.split(' ')) {
      if (line && x.measureText(`${line}${w}`).width > width) {
        x.fillText(line.trim(), 540, y);
        line = '';
        y += size * 1.4;
      }
      line += `${w} `;
    }
    x.fillText(line.trim(), 540, y);
    return y;
  };
  let y = wrap(t.summary, 620, 38, '#555');
  x.fillStyle = t.color;
  x.font = '700 42px system-ui, sans-serif';
  x.fillText('2027년 돈 목표', 540, y + 100);
  y += 100;
  t.goals.forEach((g, i) => {
    y = wrap(`${i + 1}. ${g}`, y + 66, 34, '#333', 780);
  });
  x.fillStyle = '#fff';
  x.font = '36px system-ui, sans-serif';
  x.fillText('토스에서 「나의 돈 습관 결산」', 540, 1290);
  return c.toDataURL('image/png');
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('start');
  const [answers, setAnswers] = useState<number[]>([]);
  const [saved, setSaved] = useState<{ id: TypeId; answers: number[] } | null>(null);
  const [status, setStatus] = useState('');
  const [image, setImage] = useState('');

  useEffect(() => {
    loadItem(STORE_KEY).then((raw) => {
      try {
        const v = raw ? JSON.parse(raw) : null;
        if (v && v.id in TYPES && Array.isArray(v.answers)) setSaved(v);
      } catch {
        /* 무시 */
      }
    });
  }, []);
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [screen, answers.length]);

  const pick = (i: number) => {
    const next = [...answers, i];
    if (next.length < QUESTIONS.length) {
      setAnswers(next);
      return;
    }
    const id = resultOf(next);
    const v = { id, answers: next };
    setSaved(v);
    saveItem(STORE_KEY, JSON.stringify(v));
    setAnswers(next);
    setStatus('');
    setImage('');
    setScreen('result');
  };

  const restart = () => {
    setAnswers([]);
    setScreen('quiz');
  };

  const current = screen === 'result' && saved ? saved : null;
  const t = current ? TYPES[current.id] : null;

  const share = async () => {
    if (!t) return;
    const r = await shareText(`[나의 돈 습관 결산] 2026년 나는 ${t.emoji} ${t.name}!\n${t.summary}\n너는 어떤 유형이야? ${await appLink()}`);
    setStatus(r === 'shared' ? '' : r === 'copied' ? '결과 문구를 복사했어요.' : '공유가 막혔어요.');
  };
  const save = async () => {
    if (!current) return;
    setStatus('카드를 만드는 중이에요…');
    const url = await drawCard(current.id);
    if (await saveImage(url, 'money-habit-2026.png')) setStatus('사진첩에 저장했어요.');
    else {
      setImage(url);
      setStatus('이미지를 길게 눌러 저장해 주세요.');
    }
  };

  return (
    <main className="app" style={t ? { ['--accent' as string]: t.color } : undefined}>
      {screen === 'start' && (
        <section className="start">
          <p className="badge">2026 연말 결산</p>
          <h1>나의 돈 습관 결산</h1>
          <p className="lead">질문 10개로 알아보는 올해 나의 소비·저축 유형. 내년 돈 목표까지 추천해 드려요.</p>
          <div className="zoo" aria-hidden>
            {Object.values(TYPES).map((x) => (
              <span key={x.id}>{x.emoji}</span>
            ))}
          </div>
          <button className="primary" type="button" onClick={restart}>
            테스트 시작하기
          </button>
          {saved && (
            <button className="ghost" type="button" onClick={() => setScreen('result')}>
              지난 결과 보기: {TYPES[saved.id].emoji} {TYPES[saved.id].name}
            </button>
          )}
        </section>
      )}

      {screen === 'quiz' && answers.length < QUESTIONS.length && (
        <section className="quiz">
          <div className="progress" aria-label={`${answers.length + 1} / ${QUESTIONS.length}`}>
            <i style={{ width: `${((answers.length + 1) / QUESTIONS.length) * 100}%` }} />
          </div>
          <p className="qnum">Q{answers.length + 1}</p>
          <h2>{QUESTIONS[answers.length].q}</h2>
          <div className="opts">
            {QUESTIONS[answers.length].options.map((o, i) => (
              <button key={o.text} type="button" onClick={() => pick(i)}>
                {o.text}
              </button>
            ))}
          </div>
          {answers.length > 0 && (
            <button className="back" type="button" onClick={() => setAnswers(answers.slice(0, -1))}>
              ← 이전 질문
            </button>
          )}
        </section>
      )}

      {screen === 'result' && current && t && (
        <section className="result">
          <div className="hero">
            <p>2026년 나는</p>
            <span className="emoji" aria-hidden>
              {t.emoji}
            </span>
            <h1>{t.name}</h1>
            <p className="summary">{t.summary}</p>
          </div>

          <div className="card">
            <h2>내 안의 동물들</h2>
            <ul className="mix">
              {mix(current.answers).map((m) => (
                <li key={m.id}>
                  <span>
                    {TYPES[m.id].emoji} {TYPES[m.id].animal}
                  </span>
                  <span className="bar">
                    <i style={{ width: `${m.pct}%`, background: TYPES[m.id].color }} />
                  </span>
                  <b>{m.pct}%</b>
                </li>
              ))}
            </ul>
          </div>

          <div className="card two">
            <div>
              <h3>👍 좋은 점</h3>
              <p>{t.good}</p>
            </div>
            <div>
              <h3>👀 조심할 점</h3>
              <p>{t.watch}</p>
            </div>
          </div>

          <div className="card">
            <h2>2027년 돈 목표 추천</h2>
            <ol className="goals">
              {t.goals.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ol>
          </div>

          <div className="card buddy">
            <p>
              나와 잘 맞는 짝꿍: <b>{TYPES[t.buddy].emoji} {TYPES[t.buddy].name}</b>
            </p>
            <small>서로의 빈 곳을 채워 주는 사이예요.</small>
          </div>

          <div className="row">
            <button className="primary" type="button" onClick={share}>
              친구에게 공유
            </button>
            <button className="ghost" type="button" onClick={save}>
              카드 저장
            </button>
          </div>
          <p className="note" role="status">
            {status}
          </p>
          {image && <img className="shot" src={image} alt={`${t.name} 결과 카드`} />}
          <button className="ghost" type="button" onClick={restart}>
            다시 하기
          </button>
        </section>
      )}

      <footer className="foot">재미로 보는 소비 습관 테스트예요. 투자·금융 상품 조언이 아니에요. 답은 이 기기에만 저장돼요.{!inToss() && ' 지금은 토스 밖 미리보기 화면이에요.'}</footer>
    </main>
  );
}
