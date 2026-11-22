import { useEffect, useMemo, useState } from 'react';
import { Creature, creatureSvg } from './Creature';
import { COUPLE_TYPES, MONEY_TYPES, gradeOf, josa } from './lib/content';
import {
  ELEMENT,
  ELEMENT_NAME,
  GAN,
  GAN_HANJA,
  MAX_DATE,
  MIN_DATE,
  TTI,
  ZHI,
  ZHI_HANJA,
  decodeCode,
  encodeCode,
  isValidDate,
  match,
  pillarsOf,
  type Pillars,
} from './lib/saju';
import { createInviteLink, inToss, loadItem, saveImage, saveItem, shareText } from './lib/toss';

interface Person {
  nickname: string;
  pillars: Pillars;
}

type Screen = 'start' | 'form' | 'me' | 'partnerForm' | 'result';

const STORE_KEY = 'me.v1';

function readInvite(): Person | null {
  const q = new URLSearchParams(window.location.search);
  const pillars = decodeCode(q.get('c'));
  if (!pillars) return null;
  const nickname = (q.get('n') || '상대').trim().slice(0, 8) || '상대';
  return { nickname, pillars };
}

function relationText(me: Person, you: Person, relation: ReturnType<typeof match>['relation']): string {
  const a = me.nickname;
  const b = you.nickname;
  switch (relation) {
    case 'same':
      return `${josa(a, '과', '와')} ${b}, 지갑 스타일이 거울처럼 닮았어요`;
    case 'aFeedsB':
      return `${josa(a, '이', '가')} ${josa(b, '의', '의')} 지갑을 키워 주는 사이`;
    case 'bFeedsA':
      return `${josa(b, '이', '가')} ${josa(a, '의', '의')} 지갑을 키워 주는 사이`;
    case 'aHoldsB':
      return `${josa(a, '이', '가')} ${josa(b, '의', '의')} 지갑을 꽉 잡고 있는 사이`;
    default:
      return `${josa(b, '이', '가')} ${josa(a, '의', '의')} 지갑을 꽉 잡고 있는 사이`;
  }
}

function PersonForm({
  title,
  submitLabel,
  askConsent,
  initialName,
  onSubmit,
}: {
  title: string;
  submitLabel: string;
  askConsent: boolean;
  initialName?: string;
  onSubmit: (nickname: string, date: string) => void;
}) {
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
        if (askConsent && !adult) return setError('만 19세 이상인지 확인해 주세요.');
        setError('');
        onSubmit(name, date);
      }}
    >
      <h2>{title}</h2>
      <label htmlFor="nick">별명</label>
      <input id="nick" maxLength={8} value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="예: 감자" autoComplete="off" />
      <label htmlFor="birth">양력 생일</label>
      <input id="birth" type="date" min={MIN_DATE} max={MAX_DATE} value={date} onChange={(e) => setDate(e.target.value)} />
      {askConsent && (
        <label className="check">
          <input type="checkbox" checked={adult} onChange={(e) => setAdult(e.target.checked)} />
          <span>만 19세 이상이에요</span>
        </label>
      )}
      <p className="error" role="alert">
        {error}
      </p>
      <button className="primary" type="submit">
        {submitLabel}
      </button>
      <p className="note">생일은 이 기기 안에서만 계산돼요. 서버로 보내거나 저장하지 않아요.</p>
    </form>
  );
}

function MoneyCard({ person, label }: { person: Person; label?: string }) {
  const t = MONEY_TYPES[person.pillars.element];
  return (
    <section className="money">
      <Creature element={person.pillars.element} className="money-art pop" />
      <div>
        {label && <p className="eyebrow">{label}</p>}
        <h3>{t.name}</h3>
        <p className="sub">
          {person.nickname} · {t.short}
        </p>
        <p>{t.desc}</p>
        <ul className="pros">
          <li>
            <b>잘하는 것</b> {t.strength}
          </li>
          <li>
            <b>조심할 것</b> {t.careful}
          </li>
        </ul>
      </div>
    </section>
  );
}

