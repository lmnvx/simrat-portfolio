import { useState, useRef, useEffect } from "react";

const MONO = "'Space Mono', monospace";
const SANS = "'Space Grotesk', sans-serif";
const AMBER = "#8B5E3C";
const AMBER_BG = "rgba(139,94,60,0.06)";
const BORDER = "rgba(28,26,23,0.1)";
const INK = "#1C1A17";
const INK_DIM = "#4A463E";
const INK_FAINT = "#8C8478";

const KB = [
  { keys: ["rl","reinforcement","td3","ppo","craft","trading system","agent","order book","lob","shift","hierarchical"], answer: "At Stevens' CRAFT Lab, I'm building a hierarchical RL trading system using TD3 and PPO agents over a live limit order book on the SHIFT platform. The architecture separates high-level strategy from tick-level execution, evaluated on Sharpe ratio, cumulative return, and max drawdown." },
  { keys: ["options","pricer","black-scholes","heston","greeks","iv","implied vol","delta","gamma","vega","theta","fe621","derivatives"], answer: "The options pricer runs real Black-Scholes and Heston model math — computing price, delta, gamma, vega, theta, and rho live. The IV surface uses a volatility smile model from FE621 at Stevens. Python scipy on the backend; JS fallback so it works without a server." },
  { keys: ["lendingkart","credit","loan","default","risk","fintech","production","deploy","bank"], answer: "At Lendingkart I built and deployed personal loan default prediction models in production — trained on 3 years of credit history across multiple lenders, achieving accuracy in the low 80s. I designed a unified multi-lender ML scoring pipeline with vendor-specific feature engineering. Featured in Analytics India Magazine." },
  { keys: ["nlp","speech","text","sentiment","anomaly","multilingual","customer","intern"], answer: "During my internship at Lendingkart I built a multilingual speech-to-text pipeline on customer service recordings, layering sentiment analysis and anomaly detection to surface recurring pain points. My first end-to-end ML project shipped independently." },
  { keys: ["ner","named entity","sec","filing","finer","bert","bilstm","crf","financial nlp","xbrl"], answer: "I built an automated entity extraction system for SEC financial filings using FiNER-139 — 1.1M sentences, 139 XBRL entity types. A Transformer-BiLSTM-CRF hybrid with sec-bert-base achieved F1 of 0.59 vs 0.34 for the baseline." },
  { keys: ["stock","return","prediction","xgboost","lasso","mlp","sharpe","fama","factor","portfolio"], answer: "For Statistical Learning in Finance I compared Lasso, XGBoost, and MLP on 90+ features across 1957-2021. XGBoost top-100 portfolio hit Sharpe 0.28 and average monthly return 3.13%." },
  { keys: ["smilestudio","dental","visualization","thesis","clinical","segmentation"], answer: "SmileStudio is my thesis — an interactive 3D interface integrating AI anatomical segmentation with clinical reference overlays for dental planning. I ran a controlled user study with dental students and clinicians measuring accuracy vs 2D methods." },
  { keys: ["power bi","sql","dashboard","enrollment","slate","crm","graduate assistant"], answer: "As Graduate Assistant at Stevens I built Power BI dashboards and SQL pipelines in Slate CRM tracking graduate enrollment KPIs, surfacing early funnel drop-off signals for the admissions team." },
  { keys: ["hftc","competition","high frequency","organizer","market data"], answer: "I organized the Stevens High Frequency Trading Competition — developing historic market data simulation scenarios, onboarding teams onto SHIFT, and contributing front-end improvements to the competition web client." },
  { keys: ["ieee","publication","published","position mapping","cbir","annoy"], answer: "I published Position Mapping via Content-Based Image Retrieval and Annoy in IEEE Xplore, December 2023." },
  { keys: ["portfolio","website","this site","built","fastapi","websocket","d3","gsap","three"], answer: "This portfolio runs a FastAPI and WebSocket backend serving a GBM regime-switching market simulator and TD3-style RL agent. Frontend is React, D3, Three.js, GSAP, and Lenis. Falls back to a JS simulator when the backend is offline." },
  { keys: ["education","degree","stevens","gpa","gujarat","masters","ms","certificate","financial engineering"], answer: "MS Computer Science with a Financial Engineering Certificate at Stevens (GPA 3.8, graduating May 2026). BE in Information and Communication Technology from Gujarat Technological University (GPA 3.55, 2019-2023)." },
  { keys: ["skill","python","pytorch","tensorflow","numpy","pandas","pyspark","tableau","bloomberg","c++","sql"], answer: "Core stack: Python, SQL, C++, Java. ML: PyTorch, TensorFlow, XGBoost, Scikit-learn, SHAP, Optuna, PySpark. Quant: TD3, PPO, Monte Carlo, stochastic calculus, Bloomberg API. Data: Power BI, Tableau, MongoDB, Hadoop, Git, SHIFT, FastAPI, React, D3.js." },
  { keys: ["role","job","target","looking","open","hire","quant","fintech","algo","data scientist","ml engineer"], answer: "I am targeting data science, ML engineering, and quant research roles in fintech, algorithmic trading, and marketing analytics." },
  { keys: ["contact","email","linkedin","github","reach","connect"], answer: "Best way to reach me: simratkr1.sr@gmail.com, LinkedIn: linkedin.com/in/simratkaurrandhawa, GitHub: github.com/lmnvx" },
];

