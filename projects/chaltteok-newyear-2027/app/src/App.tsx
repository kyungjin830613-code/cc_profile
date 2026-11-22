import { useEffect, useMemo, useState } from 'react';
import { Creature, creatureSvg } from './Creature';
import { Sheep, sheepSvg } from './Sheep';
import { FIELD_NAMES, MONTH_TIPS, SAMJAE_LINE, THEMES, TTI_LINES, josa } from './lib/content';
import { yearFortune } from './lib/newyear';
import { ELEMENT, ELEMENT_NAME, GAN, GAN_HANJA, MAX_DATE, MIN_DATE, TTI, ZHI, ZHI_HANJA, isValidDate, pillarsOf, type Pillars } from './lib/saju';
import { inToss, loadItem, openWalletApp, saveImage, saveItem, shareText } from './lib/toss';

interface Person {
  nickname: string;
  pillars: Pillars;
}

const STORE_KEY = 'me.v1';
const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n);

function Form({ initialName, onSubmit }: { initialName?: string; onSubmit: (nickname: string, date: string) => void }) {
  const [nickname, setNickname] = useState(initialName ?? '');
  const [date, setDate] = useState('');
  const [adult, setAdult] = useState(false);
  const [error, setError] = useState('');
  return (
    <form
      className="panel"
      onSubmit={(e) => {
        e.preventDefault();
        const name = nickname.trim().slice(0, 8);
        if (!name) return setError('별명을 적어 주세요.');
        if (!isValidDate(date)) return setError('생일을 1921년부터 2039년 사이 날짜로 골라 주세요.');
        if (!adult) return setError('만 19세 이상인지 확인해 주세요.');
        setError('');
        onSubmit(name, date);
      }}
    >
      <h2>나는 누구?</h2>
      <label htmlFor="nick">별명</label>
      <input id="nick" maxLength={8} value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="예: 감자" autoComplete="off" />
      <label htmlFor="birth">양력 생일</label>
      <input id="birth" type="date" min={MIN_DATE} max={MAX_DATE} value={date} onChange={(e) => setDate(e.target.value)} />
      <label className="check">
        <input type="checkbox" checked={adult} onChange={(e) => setAdult(e.target.checked)} />
        <span>만 19세 이상이에요</span>
      </label>
      <p className="error" role="alert">
        {error}
      </p>
      <button className="primary" type="submit">
        2027년 운세 보기
      </button>
      <p className="note">생일은 이 기기 안에서만 계산돼요. 서버로 보내거나 저장하지 않아요.</p>
    </form>
  );
}

async function drawCard(me: Person, themeName: string, tip: string): Promise<string> {
  const c = document.createElement('canvas');
  c.width = 1080;
  c.height = 1350;
  const x = c.getContext('2d')!;
  try {
    await document.fonts.load('80px Jua');
  } catch {
    /* 기본 글꼴 */
  }
  const img = (svg: string) =>
    new Promise<HTMLImageElement | null>((resolve) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => resolve(null);
      i.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    });
  x.fillStyle = '#c8102e';
  x.fillRect(0, 0, 1080, 1350);
  x.fillStyle = '#2b1720';
  x.fillRect(70, 190, 960, 1000);
  x.fillStyle = '#fff3c4';
  x.fillRect(54, 174, 960, 1000);
  x.textAlign = 'center';
  x.fillStyle = '#fff';
  x.font = '64px Jua, sans-serif';
  x.fillText('2027 붉은 양의 해', 540, 116);
  const [s, cr] = await Promise.all([img(sheepSvg()), img(creatureSvg(me.pillars.element))]);
  if (s) x.drawImage(s, 160, 210, 400, 400);
  if (cr) x.drawImage(cr, 560, 290, 320, 320);
  x.fillStyle = '#2b1720';
  x.font = '44px Jua, sans-serif';
  x.fillText(`${me.nickname}의 2027년 한 단어`, 534, 700);
  x.fillStyle = '#c8102e';
  x.font = themeName.length > 9 ? '78px Jua, sans-serif' : '92px Jua, sans-serif';
  x.fillText(themeName, 534, 820);
  x.fillStyle = '#6b4a57';
  x.font = '40px Jua, sans-serif';
  x.fillText(tip, 534, 920);
  x.font = '34px Jua, sans-serif';
  x.fillText('토스에서 찰떡 신년운세 2027', 534, 1100);
  return c.toDataURL('image/png');
}

