import { useState, useEffect, useRef, useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useMarket } from "./hooks/useMarket";
import { useIsMobile } from "./hooks/useIsMobile";
import { useLenis } from "./hooks/useLenis";
import DepthChart from "./components/DepthChart";
import PnLChart from "./components/PnLChart";
import OrderBook from "./components/OrderBook";
import AgentVisualizer from "./components/AgentVisualizer";
import SkillsGraph from "./components/SkillsGraph";
import CareerGlobe from "./components/CareerGlobe";
import AskSimrat from "./components/AskSimrat";
import CustomCursor from "./components/CustomCursor";
import KineticText from "./components/KineticText";
import { Grain } from "./components/Overlays";
import RegimeChart from "./components/RegimeChart";
import OptionsPricer from "./components/OptionsPricer";
import CVSection from "./components/CVSection";

gsap.registerPlugin(ScrollTrigger);

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

// ── FALLBACK RESUME (used when backend is unreachable e.g. on Vercel) ─────────
const FALLBACK_RESUME = {
  name: "Simrat Kaur Randhawa",
  title: "Data Scientist · ML Engineer · Quant Researcher",
  location: "Jersey City, NJ",
  phone: "201-884-0432",
  email: "simratkr1.sr@gmail.com",
  linkedin: "simratkaurrandhawa",
  github: "lmnvx",
  education: [
    {
      degree: "MS Computer Science · Certificate in Financial Engineering",
      institution: "Stevens Institute of Technology, Hoboken NJ",
      gpa: 3.8,
      period: "Sept 2024 – May 2026",
    },
    {
      degree: "BE Information and Communication Technology",
      institution: "Gujarat Technological University, India",
      gpa: 3.55,
      period: "Sept 2019 – May 2023",
    },
  ],
  experience: [
    {
      role: "Student Researcher – Algorithmic Trading",
      org: "CRAFT Lab · Stevens Institute of Technology",
      period: "Jan 2025 – Present",
      color: "#8B5E3C",
      bullets: [
        "Designing a hierarchical RL trading system (TD3 + PPO) across multiple time scales over a live limit order book; evaluating on Sharpe ratio, cumulative return, and max drawdown",
        "Analyzing simulated order book data to identify execution patterns; contributing to SHIFT in Python and C++",
      ],
      tags: ["PyTorch", "TD3", "PPO", "C++", "SHIFT", "Hierarchical RL"],
    },
    {
      role: "Graduate Assistant – Data Analytics",
      org: "Stevens Institute of Technology",
      period: "Oct 2024 – Present",
      color: "#8B5E3C",
      bullets: [
        "Built Power BI dashboards and SQL pipelines in Slate CRM tracking graduate enrollment KPIs; surfaced early drop-off signals enabling near-real-time action by admissions leadership",
      ],
      tags: ["Power BI", "SQL", "Slate CRM", "Data Pipelines"],
    },
    {
      role: "Organizer – High Frequency Trading Competition",
      org: "Stevens Institute of Technology",
      period: "Jan 2026 – March 2026",
      color: "#2D7A5A",
      bullets: [
        "Developed historic market data simulation scenarios; onboarded competing teams onto SHIFT and contributed to the competition web client",
      ],
      tags: ["SHIFT", "Market Microstructure", "Event Design"],
    },
    {
      role: "Data Scientist",
      org: "Lendingkart (Small Finance Bank) · Bangalore",
      period: "Aug 2023 – Jul 2024",
      color: "#C5803A",
      bullets: [
        "Deployed personal loan default prediction models in production across multiple lenders (accuracy low 80s); designed unified multi-lender ML scoring pipeline with vendor-specific feature engineering",
        "Profiled customer segments by repayment risk to inform underwriting policy; featured in Analytics India Magazine",
      ],
      tags: ["XGBoost", "Scikit-learn", "Python", "Credit Risk", "Production ML"],
    },
    {
      role: "Data Science Intern – AI/ML Team",
      org: "Lendingkart (Small Finance Bank) · Ahmedabad",
      period: "Jan 2023 – Jul 2023",
      color: "#C5803A",
      bullets: [
        "Built multilingual speech-to-text pipeline with sentiment analysis and anomaly detection; findings informed agent coaching and process improvements",
      ],
      tags: ["NLP", "Speech-to-Text", "Sentiment Analysis", "Python"],
    },
  ],
  projects: [
    {
      title: "This Portfolio – Full-Stack Architecture",
      description: "FastAPI backend with WebSocket streaming a GBM + regime-switching market sim and TD3-style RL agent. React + D3 + Three.js + GSAP frontend. Auto-falls back to a JS simulator when the backend is offline so the dashboard works on static hosting.",
      tech: ["FastAPI", "WebSocket", "React", "D3.js", "Three.js", "GSAP", "NumPy", "SciPy"],
      color: "#8B5E3C",
    },
    {
      title: "Hierarchical RL Trading System",
      description: "TD3 + PPO agents operating across multiple time scales over a live limit order book on SHIFT. Evaluated on Sharpe ratio, cumulative return, and max drawdown.",
      tech: ["PyTorch", "TD3", "PPO", "C++", "SHIFT", "Python"],
      color: "#8B5E3C",
    },
    {
      title: "Financial Named Entity Recognition",
      description: "Automated entity extraction for SEC financial filings using FiNER-139 (1.1M sentences, 139 XBRL types). Hybrid Transformer-BiLSTM-CRF with sec-bert-base: F1 = 0.59 vs 0.34 baseline.",
      tech: ["PyTorch", "BERT", "BiLSTM-CRF", "NLP", "Python"],
      color: "#6B5B8A",
    },
    {
      title: "Stock Return Prediction",
      description: "Compared Lasso, XGBoost, and MLP on 90+ firm-level and macro features (1957–2021). XGBoost top-100 portfolio: Sharpe 0.28, avg monthly return 3.13%.",
      tech: ["XGBoost", "Lasso", "MLP", "Python", "Pandas"],
      color: "#2D7A5A",
    },
    {
      title: "SmileStudio – 3D Clinical Visualization",
      description: "Interactive 3D interface integrating AI anatomical segmentation with clinical reference overlays. Controlled user study with dental students and clinicians.",
      tech: ["Three.js", "React", "Node.js", "Computer Vision"],
      color: "#C5803A",
    },
  ],
  skills: {
    "Languages": ["Python", "SQL", "C++", "Java"],
    "ML & Analytics": ["PyTorch", "TensorFlow", "XGBoost", "Scikit-learn", "SHAP", "Optuna", "PySpark", "NumPy", "Pandas"],
    "Quant & Finance": ["TD3", "PPO", "Monte Carlo", "Stochastic Calculus", "Time-series Modeling", "A/B Testing", "Bloomberg API"],
    "Data & Infra": ["Power BI", "Tableau", "SQL/RDBMS", "MongoDB", "Hadoop", "Git", "SHIFT Platform"],
  },
};
const MONO = "'Space Mono', monospace";
const SANS = "'Space Grotesk', sans-serif";
const NAV_SECTIONS = ["floor", "experience", "projects", "skills", "pricer", "cv", "contact"];

