import { useEffect, useState } from "react";
import {
  Button,
  ListHeader,
  Paragraph,
  SegmentedControl,
  TextField,
} from "@toss/tds-mobile";
import {
  DEFAULT_MJ_PER_M3,
  SEOUL_GAS_BASE,
  SEOUL_GAS_UNIT,
  electricBill,
  gasBill,
  isSummer,
  m3ToMj,
  tiers,
  won,
  type Voltage,
} from "./lib/bill";
import { appLink, inToss, loadItem, saveItem, shareText } from "./lib/toss";

const STORE_KEY = "bill.v1";
type Tab = "electric" | "gas";

interface Saved {
  kwh: string;
  voltage: Voltage;
  gasMode: "mj" | "m3";
  gasAmount: string;
  unit: string;
  base: string;
  mjPerM3: string;
}
const DEFAULT: Saved = {
  kwh: "",
  voltage: "high",
  gasMode: "mj",
  gasAmount: "",
  unit: String(SEOUL_GAS_UNIT),
  base: String(SEOUL_GAS_BASE),
  mjPerM3: String(DEFAULT_MJ_PER_M3),
};

const num = (s: string) => {
  const n = Number(String(s).replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? n : 0;
};

function Field({
  label,
  unit,
  value,
  onChange,
  hint,
  decimal,
}: {
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  decimal?: boolean;
}) {
  return (
    <div className="tf">
      <TextField
        variant="box"
        label={label}
        labelOption="sustain"
        suffix={unit}
        inputMode={decimal ? "decimal" : "numeric"}
        placeholder="0"
        autoComplete="off"
        value={value}
        help={hint}
        onChange={(e) =>
          onChange(e.target.value.replace(decimal ? /[^\d.]/g : /[^\d]/g, ""))
        }
      />
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState<Tab>("electric");
  const [data, setData] = useState<Saved>(DEFAULT);
  const [loaded, setLoaded] = useState(false);
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [status, setStatus] = useState("");

  useEffect(() => {
    loadItem(STORE_KEY).then((raw) => {
      try {
        const v = raw ? JSON.parse(raw) : null;
        if (v && typeof v === "object")
          setData({
            ...DEFAULT,
            ...Object.fromEntries(
              Object.entries(v).filter(
                ([k, x]) => k in DEFAULT && typeof x === "string",
              ),
            ),
          });
      } catch {
        /* 무시 */
      }
      setLoaded(true);
    });
  }, []);
  useEffect(() => {
    if (loaded) saveItem(STORE_KEY, JSON.stringify(data));
  }, [data, loaded]);
  const set = (k: keyof Saved) => (v: string) =>
    setData((d) => ({ ...d, [k]: v }));

  const e = electricBill(num(data.kwh), data.voltage, month);
  const ts = tiers(data.voltage, month);
  const mj =
    data.gasMode === "mj"
      ? num(data.gasAmount)
      : m3ToMj(num(data.gasAmount), num(data.mjPerM3) || DEFAULT_MJ_PER_M3);
  const g = gasBill(mj, num(data.unit), num(data.base));

  const share = async () => {
    const text =
      tab === "electric"
        ? `[우리집 공과금 계산] ${month}월 전기 ${e.kwh}kWh → 예상 ${won(e.total)} (누진 ${e.tier}단계)`
        : `[우리집 공과금 계산] 도시가스 ${Math.round(mj).toLocaleString("ko-KR")}MJ → 예상 ${won(g.total)}`;
    const r = await shareText(
      `${text}\n우리 집도 계산해 보기: ${await appLink()}`,
    );
    setStatus(
      r === "shared"
        ? ""
        : r === "copied"
          ? "문구를 복사했어요."
          : "공유가 막혔어요.",
    );
  };

  const chip = (on: boolean) => ({
    size: "medium" as const,
    variant: on ? ("fill" as const) : ("weak" as const),
    color: on ? ("primary" as const) : ("dark" as const),
  });

  return (
    <div className="page">
      <div className="head">
        <h1>우리집 공과금 계산</h1>
        <Paragraph.Text typography="t6" color="var(--sub)">
          고지서 오기 전에 전기·가스 요금을 미리 계산해요
        </Paragraph.Text>
      </div>

      <div className="pad">
        <SegmentedControl
          value={tab}
          onChange={(v: string) => setTab(v as Tab)}
        >
          <SegmentedControl.Item value="electric">
            전기요금
          </SegmentedControl.Item>
          <SegmentedControl.Item value="gas">도시가스</SegmentedControl.Item>
        </SegmentedControl>
      </div>

      {tab === "electric" && (
        <>
          <section className="card">
            <p className="label">사는 곳</p>
            <div className="chips">
              <Button
                {...chip(data.voltage === "high")}
                onClick={() => setData((d) => ({ ...d, voltage: "high" }))}
              >
                아파트 (고압)
              </Button>
              <Button
                {...chip(data.voltage === "low")}
                onClick={() => setData((d) => ({ ...d, voltage: "low" }))}
              >
                단독·빌라 (저압)
              </Button>
            </div>
            <Paragraph.Text typography="t7" color="var(--sub)">
              아파트 대부분은 고압이에요. 정확한 건 고지서의 '계약종별'에서
              확인하세요.
            </Paragraph.Text>
            <div className="setrow">
              <span>몇 월 요금?</span>
              <span className="stepper">
                <Button
                  size="small"
                  variant="weak"
                  color="dark"
                  aria-label="이전 달"
                  onClick={() => setMonth((m) => (m === 1 ? 12 : m - 1))}
                >
                  ‹
                </Button>
                <b>{month}월</b>
                <Button
                  size="small"
                  variant="weak"
                  color="dark"
                  aria-label="다음 달"
                  onClick={() => setMonth((m) => (m === 12 ? 1 : m + 1))}
                >
                  ›
                </Button>
              </span>
            </div>
            {isSummer(month) && (
              <Paragraph.Text typography="t7" color="var(--blue)">
                7~8월은 여름 누진 완화 구간이 적용돼요.
              </Paragraph.Text>
            )}
            <Field
              label="한 달 사용량"
              unit="kWh"
              value={data.kwh}
              onChange={set("kwh")}
              hint="고지서나 한전ON 앱의 '사용량'이에요. 1인 가구는 보통 150~250kWh."
            />
          </section>

          <section className="result" aria-live="polite">
            <Paragraph.Text typography="t6" color="var(--sub2)">
              예상 전기요금
            </Paragraph.Text>
            <strong className="big-num">{won(e.total)}</strong>
            <span className={`tier t${e.tier}`}>누진 {e.tier}단계</span>
            <div className="meter" aria-hidden>
              {ts.map((_, i) => (
                <i key={i} className={e.tier > i ? "on" : ""} />
              ))}
            </div>
            {e.toNextTier !== null && e.kwh > 0 && (
              <Paragraph.Text
                typography="t7"
                color="var(--sub2)"
              >{`${e.toNextTier}kWh 더 쓰면 ${e.tier + 1}단계로 올라가요.`}</Paragraph.Text>
            )}
            {e.tier === 3 && (
              <Paragraph.Text typography="t7" color="var(--sub2)">
                3단계 구간이에요. 조금만 줄여도 요금이 크게 줄어요.
              </Paragraph.Text>
            )}
          </section>

          <ListHeader
            title={
              <ListHeader.TitleParagraph typography="t5" fontWeight="bold">
                계산 내역
              </ListHeader.TitleParagraph>
            }
          />
          <section className="card">
            <table className="kv">
              <tbody>
                <tr>
                  <th>기본요금 ({e.tier}단계)</th>
                  <td>{won(e.base)}</td>
                </tr>
                <tr>
                  <th>전력량요금</th>
                  <td>{won(e.energy)}</td>
                </tr>
                <tr>
                  <th>기후환경요금 (9원/kWh)</th>
                  <td>{won(e.climate)}</td>
                </tr>
                <tr>
                  <th>연료비조정요금 (5원/kWh)</th>
                  <td>{won(e.fuel)}</td>
                </tr>
                <tr className="sum">
                  <th>전기요금계</th>
                  <td>{won(e.subtotal)}</td>
                </tr>
                <tr>
                  <th>부가가치세 (10%)</th>
                  <td>{won(e.vat)}</td>
                </tr>
                <tr>
                  <th>전력산업기반기금 (2.7%)</th>
                  <td>{won(e.fund)}</td>
                </tr>
                <tr className="sum">
                  <th>청구 예상액</th>
                  <td>{won(e.total)}</td>
                </tr>
              </tbody>
            </table>
            <Paragraph.Text typography="t7" color="var(--sub)">
              {`${isSummer(month) ? "7~8월은 1단계 300kWh, 2단계 450kWh까지예요." : "1단계 200kWh, 2단계 400kWh까지예요."} 하계·동계에 1,000kWh를 넘으면 초과분에 슈퍼유저 요금이 붙어요.`}
            </Paragraph.Text>
          </section>
        </>
      )}

      {tab === "gas" && (
        <>
          <section className="card">
            <p className="label">사용량 단위</p>
            <div className="chips">
              <Button
                {...chip(data.gasMode === "mj")}
                onClick={() => setData((d) => ({ ...d, gasMode: "mj" }))}
              >
                MJ (메가줄)
              </Button>
              <Button
                {...chip(data.gasMode === "m3")}
                onClick={() => setData((d) => ({ ...d, gasMode: "m3" }))}
              >
                m³ (검침량)
              </Button>
            </div>
            <Field
              label="한 달 사용량"
              unit={data.gasMode === "mj" ? "MJ" : "m³"}
              value={data.gasAmount}
              onChange={set("gasAmount")}
              decimal
            />
            {data.gasMode === "m3" && (
              <Field
                label="열량 (고지서의 MJ/m³)"
                unit="MJ/m³"
                value={data.mjPerM3}
                onChange={set("mjPerM3")}
                decimal
                hint="고지서에 적힌 값을 쓰면 정확해요. 모르면 42.7로 두세요."
              />
            )}
            <details>
              <summary>지역 단가 바꾸기 (기본: 서울)</summary>
              <Field
                label="MJ당 단가"
                unit="원/MJ"
                value={data.unit}
                onChange={set("unit")}
                decimal
                hint="서울 주택용 22.5268원(2026년 11월). 다른 지역은 고지서의 단가를 넣어 주세요."
              />
              <Field
                label="기본요금"
                unit="원"
                value={data.base}
                onChange={set("base")}
              />
            </details>
          </section>

          <section className="result" aria-live="polite">
            <Paragraph.Text typography="t6" color="var(--sub2)">
              예상 가스요금
            </Paragraph.Text>
            <strong className="big-num">{won(g.total)}</strong>
            {data.gasMode === "m3" && mj > 0 && (
              <Paragraph.Text
                typography="t7"
                color="var(--sub)"
              >{`${Math.round(mj).toLocaleString("ko-KR")}MJ로 계산했어요.`}</Paragraph.Text>
            )}
          </section>
          <ListHeader
            title={
              <ListHeader.TitleParagraph typography="t5" fontWeight="bold">
                계산 내역
              </ListHeader.TitleParagraph>
            }
          />
          <section className="card">
            <table className="kv">
              <tbody>
                <tr>
                  <th>기본요금</th>
                  <td>{won(g.base)}</td>
                </tr>
                <tr>
                  <th>사용요금</th>
                  <td>{won(g.usage)}</td>
                </tr>
                <tr>
                  <th>부가가치세 (10%)</th>
                  <td>{won(g.vat)}</td>
                </tr>
                <tr className="sum">
                  <th>청구 예상액</th>
                  <td>{won(g.total)}</td>
                </tr>
              </tbody>
            </table>
          </section>
          <p className="note">
            난방비 절약: 실내 온도 1℃만 낮춰도 가스 사용량이 줄어요.
          </p>
        </>
      )}

      <div className="actions">
        <Button display="block" variant="weak" onClick={share}>
          가족에게 공유하기
        </Button>
      </div>
      <p className="note" role="status">
        {status}
      </p>
      <p className="foot">
        2026년 11월 기준 공개 요금표로 계산한 예상액이에요. 복지 할인, 대가족
        할인, 검침일, 지역별 단가에 따라 실제 고지서와 다를 수 있어요. 입력값은
        이 기기에만 저장돼요.
        {!inToss() && " 지금은 토스 밖 미리보기 화면이에요."}
      </p>
    </div>
  );
}
