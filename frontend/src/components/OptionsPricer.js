import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
const MONO = "'Space Mono', monospace";
const SANS = "'Space Grotesk', sans-serif";

const DEFAULT_PARAMS = { S: 185, K: 185, T: 0.25, r: 0.05, sigma: 0.20, option_type: "call", model: "bs" };

// ── JS BLACK-SCHOLES ENGINE (fallback when backend unavailable) ───────────────

function normCDF(x) {
  const a1=0.254829592,a2=-0.284496736,a3=1.421413741,a4=-1.453152027,a5=1.061405429,p=0.3275911;
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5*t+a4)*t)+a3)*t+a2)*t+a1)*t*Math.exp(-x*x);
  return 0.5 * (1.0 + sign * y);
}

function normPDF(x) { return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI); }

function bsPrice(S, K, T, r, sigma, type = "call") {
  if (T <= 0 || sigma <= 0) return Math.max(type === "call" ? S - K : K - S, 0);
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  if (type === "call") return S * normCDF(d1) - K * Math.exp(-r * T) * normCDF(d2);
  return K * Math.exp(-r * T) * normCDF(-d2) - S * normCDF(-d1);
}

function bsGreeks(S, K, T, r, sigma, type = "call") {
  if (T <= 0 || sigma <= 0) return { delta:0, gamma:0, vega:0, theta:0, rho:0 };
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  const gamma = normPDF(d1) / (S * sigma * Math.sqrt(T));
  const vega  = S * normPDF(d1) * Math.sqrt(T) / 100;
  const delta = type === "call" ? normCDF(d1) : normCDF(d1) - 1;
  const theta = type === "call"
    ? (-(S * normPDF(d1) * sigma) / (2 * Math.sqrt(T)) - r * K * Math.exp(-r * T) * normCDF(d2)) / 365
    : (-(S * normPDF(d1) * sigma) / (2 * Math.sqrt(T)) + r * K * Math.exp(-r * T) * normCDF(-d2)) / 365;
  const rho = type === "call"
    ? K * T * Math.exp(-r * T) * normCDF(d2) / 100
    : -K * T * Math.exp(-r * T) * normCDF(-d2) / 100;
  return {
    delta: +delta.toFixed(4), gamma: +gamma.toFixed(6),
    vega:  +vega.toFixed(4),  theta: +theta.toFixed(4), rho: +rho.toFixed(4),
  };
}

function impliedVol(marketPrice, S, K, T, r, type = "call") {
  if (T <= 0 || marketPrice <= 0) return null;
  let lo = 0.001, hi = 5.0;
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    const price = bsPrice(S, K, T, r, mid, type);
    if (Math.abs(price - marketPrice) < 1e-6) return +mid.toFixed(6);
    if (price < marketPrice) lo = mid; else hi = mid;
  }
  return +((lo + hi) / 2).toFixed(6);
}

function buildIVSurface(S, r) {
  const strikesPct = [0.80,0.85,0.875,0.90,0.925,0.95,0.975,1.00,1.025,1.05,1.075,1.10,1.125,1.15,1.20];
  const expiries   = [7,14,30,60,90,120,180,270,365].map(d => d / 365);
  const surface = [];
  for (const T of expiries) {
    const sigmaAtm = 0.18 + 0.04 * Math.exp(-2 * T);
    const skew     = -0.15 * Math.exp(-T);
    const convex   = 0.12;
    for (const kp of strikesPct) {
      const K = S * kp;
      const m = kp - 1.0;
      const sigma = Math.max(sigmaAtm + skew * m + convex * m * m, 0.02);
      const price = bsPrice(S, K, T, r, sigma, "call");
      surface.push({
        strike: +K.toFixed(2), strikePct: +(kp * 100).toFixed(1),
        expiry: +T.toFixed(4), expiryDays: Math.round(T * 365),
        iv: +(sigma * 100).toFixed(2), price: +price.toFixed(4),
      });
    }
  }
  return surface;
}

function computePriceJS(p) {
  const { S, K, T, r, sigma, option_type } = p;
  const type = option_type?.toLowerCase() || "call";
  const price  = bsPrice(S, K, T, r, sigma, type);
  const greeks = bsGreeks(S, K, T, r, sigma, type);
  const iv     = impliedVol(price, S, K, T, r, type);
  return { price: +price.toFixed(4), model: "bs-js", greeks, iv, inputs: { S, K, T, r, sigma } };
}

