import { useState, useRef, useEffect } from "react";

const C = {
  bg: "#FAF7F2", card: "#FFFCF7", border: "#E8DDD0",
  accent: "#B8885A", accentLight: "#F5EDE0", accentLighter: "#FBF6EE",
  text: "#3A3028", muted: "#8C7B6E", ink: "#5C4A3A",
  sage: "#7A9E7E", sageLt: "#EDF4EE", rose: "#C4796A",
};

const STATIONS = [
  { id: "dashboard", icon: "◎", title: "現況儀表板", sub: "健康 · 工作 · 遊戲 · 愛" },
  { id: "compass",   icon: "◈", title: "工作觀 × 人生觀", sub: "打造你的羅盤" },
  { id: "goodtime",  icon: "◑", title: "好時光日誌", sub: "投入 · 精力 · 心流" },
  { id: "mindmap",   icon: "✦", title: "心智圖探索", sub: "自由聯想，找出模式" },
  { id: "odyssey",   icon: "⌖", title: "Odyssey Plan", sub: "三條截然不同的五年路" },
  { id: "prototype", icon: "◬", title: "原型對話", sub: "設計下一步行動" },
];

const SYS = `你是《做自己的生命設計師》的深度讀者與對話夥伴，熟悉書中所有工具的精確定義。

角色：
1. 符合書中定義 → 深化，追問一個讓他們看得更清楚的問題
2. 偏離書中定義 → 溫和但明確指出，說明書中定義，邀請重新思考
3. 太模糊 → 追問具體問題落地
4. 有矛盾 → 把矛盾點拿出來

關鍵定義：
【工作觀】是「為何工作」的哲學，不是想做什麼工作。寫成理想職位=職務描述，不是工作觀。
【人生觀】是對人生根本問題的看法，不是目標清單或人生計畫。
【一致性】工作觀與人生觀能相輔相成、互相促進，矛盾要有意識承認。
【好時光日誌】要記錄活動層次的細節，分開追蹤投入度與精力（兩者可以不同）。
【心智圖】不審查的自由聯想，延伸3-4層，不是列職業清單。
【Odyssey Plan】三條路必須截然不同，不是同主題的變形，每條需有問題要測試。
【重力問題】無法採取行動的情境，只能接受然後轉向。
【船錨問題】真正可解決但被自己的解決方案困住了。

風格：溫暖但有立場，繁體中文，150-250字，每次最多問一個問題。`;

// ── 四格油箱元件 ──────────────────────────────────────
function TankGauge({ value, onChange, label, desc }) {
  const levels = [
    { label: "空", fill: 0 },
    { label: "¼", fill: 1 },
    { label: "½", fill: 2 },
    { label: "¾", fill: 3 },
    { label: "滿", fill: 4 },
  ];
  // value = 0..4
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <span style={{ fontWeight: 500, fontSize: 14, color: C.ink, minWidth: 90 }}>{label}</span>
        <div style={{ display: "flex", gap: 4 }}>
          {[1,2,3,4].map(i => (
            <div key={i} onClick={() => onChange(value === i ? 0 : i)}
              style={{
                width: 28, height: 28, borderRadius: 6,
                background: i <= value ? C.accent : C.accentLighter,
                border: `1.5px solid ${i <= value ? C.accent : C.border}`,
                cursor: "pointer", transition: "all 0.15s",
              }} />
          ))}
        </div>
        <span style={{ fontSize: 12, color: C.accent, minWidth: 16 }}>
          {value === 0 ? "空" : value === 1 ? "¼" : value === 2 ? "½" : value === 3 ? "¾" : "滿"}
        </span>
      </div>
    </div>
  );
}

