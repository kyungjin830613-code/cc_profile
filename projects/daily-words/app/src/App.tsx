import { useEffect, useMemo, useState } from 'react';
import { Button, ListHeader, ListRow, Paragraph, ProgressBar, SegmentedControl } from '@toss/tds-mobile';
import { DAILY, dayOf, dueReviews, emptyData, grade, makeQuestion, pickToday, restore, seeded, shuffle, stats, streak, wrongNote, type Data, type Question } from './lib/study';
import { BY_ID, LEVEL_NAME, type Level } from './lib/words';
import { appLink, inToss, loadItem, saveItem, shareText } from './lib/toss';

const STORE_KEY = 'words.v1';
type Screen = 'home' | 'learn' | 'quiz' | 'done';

const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;
function speak(text: string) {
  if (!canSpeak) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  } catch {
    /* 발음 못 해도 괜찮다 */
  }
}

export default function App() {
  const [data, setData] = useState<Data>(emptyData);
  const [loaded, setLoaded] = useState(false);
  const [today, setToday] = useState(() => dayOf(new Date()));
  const [screen, setScreen] = useState<Screen>('home');
  const [card, setCard] = useState(0);
  const [reveal, setReveal] = useState(false);
  const [quiz, setQuiz] = useState<Question[]>([]);
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [newSet, setNewSet] = useState<string[]>([]);
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

  const todayIds = pickToday(data, today);
  // 오늘 단어를 고정해 둔다(레벨을 바꾸거나 다 배운 뒤에도 같은 날은 같은 단어)
  useEffect(() => {
    if (loaded && (!data.today || data.today.day !== today) && todayIds.length) setData((d) => ({ ...d, today: { day: today, ids: todayIds } }));
  }, [loaded, today, data.today, todayIds]);

  const newLeft = todayIds.filter((id) => !data.cards[id]);
  const reviews = dueReviews(data, today, todayIds);
  const st = streak(data.days, today);
  const s = stats(data);
  const wrongs = useMemo(() => wrongNote(data), [data]);
  const studiedToday = data.days.includes(today);

  const startQuiz = () => {
    const rnd = seeded(`${today}:${Date.now()}`);
    const ids = shuffle([...newLeft, ...reviews.slice(0, 20)], rnd);
    if (!ids.length) {
      setStatus('오늘 풀 문제를 다 풀었어요. 내일 또 만나요!');
      return;
    }
    setNewSet(newLeft);
    setQuiz(ids.map((id) => makeQuestion(id, rnd)));
    setQi(0);
    setPicked(null);
    setScore(0);
    setStatus('');
    setScreen('quiz');
  };

  const choose = (i: number) => {
    if (picked !== null) return;
    const q = quiz[qi];
    const ok = i === q.answer;
    setPicked(i);
    if (ok) setScore((n) => n + 1);
    setData((d) => grade(d, q.id, ok, today));
    speak(q.word.en);
  };
  const next = () => {
    if (qi + 1 >= quiz.length) setScreen('done');
    else {
      setQi(qi + 1);
      setPicked(null);
    }
  };

  const changeLevel = (lv: Level) => setData((d) => ({ ...d, level: lv, today: d.today && d.today.ids.every((id) => d.cards[id]) ? d.today : null }));

  const share = async () => {
    const r = await shareText(`[하루 영단어] 오늘도 영단어 공부 완료! ${st ? `${st}일 연속 🔥 ` : ''}지금까지 ${s.learned}개 배웠어요 📚\n같이 해요: ${await appLink()}`);
    setStatus(r === 'shared' ? '' : r === 'copied' ? '문구를 복사했어요.' : '공유가 막혔어요.');
  };

  if (screen === 'learn') {
    const w = BY_ID[todayIds[card]];
    return (
      <div className="page">
        <div className="pad top-gap">
          <ProgressBar progress={(card + 1) / todayIds.length} size="normal" animate />
          <Paragraph.Text typography="t6" color="var(--sub)">{`오늘의 단어 ${card + 1} / ${todayIds.length}`}</Paragraph.Text>
        </div>
        <section className="flash" aria-live="polite">
          <span className="pos">{w.pos}</span>
          <strong className="en">{w.en}</strong>
          {canSpeak && (
            <Button size="small" variant="weak" onClick={() => speak(w.en)}>
              🔊 발음 듣기
            </Button>
          )}
          {reveal ? (
            <p className="ko">{w.ko}</p>
          ) : (
            <Button size="medium" variant="weak" color="dark" onClick={() => setReveal(true)}>
              뜻 보기
            </Button>
          )}
        </section>
        <div className="actions">
          {card + 1 < todayIds.length ? (
            <Button
              display="block"
              size="large"
              onClick={() => {
                setCard(card + 1);
                setReveal(false);
                speak(BY_ID[todayIds[card + 1]].en);
              }}
            >
              다음 단어
            </Button>
          ) : (
            <Button display="block" size="large" onClick={startQuiz}>
              외웠어요, 퀴즈 풀기
            </Button>
          )}
          <Button display="block" size="medium" variant="weak" color="dark" onClick={() => setScreen('home')}>
            처음 화면
          </Button>
        </div>
      </div>
    );
  }

  if (screen === 'quiz' && quiz[qi]) {
    const q = quiz[qi];
    return (
      <div className="page">
        <div className="pad top-gap">
          <ProgressBar progress={(qi + 1) / quiz.length} size="normal" animate />
          <Paragraph.Text typography="t6" color="var(--sub)">{`${qi + 1} / ${quiz.length} · ${newSet.includes(q.id) ? '오늘의 단어' : '복습'}`}</Paragraph.Text>
        </div>
        <section className="flash">
          <span className="pos">{q.word.pos}</span>
          <strong className="en">{q.word.en}</strong>
          <Paragraph.Text typography="t6" color="var(--sub2)">
            알맞은 뜻을 골라 주세요
          </Paragraph.Text>
        </section>
        <div className="actions">
          {q.choices.map((c, i) => {
            const state = picked === null ? '' : i === q.answer ? 'right' : i === picked ? 'wrong' : 'dim';
            return (
              <div key={c} className={`choice ${state}`}>
                <Button display="block" size="large" variant="weak" color={state === 'right' ? 'primary' : state === 'wrong' ? 'danger' : 'dark'} onClick={() => choose(i)} aria-pressed={picked === i}>
                  {state === 'right' ? `✓ ${c}` : state === 'wrong' ? `✕ ${c}` : c}
                </Button>
              </div>
            );
          })}
        </div>
        {picked !== null && (
          <div className="actions">
            <Paragraph.Text typography="t6" color={picked === q.answer ? 'var(--blue)' : 'var(--red)'}>
              {picked === q.answer ? '정답이에요! 다음 복습 때 다시 만나요.' : `아쉬워요. 정답은 '${q.word.ko}'. 내일 다시 나와요.`}
            </Paragraph.Text>
            <Button display="block" size="large" onClick={next}>
              {qi + 1 >= quiz.length ? '결과 보기' : '다음 문제'}
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (screen === 'done') {
    return (
      <div className="page">
        <section className="result top-gap" aria-live="polite">
          <span className="big-emoji" aria-hidden>
            {score === quiz.length ? '🏆' : score >= quiz.length / 2 ? '👏' : '💪'}
          </span>
          <Paragraph.Text typography="t6" color="var(--sub2)">
            오늘의 공부 끝
          </Paragraph.Text>
          <strong className="big-num">{`${score} / ${quiz.length}`}</strong>
          <Paragraph.Text typography="t6" color="var(--sub)">{st ? `${st}일 연속 공부 중 🔥` : '내일도 와서 연속 기록을 시작해요'}</Paragraph.Text>
        </section>
        <div className="actions">
          <Button display="block" size="large" onClick={share}>
            친구에게 자랑하기
          </Button>
          <Button display="block" size="medium" variant="weak" color="dark" onClick={() => setScreen('home')}>
            처음 화면
          </Button>
        </div>
        <p className="note" role="status">
          {status}
        </p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="head">
        <h1>하루 영단어</h1>
        <Paragraph.Text typography="t6" color="var(--sub)">
          하루 5단어, 잊을 때쯤 다시 나오는 복습
        </Paragraph.Text>
      </div>

      <section className="hero">
        <span className="hero-emoji" aria-hidden>
          {st >= 3 ? '🔥' : '📚'}
        </span>
        <div className="hero-text">
          <Paragraph.Text typography="t6" color="var(--sub2)">
            연속 공부
          </Paragraph.Text>
          <strong className="big-num">{st}일</strong>
          <Paragraph.Text typography="t7" color="var(--sub)">{`배운 단어 ${s.learned}개 · 완전히 외운 단어 ${s.mastered}개`}</Paragraph.Text>
        </div>
      </section>

      <div className="pad">
        <SegmentedControl value={data.level} onChange={(v: string) => changeLevel(v as Level)}>
          {(Object.keys(LEVEL_NAME) as Level[]).map((lv) => (
            <SegmentedControl.Item key={lv} value={lv}>
              {LEVEL_NAME[lv]}
            </SegmentedControl.Item>
          ))}
        </SegmentedControl>
      </div>

      <ListHeader title={<ListHeader.TitleParagraph typography="t5" fontWeight="bold">{`오늘의 단어 ${todayIds.length - newLeft.length}/${todayIds.length || DAILY}`}</ListHeader.TitleParagraph>} />
      {todayIds.length ? (
        <ul className="list">
          {todayIds.map((id) => {
            const w = BY_ID[id];
            const done = !!data.cards[id];
            return (
              <ListRow
                key={id}
                left={<span className="row-emoji">{done ? '✅' : '📖'}</span>}
                contents={<ListRow.Texts type="2RowTypeA" top={w.en} bottom={done ? `${w.pos} · ${w.ko}` : `${w.pos} · 뜻은 공부하면서 확인해요`} />}
                right={
                  canSpeak ? (
                    <Button size="small" variant="weak" color="dark" aria-label={`${w.en} 발음 듣기`} onClick={() => speak(w.en)}>
                      🔊
                    </Button>
                  ) : undefined
                }
              />
            );
          })}
        </ul>
      ) : (
        <p className="empty">{`${LEVEL_NAME[data.level]} 단어를 모두 배웠어요! 다른 단계를 골라 보세요.`}</p>
      )}

      <div className="actions">
        {newLeft.length > 0 ? (
          <Button
            display="block"
            size="xlarge"
            onClick={() => {
              setCard(0);
              setReveal(false);
              setScreen('learn');
              speak(BY_ID[todayIds[0]].en);
            }}
          >
            오늘 단어 외우기
          </Button>
        ) : null}
        <Button display="block" size={newLeft.length ? 'large' : 'xlarge'} variant={newLeft.length ? 'weak' : 'fill'} onClick={startQuiz} disabled={!newLeft.length && !reviews.length}>
          {newLeft.length ? `바로 퀴즈 풀기 (새 ${newLeft.length} + 복습 ${reviews.length})` : reviews.length ? `복습 퀴즈 ${reviews.length}개 풀기` : studiedToday ? '오늘 공부 완료 ✅' : '오늘은 복습할 단어가 없어요'}
        </Button>
      </div>

      {wrongs.length > 0 && (
        <>
          <ListHeader title={<ListHeader.TitleParagraph typography="t5" fontWeight="bold">자주 틀린 단어</ListHeader.TitleParagraph>} />
          <ul className="list">
            {wrongs.slice(0, 8).map((w) => (
              <ListRow key={w.id} contents={<ListRow.Texts type="2RowTypeA" top={w.en} bottom={`${w.pos} · ${w.ko}`} />} right={<Paragraph.Text typography="t7" color="var(--red)">{`${data.cards[w.id].wrong}번 틀림`}</Paragraph.Text>} />
            ))}
          </ul>
        </>
      )}

      {studiedToday && (
        <div className="actions">
          <Button display="block" variant="weak" onClick={share}>
            친구에게 자랑하기
          </Button>
        </div>
      )}
      <p className="note" role="status">
        {status}
      </p>
      <p className="foot">맞힌 단어는 1·3·7·14·30일 뒤에 다시 나오고, 틀린 단어는 다음 날 다시 나와요. 기록은 이 기기에만 저장돼요.{!inToss() && ' 지금은 토스 밖 미리보기 화면이에요.'}</p>
    </div>
  );
}