function Slider({ label, value, min, max, step, onChange, format = v => v.toFixed(2) }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
        <span style={{ fontFamily:MONO, fontSize:9, letterSpacing:".12em", color:"rgba(28,26,23,0.65)", textTransform:"uppercase" }}>{label}</span>
        <span style={{ fontFamily:MONO, fontSize:9, color:"#8B5E3C" }}>{format(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width:"100%", appearance:"none", height:2,
          background:`linear-gradient(to right, #8B5E3C ${((value-min)/(max-min))*100}%, rgba(255,255,255,0.1) 0%)`,
          outline:"none", cursor:"pointer" }}
      />
    </div>
  );
}

function IVHeatmap({ surface }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!surface?.length) return;
    const el = svgRef.current;
    const W = el.clientWidth || 480;
    const H = el.clientHeight || 200;
    const m = { top:8, right:12, bottom:36, left:44 };
    const iW = W - m.left - m.right;
    const iH = H - m.top - m.bottom;

    d3.select(el).selectAll("*").remove();
    const svg = d3.select(el).attr("viewBox",`0 0 ${W} ${H}`);
    const g   = svg.append("g").attr("transform",`translate(${m.left},${m.top})`);

    const strikes  = [...new Set(surface.map(d=>d.strikePct))].sort((a,b)=>a-b);
    const expiries = [...new Set(surface.map(d=>d.expiryDays))].sort((a,b)=>a-b);

    const xScale = d3.scaleBand().domain(strikes).range([0,iW]).padding(0.02);
    const yScale = d3.scaleBand().domain(expiries).range([0,iH]).padding(0.02);
    const ivMin  = d3.min(surface, d=>d.iv);
    const ivMax  = d3.max(surface, d=>d.iv);
    const color  = d3.scaleSequential(d3.interpolateRdYlBu).domain([ivMax, ivMin]);

    g.selectAll("rect.cell").data(surface).join("rect")
      .attr("class","cell")
      .attr("x", d => xScale(d.strikePct))
      .attr("y", d => yScale(d.expiryDays))
      .attr("width",  xScale.bandwidth())
      .attr("height", yScale.bandwidth())
      .attr("fill", d => color(d.iv))
      .attr("rx", 1)
      .append("title").text(d => `Strike: ${d.strikePct}%  Expiry: ${d.expiryDays}d  IV: ${d.iv}%`);

    // ATM line
    const atm = xScale(100);
    if (atm !== undefined) {
      g.append("line")
        .attr("x1", atm + xScale.bandwidth()/2).attr("x2", atm + xScale.bandwidth()/2)
        .attr("y1", 0).attr("y2", iH)
        .attr("stroke","rgba(28,26,23,0.65)").attr("stroke-dasharray","3,2").attr("stroke-width",1);
      g.append("text")
        .attr("x", atm + xScale.bandwidth()/2 + 4).attr("y", 8)
        .attr("fill","rgba(28,26,23,0.55)").attr("font-size",7).attr("font-family",MONO)
        .text("ATM");
    }

    g.append("g").attr("transform",`translate(0,${iH})`)
      .call(d3.axisBottom(xScale).tickValues(strikes.filter((_,i)=>i%2===0)).tickFormat(d=>`${d}%`))
      .call(ax=>ax.select(".domain").remove())
      .call(ax=>ax.selectAll("text").attr("fill","rgba(255,255,255,0.3)").attr("font-size","8px").attr("font-family",MONO));

    g.append("g")
      .call(d3.axisLeft(yScale).tickFormat(d=>`${d}d`))
      .call(ax=>ax.select(".domain").remove())
      .call(ax=>ax.selectAll("text").attr("fill","rgba(255,255,255,0.3)").attr("font-size","8px").attr("font-family",MONO));

    // Color bar
    const cbW = 8, cbH = iH * 0.6, cbX = iW + 4, cbY = iH * 0.2;
    const cbScale = d3.scaleLinear().domain([0,1]).range([cbH,0]);
    const cbGrad  = svg.append("defs").append("linearGradient").attr("id","cbg").attr("x1","0").attr("x2","0").attr("y1","1").attr("y2","0");
    [[0,"#313695"],[0.25,"#74add1"],[0.5,"#fee090"],[0.75,"#f46d43"],[1,"#a50026"]].forEach(([o,c])=>
      cbGrad.append("stop").attr("offset",`${o*100}%`).attr("stop-color",c));
    g.append("rect").attr("x",cbX).attr("y",cbY).attr("width",cbW).attr("height",cbH).attr("fill","url(#cbg)");
    g.append("text").attr("x",cbX+cbW+2).attr("y",cbY+4).attr("fill","rgba(255,255,255,0.3)").attr("font-size",7).attr("font-family",MONO).text(`${ivMax}%`);
    g.append("text").attr("x",cbX+cbW+2).attr("y",cbY+cbH).attr("fill","rgba(255,255,255,0.3)").attr("font-size",7).attr("font-family",MONO).text(`${ivMin}%`);
  }, [surface]);

  return <svg ref={svgRef} style={{width:"100%",height:"100%"}}/>;
}