// ── WARM EDITORIAL TOKENS ─────────────────────────────────────────────────────
const T = {
  // Light / cream surfaces
  bg:         "#F5F0E8",       // warm cream base
  bgRaised:   "#EDE8DF",       // slightly deeper cream for alternating sections
  bgCard:     "#FFFFFF",       // pure white cards on cream
  bgCardAlt:  "#F9F6F0",       // off-white card variant

  // Ink — dark warm tones instead of cold greys
  ink:        "#1C1A17",       // near-black warm
  inkDim:     "#4A463E",       // mid-tone warm brown
  inkFaint:   "#8C8478",       // muted warm label color
  inkGhost:   "#C8C0B4",       // very faint dividers

  // Borders
  border:     "rgba(28,26,23,0.1)",
  borderMed:  "rgba(28,26,23,0.18)",

  // Accents — keep cyan for the dark dashboard; use warm amber for editorial
  cyan:       "#5ef0ff",       // only used INSIDE the dark dashboard
  amber:      "#8B5E3C",       // warm brown-amber for editorial accents
  amberBright:"#C5803A",       // slightly brighter for tags/labels
  green:      "#2D7A5A",       // muted forest green (for LIVE badge etc)
  red:        "#B5392A",       // warm red

  // Dashboard (stays dark)
  dashBg:     "#0D0C0A",
  dashCard:   "#141210",
  dashBorder: "rgba(240,238,232,0.1)",
  dashInk:    "#E8E4DC",
  dashFaint:  "rgba(240,238,232,0.4)",
  dashCyan:   "#5ef0ff",
  dashGreen:  "#4dffa8",
  dashRed:    "#ff6b6b",
  dashAmber:  "#ffb454",
};

