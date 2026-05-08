import { useState, useEffect, useRef } from "react";

const COLORS = {
  bg: "#0a0a0a",
  surface: "#141414",
  card: "#1c1c1e",
  border: "#2c2c2e",
  green: "#30d158",
  greenDim: "#1a3a1a",
  blue: "#0a84ff",
  blueDim: "#1a2a4a",
  orange: "#ff9f0a",
  orangeDim: "#3a2a0a",
  purple: "#bf5af2",
  purpleDim: "#2a1a3a",
  red: "#ff453a",
  text: "#ffffff",
  textSec: "#8e8e93",
  textTer: "#636366",
};

const initialWeeks = [
  {
    week: 1,
    days: [
      { day: "월", type: "jog", planKm: 8, actualKm: 8.2, done: true, pace: "5'48\"", condition: 2 },
      { day: "화", type: "jog", planKm: 8, actualKm: 7.8, done: true, pace: "5'52\"", condition: 1 },
      { day: "수", type: "point", planKm: 10, actualKm: 11.3, done: true, pace: "5'08\"", condition: 3 },
      { day: "목", type: "jog", planKm: 8, actualKm: null, done: false, pace: null, condition: null },
      { day: "토", type: "lsd", planKm: 16, actualKm: null, done: false, pace: null, condition: null },
    ],
  },
  {
    week: 2,
    days: [
      { day: "월", type: "jog", planKm: 9, actualKm: null, done: false, pace: null, condition: null },
      { day: "화", type: "jog", planKm: 9, actualKm: null, done: false, pace: null, condition: null },
      { day: "수", type: "point", planKm: 10, actualKm: null, done: false, pace: null, condition: null },
      { day: "목", type: "jog", planKm: 9, actualKm: null, done: false, pace: null, condition: null },
      { day: "토", type: "lsd", planKm: 18, actualKm: null, done: false, pace: null, condition: null },
    ],
  },
];

const TYPE_META = {
  jog:   { label: "조깅",     color: COLORS.blue,   dim: COLORS.blueDim,   desc: "편안한 페이스 유산소" },
  point: { label: "포인트",   color: COLORS.orange,  dim: COLORS.orangeDim, desc: "인터벌 / 템포런 · 역치 향상" },
  lsd:   { label: "LSD",     color: COLORS.purple,  dim: COLORS.purpleDim, desc: "장거리 지구력 훈련" },
};

const COND = ["😩", "😐", "😊", "🔥"];
const COND_LABEL = ["힘들었음", "보통", "좋았음", "최고"];

function PaceRing({ pct, km, goal }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(pct, 1));
  return (
    <div style={{ position: "relative", width: 130, height: 130, flexShrink: 0 }}>
      <svg width="130" height="130" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="65" cy="65" r={r} fill="none" stroke="#1a1a1a" strokeWidth="10" />
        <circle
          cx="65" cy="65" r={r} fill="none"
          stroke={COLORS.green} strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.text, lineHeight: 1 }}>{km.toFixed(1)}</div>
        <div style={{ fontSize: 10, color: COLORS.textSec, marginTop: 2 }}>/ {goal} km</div>
        <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.green, marginTop: 2 }}>{Math.round(pct * 100)}%</div>
      </div>
    </div>
  );
}

function TypeBadge({ type, small }) {
  const m = TYPE_META[type];
  return (
    <span style={{
      fontSize: small ? 9 : 10,
      fontWeight: 600,
      padding: small ? "2px 5px" : "3px 8px",
      borderRadius: 6,
      background: m.dim,
      color: m.color,
    }}>{m.label}</span>
  );
}

function WeekDayCard({ d, isToday, onTap, onDetail }) {
  const m = TYPE_META[d.type];
  return (
    <div
      onClick={() => d.done ? onDetail(d) : onTap(d)}
      style={{
        background: d.done ? "#1a2a1a" : COLORS.card,
        borderRadius: 14,
        padding: "10px 5px",
        textAlign: "center",
        border: isToday ? `1.5px solid ${COLORS.green}` : "1.5px solid transparent",
        cursor: "pointer",
        transition: "opacity .15s",
      }}
    >
      <div style={{ fontSize: 12, color: COLORS.textSec, marginBottom: 3 }}>{d.day}</div>
      <TypeBadge type={d.type} small />
      <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.text, margin: "5px 0 2px" }}>
        {d.actualKm != null ? d.actualKm.toFixed(1) : d.planKm}
      </div>
      <div style={{ fontSize: 11, color: COLORS.textSec }}>km</div>
      {d.done ? (
        <div style={{ marginTop: 3, fontSize: 14, color: COLORS.green }}>✓</div>
      ) : isToday ? (
        <div style={{ marginTop: 3, fontSize: 11, color: COLORS.green }}>오늘</div>
      ) : (
        <div style={{ marginTop: 3, fontSize: 12, color: COLORS.textTer }}>—</div>
      )}
    </div>
  );
}