const SUGGESTIONS = [
  "What RL methods did you use at CRAFT Lab?",
  "Tell me about your options pricing work.",
  "What roles are you targeting?",
  "How does this portfolio work technically?",
];

function findAnswer(query) {
  const q = query.toLowerCase();
  const words = q.split(/\s+/);
  let best = null, bestScore = 0;
  for (const entry of KB) {
    let score = 0;
    for (const key of entry.keys) {
      if (q.includes(key)) score += key.split(" ").length * 2;
      else for (const word of words) {
        if (key.includes(word) && word.length > 3) score += 1;
      }
    }
    if (score > bestScore) { bestScore = score; best = entry; }
  }
  if (bestScore === 0 || !best) return "Try asking about the RL trading system, options pricer, Lendingkart work, NLP projects, or what roles Simrat is targeting.";
  return best.answer;
}

export default function AskSimrat() {
  const [messages, setMessages] = useState([{ role: "assistant", text: "Hi — ask me anything about Simrat's work, research, or background." }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  function send(text) {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: msg }]);
    setLoading(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { role: "assistant", text: findAnswer(msg) }]);
      setLoading(false);
    }, 320);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#fff" }}>
      <div style={{ padding: "0.9rem 1.4rem", borderBottom: "1px solid " + BORDER, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#2D7A5A", display: "block" }} />
        <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".15em", color: AMBER, textTransform: "uppercase" }}>Ask Simrat</span>
        <span style={{ fontFamily: MONO, fontSize: 8, color: INK_FAINT, marginLeft: "auto" }}>PORTFOLIO AI</span>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.4rem", display: "flex", flexDirection: "column", gap: 10 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{ maxWidth: "84%", padding: "0.7rem 1rem", background: m.role === "user" ? AMBER_BG : "#F9F6F0", border: "1px solid " + (m.role === "user" ? "rgba(139,94,60,0.2)" : BORDER), borderRadius: 6, fontSize: 13, lineHeight: 1.75, fontFamily: SANS, color: m.role === "user" ? AMBER : INK_DIM }}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex" }}>
            <div style={{ padding: "0.7rem 1rem", background: "#F9F6F0", border: "1px solid " + BORDER, borderRadius: 6, fontFamily: MONO, fontSize: 11, color: INK_FAINT }}>···</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      {messages.length <= 1 && (
        <div style={{ padding: "0 1.4rem 0.75rem", display: "flex", flexWrap: "wrap", gap: 6 }}>
          {SUGGESTIONS.map((s, i) => (
            <button key={i} onClick={() => send(s)} style={{ fontFamily: MONO, fontSize: 9, letterSpacing: ".08em", color: INK_FAINT, background: "#F5F0E8", border: "1px solid " + BORDER, padding: "5px 10px", cursor: "pointer", borderRadius: 3 }}>
              {s}
            </button>
          ))}
        </div>
      )}
      <div style={{ padding: "0.75rem 1.4rem", borderTop: "1px solid " + BORDER, display: "flex", gap: 8 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Ask about Simrat's work..." style={{ flex: 1, background: "#F9F6F0", border: "1px solid " + BORDER, borderRadius: 3, padding: "0.6rem 0.8rem", color: INK, fontFamily: SANS, fontSize: 13, outline: "none" }} onFocus={e => e.target.style.borderColor = "rgba(139,94,60,0.4)"} onBlur={e => e.target.style.borderColor = BORDER} />
        <button onClick={() => send()} disabled={loading} style={{ fontFamily: MONO, fontSize: 9, letterSpacing: ".12em", textTransform: "uppercase", color: loading ? INK_FAINT : AMBER, background: "none", border: "1px solid " + (loading ? BORDER : "rgba(139,94,60,0.3)"), borderRadius: 3, padding: "0.6rem 1.1rem", cursor: loading ? "default" : "pointer" }}>Send</button>
      </div>
    </div>
  );
}