// ── GLOBAL CSS ────────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300..700&family=Space+Mono:wght@400;700&display=swap');
  *,*::before,*::after{ margin:0; padding:0; box-sizing:border-box; }
  html{ background:${T.bg}; }
  body{ background:${T.bg}; color:${T.ink}; font-family:${SANS}; cursor:none; overflow-x:hidden; }
  ::selection{ background:${T.amberBright}; color:#fff; }
  ::-webkit-scrollbar{ width:3px; }
  ::-webkit-scrollbar-track{ background:${T.bg}; }
  ::-webkit-scrollbar-thumb{ background:${T.inkGhost}; border-radius:2px; }

  @media (pointer: coarse){ body{ cursor:auto; } }

  .cursor-dot, .cursor-ring{
    position:fixed; top:0; left:0; z-index:999; pointer-events:none;
    border-radius:50%; transform:translate(-50%,-50%);
  }
  .cursor-dot{ width:5px; height:5px; background:${T.ink}; transition:width .2s,height .2s; }
  .cursor-ring{ width:32px; height:32px; border:1px solid rgba(28,26,23,0.25); transition:width .25s,height .25s,border-color .25s; }
  body.cur-hover .cursor-ring{ width:52px; height:52px; border-color:rgba(28,26,23,0.5); }
  body.cur-hover .cursor-dot{ width:7px; height:7px; }
  body.cur-text .cursor-ring{ width:80px; height:32px; border-radius:16px; border-color:rgba(139,94,60,0.6); }
  body.cur-text .cursor-dot{ opacity:0; }

  @keyframes blink-dot{ 0%,100%{opacity:1} 50%{opacity:.3} }
  a, button{ font-family:inherit; }

  .dash-section{ background:${T.dashBg}; }

  @media (max-width: 768px) {
    .corner-hud { display: none !important; }
    .hero-scroll-cue { display: none !important; }
    .exp-grid { grid-template-columns: 1fr !important; gap: 0.75rem !important; }
    .dash-grid-2 { grid-template-columns: 1fr !important; }
    .dash-grid-3 { grid-template-columns: 1fr !important; }
    .skills-ai-grid { grid-template-columns: 1fr !important; }
    .skills-cat-grid { grid-template-columns: 1fr 1fr !important; }
  }
`;

// ── SHARED PRIMITIVES ─────────────────────────────────────────────────────────

function Eyebrow({ children, color, align = "left" }) {
  const c = color || T.amberBright;
  return (
    <div style={{
      fontFamily: MONO, fontSize: 10, letterSpacing: ".24em", textTransform: "uppercase",
      color: c, display: "flex", alignItems: "center", gap: 12,
      justifyContent: align === "center" ? "center" : "flex-start",
      marginBottom: "1.25rem",
    }}>
      <span style={{ width: 22, height: 1, background: c, display: "block" }} />
      {children}
    </div>
  );
}

function Tag({ children, color }) {
  const c = color || T.amberBright;
  return (
    <span style={{
      fontFamily: MONO, fontSize: 9, letterSpacing: ".08em", textTransform: "uppercase",
      padding: "4px 9px", border: `1px solid ${c}50`, color: c,
      borderRadius: 2, display: "inline-flex",
    }}>
      {children}
    </span>
  );
}

function DashPanel({ children, style = {} }) {
  return (
    <div style={{
      background: T.dashCard,
      border: `1px solid ${T.dashBorder}`,
      borderRadius: 6,
      padding: "1.1rem 1.25rem",
      ...style,
    }}>
      {children}
    </div>
  );
}

function DashLabel({ children }) {
  return (
    <div style={{
      fontFamily: MONO, fontSize: 9, letterSpacing: ".16em",
      color: T.dashFaint, textTransform: "uppercase", marginBottom: 8,
    }}>
      {children}
    </div>
  );
}

function Card({ children, style = {}, accentColor }) {
  return (
    <div style={{
      background: T.bgCard,
      border: `1px solid ${T.border}`,
      borderRadius: 8,
      padding: "1.5rem 1.75rem",
      position: "relative",
      ...(accentColor ? { borderTop: `2px solid ${accentColor}` } : {}),
      ...style,
    }}>
      {children}
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: T.border, margin: 0 }} />;
}

// ── NAV ───────────────────────────────────────────────────────────────────────

function Nav({ activeSection, scrollTo, connected }) {
  const isMobile = useIsMobile();
  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: isMobile ? "0 1.25rem" : "0 3rem", height: 52,
      background: "rgba(245,240,232,0.92)",
      backdropFilter: "blur(16px)",
      borderBottom: `1px solid ${T.border}`,
    }}>
      <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".2em", color: T.ink, fontWeight: 700 }}>SKR</span>
      {!isMobile && (
        <div style={{ display: "flex", gap: "2.5rem" }}>
          {NAV_SECTIONS.map(id => (
            <button key={id} data-cursor="hover" onClick={() => scrollTo(id)} style={{
              background: "none", border: "none", cursor: "none",
              fontFamily: MONO, fontSize: 9, letterSpacing: ".14em", textTransform: "uppercase",
              color: activeSection === id ? T.ink : T.inkFaint,
              transition: "color .2s", position: "relative", padding: "4px 0",
            }}>
              {id}
              {activeSection === id && (
                <span style={{ position: "absolute", left: 0, right: 0, bottom: -2, height: 1.5, background: T.amberBright }} />
              )}
            </button>
          ))}
        </div>
      )}
      {isMobile && (
        <div style={{ display: "flex", gap: "1rem" }}>
          {["floor", "experience", "skills", "contact"].map(id => (
            <button key={id} onClick={() => scrollTo(id)} style={{
              background: "none", border: "none", cursor: "pointer",
              fontFamily: MONO, fontSize: 8, letterSpacing: ".1em", textTransform: "uppercase",
              color: activeSection === id ? T.ink : T.inkFaint,
            }}>
              {id === "floor" ? "home" : id}
            </button>
          ))}
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: MONO, fontSize: 9, letterSpacing: ".12em" }}>
        <span style={{
          width: 6, height: 6, borderRadius: "50%",
          background: connected ? T.green : T.red,
          animation: connected ? "blink-dot 2s infinite" : "none",
        }} />
        {!isMobile && <span style={{ color: connected ? T.green : T.red }}>{connected ? "LIVE" : "—"}</span>}
      </div>
    </nav>
  );
}

// ── HERO ──────────────────────────────────────────────────────────────────────

function HeroFloor({ market, connected, regimeHistory, source, isMobile }) {
  const heroRef = useRef(null);
  const nameRef = useRef(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const ctx = gsap.context(() => {
        gsap.to(nameRef.current, {
          yPercent: -12, scale: 0.94, opacity: 0.25,
          scrollTrigger: { trigger: heroRef.current, start: "top top", end: "+=55%", scrub: 0.6 },
        });
        gsap.to(".hero-fade", {
          opacity: 0, y: -12,
          scrollTrigger: { trigger: heroRef.current, start: "top top", end: "+=32%", scrub: 0.6 },
        });
        ScrollTrigger.refresh();
      }, heroRef);
      heroRef.current.__gsapCtx = ctx;
    });
    return () => {
      cancelAnimationFrame(id);
      heroRef.current?.__gsapCtx?.revert();
    };
  }, []);

  const pos = market?.agent?.position ?? 0;
  const pnl = market?.agent?.pnl ?? 0;
  const posLabel = pos === 1 ? "LONG" : pos === -1 ? "SHORT" : "FLAT";
  const posColor = pos === 1 ? T.dashGreen : pos === -1 ? T.dashRed : T.dashFaint;

  return (
    <section ref={heroRef} id="floor" style={{ background: T.bg }}>
      {/* ── CREAM HERO ── */}
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", textAlign: "center",
        padding: isMobile ? "6rem 1.25rem 3rem" : "8rem 2rem 4rem", position: "relative",
      }}>
        <div className="hero-fade" style={{ marginBottom: "1.75rem" }}>
          <Eyebrow align="center" color={T.amberBright}>
            Data Scientist · ML Engineer · Quant Researcher
          </Eyebrow>
        </div>

        <div ref={nameRef}>
          <KineticText as="div" text="SIMRAT KAUR"
            style={{
              fontFamily: SANS, fontWeight: 700, letterSpacing: "-.045em",
              lineHeight: 0.92, fontSize: "clamp(2.8rem,9.2vw,7.4rem)", color: T.ink,
            }}
          />
          <KineticText as="div" text="RANDHAWA" delay={0.12}
            style={{
              fontFamily: SANS, fontWeight: 700, letterSpacing: "-.045em",
              lineHeight: 0.92, fontSize: "clamp(2.8rem,9.2vw,7.4rem)",
              WebkitTextStroke: `1.5px ${T.inkGhost}`, color: "transparent",
            }}
          />
        </div>

        <div className="hero-fade" style={{
          marginTop: "2rem", fontFamily: MONO, fontSize: 11, letterSpacing: ".08em",
          color: T.inkFaint, display: "flex", alignItems: "center", gap: "1.4rem",
          flexWrap: "wrap", justifyContent: "center",
        }}>
          <span>{market?.symbol ?? "AAPL"} <span style={{ color: T.amberBright }}>${market?.mid?.toFixed(2) ?? "—"}</span></span>
          <span style={{ width: 1, height: 11, background: T.border }} />
          <span>TD3.POLICY <span style={{ color: T.amberBright }}>{posLabel}</span></span>
          <span style={{ width: 1, height: 11, background: T.border }} />
          <span>REGIME <span style={{ color: T.amber, textTransform: "uppercase" }}>{market?.regime ?? "—"}</span></span>
        </div>

        <p className="hero-fade" style={{
          marginTop: "1.5rem", fontSize: "clamp(.88rem,1.15vw,1.02rem)", fontWeight: 300,
          color: T.inkDim, maxWidth: 520, lineHeight: 1.85,
        }}>
          Production ML at scale, then RL research on live order books.<br />
          MS CS · Financial Engineering · Stevens Institute · GPA 3.8
        </p>

        {/* Corner HUDs */}
        {!isMobile && <div className="hero-fade" style={{
          position: "absolute", top: "7rem", left: "3rem",
          fontFamily: MONO, fontSize: 9, letterSpacing: ".12em", color: T.inkFaint, lineHeight: 2.2, textAlign: "left",
        }}>
          STEVENS INST · <b style={{ color: T.inkDim }}>GPA 3.8</b><br />
          CRAFT LAB · <b style={{ color: T.inkDim }}>TD3 / PPO</b><br />
          IEEE XPLORE · <b style={{ color: T.inkDim }}>PUBLISHED</b>
        </div>}
        {!isMobile && <div className="hero-fade" style={{
          position: "absolute", bottom: "5.5rem", right: "3rem",
          fontFamily: MONO, fontSize: 9, letterSpacing: ".12em", color: T.inkFaint, lineHeight: 2.2, textAlign: "right",
        }}>
          JERSEY CITY · NEW JERSEY<br />
          <b style={{ color: T.inkDim }}>SCROLL TO EXPLORE</b>
        </div>}

        <div className="hero-fade" style={{
          position: "absolute", bottom: "2.5rem", left: "50%", transform: "translateX(-50%)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
        }}>
          <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: ".26em", color: T.inkFaint, textTransform: "uppercase" }}>Scroll</span>
          <div style={{ width: 1, height: 36, background: `linear-gradient(to bottom, ${T.amber}, transparent)` }} />
        </div>
      </div>

      {/* ── DARK DASHBOARD BAND ── */}
      <div className="dash-section">
        <div style={{ maxWidth: 1320, margin: "0 auto", padding: isMobile ? "2rem 1.25rem 3rem" : "3rem 3rem 4rem" }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: "1.5rem",
          }}>
            <div style={{
              fontFamily: MONO, fontSize: 9, letterSpacing: ".22em",
              color: T.dashFaint, textTransform: "uppercase",
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <span style={{ width: 18, height: 1, background: T.dashCyan, display: "block", opacity: 0.6 }} />
              Live RL Agent · Simulated Limit Order Book
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ fontFamily: MONO, fontSize: 8, letterSpacing: ".12em", color: T.dashFaint }}>
                {source === "ws"
                  ? <span>FEED <span style={{ color: T.dashCyan }}>FASTAPI WS</span></span>
                  : source === "sim"
                  ? <span>FEED <span style={{ color: T.dashAmber }}>JS SIM</span></span>
                  : <span>CONNECTING...</span>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: MONO, fontSize: 9, letterSpacing: ".12em" }}>
                <span style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: connected ? T.dashGreen : T.dashRed,
                  animation: connected ? "blink-dot 2s infinite" : "none",
                }} />
                <span style={{ color: connected ? T.dashGreen : T.dashRed }}>
                  {connected ? "LIVE" : "RECONNECTING"}
                </span>
              </div>
            </div>
          </div>

          {/* Price + Agent */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.7fr 1fr", gap: 10, marginBottom: 10 }}>
            <DashPanel style={{ height: isMobile ? 200 : 260 }}>
              <DashLabel>Price · {market?.symbol} · Regime Detection</DashLabel>
              <div style={{ height: "calc(100% - 22px)" }}>
                <RegimeChart
                  priceHistory={market?.priceHistory || []}
                  regimeHistory={regimeHistory}
                  currentRegime={market?.regime || "trending"}
                />
              </div>
            </DashPanel>
            <DashPanel style={{ height: isMobile ? 180 : 260, display: "flex", flexDirection: "column" }}>
              <DashLabel>RL Agent · 3D State</DashLabel>
              <div style={{ flex: 1, minHeight: 0 }}>
                <AgentVisualizer position={pos} pnl={pnl} regime={market?.regime ?? "trending"} />
              </div>
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
                gap: 8, paddingTop: 8, borderTop: `1px solid ${T.dashBorder}`, marginTop: 8,
              }}>
                {[
                  { l: "Position", v: posLabel, c: posColor },
                  { l: "PnL", v: `${pnl >= 0 ? "+" : ""}${pnl.toFixed(3)}`, c: pnl >= 0 ? T.dashGreen : T.dashRed },
                  { l: "Regime", v: market?.regime ?? "—", c: T.dashFaint },
                ].map((s, i) => (
                  <div key={i}>
                    <div style={{ fontFamily: MONO, fontSize: 8, color: T.dashFaint, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 3 }}>{s.l}</div>
                    <div style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: s.c, textTransform: "uppercase" }}>{s.v}</div>
                  </div>
                ))}
              </div>
            </DashPanel>
          </div>

          {/* LOB + Depth + PnL */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "0.85fr 1.15fr 1fr", gap: 10, marginBottom: 10 }}>
            <DashPanel>
              <DashLabel>Order Book</DashLabel>
              <OrderBook bids={market?.bids || []} asks={market?.asks || []} mid={market?.mid} />
            </DashPanel>
            <DashPanel style={{ height: isMobile ? 180 : 200 }}>
              <DashLabel>Market Depth</DashLabel>
              <div style={{ height: "calc(100% - 22px)" }}>
                <DepthChart bids={market?.bids || []} asks={market?.asks || []} />
              </div>
            </DashPanel>
            <DashPanel>
              <DashLabel>Agent PnL</DashLabel>
              <div style={{ height: 72, marginBottom: 12 }}>
                <PnLChart pnlHistory={market?.agent?.pnlHistory || []} />
              </div>
              <DashLabel>Recent Trades</DashLabel>
              {(market?.agent?.recentTrades || []).slice(-4).reverse().map((t, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderBottom: `1px solid ${T.dashBorder}`, fontFamily: MONO, fontSize: 9 }}>
                  <span style={{ color: t.side === "BUY" ? T.dashGreen : t.side === "SELL" ? T.dashRed : T.dashFaint }}>{t.side}</span>
                  <span style={{ color: T.dashInk }}>${t.price?.toFixed(2)}</span>
                  <span style={{ color: t.pnl >= 0 ? T.dashGreen : T.dashRed }}>{t.pnl >= 0 ? "+" : ""}{t.pnl?.toFixed(3)}</span>
                </div>
              ))}
            </DashPanel>
          </div>

          {/* Globe */}
          <DashPanel style={{ height: isMobile ? 240 : 300 }}>
            <DashLabel>Career Geography · Bangalore → Hoboken → Jersey City</DashLabel>
            <div style={{ height: "calc(100% - 22px)" }}>
              <CareerGlobe />
            </div>
          </DashPanel>
        </div>
      </div>
    </section>
  );
}

// ── EXPERIENCE ────────────────────────────────────────────────────────────────

function ExperienceSection({ resume, isMobile }) {
  const exp = resume?.experience || [];
  const secRef = useRef(null);

  useLayoutEffect(() => {
    if (!resume) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray(".exp-row").forEach(row => {
        gsap.fromTo(row, { opacity: 0, y: 32 }, {
          opacity: 1, y: 0, duration: 0.85, ease: "power3.out",
          scrollTrigger: { trigger: row, start: "top 88%" },
        });
      });
    }, secRef);
    return () => ctx.revert();
  }, [resume]);

  return (
    <section ref={secRef} id="experience" style={{ background: T.bg }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: isMobile ? "4rem 1.25rem" : "8rem 3rem" }}>
        <Eyebrow>Timeline</Eyebrow>
        <h2 style={{
          fontFamily: SANS, fontWeight: 700, letterSpacing: "-.03em",
          lineHeight: 1.04, fontSize: "clamp(2rem,4.5vw,3.8rem)",
          marginBottom: isMobile ? "2.5rem" : "4.5rem", maxWidth: 640, color: T.ink,
        }}>
          Production ML at scale, then RL research — <span style={{ color: T.amberBright }}>one thread.</span>
        </h2>

        {exp.map((e, i) => (
          <div key={i} className="exp-row" style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "0.4fr 1.4fr 2fr",
            gap: isMobile ? "0.5rem" : "2.5rem",
            padding: isMobile ? "1.5rem 0" : "2.5rem 0",
            borderTop: `1px solid ${T.border}`, alignItems: "start",
          }}>
            {!isMobile && <div style={{
              fontFamily: SANS, fontSize: "clamp(2.2rem,4vw,3.2rem)", fontWeight: 700,
              color: "transparent", WebkitTextStroke: `1px ${T.inkGhost}`, lineHeight: 1,
            }}>
              {String(i + 1).padStart(2, "0")}
            </div>}
            <div>
              <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: ".12em", color: T.inkFaint, marginBottom: 6, textTransform: "uppercase" }}>
                {e.period}
              </div>
              <div style={{ fontSize: isMobile ? "0.95rem" : "1.05rem", fontWeight: 600, marginBottom: 4, color: T.ink }}>{e.role}</div>
              <div style={{ fontFamily: MONO, fontSize: 11, color: T.amberBright, marginBottom: isMobile ? 8 : 0 }}>{e.org}</div>
            </div>
            <div>
              <ul style={{ paddingLeft: "1rem", marginBottom: "0.75rem" }}>
                {e.bullets.map((b, j) => (
                  <li key={j} style={{ fontSize: isMobile ? 13 : 14, color: T.inkDim, lineHeight: 1.85, marginBottom: 4 }}>{b}</li>
                ))}
              </ul>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {e.tags.map((t, j) => <Tag key={j} color={T.amberBright}>{t}</Tag>)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── PROJECTS ──────────────────────────────────────────────────────────────────

function ProjectsSection({ resume, isMobile }) {
  const projects = resume?.projects || [];
  const secRef = useRef(null);

  useLayoutEffect(() => {
    if (!resume) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray(".proj-row").forEach((row, i) => {
        gsap.fromTo(row, { opacity: 0, x: i % 2 === 0 ? -20 : 20 }, {
          opacity: 1, x: 0, duration: 0.8, ease: "power3.out",
          scrollTrigger: { trigger: row, start: "top 88%" },
        });
      });
    }, secRef);
    return () => ctx.revert();
  }, [resume]);

  return (
    <section ref={secRef} id="projects" style={{ background: T.bgRaised }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "4rem 1.25rem" : "8rem 3rem" }}>
        <Eyebrow>Portfolio</Eyebrow>
        <h2 style={{
          fontFamily: SANS, fontWeight: 700, letterSpacing: "-.03em",
          lineHeight: 1.05, fontSize: "clamp(2.2rem,4.5vw,3.8rem)",
          marginBottom: "4.5rem", color: T.ink,
        }}>
          Selected <span style={{ color: T.amberBright }}>projects</span>
        </h2>

        {projects.map((p, i) => (
          <div key={i} className="proj-row" style={{
            display: "flex", flexDirection: "column",
            alignItems: isMobile ? "flex-start" : (i % 2 === 0 ? "flex-start" : "flex-end"),
            textAlign: isMobile ? "left" : (i % 2 === 0 ? "left" : "right"),
            padding: isMobile ? "1.5rem 0" : "2.5rem 0",
            borderBottom: `1px solid ${T.border}`,
          }}>
            <div style={{ fontFamily: MONO, fontSize: 9, color: T.inkFaint, letterSpacing: ".12em", marginBottom: 10 }}>
              0{i + 1}
            </div>
            <div style={{ fontSize: "clamp(1.3rem,2.2vw,1.8rem)", fontWeight: 600, marginBottom: 10, maxWidth: 620, color: T.ink }}>
              {p.title}
            </div>
            <div style={{ fontSize: 14, color: T.inkDim, lineHeight: 1.85, maxWidth: 540, marginBottom: 16 }}>
              {p.description}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, justifyContent: i % 2 === 0 ? "flex-start" : "flex-end" }}>
              {p.tech.map((t, j) => <Tag key={j}>{t}</Tag>)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── SKILLS + AI ───────────────────────────────────────────────────────────────

function SkillsSection({ resume, isMobile }) {
  return (
    <section id="skills" style={{ background: T.bg }}>
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: isMobile ? "4rem 1.25rem" : "8rem 3rem" }}>
        <Eyebrow>Arsenal</Eyebrow>
        <h2 style={{
          fontFamily: SANS, fontWeight: 700, letterSpacing: "-.03em",
          lineHeight: 1.05, fontSize: "clamp(2rem,4.5vw,3.8rem)",
          marginBottom: "0.75rem", color: T.ink,
        }}>
          Skills &amp; <span style={{ color: T.amberBright }}>AI</span>
        </h2>
        <p style={{ color: T.inkDim, fontSize: 14, maxWidth: 460, marginBottom: isMobile ? "2rem" : "3.5rem", lineHeight: 1.85 }}>
          {isMobile ? "Ask the AI anything about the work above." : "Drag the graph to rotate. Ask the AI anything about the work above."}
        </p>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.2fr 1fr", gap: 14, marginBottom: 14 }}>
          {!isMobile && (
            <Card style={{ height: 500, display: "flex", flexDirection: "column" }}>
              <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: ".16em", color: T.inkFaint, marginBottom: 10, textTransform: "uppercase" }}>
                Skill Graph · 3D Force-Directed
              </div>
              <div style={{ flex: 1, minHeight: 0 }}>
                <SkillsGraph />
              </div>
            </Card>
          )}
          <Card style={{ height: isMobile ? 420 : 500, padding: 0, overflow: "hidden" }}>
            <AskSimrat />
          </Card>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: 14 }}>
          {Object.entries(resume?.skills || {}).map(([cat, list], i) => (
            <Card key={i}>
              <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: ".16em", color: T.amberBright, marginBottom: 14, textTransform: "uppercase" }}>
                {cat}
              </div>
              <ul style={{ listStyle: "none" }}>
                {list.map((s, j) => (
                  <li key={j} style={{ fontSize: 12, color: T.inkDim, padding: "4px 0", borderBottom: `1px solid ${T.border}` }}>
                    {s}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── OPTIONS PRICER ────────────────────────────────────────────────────────────

function PricerSection({ market, isMobile }) {
  return (
    <section id="pricer" style={{ background: T.bgRaised }}>
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: isMobile ? "4rem 1.25rem" : "8rem 3rem" }}>
        <Eyebrow>Quant Tools</Eyebrow>
        <h2 style={{
          fontFamily: SANS, fontWeight: 700, letterSpacing: "-.03em",
          lineHeight: 1.05, fontSize: "clamp(2rem,4.5vw,3.8rem)",
          marginBottom: "0.75rem", color: T.ink,
        }}>
          Options <span style={{ color: T.amberBright }}>Pricer</span>
        </h2>
        <p style={{ color: T.inkDim, fontSize: 14, maxWidth: 560, marginBottom: isMobile ? "2rem" : "3rem", lineHeight: 1.85 }}>
          Live Black-Scholes and Heston model pricing with Greeks — real Python math via FastAPI. IV surface from FE621 coursework.
        </p>
        <OptionsPricer currentSpot={market?.mid ?? 185} />
      </div>
    </section>
  );
}

// ── CONTACT ───────────────────────────────────────────────────────────────────

function ContactSection({ resume, isMobile }) {
  return (
    <section id="contact" style={{ background: T.bg }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: isMobile ? "4rem 1.25rem 4rem" : "9rem 3rem 7rem", textAlign: "center" }}>
        <Eyebrow align="center">What's next</Eyebrow>
        <h2 style={{
          fontFamily: SANS, fontWeight: 700, letterSpacing: "-.035em",
          lineHeight: 1.04, fontSize: "clamp(2.4rem,7vw,5.5rem)",
          marginBottom: "1.5rem", color: T.ink,
        }}>
          Let's build<br /><span style={{ color: T.amberBright }}>something.</span>
        </h2>
        <p style={{ color: T.inkDim, fontSize: 15, maxWidth: 460, margin: "0 auto 2.5rem", lineHeight: 1.85 }}>
          Open to data science, ML engineering, and quant research roles in fintech and algorithmic trading.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
          {[
            { label: "Email", href: `mailto:${resume?.email}` },
            { label: "LinkedIn", href: `https://linkedin.com/in/simratkaurrandhawa`, target: "_blank" },
            { label: "GitHub", href: `https://github.com/${resume?.github}`, target: "_blank" },
            { label: "Resume ↗", href: "#" },
          ].map((l, i) => (
            <a key={i} href={l.href} target={l.target} data-cursor="hover" style={{
              fontFamily: MONO, fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase",
              color: T.inkDim, textDecoration: "none", padding: ".9rem 2rem",
              border: `1px solid ${T.borderMed}`, borderRadius: 3,
              background: T.bgCard, transition: "border-color .2s, color .2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.amberBright; e.currentTarget.style.color = T.amber; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.borderMed; e.currentTarget.style.color = T.inkDim; }}
            >
              {l.label}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── APP ───────────────────────────────────────────────────────────────────────

export default function App() {
  useLenis();
  const { data: market, connected, source } = useMarket();
  const [resume, setResume] = useState(FALLBACK_RESUME);
  const [activeSection, setActiveSection] = useState("floor");
  const [regimeHistory, setRegimeHistory] = useState([]);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!market?.regime) return;
    setRegimeHistory(prev => [...prev, market.regime].slice(-80));
  }, [market?.tick]);

  useEffect(() => {
    fetch(`${API_URL}/api/resume`)
      .then(r => r.json())
      .then(setResume)
      .catch(() => setResume(FALLBACK_RESUME));
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) setActiveSection(e.target.id); });
    }, { threshold: 0.25 });
    NAV_SECTIONS.forEach(id => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, [resume]);

  useEffect(() => {
    const id = setTimeout(() => ScrollTrigger.refresh(), 800);
    return () => clearTimeout(id);
  }, [resume]);

  const scrollTo = id => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <CustomCursor />
      <Grain />

      <Nav activeSection={activeSection} scrollTo={scrollTo} connected={connected} />

      <HeroFloor market={market} connected={connected} regimeHistory={regimeHistory} source={source} isMobile={isMobile} />
      <Divider />
      <ExperienceSection resume={resume} isMobile={isMobile} />
      <Divider />
      <ProjectsSection resume={resume} isMobile={isMobile} />
      <Divider />
      <SkillsSection resume={resume} isMobile={isMobile} />
      <Divider />
      <PricerSection market={market} isMobile={isMobile} />
      <Divider />
      <CVSection resume={resume} />
      <Divider />
      <ContactSection resume={resume} isMobile={isMobile} />

      <footer style={{
        background: T.bgRaised,
        borderTop: `1px solid ${T.border}`,
        padding: isMobile ? "1.25rem" : "1.5rem 3rem",
        display: "flex", justifyContent: "space-between",
        fontFamily: MONO, fontSize: 9, letterSpacing: ".12em",
        color: T.inkFaint, flexWrap: "wrap", gap: 8,
      }}>
        <span>© 2026 SIMRAT KAUR RANDHAWA</span>
        <span style={{ color: T.amberBright }}>FASTAPI · REACT · D3 · THREE.JS · GSAP · SCIPY</span>
        <span>JERSEY CITY · NEW JERSEY</span>
      </footer>
    </>
  );
}
