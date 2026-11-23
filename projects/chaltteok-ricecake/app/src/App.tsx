import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import { Cake } from './Cake';
import {
  CAKES,
  HELPERS,
  applyOffline,
  buyHelper,
  buyTap,
  canCheckIn,
  checkIn,
  checkInReward,
  fmt,
  fmtDuration,
  helperCost,
  helperVisible,
  newGame,
  perSec,
  restore,
  tap,
  tapCost,
  tapValue,
  tick,
  unlockedCakes,
  type GameState,
} from './lib/game';
import { appLink, inToss, loadItem, saveItem, shareText } from './lib/toss';

const STORE_KEY = 'game.v1';
type Tab = 'helpers' | 'tools' | 'book';
interface Pop {
  id: number;
  x: number;
  y: number;
  text: string;
}
type Notice = { kind: 'offline'; sec: number; amount: number } | { kind: 'checkin'; streak: number; reward: number } | { kind: 'unlock'; index: number };

export default function App() {
  const [game, setGame] = useState<GameState | null>(null);
  const [tab, setTab] = useState<Tab>('helpers');
  const [pops, setPops] = useState<Pop[]>([]);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [status, setStatus] = useState('');
  const [squish, setSquish] = useState(false);
  const gameRef = useRef<GameState | null>(null);
  const popId = useRef(0);
  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  // 불러오기 + 비운 동안 번 떡
  useEffect(() => {
    loadItem(STORE_KEY).then((raw) => {
      const now = Date.now();
      const saved = restore(raw);
      if (!saved) {
        setGame(newGame(now));
        return;
      }
      const r = applyOffline(saved, now);
      setGame(r.state);
      if (r.amount >= 1 && r.sec >= 60) setNotice({ kind: 'offline', sec: r.sec, amount: r.amount });
    });
  }, []);

  // 0.2초마다 생산
  useEffect(() => {
    if (!game) return;
    const t = setInterval(() => setGame((g) => (g ? tick(g, Date.now()) : g)), 200);
    return () => clearInterval(t);
  }, [game !== null]); // eslint-disable-line react-hooks/exhaustive-deps

  // 저장: 5초마다, 그리고 앱이 가려질 때
  const save = useCallback(() => {
    const g = gameRef.current;
    if (g) saveItem(STORE_KEY, JSON.stringify(g));
  }, []);
  useEffect(() => {
    const t = setInterval(save, 5000);
    const onHide = () => {
      if (document.visibilityState === 'hidden') save();
    };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', save);
    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', save);
    };
  }, [save]);

  // 앱으로 돌아오면 비운 시간 정산
  useEffect(() => {
    const onShow = () => {
      if (document.visibilityState !== 'visible') return;
      const g = gameRef.current;
      if (!g) return;
      const r = applyOffline(g, Date.now());
      setGame(r.state);
      if (r.amount >= 1 && r.sec >= 60) setNotice({ kind: 'offline', sec: r.sec, amount: r.amount });
    };
    document.addEventListener('visibilitychange', onShow);
    return () => document.removeEventListener('visibilitychange', onShow);
  }, []);

  // 새 떡 해금 알림
  const unlocked = game ? unlockedCakes(game.total) : 1;
  const lastUnlocked = useRef<number | null>(null);
  useEffect(() => {
    if (!game) return;
    // 불러온 직후 처음 한 번은 기준만 잡는다(이미 연 떡을 다시 알리지 않게)
    if (lastUnlocked.current !== null && unlocked > lastUnlocked.current) {
      setNotice({ kind: 'unlock', index: unlocked - 1 });
      save();
    }
    lastUnlocked.current = unlocked;
  }, [unlocked]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!game) {
    return (
      <main className="app loading">
        <Cake index={0} className="hero-cake" />
        <p>떡집 문 여는 중…</p>
      </main>
    );
  }

  const ps = perSec(game);
  const current = unlocked - 1;
  const next = CAKES[unlocked];
  const progress = next ? Math.min(1, (game.total - CAKES[current].unlockAt) / (next.unlockAt - CAKES[current].unlockAt)) : 1;

  const onTap = (e: PointerEvent<HTMLButtonElement>) => {
    const value = tapValue(game);
    setGame((g) => (g ? tap(g) : g));
    const rect = e.currentTarget.getBoundingClientRect();
    const id = ++popId.current;
    const x = (e.clientX || rect.left + rect.width / 2) - rect.left;
    const y = (e.clientY || rect.top + rect.height / 2) - rect.top;
    setPops((p) => [...p.slice(-12), { id, x, y, text: `+${fmt(value)}` }]);
    setTimeout(() => setPops((p) => p.filter((q) => q.id !== id)), 800);
    setSquish(true);
    setTimeout(() => setSquish(false), 90);
  };

  const doCheckIn = () => {
    const r = checkIn(game, Date.now());
    if (!r) return;
    setGame(r.state);
    setNotice({ kind: 'checkin', streak: r.streak, reward: r.reward });
    saveItem(STORE_KEY, JSON.stringify(r.state));
  };

  const brag = async () => {
    const link = await appLink();
    const text = `[찰떡 떡집 키우기] 우리 떡집은 지금 ${CAKES[current].name}까지 만들어요! 지금까지 판 떡 ${fmt(game.total)}개 🍡\n${link}`;
    const r = await shareText(text);
    setStatus(r === 'shared' ? '' : r === 'copied' ? '자랑 문구를 복사했어요. 친구에게 붙여 넣어 주세요.' : '공유가 막혔어요.');
  };

  const checkInReady = canCheckIn(game, game.lastTick);

  return (
    <main className="app">
      <header className="hud">
        <p className="shop">찰떡 떡집</p>
        <p className="coins" aria-live="polite">
          🍡 {fmt(game.coins)}
        </p>
        <p className="rate">1초에 {fmt(ps)}개씩 팔려요</p>
      </header>

      {checkInReady && (
        <button className="checkin" type="button" onClick={doCheckIn}>
          🎁 오늘 출석 보상 받기 <small>(연속 출석하면 더 커져요)</small>
        </button>
      )}

      <section className="stage">
        <button className={`cake-btn${squish ? ' squish' : ''}`} type="button" onPointerDown={onTap} aria-label={`${CAKES[current].name} 빚기, 한 번에 ${fmt(tapValue(game))}개`}>
          <Cake index={current} happy={squish} className="hero-cake" />
          {pops.map((p) => (
            <span key={p.id} className="pop-num" style={{ left: p.x, top: p.y }} aria-hidden>
              {p.text}
            </span>
          ))}
        </button>
        <p className="cake-name">
          {CAKES[current].name} <span>톡톡 눌러서 빚어요</span>
        </p>
        <div className="next">
          {next ? (
            <>
              <span>
                다음 떡 <b>{next.name}</b>까지 {fmt(Math.max(0, next.unlockAt - game.total))}개
              </span>
              <span className="bar">
                <i style={{ width: `${progress * 100}%` }} />
              </span>
            </>
          ) : (
            <span>모든 떡을 다 모았어요! 전설의 떡집 🏆</span>
          )}
        </div>
      </section>

      <nav className="tabs" role="tablist">
        {(
          [
            ['helpers', '도우미'],
            ['tools', '절구'],
            ['book', '떡 도감'],
          ] as [Tab, string][]
        ).map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'on' : ''} type="button" onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </nav>

      {tab === 'helpers' && (
        <ul className="shop-list">
          {HELPERS.map((h, i) => {
            if (!helperVisible(game, i)) return null;
            const owned = game.helpers[h.id] ?? 0;
            const cost = helperCost(h, owned);
            const ok = game.coins >= cost;
            return (
              <li key={h.id}>
                <div>
                  <b>{h.name}</b> <span className="own">×{owned}</span>
                  <p>
                    {h.desc} · 1초에 +{fmt(h.perSec)}
                  </p>
                </div>
                <button type="button" disabled={!ok} onClick={() => setGame((g) => (g ? (buyHelper(g, h.id) ?? g) : g))}>
                  🍡 {fmt(cost)}
                </button>
              </li>
            );
          })}
          {helperVisible(game, HELPERS.length - 1) ? null : <li className="locked">더 모으면 새 도우미가 나타나요…</li>}
        </ul>
      )}

      {tab === 'tools' && (
        <ul className="shop-list">
          <li>
            <div>
              <b>황금 절구</b> <span className="own">Lv.{game.tapLevel}</span>
              <p>한 번 누를 때 빚는 떡이 늘어나요. 지금 한 번에 {fmt(tapValue(game))}개</p>
            </div>
            <button type="button" disabled={game.coins < tapCost(game.tapLevel)} onClick={() => setGame((g) => (g ? (buyTap(g) ?? g) : g))}>
              🍡 {fmt(tapCost(game.tapLevel))}
            </button>
          </li>
          <li className="info">
            <div>
              <b>출석 도장</b> <span className="own">{game.streak}일 연속</span>
              <p>매일 들어오면 보상이 커져요. 내일 보상: 약 {fmt(checkInReward(game, Math.min(game.streak + 1, 7)))}개</p>
            </div>
          </li>
          <li className="info">
            <div>
              <b>가게 비운 동안</b>
              <p>앱을 닫아도 도우미들이 절반 속도로 최대 8시간까지 떡을 팔아 둬요.</p>
            </div>
          </li>
        </ul>
      )}

      {tab === 'book' && (
        <ul className="book">
          {CAKES.map((c, i) => (
            <li key={c.name} className={i < unlocked ? '' : 'dark'}>
              <Cake index={i} alt={i < unlocked ? c.name : '아직 모르는 떡'} />
              <b>{i < unlocked ? c.name : '???'}</b>
              <small>{i < unlocked ? c.line : `${fmt(c.unlockAt)}개 팔면 열려요`}</small>
            </li>
          ))}
          <li className="book-note">떡 하나를 열 때마다 모든 떡이 10% 더 팔려요.</li>
        </ul>
      )}

      <section className="share">
        <button className="ghost" type="button" onClick={brag}>
          친구에게 내 떡집 자랑하기
        </button>
        <p className="note" role="status">
          {status}
        </p>
      </section>

      <footer className="foot">
        전체이용가 · 확률형 아이템 없음 · 게임 속 떡은 실제 돈이 아니에요.
        {!inToss() && ' 지금은 토스 밖 미리보기 화면이에요.'}
      </footer>

      {notice && (
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="notice-title" onClick={() => setNotice(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            {notice.kind === 'offline' && (
              <>
                <Cake index={current} happy className="sheet-cake" />
                <h2 id="notice-title">어서 와요, 사장님!</h2>
                <p>
                  {fmtDuration(notice.sec)} 동안 도우미들이 떡을 <b>{fmt(notice.amount)}개</b> 팔아 뒀어요.
                </p>
              </>
            )}
            {notice.kind === 'checkin' && (
              <>
                <Cake index={current} happy className="sheet-cake" />
                <h2 id="notice-title">{notice.streak}일 연속 출석!</h2>
                <p>
                  출석 보상으로 떡 <b>{fmt(notice.reward)}개</b>를 받았어요. 내일도 오면 더 커져요.
                </p>
              </>
            )}
            {notice.kind === 'unlock' && (
              <>
                <Cake index={notice.index} happy className="sheet-cake pop" />
                <h2 id="notice-title">새 떡 「{CAKES[notice.index].name}」 완성!</h2>
                <p>{CAKES[notice.index].line}. 이제 모든 떡이 10% 더 팔려요.</p>
              </>
            )}
            <button className="primary wide" type="button" onClick={() => setNotice(null)} autoFocus>
              좋아요
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