function HomeTab({ weeks, onRecord, onDetail, monthKm, goalKm }) {
  const todayIdx = 2;
  const currentWeek = weeks[0];
  const completedCount = weeks.flat ? 0 : weeks[0].days.filter(d => d.done).length;
  const totalDone = weeks.reduce((a, w) => a + w.days.filter(d => d.done).length, 0);
  const totalPlan = weeks.reduce((a, w) => a + w.days.length, 0);
  const todayDay = currentWeek.days[todayIdx];
  const lastPace = currentWeek.days.filter(d => d.done && d.pace).slice(-1)[0]?.pace || "-";

  return (
    <div style={{ padding: "16px 0 100px" }}>
      <div style={{ padding: "0 20px 12px" }}>
        <div style={{ fontSize: 13, color: COLORS.textSec, marginBottom: 4 }}>5월 2026</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: COLORS.text, letterSpacing: -0.5 }}>RunHigh</div>
          <div style={{ fontSize: 16, color: COLORS.textTer, fontStyle: "italic", letterSpacing: 0.3 }}>One run at a time</div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "12px 20px 16px" }}>
        <PaceRing pct={monthKm / goalKm} km={monthKm} goal={goalKm} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { dot: COLORS.green,  label: "월 달성률",   val: `${Math.round((monthKm/goalKm)*100)}%` },
            { dot: COLORS.blue,   label: "훈련 완료",   val: `${totalDone} / ${totalPlan}회` },
            { dot: COLORS.orange, label: "이번 주",     val: `${currentWeek.days.reduce((a,d) => a + (d.actualKm ?? d.planKm), 0).toFixed(0)} km` },
            { dot: COLORS.purple, label: "최근 페이스", val: lastPace },
          ].map(s => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 14, color: COLORS.textSec }}>{s.label}</span>
              <span style={{ fontSize: 15, fontWeight: 600, color: COLORS.text }}>{s.val}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: 0.5, background: COLORS.border, margin: "0 20px 16px" }} />

      <div style={{ padding: "0 20px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.textSec, letterSpacing: 0.5, textTransform: "uppercase" }}>이번 주 훈련</div>
          <div style={{ fontSize: 14, color: COLORS.textTer }}>5.4 ~ 5.9</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
          {currentWeek.days.map((d, i) => (
            <WeekDayCard key={d.day} d={d} isToday={i === todayIdx} onTap={onRecord} onDetail={onDetail} />
          ))}
        </div>
      </div>

      <div style={{ height: 0.5, background: COLORS.border, margin: "0 20px 16px" }} />

      <div style={{ padding: "0 20px" }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.textSec, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 10 }}>오늘 훈련</div>
        <div style={{ background: COLORS.card, borderRadius: 16, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <TypeBadge type={todayDay.type} />
            <span style={{ fontSize: 13, color: COLORS.textTer }}>5월 6일 수요일</span>
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: COLORS.text }}>
            {todayDay.planKm} <span style={{ fontSize: 14, color: COLORS.textSec, fontWeight: 400 }}>km 계획</span>
          </div>
          <div style={{ fontSize: 14, color: COLORS.textSec, marginTop: 4 }}>{TYPE_META[todayDay.type].desc}</div>
          <div style={{ display: "flex", gap: 16, marginTop: 12, paddingTop: 12, borderTop: `0.5px solid ${COLORS.border}` }}>
            {[["목표 페이스","5'10\""],["예상 시간","52분"],["난이도","★★★"]].map(([l,v]) => (
              <div key={l}>
                <div style={{ fontSize: 12, color: COLORS.textTer }}>{l}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: l === "난이도" ? COLORS.orange : COLORS.text, marginTop: 2 }}>{v}</div>
              </div>
            ))}
          </div>
          <button
            onClick={() => onRecord(todayDay)}
            style={{
              marginTop: 14, width: "100%", background: COLORS.green,
              border: "none", borderRadius: 12, padding: "12px 0",
              fontSize: 15, fontWeight: 600, color: "#000", cursor: "pointer",
            }}
          >
            훈련 완료 기록 →
          </button>
        </div>
      </div>
    </div>
  );
}