async function drawCard(me: Person, you: Person, score: number, grade: string, name: string): Promise<string> {
  const c = document.createElement('canvas');
  c.width = 1080;
  c.height = 1350;
  const x = c.getContext('2d')!;
  try {
    await document.fonts.load('80px Jua');
  } catch {
    /* 기본 글꼴로 그린다 */
  }
  const img = (svg: string) =>
    new Promise<HTMLImageElement | null>((resolve) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => resolve(null);
      i.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    });
  x.fillStyle = '#ff5c93';
  x.fillRect(0, 0, 1080, 1350);
  x.fillStyle = '#2b1720';
  x.fillRect(70, 190, 960, 1000);
  x.fillStyle = '#fff3c4';
  x.fillRect(54, 174, 960, 1000);
  x.textAlign = 'center';
  x.fillStyle = '#fff';
  x.font = '72px Jua, sans-serif';
  x.fillText('찰떡 지갑궁합', 540, 120);
  const [a, b] = await Promise.all([img(creatureSvg(me.pillars.element)), img(creatureSvg(you.pillars.element, true))]);
  if (a) x.drawImage(a, 90, 230, 340, 340);
  if (b) x.drawImage(b, 650, 230, 340, 340);
  x.fillStyle = '#ff3d7f';
  x.beginPath();
  x.arc(540, 400, 120, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = '#fff';
  x.font = '110px Jua, sans-serif';
  x.fillText(String(score), 540, 440);
  x.fillStyle = '#2b1720';
  x.font = '42px Jua, sans-serif';
  x.fillText(me.nickname, 260, 620);
  x.fillText(you.nickname, 820, 620);
  x.fillStyle = '#ffd84d';
  x.fillRect(300, 680, 480, 70);
  x.fillStyle = '#2b1720';
  x.font = '44px Jua, sans-serif';
  x.fillText(grade, 540, 732);
  x.font = name.length > 13 ? '50px Jua, sans-serif' : '60px Jua, sans-serif';
  x.fillText(name, 534, 860);
  x.fillStyle = '#6b4a57';
  x.font = '34px Jua, sans-serif';
  x.fillText('너도 생일 넣어 봐!  토스에서 찰떡 지갑궁합', 534, 1090);
  return c.toDataURL('image/png');
}

function Result({ me, you, onRestart }: { me: Person; you: Person; onRestart: () => void }) {
  const m = useMemo(() => match(me.pillars, you.pillars), [me, you]);
  const t = COUPLE_TYPES[m.pairKey];
  const grade = gradeOf(m.score);
  const [status, setStatus] = useState('');
  const [image, setImage] = useState('');

  const share = async () => {
    const text = `[찰떡 지갑궁합] ${me.nickname} × ${you.nickname} = ${m.score}점 ${grade}\n우리는 "${t.name}"\n데이트 비용 추천: ${t.pay}`;
    const r = await shareText(text);
    setStatus(r === 'shared' ? '' : r === 'copied' ? '결과 문구를 복사했어요. 원하는 곳에 붙여 넣어 주세요.' : '공유가 막혔어요. 화면을 캡처해서 보내 주세요.');
  };
  const save = async () => {
    setStatus('카드를 만드는 중이에요…');
    const url = await drawCard(me, you, m.score, grade, t.name);
    if (await saveImage(url, `chaltteok-wallet-${m.score}.png`)) setStatus('사진첩에 저장했어요.');
    else {
      setImage(url);
      setStatus('이미지를 길게 눌러 저장해 주세요.');
    }
  };

  return (
    <article className="result">
      <div className="stage">
        <Creature element={me.pillars.element} className="pop" />
        <div className="heart pop" aria-label={`궁합 점수 ${m.score}점`}>
          <span>{m.score}</span>
        </div>
        <Creature element={you.pillars.element} flip className="pop" />
      </div>
      <div className="names">
        <span>{me.nickname}</span>
        <span />
        <span>{you.nickname}</span>
      </div>
      <div className="panel">
        <span className="grade">{grade}</span>
        <h2>{t.name}</h2>
        <p className="rel">{relationText(me, you, m.relation)}</p>
        <p>{t.desc}</p>
        <div className="tips">
          <div className="tip pay">
            <h4>데이트 비용 추천</h4>
            <p>{t.pay}</p>
          </div>
          <div className="tip">
            <h4>돈싸움 주의보</h4>
            <p>{t.fight}</p>
          </div>
          <div className="tip">
            <h4>화해 비법</h4>
            <p>{t.fix}</p>
          </div>
          <div className="tip">
            <h4>같이 모으기 미션</h4>
            <p>{t.mission}</p>
          </div>
        </div>
        <div className="row">
          <button className="primary" type="button" onClick={share}>
            결과 공유하기
          </button>
          <button className="ghost" type="button" onClick={save}>
            카드 이미지 저장
          </button>
        </div>
        <p className="note" role="status">
          {status}
        </p>
        {image && <img className="shot" src={image} alt="지갑궁합 카드 이미지" />}
      </div>

      <MoneyCard person={me} label="나의 지갑 성향" />
      <MoneyCard person={you} label="상대의 지갑 성향" />

      <details className="panel why">
        <summary>이 점수가 나온 이유</summary>
        <table>
          <thead>
            <tr>
              <th />
              <th>{me.nickname}</th>
              <th>{you.nickname}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>일주</td>
              {[me, you].map((p, i) => (
                <td key={i}>
                  {GAN[p.pillars.gan]}
                  {ZHI[p.pillars.zhi]}({GAN_HANJA[p.pillars.gan]}
                  {ZHI_HANJA[p.pillars.zhi]})
                </td>
              ))}
            </tr>
            <tr>
              <td>일간 오행</td>
              <td>{ELEMENT[me.pillars.element]}</td>
              <td>{ELEMENT[you.pillars.element]}</td>
            </tr>
            <tr>
              <td>띠</td>
              <td>{TTI[me.pillars.tti]}띠</td>
              <td>{TTI[you.pillars.tti]}띠</td>
            </tr>
          </tbody>
        </table>
        <ul>
          {m.reasons.map((r) => (
            <li key={r.text}>
              {r.text} ({r.delta > 0 ? '+' : ''}
              {r.delta})
            </li>
          ))}
          <li>기본 72점에서 더하고 뺐어요 (최저 52점, 최고 99점).</li>
          {[me, you].some((p) => p.pillars.onLichun) && <li>입춘 당일 생일은 태어난 시각에 따라 띠가 바뀔 수 있어요. 여기서는 입춘 날을 새해로 봤어요.</li>}
        </ul>
      </details>

      <button className="ghost wide" type="button" onClick={onRestart}>
        처음으로
      </button>
    </article>
  );
}