function Result({ me, onRestart }: { me: Person; onRestart: () => void }) {
  const y = useMemo(() => yearFortune(me.pillars), [me]);
  const theme = THEMES[y.god];
  const tti = TTI_LINES[y.tti];
  const [status, setStatus] = useState('');
  const [image, setImage] = useState('');

  const share = async () => {
    const text = `[찰떡 신년운세 2027] ${josa(me.nickname, '의', '의')} 2027년 한 단어는 "${theme.name}"\n${theme.tip}\n가장 좋은 달: ${y.best.month.label} ${stars(y.best.stars)}`;
    const r = await shareText(text);
    setStatus(r === 'shared' ? '' : r === 'copied' ? '결과 문구를 복사했어요. 원하는 곳에 붙여 넣어 주세요.' : '공유가 막혔어요. 화면을 캡처해서 보내 주세요.');
  };
  const save = async () => {
    setStatus('카드를 만드는 중이에요…');
    const url = await drawCard(me, theme.name, theme.tip);
    if (await saveImage(url, 'chaltteok-2027.png')) setStatus('사진첩에 저장했어요.');
    else {
      setImage(url);
      setStatus('이미지를 길게 눌러 저장해 주세요.');
    }
  };
  const goWallet = async () => {
    if (!(await openWalletApp())) setStatus('토스 앱에서 "찰떡 지갑궁합"을 검색해 주세요.');
  };

  return (
    <article className="result">
      <section className="hero-card">
        <div className="pair">
          <Sheep className="pop" />
          <Creature element={me.pillars.element} className="pop small" />
        </div>
        <p className="eyebrow">{josa(me.nickname, '의', '의')} 2027년 한 단어</p>
        <h2>{theme.name}</h2>
        <p className="keys">{theme.keywords}</p>
        <p>{theme.desc}</p>
        <p className="mantra">{theme.tip}</p>
      </section>

      <section className="panel">
        <h3>분야별 별점</h3>
        <ul className="bars">
          {FIELD_NAMES.map((f, i) => (
            <li key={f}>
              <span>{f}</span>
              <span className="bar" aria-label={`${f} ${theme.fields[i]}점 만점에 5점`}>
                <i style={{ width: `${theme.fields[i] * 20}%` }} />
              </span>
              <b>{theme.fields[i]}</b>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <h3>12달 운세 달력</h3>
        <p className="note">달은 절기 기준이에요. 2월은 2월 4일 입춘부터 시작해요.</p>
        <ol className="months">
          {y.months.map((m) => (
            <li key={m.month.label} className={m === y.best ? 'best' : m === y.careful ? 'careful' : ''}>
              <span className="m">{m.month.label}</span>
              <span className="s" aria-label={`별 ${m.stars}개`}>
                {stars(m.stars)}
              </span>
              <span className="t">
                {MONTH_TIPS[m.god]}
                {m.clash ? ' · 일정 변동 주의' : ''}
                {m === y.best && <em> 최고의 달</em>}
                {m === y.careful && <em> 조심할 달</em>}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="panel">
        <h3>
          {TTI[me.pillars.tti]}띠 · {tti.title}
        </h3>
        <p>{tti.text}</p>
        {y.samjae && <p className="samjae">{SAMJAE_LINE}</p>}
      </section>

      <section className="panel">
        <div className="row">
          <button className="primary" type="button" onClick={share}>
            결과 공유하기
          </button>
          <button className="ghost" type="button" onClick={save}>
            카드 이미지 저장
          </button>
        </div>
        <button className="ghost" type="button" onClick={goWallet}>
          애인과 지갑궁합도 보기 💛
        </button>
        <p className="note" role="status">
          {status}
        </p>
        {image && <img className="shot" src={image} alt="2027 신년운세 카드 이미지" />}
      </section>

      <details className="panel why">
        <summary>이 결과가 나온 이유</summary>
        <ul>
          <li>
            내 일주는 {GAN[me.pillars.gan]}
            {ZHI[me.pillars.zhi]}({GAN_HANJA[me.pillars.gan]}
            {ZHI_HANJA[me.pillars.zhi]}), 일간 오행은 {ELEMENT[me.pillars.element]}({ELEMENT_NAME[me.pillars.element]})예요.
          </li>
          <li>2027년은 정미(丁未)년. 내 일간에서 본 丁은 「{y.god}」이라 테마가 「{theme.name}」예요.</li>
          <li>달마다 그 달의 천간과 내 일간의 관계, 그 달의 지지와 내 일지의 합·충으로 별점을 매겼어요.</li>
          <li>띠는 입춘 기준이에요. 입춘 당일 생일은 태어난 시각에 따라 띠가 바뀔 수 있어요.</li>
        </ul>
      </details>

      <button className="ghost wide" type="button" onClick={onRestart}>
        처음으로
      </button>
    </article>
  );
}

export default function App() {
  const [screen, setScreen] = useState<'start' | 'form' | 'result'>('start');
  const [me, setMe] = useState<Person | null>(null);

  useEffect(() => {
    loadItem(STORE_KEY).then((raw) => {
      if (!raw) return;
      try {
        const { nickname, date } = JSON.parse(raw);
        if (typeof nickname === 'string' && isValidDate(date)) setMe({ nickname, pillars: pillarsOf(date) });
      } catch {
        /* 저장값이 깨졌으면 무시 */
      }
    });
  }, []);
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [screen]);

  return (
    <main className="app">
      <header className="top">
        <h1>찰떡 신년운세 2027</h1>
        <p>붉은 양의 해, 나의 한 단어와 12달 운세 달력</p>
      </header>

      {screen === 'start' && (
        <section className="panel start">
          <Sheep className="pop hero" />
          <p className="lead">2027년은 정미년, 붉은 양의 해예요. 내 생일 기운과 붉은 양은 어떤 사이일까?</p>
          {me ? (
            <>
              <button className="primary" type="button" onClick={() => setScreen('result')}>
                {josa(me.nickname, '의', '의')} 2027년 다시 보기
              </button>
              <button className="ghost" type="button" onClick={() => setScreen('form')}>
                다른 생일로 보기
              </button>
            </>
          ) : (
            <button className="primary" type="button" onClick={() => setScreen('form')}>
              내 2027년 운세 보기
            </button>
          )}
          <p className="note">재미로 보는 운세예요. 의학·금융·법률 조언이 아니에요.</p>
        </section>
      )}

      {screen === 'form' && (
        <Form
          initialName={me?.nickname}
          onSubmit={(nickname, date) => {
            setMe({ nickname, pillars: pillarsOf(date) });
            saveItem(STORE_KEY, JSON.stringify({ nickname, date }));
            setScreen('result');
          }}
        />
      )}

      {screen === 'result' && me && <Result me={me} onRestart={() => setScreen('start')} />}

      <footer className="foot">
        일간(태어난 날의 천간)과 2027년 기운의 관계로 본 재미용 신년운세예요.
        {!inToss() && ' 지금은 토스 밖 미리보기 화면이에요.'}
      </footer>
    </main>
  );
}