export default function OptionsPricer({ currentSpot = 185 }) {
  const [params, setParams] = useState({ ...DEFAULT_PARAMS, S: currentSpot, K: currentSpot });
  const [result, setResult] = useState(null);
  const [surface, setSurface] = useState([]);
  const [loading, setLoading] = useState(false);
  const [surfaceLoading, setSurfaceLoading] = useState(false);
  const debounceRef = useRef(null);

  const set = (key, val) => setParams(p => ({ ...p, [key]: val }));

  const fetchPrice = useCallback(async (p) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/price-option`, {
        method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(p),
        signal: AbortSignal.timeout(3000),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      // Backend unreachable — compute locally
      setResult(computePriceJS(p));
    } finally { setLoading(false); }
  }, []);

  const fetchSurface = useCallback(async (S, r) => {
    setSurfaceLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/iv-surface?S=${S}&r=${r}`, {
        signal: AbortSignal.timeout(3000),
      });
      const data = await res.json();
      setSurface(data.surface || []);
    } catch {
      // Backend unreachable — compute locally
      setSurface(buildIVSurface(S, r));
    } finally { setSurfaceLoading(false); }
  }, []);

  // Debounce pricing calls
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPrice(params), 180);
  }, [params, fetchPrice]);

  // Load IV surface on mount + when spot changes
  useEffect(() => {
    fetchSurface(params.S, params.r);
  }, [params.S, params.r, fetchSurface]);

  const G = result?.greeks || {};
  const rowStyle = { display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:"0.5px solid rgba(240,238,232,0.1)", fontFamily:MONO, fontSize:10 };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14, height:"100%" }}>
      {/* Controls + Greeks */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))", gap:14 }}>
        {/* Sliders */}
        <div style={{ background:"rgba(13,14,18,1)", border:"0.5px solid rgba(240,238,232,0.1)", borderRadius:4, padding:"1.25rem 1.4rem" }}>
          <div style={{ fontFamily:MONO, fontSize:9, letterSpacing:".2em", color:"#8B5E3C", marginBottom:16, textTransform:"uppercase", display:"flex", alignItems:"center", gap:8 }}>
            <span style={{width:16,height:"0.5px",background:"#8B5E3C",display:"block"}}/>
            Parameters
          </div>

          {/* Model toggle */}
          <div style={{ display:"flex", gap:6, marginBottom:14 }}>
            {["bs","heston"].map(m => (
              <button key={m} onClick={()=>set("model",m)} style={{
                fontFamily:MONO, fontSize:9, letterSpacing:".1em", textTransform:"uppercase",
                padding:"4px 12px", cursor:"pointer", borderRadius:2,
                background: params.model===m ? "rgba(94,240,255,0.12)" : "transparent",
                border: `0.5px solid ${params.model===m ? "#8B5E3C" : "rgba(255,255,255,0.1)"}`,
                color: params.model===m ? "#8B5E3C" : "rgba(28,26,23,0.6)",
                transition:"all .2s",
              }}>
                {m === "bs" ? "Black-Scholes" : "Heston"}
              </button>
            ))}
            {["call","put"].map(t => (
              <button key={t} onClick={()=>set("option_type",t)} style={{
                fontFamily:MONO, fontSize:9, letterSpacing:".1em", textTransform:"uppercase",
                padding:"4px 12px", cursor:"pointer", borderRadius:2,
                background: params.option_type===t ? "rgba(255,180,84,0.12)" : "transparent",
                border: `0.5px solid ${params.option_type===t ? "#ffb454" : "rgba(255,255,255,0.1)"}`,
                color: params.option_type===t ? "#ffb454" : "rgba(28,26,23,0.6)",
                transition:"all .2s",
              }}>
                {t}
              </button>
            ))}
          </div>

          <Slider label="Spot (S)" value={params.S} min={140} max={240} step={0.5} onChange={v=>set("S",v)} format={v=>`$${v.toFixed(1)}`}/>
          <Slider label="Strike (K)" value={params.K} min={140} max={240} step={0.5} onChange={v=>set("K",v)} format={v=>`$${v.toFixed(1)}`}/>
          <Slider label="Expiry (T)" value={params.T} min={0.01} max={2} step={0.01} onChange={v=>set("T",v)} format={v=>`${Math.round(v*365)}d`}/>
          <Slider label="Vol (σ)" value={params.sigma} min={0.05} max={0.80} step={0.01} onChange={v=>set("sigma",v)} format={v=>`${(v*100).toFixed(0)}%`}/>
          <Slider label="Risk-free (r)" value={params.r} min={0} max={0.10} step={0.001} onChange={v=>set("r",v)} format={v=>`${(v*100).toFixed(1)}%`}/>
        </div>

        {/* Price + Greeks */}
        <div style={{ background:"rgba(13,14,18,1)", border:"0.5px solid rgba(240,238,232,0.1)", borderRadius:4, padding:"1.25rem 1.4rem", display:"flex", flexDirection:"column" }}>
          <div style={{ fontFamily:MONO, fontSize:9, letterSpacing:".2em", color:"#8B5E3C", marginBottom:16, textTransform:"uppercase", display:"flex", alignItems:"center", gap:8 }}>
            <span style={{width:16,height:"0.5px",background:"#8B5E3C",display:"block"}}/>
            Pricing Output
          </div>

          {/* Big price */}
          <div style={{ textAlign:"center", padding:"1rem 0 1.25rem", borderBottom:"0.5px solid rgba(240,238,232,0.1)", marginBottom:14 }}>
            <div style={{ fontFamily:MONO, fontSize:9, color:"rgba(255,255,255,0.3)", letterSpacing:".14em", marginBottom:6, textTransform:"uppercase" }}>
              {params.option_type.toUpperCase()} · {params.model.toUpperCase()}
            </div>
            <div style={{ fontFamily:SANS, fontSize:"2.4rem", fontWeight:700, color: loading ? "rgba(255,255,255,0.3)" : "#8B5E3C", lineHeight:1 }}>
              {loading ? "—" : result?.price != null ? `$${result.price.toFixed(4)}` : "—"}
            </div>
            {result?.iv && (
              <div style={{ fontFamily:MONO, fontSize:9, color:"rgba(255,180,84,0.7)", marginTop:6 }}>
                IV: {(result.iv * 100).toFixed(2)}%
              </div>
            )}
          </div>

          {/* Greeks table */}
          <div style={{ flex:1 }}>
            {[
              { label:"Delta (Δ)", val:G.delta, desc:"Price sensitivity to S" },
              { label:"Gamma (Γ)", val:G.gamma, desc:"Delta sensitivity to S" },
              { label:"Vega (ν)",  val:G.vega,  desc:"Per 1% vol move" },
              { label:"Theta (Θ)", val:G.theta, desc:"Daily time decay" },
              { label:"Rho (ρ)",   val:G.rho,   desc:"Per 1% rate move" },
            ].map(({ label, val, desc }) => (
              <div key={label} style={rowStyle}>
                <span style={{ color:"rgba(255,255,255,0.5)" }}>{label}</span>
                <div style={{ textAlign:"right" }}>
                  <span style={{ color:"#f3f1ec" }}>{val != null ? val.toFixed(4) : "—"}</span>
                  <span style={{ color:"rgba(255,255,255,0.2)", fontSize:8, marginLeft:6 }}>{desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* IV Surface heatmap */}
      <div style={{ background:"rgba(13,14,18,1)", border:"0.5px solid rgba(240,238,232,0.1)", borderRadius:4, padding:"1.25rem 1.4rem", flex:1 }}>
        <div style={{ fontFamily:MONO, fontSize:9, letterSpacing:".2em", color:"#8B5E3C", marginBottom:12, textTransform:"uppercase", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{width:16,height:"0.5px",background:"#8B5E3C",display:"block"}}/>
            IV Surface · Strike % vs Expiry
          </div>
          {surfaceLoading && <span style={{ color:"rgba(255,255,255,0.3)", fontSize:8 }}>COMPUTING...</span>}
        </div>
        <div style={{ height:200 }}>
          <IVHeatmap surface={surface}/>
        </div>
        <div style={{ fontFamily:MONO, fontSize:8, color:"rgba(255,255,255,0.2)", marginTop:8, letterSpacing:".08em" }}>
          Blue = low vol · Red = high vol · Dashed line = ATM · Negative skew parameterised from FE621 coursework
        </div>
      </div>
    </div>
  );
}