export default function App() {
  const invite = useMemo(readInvite, []);
  const [screen, setScreen] = useState<Screen>('start');
  const [me, setMe] = useState<Person | null>(null);
  const [partner, setPartner] = useState<Person | null>(null);
  const [linkStatus, setLinkStatus] = useState('');

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

  const saveMe = (nickname: string, date: string) => {
    const person = { nickname, pillars: pillarsOf(date) };
    setMe(person);
    saveItem(STORE_KEY, JSON.stringify({ nickname, date }));
    if (invite) {
      setPartner(invite);
      setScreen('result');
    } else setScreen('me');
  };

  const sendInvite = async () => {
    if (!me) return;
    setLinkStatus('링크를 만드는 중이에요…');
    try {
      const link = await createInviteLink(encodeCode(me.pillars), me.nickname);
      const r = await shareText(`${me.nickname}님이 우리 지갑궁합을 보재요 💛\n생일만 넣으면 바로 나와요 👉 ${link}`);
      setLinkStatus(r === 'shared' ? '링크를 보냈어요! 상대가 생일을 넣으면 결과가 나와요.' : r === 'copied' ? '링크를 복사했어요. 메신저에 붙여 넣어 보내 주세요.' : `링크: ${link}`);
    } catch {
      setLinkStatus('링크를 만들지 못했어요. 잠시 뒤 다시 시도해 주세요.');
    }
  };

  return (
    <main className="app">
      <header className="top">
        <h1>찰떡 지갑궁합</h1>
        <p>둘이 생일만 넣으면, 데이트 비용 누가 내야 맞는지 나와요</p>
      </header>

      {screen === 'start' && (
        <section className="panel start">
          <div className="duo">
            <Creature element={1} className="pop" />
            <Creature element={2} flip className="pop" />
          </div>
          {invite ? (
            <p className="invite">
              <b>{invite.nickname}</b>님이 지갑궁합을 같이 보자고 초대했어요!
            </p>
          ) : (
            <p className="lead">불꽃 소비러와 곳간지기, 우리 커플은 어떤 지갑 조합일까?</p>
          )}
          {me && !invite ? (
            <>
              <button className="primary" type="button" onClick={() => setScreen('me')}>
                {me.nickname}님의 지갑 성향 다시 보기
              </button>
              <button className="ghost" type="button" onClick={() => setScreen('form')}>
                다른 생일로 시작하기
              </button>
            </>
          ) : (
            <button className="primary" type="button" onClick={() => setScreen('form')}>
              {invite ? '내 생일 넣고 결과 보기' : '내 지갑 성향부터 보기'}
            </button>
          )}
          <p className="note">재미로 보는 결과예요. 금융·투자 조언이 아니에요.</p>
        </section>
      )}

      {screen === 'form' && <PersonForm title="나는 누구?" submitLabel={invite ? '지갑궁합 결과 보기' : '내 지갑 성향 보기'} askConsent initialName={me?.nickname} onSubmit={saveMe} />}

      {screen === 'me' && me && (
        <>
          <MoneyCard person={me} label="나의 지갑 성향" />
          <section className="panel">
            <h2>이제 상대 차례!</h2>
            <p>상대가 링크를 열어 자기 생일을 넣으면 둘의 지갑궁합이 나와요. 내 생일은 링크에 들어가지 않아요.</p>
            <button className="primary" type="button" onClick={sendInvite}>
              애인에게 링크 보내기
            </button>
            <button className="ghost" type="button" onClick={() => setScreen('partnerForm')}>
              상대 생일 직접 넣기
            </button>
            <p className="note" role="status">
              {linkStatus}
            </p>
          </section>
        </>
      )}

      {screen === 'partnerForm' && (
        <PersonForm
          title="상대는 누구?"
          submitLabel="지갑궁합 결과 보기"
          askConsent={false}
          onSubmit={(nickname, date) => {
            setPartner({ nickname, pillars: pillarsOf(date) });
            setScreen('result');
          }}
        />
      )}

      {screen === 'result' && me && partner && (
        <Result
          me={me}
          you={partner}
          onRestart={() => {
            setPartner(null);
            setScreen('start');
          }}
        />
      )}

      <footer className="foot">
        일주(태어난 날의 간지)와 띠(입춘 기준)로 본 재미용 궁합이에요. 지갑 성향은 일간 오행({ELEMENT_NAME.join('·')})에서 착안한 분류예요.
        {!inToss() && ' 지금은 토스 밖 미리보기 화면이에요.'}
      </footer>
    </main>
  );
}