function PlanTab({ weeks, goalKm, setGoalKm }) {
  const [inputGoal, setInputGoal] = useState(goalKm);
  const [selectedDays, setSelectedDays] = useState([0,1,2,3,5]); // 월화수목토 기본

  function toggleDay(i) {
    setSelectedDays(prev =>
      prev.includes(i) ? prev.filter(d => d !== i) : [...prev, i]
    );
  }

  function generate() {
    setGoalKm(inputGoal);
  }

  return (
    <div style={{ padding: "16px 20px 100px" }}>
      <div style={{ fontSize: 15, color: COLORS.textSec, marginBottom: 4 }}>훈련 계획</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.text, marginBottom: 20 }}>월간 플랜 생성</div>

      <div style={{ background: COLORS.card, borderRadius: 16, padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 15, color: COLORS.textSec, marginBottom: 10 }}>목표 월 마일리지</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <input
            type="range" min={60} max={500} step={5} value={inputGoal}
            onChange={e => setInputGoal(+e.target.value)}
            style={{ flex: 1, accentColor: COLORS.green }}
          />
          <div style={{ minWidth: 70, textAlign: "right" }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: COLORS.green }}>{inputGoal}</span>
            <span style={{ fontSize: 14, color: COLORS.textSec }}> km</span>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: COLORS.textTer, marginTop: 4 }}>
          <span>60km</span><span>500km</span>
        </div>
      </div>

      <div style={{ background: COLORS.card, borderRadius: 16, padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 15, color: COLORS.textSec, marginBottom: 6 }}>주 훈련 가능 일수</div>
        <div style={{ fontSize: 13, color: COLORS.textTer, marginBottom: 10 }}>훈련 가능한 요일을 선택하세요 · {selectedDays.length}일 선택됨</div>
        <div style={{ display: "flex", gap: 8 }}>
          {["월","화","수","목","금","토"].map((d, i) => {
            const isOn = selectedDays.includes(i);
            return (
              <div
                key={d}
                onClick={() => toggleDay(i)}
                style={{
                  flex: 1, textAlign: "center", padding: "10px 0",
                  borderRadius: 10, fontSize: 15, fontWeight: 600,
                  background: isOn ? COLORS.greenDim : COLORS.surface,
                  color: isOn ? COLORS.green : COLORS.textTer,
                  border: isOn ? `1.5px solid ${COLORS.green}` : `1.5px solid ${COLORS.border}`,
                  cursor: "pointer",
                  transition: "all .2s",
                }}
              >{d}</div>
            );
          })}
        </div>
      </div>

      <div style={{ background: COLORS.card, borderRadius: 16, padding: 16, marginBottom: 20 }}>
        <div style={{ fontSize: 15, color: COLORS.textSec, marginBottom: 12 }}>계획 미리보기</div>
        {[1,2,3,4].map(w => {
          const factor = w === 4 ? 0.75 : 1 + (w-1)*0.08;
          const weekKm = Math.round((inputGoal / 4) * factor);
          const lsd = Math.round(weekKm * 0.33);
          const pt = 10;
          const jog = Math.round((weekKm - lsd - pt) / 3);
          return (
            <div key={w} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: w<4?12:0 }}>
              <div style={{ fontSize: 14, color: COLORS.textSec, width: 40 }}>{w}주차</div>
              <div style={{ flex: 1, height: 7, background: COLORS.border, borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${Math.min((weekKm/60)*100,100)}%`, height: "100%", background: w===4?COLORS.orange:COLORS.green, borderRadius: 3, transition: "width .5s" }} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: w===4?COLORS.orange:COLORS.text, width: 55, textAlign: "right" }}>{weekKm} km</div>
              {w === 4 && <span style={{ fontSize: 12, color: COLORS.orange }}>회복</span>}
            </div>
          );
        })}
      </div>

      <button
        onClick={generate}
        style={{
          width: "100%", background: COLORS.green, border: "none",
          borderRadius: 14, padding: "14px 0", fontSize: 16,
          fontWeight: 700, color: "#000", cursor: "pointer",
        }}
      >
        플랜 생성하기
      </button>
    </div>
  );
}

function StatsTab({ weeks }) {
  const allDone = weeks.flatMap(w => w.days.filter(d => d.done));
  const totalKm = allDone.reduce((a, d) => a + (d.actualKm || 0), 0);
  const overCount = allDone.filter(d => d.actualKm > d.planKm).length;
  const underCount = allDone.filter(d => d.actualKm < d.planKm).length;
  const exactCount = allDone.filter(d => d.actualKm === d.planKm).length;

  const barData = [
    { label: "1주", plan: 50, actual: 36.3 },
    { label: "2주", plan: 55, actual: 0 },
    { label: "3주", plan: 58, actual: 0 },
    { label: "4주", plan: 37, actual: 0 },
  ];
  const maxVal = 60;

  return (
    <div style={{ padding: "16px 20px 100px" }}>
      <div style={{ fontSize: 15, color: COLORS.textSec, marginBottom: 4 }}>통계</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.text, marginBottom: 20 }}>이번 달 분석</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        {[
          { label: "총 누적 거리", val: `${totalKm.toFixed(1)} km`, color: COLORS.green },
          { label: "완료 훈련", val: `${allDone.length}회`, color: COLORS.blue },
          { label: "계획 초과", val: `${overCount}회`, color: COLORS.orange },
          { label: "계획 미달", val: `${underCount}회`, color: COLORS.red },
        ].map(s => (
          <div key={s.label} style={{ background: COLORS.card, borderRadius: 14, padding: "14px 14px" }}>
            <div style={{ fontSize: 14, color: COLORS.textSec, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      <div style={{ background: COLORS.card, borderRadius: 16, padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.text, marginBottom: 14 }}>주차별 계획 vs 실제</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 100 }}>
          {barData.map(b => (
            <div key={b.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: "100%", display: "flex", gap: 3, alignItems: "flex-end", height: 80 }}>
                <div style={{
                  flex: 1, background: COLORS.border, borderRadius: "4px 4px 0 0",
                  height: `${(b.plan/maxVal)*100}%`, transition: "height .6s",
                }} />
                <div style={{
                  flex: 1, background: b.actual > 0 ? COLORS.green : COLORS.greenDim,
                  borderRadius: "4px 4px 0 0",
                  height: b.actual > 0 ? `${(b.actual/maxVal)*100}%` : "4%",
                  transition: "height .6s",
                }} />
              </div>
              <div style={{ fontSize: 13, color: COLORS.textSec }}>{b.label}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 10, height: 10, background: COLORS.border, borderRadius: 2 }} />
            <span style={{ fontSize: 13, color: COLORS.textSec }}>계획</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 10, height: 10, background: COLORS.green, borderRadius: 2 }} />
            <span style={{ fontSize: 13, color: COLORS.textSec }}>실제</span>
          </div>
        </div>
      </div>

      <div style={{ background: COLORS.card, borderRadius: 16, padding: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.text, marginBottom: 14 }}>훈련 타입별 누적</div>
        {[
          { type: "jog", km: 24, total: 45 },
          { type: "point", km: 11.3, total: 20 },
          { type: "lsd", km: 0, total: 55 },
        ].map(t => {
          const m = TYPE_META[t.type];
          return (
            <div key={t.type} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 14, color: COLORS.textSec }}>{m.label}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: m.color }}>{t.km} / {t.total} km</span>
              </div>
              <div style={{ height: 7, background: COLORS.border, borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${(t.km/t.total)*100}%`, height: "100%", background: m.color, borderRadius: 3, transition: "width .6s" }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TrainingDetail({ day, onClose, onEdit }) {
  const canvasRef = useRef(null);
  const [composited, setComposited] = useState(false);

  const m = TYPE_META[day.type];
  const condIcon = day.condition != null ? COND[day.condition] : null;
  const condLabel = day.condition != null ? COND_LABEL[day.condition] : null;

  function drawComposite() {
    const canvas = canvasRef.current;
    if (!canvas || !day.photo) return;
    const ctx = canvas.getContext("2d");
    const W = 360, H = 480;
    canvas.width = W; canvas.height = H;

    const img = new Image();
    img.onload = () => {
      // 사진 (상단 3/4)
      const photoH = 340;
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(0, 0, W, photoH, [16, 16, 0, 0]);
      ctx.clip();
      const scale = Math.max(W / img.width, photoH / img.height);
      const sw = img.width * scale, sh = img.height * scale;
      ctx.drawImage(img, (W - sw) / 2, (photoH - sh) / 2, sw, sh);
      ctx.restore();

      // 하단 데이터 카드
      ctx.fillStyle = "#111111";
      ctx.beginPath();
      ctx.roundRect(0, photoH, W, H - photoH, [0, 0, 16, 16]);
      ctx.fill();

      // 브랜드 + 날짜
      ctx.font = "700 12px monospace";
      ctx.fillStyle = "#30d158";
      ctx.fillText("RUNHIGH", 18, photoH + 22);

      ctx.font = "400 10px -apple-system, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      const typeLabel = m.label;
      ctx.fillText(`2026.05  ·  ${typeLabel}`, 18, photoH + 38);

      // 구분선
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(18, photoH + 48); ctx.lineTo(W - 18, photoH + 48);
      ctx.stroke();

      // 수치 4칸
      const stats = [
        [day.actualKm?.toFixed(2) ?? "-", "km", "거리"],
        [day.pace ?? "-", "/km", "페이스"],
        [day.time ?? "-", "", "시간"],
        [day.heartRate ? `${day.heartRate}` : "-", "bpm", "심박"],
      ];
      stats.forEach(([val, unit, lbl], i) => {
        const x = 18 + i * 82;
        ctx.font = `700 17px -apple-system, sans-serif`;
        ctx.fillStyle = i === 3 ? "#ff453a" : "#ffffff";
        ctx.fillText(val, x, photoH + 72);
        ctx.font = "400 9px -apple-system, sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.fillText(unit, x, photoH + 86);
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.fillText(lbl, x, photoH + 100);
        if (i < 3) {
          ctx.strokeStyle = "rgba(255,255,255,0.08)";
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(x + 74, photoH + 54); ctx.lineTo(x + 74, photoH + 106);
          ctx.stroke();
        }
      });
      setComposited(true);
    };
    img.src = day.photo;
  }

  useEffect(() => {
    if (day.photo) drawComposite();
  }, [day.photo]);

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.download = `runhigh_${day.day}.png`;
    a.href = canvas.toDataURL("image/png");
    a.click();
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: COLORS.bg,
      zIndex: 100, overflowY: "auto",
    }}>
      {/* 헤더 */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 20px", borderBottom: `0.5px solid ${COLORS.border}`,
      }}>
        <button onClick={onClose} style={{
          background: "none", border: "none", color: COLORS.green,
          fontSize: 15, fontWeight: 600, cursor: "pointer", padding: 0,
        }}>← 뒤로</button>
        <div style={{ fontSize: 16, fontWeight: 600, color: COLORS.text }}>훈련 상세</div>
        <button onClick={() => onEdit(day)} style={{
          background: "none", border: "none", color: COLORS.textSec,
          fontSize: 14, cursor: "pointer", padding: 0,
        }}>편집</button>
      </div>

      <div style={{ padding: "20px 20px 100px" }}>
        {/* 합성 캔버스 or 사진 없음 */}
        {day.photo ? (
          <div style={{ marginBottom: 16 }}>
            <canvas ref={canvasRef} style={{
              width: "100%", borderRadius: 16, display: "block",
            }} />
            <button onClick={handleDownload} style={{
              marginTop: 10, width: "100%", background: COLORS.surface,
              border: `0.5px solid ${COLORS.border}`, borderRadius: 12,
              padding: "12px 0", fontSize: 14, fontWeight: 600,
              color: COLORS.green, cursor: "pointer",
            }}>
              📥 공유 이미지 저장
            </button>
          </div>
        ) : (
          <div style={{
            background: COLORS.card, borderRadius: 16, padding: 32,
            textAlign: "center", marginBottom: 16,
          }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>📷</div>
            <div style={{ fontSize: 14, color: COLORS.textSec }}>첨부된 사진이 없어요</div>
          </div>
        )}

        {/* 훈련 요약 */}
        <div style={{ background: COLORS.card, borderRadius: 16, padding: 16, marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <TypeBadge type={day.type} />
            {condIcon && (
              <span style={{ fontSize: 13, color: COLORS.textSec }}>{condIcon} {condLabel}</span>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              ["실제 거리", day.actualKm != null ? `${day.actualKm.toFixed(2)} km` : "-", COLORS.green],
              ["평균 페이스", day.pace ?? "-", COLORS.blue],
              ["시간", day.time ?? "-", COLORS.purple],
              ["심박수", day.heartRate ? `${day.heartRate} bpm` : "-", COLORS.red],
              ["케이던스", day.cadence ? `${day.cadence} spm` : "-", COLORS.orange],
              ["계획 거리", `${day.planKm} km`, COLORS.textSec],
            ].map(([lbl, val, color]) => (
              <div key={lbl} style={{ background: COLORS.surface, borderRadius: 12, padding: "12px 14px" }}>
                <div style={{ fontSize: 12, color: COLORS.textTer, marginBottom: 4 }}>{lbl}</div>
                <div style={{ fontSize: 17, fontWeight: 700, color }}>{val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 메모 */}
        {day.memo && (
          <div style={{ background: COLORS.card, borderRadius: 16, padding: 16 }}>
            <div style={{ fontSize: 13, color: COLORS.textSec, marginBottom: 6 }}>메모</div>
            <div style={{ fontSize: 14, color: COLORS.text, lineHeight: 1.6 }}>{day.memo}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function BottomSheet({ day, onClose, onSave }) {
  const [km, setKm] = useState(String(day?.actualKm ?? day?.planKm ?? ""));
  const [hourVal, setHourVal] = useState("0");
  const [minVal, setMinVal] = useState("55");
  const [secVal, setSecVal] = useState("0");
  const [cond, setCond] = useState(day?.condition ?? 2);
  const [memo, setMemo] = useState("");
  const [heartRate, setHeartRate] = useState("145");
  const [cadence, setCadence] = useState("170");
  const [photo, setPhoto] = useState(null);
  const fileRef = useRef(null);

  function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setPhoto(ev.target.result);
    reader.readAsDataURL(file);
  }

  if (!day) return null;

  const kmNum = parseFloat(km) || 0;
  const hourNum = parseInt(hourVal) || 0;
  const minNum = parseInt(minVal) || 0;
  const secNum = Math.min(59, parseInt(secVal) || 0);
  const hrNum = parseInt(heartRate) || 0;
  const cadNum = parseInt(cadence) || 0;

  const totalMin = hourNum * 60 + minNum + secNum / 60;
  const diff = +(kmNum - day.planKm).toFixed(2);
  const pace = kmNum > 0 ? (totalMin / kmNum) : 0;
  const paceMin = Math.floor(pace);
  const paceSec = Math.round((pace - paceMin) * 60);
  const paceStr = `${paceMin}'${String(paceSec).padStart(2,"0")}"`;

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
      display: "flex", alignItems: "flex-end", zIndex: 100,
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", background: COLORS.card,
          borderRadius: "24px 24px 0 0",
          maxHeight: "88vh", overflowY: "auto",
          paddingBottom: 40,
        }}
      >
        <div style={{ width: 36, height: 4, background: COLORS.border, borderRadius: 2, margin: "12px auto 16px" }} />

        <div style={{ padding: "0 20px 14px", borderBottom: `0.5px solid ${COLORS.border}` }}>
          <div style={{ fontSize: 19, fontWeight: 600, color: COLORS.text }}>훈련 완료 기록</div>
          <div style={{ fontSize: 15, color: COLORS.textSec, marginTop: 2 }}>2026년 5월 6일 수요일</div>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <TypeBadge type={day.type} />
            <span style={{ fontSize: 13, padding: "3px 10px", borderRadius: 8, background: COLORS.surface, color: COLORS.textSec }}>
              계획 {day.planKm} km
            </span>
          </div>
        </div>

        <div style={{ padding: "16px 20px 0" }}>
          {/* 실제 거리 */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 14, color: COLORS.textSec, marginBottom: 8 }}>실제 거리</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input
                type="text" inputMode="decimal" value={km}
                onChange={e => setKm(e.target.value)}
                placeholder="0.00"
                style={{
                  flex: 1, background: COLORS.surface, border: `1.5px solid ${COLORS.green}`,
                  borderRadius: 12, padding: "12px 16px", fontSize: 22, fontWeight: 700,
                  color: COLORS.text, outline: "none", textAlign: "center",
                }}
              />
              <span style={{ fontSize: 15, color: COLORS.textSec }}>km</span>
            </div>
            {km !== "" && diff !== 0 && (
              <div style={{
                marginTop: 6, display: "inline-block",
                fontSize: 13, padding: "3px 10px", borderRadius: 8,
                background: diff > 0 ? COLORS.greenDim : "#3a1a1a",
                color: diff > 0 ? COLORS.green : COLORS.red,
              }}>
                {diff > 0 ? `+${diff} km 초과` : `${diff} km 미달`}
              </div>
            )}
          </div>

          {/* 실제 시간 */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 14, color: COLORS.textSec, marginBottom: 8 }}>실제 시간</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <input
                  type="text" inputMode="numeric" value={hourVal}
                  onChange={e => setHourVal(e.target.value)}
                  placeholder="0"
                  style={{
                    width: "100%", background: COLORS.surface, border: `1.5px solid ${COLORS.blue}`,
                    borderRadius: 12, padding: "12px 4px", fontSize: 22, fontWeight: 700,
                    color: COLORS.text, outline: "none", textAlign: "center",
                  }}
                />
                <span style={{ fontSize: 12, color: COLORS.textTer }}>시간</span>
              </div>
              <div style={{ fontSize: 22, color: COLORS.textTer, paddingBottom: 20 }}>:</div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <input
                  type="text" inputMode="numeric" value={minVal}
                  onChange={e => setMinVal(e.target.value)}
                  placeholder="0"
                  style={{
                    width: "100%", background: COLORS.surface, border: `1.5px solid ${COLORS.blue}`,
                    borderRadius: 12, padding: "12px 4px", fontSize: 22, fontWeight: 700,
                    color: COLORS.text, outline: "none", textAlign: "center",
                  }}
                />
                <span style={{ fontSize: 12, color: COLORS.textTer }}>분</span>
              </div>
              <div style={{ fontSize: 22, color: COLORS.textTer, paddingBottom: 20 }}>:</div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <input
                  type="text" inputMode="numeric" value={secVal}
                  onChange={e => setSecVal(e.target.value)}
                  placeholder="0"
                  style={{
                    width: "100%", background: COLORS.surface, border: `1.5px solid ${COLORS.blue}`,
                    borderRadius: 12, padding: "12px 4px", fontSize: 22, fontWeight: 700,
                    color: COLORS.text, outline: "none", textAlign: "center",
                  }}
                />
                <span style={{ fontSize: 12, color: COLORS.textTer }}>초</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              {[["평균 페이스", paceStr, COLORS.blue], ["예상 칼로리", `${Math.round(kmNum * 65)} kcal`, COLORS.orange]].map(([l,v,c]) => (
                <div key={l} style={{ flex: 1, background: COLORS.surface, borderRadius: 10, padding: "10px 12px" }}>
                  <div style={{ fontSize: 12, color: COLORS.textTer }}>{l}</div>
                  <div style={{ fontSize: 17, fontWeight: 600, color: c, marginTop: 3 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 평균 심박수 */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 14, color: COLORS.textSec, marginBottom: 8 }}>평균 심박수</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input
                type="text" inputMode="numeric" value={heartRate}
                onChange={e => setHeartRate(e.target.value)}
                placeholder="0"
                style={{
                  flex: 1, background: COLORS.surface, border: `1.5px solid ${COLORS.red}`,
                  borderRadius: 12, padding: "12px 16px", fontSize: 22, fontWeight: 700,
                  color: COLORS.text, outline: "none", textAlign: "center",
                }}
              />
              <span style={{ fontSize: 15, color: COLORS.textSec }}>bpm</span>
            </div>
          </div>

          {/* 평균 케이던스 */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 14, color: COLORS.textSec, marginBottom: 8 }}>평균 케이던스</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input
                type="text" inputMode="numeric" value={cadence}
                onChange={e => setCadence(e.target.value)}
                placeholder="0"
                style={{
                  flex: 1, background: COLORS.surface, border: `1.5px solid ${COLORS.purple}`,
                  borderRadius: 12, padding: "12px 16px", fontSize: 22, fontWeight: 700,
                  color: COLORS.text, outline: "none", textAlign: "center",
                }}
              />
              <span style={{ fontSize: 15, color: COLORS.textSec }}>spm</span>
            </div>
          </div>

          {/* 컨디션 */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 14, color: COLORS.textSec, marginBottom: 8 }}>오늘 컨디션</div>
            <div style={{ display: "flex", gap: 8 }}>
              {COND.map((icon, i) => (
                <button
                  key={i}
                  onClick={() => setCond(i)}
                  style={{
                    flex: 1, background: cond === i ? COLORS.blueDim : COLORS.surface,
                    border: cond === i ? `1.5px solid ${COLORS.blue}` : "1.5px solid transparent",
                    borderRadius: 12, padding: "10px 0", cursor: "pointer",
                  }}
                >
                  <div style={{ fontSize: 20 }}>{icon}</div>
                  <div style={{ fontSize: 11, color: cond === i ? COLORS.blue : COLORS.textTer, marginTop: 3 }}>{COND_LABEL[i]}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 메모 */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 14, color: COLORS.textSec, marginBottom: 8 }}>메모 (선택)</div>
            <textarea
              value={memo}
              onChange={e => setMemo(e.target.value)}
              placeholder="오늘 훈련 메모..."
              rows={3}
              style={{
                width: "100%", background: COLORS.surface, border: `0.5px solid ${COLORS.border}`,
                borderRadius: 12, padding: "12px 14px", fontSize: 14,
                color: COLORS.text, resize: "none", outline: "none",
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* 사진 업로드 */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 14, color: COLORS.textSec, marginBottom: 8 }}>훈련 사진 (선택)</div>
            <input
              type="file" accept="image/*" ref={fileRef}
              onChange={handlePhotoChange}
              style={{ display: "none" }}
            />
            {photo ? (
              <div style={{ position: "relative" }}>
                <img src={photo} alt="훈련 사진" style={{
                  width: "100%", borderRadius: 12, maxHeight: 200,
                  objectFit: "cover", display: "block",
                }} />
                <button onClick={() => setPhoto(null)} style={{
                  position: "absolute", top: 8, right: 8,
                  background: "rgba(0,0,0,0.6)", border: "none",
                  borderRadius: "50%", width: 28, height: 28,
                  color: "#fff", fontSize: 14, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>✕</button>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()} style={{
                width: "100%", background: COLORS.surface,
                border: `1px dashed ${COLORS.border}`, borderRadius: 12,
                padding: "20px 0", fontSize: 14, color: COLORS.textSec,
                cursor: "pointer", display: "flex", flexDirection: "column",
                alignItems: "center", gap: 6,
              }}>
                <span style={{ fontSize: 28 }}>📷</span>
                <span>사진 추가하기</span>
              </button>
            )}
          </div>

          <button
            onClick={() => onSave({ km: kmNum, min: totalMin, cond, memo, pace: paceStr, heartRate: hrNum, cadence: cadNum, photo,
              time: `${String(parseInt(hourVal)||0).padStart(1,"0")}:${String(parseInt(minVal)||0).padStart(2,"0")}:${String(Math.min(59,parseInt(secVal)||0)).padStart(2,"0")}` })}
            style={{
              width: "100%", background: COLORS.green, border: "none",
              borderRadius: 14, padding: "14px 0", fontSize: 16,
              fontWeight: 700, color: "#000", cursor: "pointer",
            }}
          >
            기록 저장
          </button>
        </div>
      </div>
    </div>
  );
}

const TAB_ICONS = [
  { id: "home",  icon: "🏃", label: "훈련" },
  { id: "plan",  icon: "📅", label: "계획" },
  { id: "stats", icon: "📊", label: "통계" },
  { id: "settings", icon: "⚙️", label: "설정" },
];

export default function RunHigh() {
  const [tab, setTab] = useState("home");
  const [weeks, setWeeks] = useState(initialWeeks);
  const [sheetDay, setSheetDay] = useState(null);
  const [detailDay, setDetailDay] = useState(null);
  const [goalKm, setGoalKm] = useState(120);
  const [toast, setToast] = useState(null);

  const monthKm = weeks.reduce((a, w) => a + w.days.reduce((b, d) => b + (d.actualKm || 0), 0), 0);

  function handleRecord(day) { setSheetDay(day); }
  function handleDetail(day) { setDetailDay(day); }

  function handleSave({ km, min, cond, memo, pace, heartRate, cadence, photo, time }) {
    setWeeks(prev => prev.map(w => ({
      ...w,
      days: w.days.map(d =>
        d.day === sheetDay.day && d.type === sheetDay.type
          ? { ...d, actualKm: km, done: true, pace, condition: cond, memo, heartRate, cadence, photo, time }
          : d
      ),
    })));
    setSheetDay(null);
    setToast("기록이 저장됐어요! 🎉");
    setTimeout(() => setToast(null), 2500);
  }

  return (
    <div style={{
      maxWidth: 430, margin: "0 auto", minHeight: "100vh",
      background: COLORS.bg, color: COLORS.text,
      fontFamily: "-apple-system, 'SF Pro Display', sans-serif",
      position: "relative",
    }}>
      <div style={{ paddingBottom: 80 }}>
        {tab === "home"  && <HomeTab weeks={weeks} onRecord={handleRecord} onDetail={handleDetail} monthKm={monthKm} goalKm={goalKm} />}
        {tab === "plan"  && <PlanTab weeks={weeks} goalKm={goalKm} setGoalKm={setGoalKm} />}
        {tab === "stats" && <StatsTab weeks={weeks} />}
        {tab === "settings" && (
          <div style={{ padding: "60px 20px", textAlign: "center", color: COLORS.textSec }}>
            설정 화면 준비 중
          </div>
        )}
      </div>

      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 430,
        background: "rgba(20,20,20,0.95)",
        borderTop: `0.5px solid ${COLORS.border}`,
        display: "flex", paddingBottom: "env(safe-area-inset-bottom, 16px)",
        zIndex: 50,
      }}>
        {TAB_ICONS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1, background: "none", border: "none", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center",
              padding: "10px 0 6px", gap: 3,
            }}
          >
            <span style={{ fontSize: 22 }}>{t.icon}</span>
            <span style={{ fontSize: 10, color: tab === t.id ? COLORS.green : COLORS.textTer, fontWeight: tab === t.id ? 600 : 400 }}>
              {t.label}
            </span>
          </button>
        ))}
      </div>

      {detailDay && (
        <TrainingDetail
          day={detailDay}
          onClose={() => setDetailDay(null)}
          onEdit={(d) => { setDetailDay(null); setSheetDay(d); }}
        />
      )}
      {sheetDay && <BottomSheet day={sheetDay} onClose={() => setSheetDay(null)} onSave={handleSave} />}

      {toast && (
        <div style={{
          position: "fixed", top: 60, left: "50%", transform: "translateX(-50%)",
          background: COLORS.green, color: "#000", fontSize: 14, fontWeight: 600,
          padding: "10px 20px", borderRadius: 20, zIndex: 200,
          whiteSpace: "nowrap",
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}
