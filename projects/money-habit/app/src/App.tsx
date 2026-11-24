import { useEffect, useState } from 'react';
import { BottomCTA, Button, ListHeader, ListRow, Paragraph, ProgressBar, Top } from '@toss/tds-mobile';
import { QUESTIONS, TYPES, mix, resultOf, type TypeId } from './lib/quiz';
import { appLink, loadItem, saveImage, saveItem, shareText } from './lib/toss';

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
    <div className={`page ${screen === 'start' ? 'has-cta' : ''}`}>
      {screen === 'start' && (
        <>
          <Top title={<Top.TitleParagraph size={22}>나의 돈 습관 결산</Top.TitleParagraph>} subtitleBottom={<Top.SubtitleParagraph>질문 10개로 알아보는 2026년 나의 소비·저축 유형</Top.SubtitleParagraph>} />
          <div className="zoo" aria-hidden>
            {Object.values(TYPES).map((x) => (
              <span key={x.id} style={{ background: `${x.color}22` }}>
                {x.emoji}
              </span>
            ))}
          </div>
          {saved && (
            <ul className="list">
              <ListRow onClick={() => setScreen('result')} left={<span className="row-emoji">{TYPES[saved.id].emoji}</span>} contents={<ListRow.Texts type="2RowTypeA" top="지난 결과 다시 보기" bottom={TYPES[saved.id].name} />} withArrow />
            </ul>
          )}
          <p className="foot">재미로 보는 소비 습관 테스트예요. 투자·금융 상품 조언이 아니에요. 답은 이 기기에만 저장돼요.</p>
          <BottomCTA onClick={restart}>테스트 시작하기</BottomCTA>
        </>
      )}

      {screen === 'quiz' && answers.length < QUESTIONS.length && (
        <>
          <div className="pad quiz-top">
            <ProgressBar progress={(answers.length + 1) / QUESTIONS.length} size="normal" animate />
            <Paragraph.Text typography="t6" color="var(--sub)">{`${answers.length + 1} / ${QUESTIONS.length}`}</Paragraph.Text>
          </div>
          <Top title={<Top.TitleParagraph size={22}>{QUESTIONS[answers.length].q}</Top.TitleParagraph>} />
          <div className="actions">
            {QUESTIONS[answers.length].options.map((o, i) => (
              <Button key={o.text} display="block" size="large" variant="weak" color="dark" onClick={() => pick(i)}>
                {o.text}
              </Button>
            ))}
          </div>
          {answers.length > 0 && (
            <div className="actions">
              <Button display="block" size="medium" variant="weak" color="light" onClick={() => setAnswers(answers.slice(0, -1))}>
                이전 질문
              </Button>
            </div>
          )}
        </>
      )}

      {screen === 'result' && current && t && (
        <>
          <div className="hero" style={{ background: `${t.color}1f` }}>
            <Paragraph.Text typography="t6" color="var(--sub2)">
              2026년 나는
            </Paragraph.Text>
            <span className="emoji" aria-hidden>
              {t.emoji}
            </span>
            <strong>{t.name}</strong>
            <p>{t.summary}</p>
          </div>

          <ListHeader title={<ListHeader.TitleParagraph typography="t5" fontWeight="bold">내 안의 동물들</ListHeader.TitleParagraph>} />
          <div className="card">
            {mix(current.answers).map((m) => (
              <div key={m.id} className="mix">
                <span>{`${TYPES[m.id].emoji} ${TYPES[m.id].animal}`}</span>
                <ProgressBar progress={m.pct / 100} size="bold" color={TYPES[m.id].color} />
                <b>{m.pct}%</b>
              </div>
            ))}
          </div>

          <ul className="list">
            <ListRow left={<span className="row-emoji">👍</span>} contents={<ListRow.Texts type="2RowTypeA" top="좋은 점" bottom={t.good} />} />
            <ListRow left={<span className="row-emoji">👀</span>} contents={<ListRow.Texts type="2RowTypeA" top="조심할 점" bottom={t.watch} />} />
          </ul>

          <ListHeader title={<ListHeader.TitleParagraph typography="t5" fontWeight="bold">2027년 돈 목표 추천</ListHeader.TitleParagraph>} />
          <ul className="list">
            {t.goals.map((g, i) => (
              <ListRow key={g} left={<span className="num">{i + 1}</span>} contents={<ListRow.Texts type="1RowTypeA" top={g} />} />
            ))}
          </ul>

          <ul className="list">
            <ListRow left={<span className="row-emoji">{TYPES[t.buddy].emoji}</span>} contents={<ListRow.Texts type="2RowTypeA" top="나와 잘 맞는 짝꿍" bottom={TYPES[t.buddy].name} />} />
          </ul>

          <div className="actions">
            <div className="row2">
              <Button display="block" onClick={share}>
                친구에게 공유
              </Button>
              <Button display="block" variant="weak" onClick={save}>
                카드 저장
              </Button>
            </div>
            <Button display="block" variant="weak" color="dark" onClick={restart}>
              다시 하기
            </Button>
          </div>
          <p className="note" role="status">
            {status}
          </p>
          {image && <img className="shot" src={image} alt={`${t.name} 결과 카드`} />}
          <p className="foot">재미로 보는 소비 습관 테스트예요. 투자·금융 상품 조언이 아니에요.</p>
        </>
      )}
    </div>
  );
}
