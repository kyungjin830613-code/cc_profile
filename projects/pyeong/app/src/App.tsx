import { useState } from 'react';
import { Button, Paragraph, SegmentedControl, Slider, TextField } from '@toss/tds-mobile';
import { COMMON_UNITS, DEFAULT_EXCLUSIVE_RATIO, fmt, parse, pyeongToSqm, roomArea, sqmToPyeong, supplyFromExclusive, typeName } from './lib/area';
import { appLink, inToss, shareText } from './lib/toss';

type Tab = 'convert' | 'apt' | 'room';

export default function App() {
  const [tab, setTab] = useState<Tab>('convert');
  const [pyeong, setPyeong] = useState('');
  const [sqm, setSqm] = useState('');
  const [exclusive, setExclusive] = useState('84');
  const [ratio, setRatio] = useState(Math.round(DEFAULT_EXCLUSIVE_RATIO * 100));
  const [w, setW] = useState('');
  const [d, setD] = useState('');
  const [status, setStatus] = useState('');

  const onPyeong = (v: string) => {
    const s = v.replace(/[^\d.,]/g, '');
    setPyeong(s);
    setSqm(parse(s) ? fmt(pyeongToSqm(parse(s)), 2) : '');
  };
  const onSqm = (v: string) => {
    const s = v.replace(/[^\d.,]/g, '');
    setSqm(s);
    setPyeong(parse(s) ? fmt(sqmToPyeong(parse(s)), 2) : '');
  };

  const ex = parse(exclusive);
  const supply = supplyFromExclusive(ex, ratio / 100);
  const room = roomArea(parse(w), parse(d));

  const share = async () => {
    const text =
      tab === 'apt' && ex
        ? `[평수 계산기] 전용 ${fmt(ex)}㎡(${fmt(sqmToPyeong(ex))}평) → 공급 약 ${fmt(sqmToPyeong(supply))}평, ${typeName(sqmToPyeong(supply))}`
        : tab === 'room' && room.sqm
          ? `[평수 계산기] 방 ${w}m × ${d}m = ${fmt(room.sqm)}㎡, 약 ${fmt(room.pyeong)}평`
          : `[평수 계산기] ${pyeong || 0}평 = ${sqm || 0}㎡`;
    const r = await shareText(`${text}\n평수 계산해 보기: ${await appLink()}`);
    setStatus(r === 'shared' ? '' : r === 'copied' ? '문구를 복사했어요.' : '공유가 막혔어요.');
  };

  const tf = (label: string, value: string, onChange: (v: string) => void, suffix: string, placeholder = '0', help?: string) => (
    <div className="tf">
      <TextField variant="box" label={label} labelOption="sustain" suffix={suffix} inputMode="decimal" placeholder={placeholder} value={value} help={help} onChange={(e) => onChange(e.target.value)} />
    </div>
  );

  return (
    <div className="page">
      <div className="head">
        <h1>평수 계산기</h1>
        <Paragraph.Text typography="t6" color="var(--sub)">
          평 ↔ ㎡ 바꾸기, 아파트 전용·공급면적, 방 크기까지
        </Paragraph.Text>
      </div>

      <div className="pad">
        <SegmentedControl value={tab} onChange={(v: string) => setTab(v as Tab)}>
          <SegmentedControl.Item value="convert">평 ↔ ㎡</SegmentedControl.Item>
          <SegmentedControl.Item value="apt">아파트</SegmentedControl.Item>
          <SegmentedControl.Item value="room">방 넓이</SegmentedControl.Item>
        </SegmentedControl>
      </div>

      {tab === 'convert' && (
        <section className="card">
          {tf('평', pyeong, onPyeong, '평')}
          <p className="swap" aria-hidden>
            ⇅
          </p>
          {tf('제곱미터', sqm, onSqm, '㎡')}
          <Paragraph.Text typography="t7" color="var(--sub)">
            1평 = 3.3058㎡ (400/121㎡). 어느 칸에 넣어도 바로 바뀌어요.
          </Paragraph.Text>
        </section>
      )}

      {tab === 'apt' && (
        <>
          <section className="card">
            {tf('전용면적 (분양 공고·등기부의 ㎡)', exclusive, (v) => setExclusive(v.replace(/[^\d.]/g, '')), '㎡', '84')}
            <div className="chips">
              {COMMON_UNITS.map((u) => (
                <Button key={u} size="small" variant={parse(exclusive) === u ? 'fill' : 'weak'} color={parse(exclusive) === u ? 'primary' : 'dark'} onClick={() => setExclusive(String(u))}>
                  {`${u}㎡`}
                </Button>
              ))}
            </div>
            <div className="setrow">
              <span>전용률</span>
              <b className="ratio">{ratio}%</b>
            </div>
            <Slider min={60} max={90} value={ratio} onValueChange={setRatio} aria-label="전용률" label={{ min: '60%', mid: '아파트 보통 70~80%', max: '90%' }} />
          </section>
          {ex > 0 && (
            <>
              <section className="result" aria-live="polite">
                <Paragraph.Text typography="t6" color="var(--sub2)">
                  흔히 부르는 크기
                </Paragraph.Text>
                <strong className="big-num">{typeName(sqmToPyeong(supply))}</strong>
              </section>
              <section className="card">
                <table className="kv">
                  <tbody>
                    <tr>
                      <th>전용면적</th>
                      <td>{`${fmt(ex)}㎡ · ${fmt(sqmToPyeong(ex))}평`}</td>
                    </tr>
                    <tr>
                      <th>공급면적 (약)</th>
                      <td>{`${fmt(supply)}㎡ · ${fmt(sqmToPyeong(supply))}평`}</td>
                    </tr>
                  </tbody>
                </table>
                <Paragraph.Text typography="t7" color="var(--sub)">
                  공급면적 = 전용 + 계단·복도 같은 주거공용. 단지마다 전용률이 달라 정확한 값은 분양 공고를 확인하세요.
                </Paragraph.Text>
              </section>
            </>
          )}
        </>
      )}

      {tab === 'room' && (
        <>
          <section className="card">
            {tf('가로', w, (v) => setW(v.replace(/[^\d.]/g, '')), 'm', '3')}
            {tf('세로', d, (v) => setD(v.replace(/[^\d.]/g, '')), 'm', '3.5', '줄자로 잰 cm는 100으로 나눠 m로 넣어요. 예: 350cm → 3.5')}
          </section>
          {room.sqm > 0 && (
            <section className="result" aria-live="polite">
              <Paragraph.Text typography="t6" color="var(--sub2)">
                방 넓이
              </Paragraph.Text>
              <strong className="big-num">{fmt(room.pyeong)}평</strong>
              <Paragraph.Text typography="t6" color="var(--sub)">{`${fmt(room.sqm, 2)}㎡`}</Paragraph.Text>
            </section>
          )}
        </>
      )}

      <div className="actions">
        <Button display="block" variant="weak" onClick={share}>
          결과 공유하기
        </Button>
      </div>
      <p className="note" role="status">
        {status}
      </p>
      <p className="foot">계산 참고용이에요. 계약·세금 신고에는 등기부·분양 공고의 공식 면적을 쓰세요.{!inToss() && ' 지금은 토스 밖 미리보기 화면이에요.'}</p>
    </div>
  );
}