// ── AI 對話框（自動帶入 context，不需用戶貼）─────────────
function AIChat({ context, stationExtra }) {
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = async (text) => {
    const content = text ?? input.trim();
    if (!content || loading) return;
    const userMsg = { role: "user", content };
    const newMsgs = [...msgs, userMsg];
    setMsgs(newMsgs);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYS + "\n\n【本站點說明】" + stationExtra + "\n\n【用戶目前的填寫內容】\n" + context,
          messages: newMsgs,
        }),
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || "（無回應）";
      setMsgs(m => [...m, { role: "assistant", content: reply }]);
    } catch {
      setMsgs(m => [...m, { role: "assistant", content: "連線出了問題，請稍後再試。" }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ marginTop: 20, background: C.accentLighter, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" }}>
      <div style={{ padding: "10px 14px", background: C.accentLight, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 13, color: C.accent }}>✦</span>
        <span style={{ fontSize: 13, fontWeight: 500, color: C.ink }}>和 AI 夥伴討論</span>
        <span style={{ fontSize: 11, color: C.muted }}>— 它讀過這本書，有立場</span>
      </div>
      {msgs.length === 0 && (
        <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
          <p style={{ margin: 0, fontSize: 13, color: C.muted, fontStyle: "italic" }}>填完上面後，可以把你的想法送給 AI 評判，或直接問問題。</p>
          <button onClick={() => send("請根據我目前的填寫內容給我回饋。")}
            style={{ alignSelf: "flex-start", padding: "6px 14px", borderRadius: 7, border: `1px solid ${C.border}`, background: C.card, color: C.ink, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>
            送出我目前的填寫，請評判 ↗
          </button>
        </div>
      )}
      <div style={{ maxHeight: 280, overflowY: "auto", padding: msgs.length ? "12px 16px" : 0 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ marginBottom: 12, display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "88%", padding: "8px 12px",
              borderRadius: m.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
              background: m.role === "user" ? C.accent : C.card,
              color: m.role === "user" ? "#fff" : C.text,
              fontSize: 13, lineHeight: 1.65,
              border: m.role === "assistant" ? `1px solid ${C.border}` : "none",
            }}>{m.content}</div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", marginBottom: 12 }}>
            <div style={{ padding: "8px 14px", borderRadius: "12px 12px 12px 2px", background: C.card, border: `1px solid ${C.border}`, fontSize: 13, color: C.muted }}>思考中…</div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <div style={{ padding: "10px 12px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 8 }}>
        <textarea value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="繼續追問或分享想法…" rows={2}
          style={{ flex: 1, resize: "none", padding: "7px 10px", fontSize: 13, borderRadius: 8, border: `1px solid ${C.border}`, background: C.card, color: C.text, outline: "none", fontFamily: "inherit" }} />
        <button onClick={() => send()} disabled={loading || !input.trim()}
          style={{ padding: "0 16px", borderRadius: 8, border: "none", background: input.trim() && !loading ? C.accent : C.border, color: input.trim() && !loading ? "#fff" : C.muted, cursor: input.trim() && !loading ? "pointer" : "default", fontSize: 13, fontWeight: 500 }}>
          送出
        </button>
      </div>
    </div>
  );
}

// ── ScoreBar（Odyssey 用）────────────────────────────────
function ScoreBar({ label, value, onChange }) {
  const lvl = ["低", "中低", "中", "中高", "高"];
  const idx = Math.round(value / 25);
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ fontSize: 12, color: C.muted }}>{label}</span>
        <span style={{ fontSize: 12, color: C.accent }}>{lvl[idx] ?? "高"}</span>
      </div>
      <input type="range" min={0} max={100} step={25} value={value} onChange={e => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: C.accent }} />
    </div>
  );
}

// ══ STATION COMPONENTS ══════════════════════════════════

function Dashboard({ data, setData }) {
  const items = [
    { key: "health", icon: "◎", label: "健康", desc: "身體、心理、靈性三個層面，比重由你決定" },
    { key: "work",   icon: "◈", label: "工作", desc: "有酬或無酬皆算——帶孩子、義工、副業都是工作" },
    { key: "play",   icon: "◑", label: "遊戲", desc: "純為樂趣而做的事，不為成績、不為進步" },
    { key: "love",   icon: "♡", label: "愛",   desc: "付出愛與感覺被愛，雙向都重要；包含對人、藝術、社群的愛" },
  ];
  const ctx = items.map(it =>
    `${it.label}：${data[it.key] ?? 0}/4 格（${["空","¼","½","¾","滿"][data[it.key] ?? 0]}）${data[it.key+"_note"] ? "，說明：" + data[it.key+"_note"] : ""}`
  ).join("；");

  return (
    <div>
      <p style={{ fontSize: 14, color: C.muted, marginBottom: 20, lineHeight: 1.7 }}>
        這不是評分，而是覺察現況。點選格子代表油箱的充盈程度，沒有完美比例，只有誠實的快照。
      </p>
      {items.map(it => (
        <div key={it.key} style={{ background: C.accentLighter, borderRadius: 10, padding: "14px 16px", marginBottom: 12, border: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 16, color: C.accent }}>{it.icon}</span>
            <TankGauge value={data[it.key] ?? 0} onChange={v => setData(d => ({ ...d, [it.key]: v }))} label={it.label} />
          </div>
          <p style={{ fontSize: 12, color: C.muted, margin: "0 0 8px 2px" }}>{it.desc}</p>
          <textarea placeholder={`用幾句話描述目前「${it.label}」的狀況…`}
            value={data[it.key + "_note"] ?? ""}
            onChange={e => setData(d => ({ ...d, [it.key + "_note"]: e.target.value }))} rows={2}
            style={{ width: "100%", resize: "none", padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" }} />
        </div>
      ))}
      <AIChat context={ctx} stationExtra="這是「健康／工作／遊戲／愛的儀表板」。幫用戶覺察現況、找出哪個領域需要設計，並辨別是否是重力問題（無法行動）還是真正可以設計的問題。" />
    </div>
  );
}

function Compass({ data, setData }) {
  const ctx = `工作觀：${data.workview ?? "（未填）"}；人生觀：${data.lifeview ?? "（未填）"}；一致性整合：${data.coherence ?? "（未填）"}`;
  return (
    <div>
      <p style={{ fontSize: 14, color: C.muted, marginBottom: 20, lineHeight: 1.7 }}>
        羅盤讓你知道自己往哪走。工作觀不是「想做什麼工作」，而是「為何工作」的哲學；人生觀不是計畫，而是你對最根本問題的看法。
      </p>
      {[
        { key: "workview", title: "工作觀", hint: "為什麼要工作？工作的意義是什麼？工作與個人、他人、社會的關聯？什麼叫好工作？金錢和工作的關係？", warn: "⚠ 常見陷阱：寫成理想工作清單或職涯規畫，那叫職務描述，不是工作觀。" },
        { key: "lifeview", title: "人生觀", hint: "人活在世上為了什麼？個人與他人的關聯？什麼是善？更崇高的力量？快樂與痛苦在人生中的角色？", warn: "⚠ 常見陷阱：寫成人生目標或願望清單，那是計畫，不是人生觀。" },
      ].map(({ key, title, hint, warn }) => (
        <div key={key} style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 500, fontSize: 15, color: C.ink, marginBottom: 4 }}>{title}</div>
          <p style={{ fontSize: 12, color: C.muted, margin: "0 0 4px", lineHeight: 1.6 }}>{hint}</p>
          <p style={{ fontSize: 11, color: C.rose, margin: "0 0 8px" }}>{warn}</p>
          <textarea value={data[key] ?? ""} onChange={e => setData(d => ({ ...d, [key]: e.target.value }))}
            placeholder={`寫下你的${title}（約 250 字）…`} rows={6}
            style={{ width: "100%", resize: "vertical", padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: 13, fontFamily: "inherit", lineHeight: 1.7, boxSizing: "border-box" }} />
        </div>
      ))}
      <div style={{ background: C.sageLt, borderRadius: 10, padding: "14px 16px", border: "1px solid #c5dbc8", marginBottom: 0 }}>
        <div style={{ fontWeight: 500, fontSize: 14, color: "#3d6b42", marginBottom: 6 }}>一致性整合</div>
        <p style={{ fontSize: 12, color: "#5a8c5e", margin: "0 0 8px" }}>你的工作觀與人生觀在哪些地方相輔相成？哪裡有矛盾？工作觀能促進人生觀嗎？</p>
        <textarea value={data.coherence ?? ""} onChange={e => setData(d => ({ ...d, coherence: e.target.value }))}
          placeholder="思考兩者的關聯…" rows={4}
          style={{ width: "100%", resize: "vertical", padding: "9px 11px", borderRadius: 8, border: "1px solid #c5dbc8", background: "#f5fbf5", color: C.text, fontSize: 13, fontFamily: "inherit", lineHeight: 1.7, boxSizing: "border-box" }} />
      </div>
      <AIChat context={ctx} stationExtra="工作觀必須是關於『為何工作』的哲學，不是職涯規畫；人生觀必須是對人生根本問題的看法，不是目標清單。如果用戶寫錯了，要明確指出。同時評估兩者的一致性。" />
    </div>
  );
}

function GoodTime({ data, setData }) {
  const addEntry = () => setData(d => ({ ...d, entries: [...(d.entries ?? []), { activity: "", engage: 50, energy: 50, flow: false, note: "" }] }));
  const upd = (i, f, v) => setData(d => { const e = [...(d.entries ?? [])]; e[i] = { ...e[i], [f]: v }; return { ...d, entries: e }; });
  const del = i => setData(d => { const e = [...(d.entries ?? [])]; e.splice(i, 1); return { ...d, entries: e }; });
  const entries = data.entries ?? [];
  const ctx = `活動記錄：${entries.map(e => `「${e.activity}」投入${e.engage}% 精力${e.energy > 0 ? "+" : ""}${e.energy}${e.flow ? " 有心流" : ""}（${e.note}）`).join("；")}；每週反省：${data.reflection ?? "（未填）"}`;

  return (
    <div>
      <p style={{ fontSize: 14, color: C.muted, marginBottom: 6, lineHeight: 1.7 }}>記錄每日活動，分開追蹤「投入度」與「精力」。這兩者不同——可以很投入卻精疲力竭，也可以不投入但精力好。</p>
      <p style={{ fontSize: 12, color: C.rose, marginBottom: 16 }}>⚠ 不要只寫「今天很充實」——要具體到活動層次：「和設計師開了3小時腦力激盪」</p>
      {entries.map((e, i) => (
        <div key={i} style={{ background: C.accentLighter, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", marginBottom: 10 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <input value={e.activity} onChange={ev => upd(i, "activity", ev.target.value)} placeholder="活動描述（盡量具體）"
              style={{ flex: 1, padding: "7px 10px", borderRadius: 7, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: 13, fontFamily: "inherit" }} />
            <button onClick={() => del(i)} style={{ padding: "0 10px", borderRadius: 7, border: `1px solid ${C.border}`, background: C.card, color: C.muted, cursor: "pointer", fontSize: 12 }}>✕</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>投入度</div>
              <input type="range" min={0} max={100} step={25} value={e.engage} onChange={ev => upd(i, "engage", Number(ev.target.value))} style={{ width: "100%", accentColor: C.accent }} />
              <div style={{ fontSize: 11, color: C.accent, textAlign: "right" }}>{e.engage}%</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>精力（+ 充沛 / − 消耗）</div>
              <input type="range" min={-100} max={100} step={25} value={e.energy} onChange={ev => upd(i, "energy", Number(ev.target.value))} style={{ width: "100%", accentColor: e.energy >= 0 ? C.sage : C.rose }} />
              <div style={{ fontSize: 11, color: e.energy >= 0 ? C.sage : C.rose, textAlign: "right" }}>{e.energy > 0 ? "+" : ""}{e.energy}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
            <input type="checkbox" checked={e.flow ?? false} onChange={ev => upd(i, "flow", ev.target.checked)} id={`fl${i}`} />
            <label htmlFor={`fl${i}`} style={{ fontSize: 12, color: C.ink }}>有心流體驗（時間靜止、全然投入）</label>
          </div>
          <textarea value={e.note ?? ""} onChange={ev => upd(i, "note", ev.target.value)} placeholder="具體是什麼帶來投入或消耗？（環境、互動對象、做的事情）" rows={2}
            style={{ width: "100%", resize: "none", marginTop: 8, padding: "7px 9px", borderRadius: 7, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: 12, fontFamily: "inherit", boxSizing: "border-box" }} />
        </div>
      ))}
      <button onClick={addEntry} style={{ display: "block", width: "100%", padding: 10, borderRadius: 9, border: `1.5px dashed ${C.border}`, background: "transparent", color: C.muted, cursor: "pointer", fontSize: 13, marginBottom: 14 }}>
        + 新增活動記錄
      </button>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 500, fontSize: 14, color: C.ink, marginBottom: 6 }}>每週反省</div>
        <textarea value={data.reflection ?? ""} onChange={e => setData(d => ({ ...d, reflection: e.target.value }))} placeholder="這週發現了什麼模式？哪些活動讓你出乎意料地投入？哪些偷走了你的精力？" rows={4}
          style={{ width: "100%", resize: "vertical", padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: 13, fontFamily: "inherit", lineHeight: 1.7, boxSizing: "border-box" }} />
      </div>
      <AIChat context={ctx} stationExtra="好時光日誌。評判：1)活動描述是否具體？2)投入度和精力有分開嗎？3)反省有找出模式嗎？太模糊要追問AEIOU細節。" />
    </div>
  );
}

function MindMap({ data, setData }) {
  const maps = [
    { key: "engage", label: "讓你最投入的活動" },
    { key: "energy", label: "讓你最有活力的事物" },
    { key: "flow",   label: "曾進入心流的體驗" },
  ];
  const ctx = maps.map(m => `心智圖「${m.label}」：${data[m.key+"_map"] ?? "未填"}，組合角色：${data[m.key+"_role"] ?? "未填"}`).join("；");
  return (
    <div>
      <p style={{ fontSize: 14, color: C.muted, marginBottom: 6, lineHeight: 1.7 }}>從中心詞出發，延伸3-4層，快速寫下，不要評判。最後從最外層挑3個詞，組成一個有趣的職務描述。</p>
      <p style={{ fontSize: 12, color: C.rose, marginBottom: 16 }}>⚠ 心智圖不是列職業清單——是自由聯想，讓詞彙帶著你走。</p>
      {maps.map(({ key, label }) => (
        <div key={key} style={{ marginBottom: 20, background: C.accentLighter, borderRadius: 10, padding: "14px 16px", border: `1px solid ${C.border}` }}>
          <div style={{ fontWeight: 500, fontSize: 14, color: C.ink, marginBottom: 4 }}>心智圖：{label}</div>
          <p style={{ fontSize: 12, color: C.muted, margin: "0 0 8px" }}>中心詞 → 延伸詞 → 再延伸，至少3層，不要停下來評判</p>
          <textarea value={data[key+"_map"] ?? ""} onChange={e => setData(d => ({ ...d, [key+"_map"]: e.target.value }))}
            placeholder="例如：教學 → 課程設計、學生反應、知識傳遞 → 課程設計 → 系統化、可視化、樂趣…" rows={5}
            style={{ width: "100%", resize: "vertical", padding: "9px 11px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: 13, fontFamily: "inherit", lineHeight: 1.7, boxSizing: "border-box", marginBottom: 8 }} />
          <div style={{ fontSize: 13, color: C.ink, fontWeight: 500, marginBottom: 4 }}>從最外層挑3個詞，組成一個職務描述：</div>
          <input value={data[key+"_role"] ?? ""} onChange={e => setData(d => ({ ...d, [key+"_role"]: e.target.value }))}
            placeholder="例如：替有系統恐懼的成年人設計可視化學習地圖的顧問"
            style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" }} />
        </div>
      ))}
      <AIChat context={ctx} stationExtra="心智圖。評判：1)是真正的自由聯想還是清單？2)有延伸到3層嗎？3)組合出來的角色是否來自最外層詞彙？如果只是職業名稱清單，要指出問題。" />
    </div>
  );
}

function Odyssey({ data, setData }) {
  const plans = [0,1,2];
  const pNames = ["人生一：目前路線的延伸", "人生二：萬一人生一消失，你會做的事", "人生三：若錢不是問題、面子不是問題"];
  const ctx = plans.map(p => `計畫${p+1}「${data[`p${p}_title`]??"未填"}」：五年後${data[`p${p}_end`]??""}，問題：${data[`p${p}_q`]??""}`).join("；");
  return (
    <div>
      <p style={{ fontSize: 14, color: C.muted, marginBottom: 6, lineHeight: 1.7 }}>三條路必須「截然不同」，不是同一主題的變形。每條路都認真對待，都是 A 計畫。</p>
      <p style={{ fontSize: 12, color: C.rose, marginBottom: 16 }}>⚠ 「在台北做分析師」和「在柏林做分析師」不算兩條路，要真正不同。</p>
      {plans.map(p => (
        <div key={p} style={{ marginBottom: 20, background: C.accentLighter, borderRadius: 12, padding: 16, border: `1px solid ${C.border}` }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: C.accent, marginBottom: 8 }}>✦ {pNames[p]}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 3 }}>標題（點出精神）</div>
              <input value={data[`p${p}_title`] ?? ""} onChange={e => setData(d => ({ ...d, [`p${p}_title`]: e.target.value }))} placeholder="例如：科技轉教育的橋樑人"
                style={{ width: "100%", padding: "7px 9px", borderRadius: 7, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" }} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 3 }}>五年後的狀態</div>
              <input value={data[`p${p}_end`] ?? ""} onChange={e => setData(d => ({ ...d, [`p${p}_end`]: e.target.value }))} placeholder="簡述五年後你在做什麼"
                style={{ width: "100%", padding: "7px 9px", borderRadius: 7, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" }} />
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 3 }}>要測試或探索的問題（2-3個）</div>
            <textarea value={data[`p${p}_q`] ?? ""} onChange={e => setData(d => ({ ...d, [`p${p}_q`]: e.target.value }))}
              placeholder="例如：我真的喜歡每天面對學生嗎？沒有科技行業的薪水我能接受嗎？" rows={3}
              style={{ width: "100%", resize: "none", padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: 12, fontFamily: "inherit", boxSizing: "border-box" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[["res","資源（時間、金錢、技能）"],["like","喜歡程度"],["conf","自信程度"],["coh","與工作觀人生觀一致性"]].map(([k,lbl]) => (
              <ScoreBar key={k} label={lbl} value={data[`p${p}_${k}`] ?? 50} onChange={v => setData(d => ({ ...d, [`p${p}_${k}`]: v }))} />
            ))}
          </div>
        </div>
      ))}
      <AIChat context={ctx} stationExtra="Odyssey Plan。評判：1)三條路真的截然不同嗎？2)每條路有具體問題要測試嗎？3)有一條是真正打破框架的嗎？三條路太相似要明確指出。" />
    </div>
  );
}

function Prototype({ data, setData }) {
  const ctx = `原型對話：${data.talks ?? "未填"}；原型體驗：${data.exps ?? "未填"}；失敗重擬：${data.failures ?? "未填"}`;
  return (
    <div>
      <p style={{ fontSize: 14, color: C.muted, marginBottom: 6, lineHeight: 1.7 }}>原型不是計畫，是「小型真實體驗」。先對話，再體驗，讓水淹到膝蓋不是淹過頭。</p>
      <p style={{ fontSize: 12, color: C.rose, marginBottom: 16 }}>⚠ 原型不是思想實驗——要在真實世界中發生，哪怕只是30分鐘的咖啡對談。</p>
      {[
        { key: "talks", title: "原型對話清單", hint: "想聽誰的故事？他們正在做你好奇的事。不是去求職，是去聽故事。", ph: "例如：做了DBT轉型的分析工程師 / 在德國遠端工作的台灣人…" },
        { key: "exps",  title: "原型體驗清單", hint: "可以怎麼小規模試水溫？不必全跳進去。", ph: "例如：用一個週末跟著DBT教學做一個小model / 在公司內自願接一個數據建模任務…" },
        { key: "failures", title: "失敗重擬練習", hint: "列出近期失敗 → 分類（失誤／弱點／成長機會）→ 找出心得", ph: "例如：報告遲交（失誤，下次設提前一天的假截止日）/ 開會發言少（弱點，接受並用書面補強）…" },
      ].map(({ key, title, hint, ph }) => (
        <div key={key} style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 500, fontSize: 14, color: C.ink, marginBottom: 4 }}>{title}</div>
          <p style={{ fontSize: 12, color: C.muted, margin: "0 0 8px" }}>{hint}</p>
          <textarea value={data[key] ?? ""} onChange={e => setData(d => ({ ...d, [key]: e.target.value }))} placeholder={ph} rows={4}
            style={{ width: "100%", resize: "vertical", padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: 13, fontFamily: "inherit", lineHeight: 1.7, boxSizing: "border-box" }} />
        </div>
      ))}
      <AIChat context={ctx} stationExtra="原型設計。評判：1)對話有明確人選和問題嗎？2)體驗是真實可執行的小實驗嗎？3)失敗重擬有分類嗎？要對照用戶的Odyssey Plan，檢查原型是否真的在測試那些問題。" />
    </div>
  );
}

const COMPS = { dashboard: Dashboard, compass: Compass, goodtime: GoodTime, mindmap: MindMap, odyssey: Odyssey, prototype: Prototype };

export default function App() {
  const [active, setActive] = useState("dashboard");
  const [allData, setAllData] = useState({});
  const getData = id => allData[id] ?? {};
  const setData = id => fn => setAllData(d => ({ ...d, [id]: typeof fn === "function" ? fn(d[id] ?? {}) : fn }));
  const Comp = COMPS[active];
  const st = STATIONS.find(s => s.id === active);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Georgia', serif", paddingBottom: 60 }}>
      <div style={{ background: C.accentLight, borderBottom: `1px solid ${C.border}`, padding: "18px 20px 14px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ fontSize: 11, color: C.muted, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>Designing Your Life</div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 400, color: C.ink }}>做自己的生命設計師</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: C.muted }}>Bill Burnett & Dave Evans · 你的沈浸式引導工具</p>
        </div>
      </div>
      <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`, overflowX: "auto" }}>
        <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", padding: "0 4px" }}>
          {STATIONS.map(s => (
            <button key={s.id} onClick={() => setActive(s.id)}
              style={{ padding: "12px 14px", border: "none", background: "transparent", cursor: "pointer",
                borderBottom: active === s.id ? `2px solid ${C.accent}` : "2px solid transparent",
                color: active === s.id ? C.accent : C.muted, fontSize: 12, fontFamily: "inherit",
                whiteSpace: "nowrap", transition: "all 0.15s", textAlign: "center" }}>
              <div style={{ fontSize: 15, marginBottom: 2 }}>{s.icon}</div>
              <div style={{ fontWeight: active === s.id ? 600 : 400 }}>{s.title}</div>
            </button>
          ))}
        </div>
      </div>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 16px" }}>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ margin: "0 0 2px", fontSize: 20, fontWeight: 400, color: C.ink }}>{st?.icon} {st?.title}</h2>
          <p style={{ margin: 0, fontSize: 13, color: C.muted }}>{st?.sub}</p>
        </div>
        <Comp data={getData(active)} setData={setData(active)} />
      </div>
    </div>
  );
}
