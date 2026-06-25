import { useEffect, useRef } from "react";
import * as d3 from "d3";

const REGIME_COLORS = {
  trending:      { fill: "rgba(94,240,255,0.12)",  stroke: "#5ef0ff" },
  mean_reverting:{ fill: "rgba(255,180,84,0.12)",  stroke: "#ffb454" },
  volatile:      { fill: "rgba(255,107,107,0.15)", stroke: "#ff6b6b" },
};

export default function RegimeChart({ priceHistory = [], regimeHistory = [], currentRegime = "trending" }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (priceHistory.length < 2) return;
    const el = svgRef.current;
    const W = el.clientWidth || 480;
    const H = el.clientHeight || 160;
    const m = { top: 10, right: 12, bottom: 26, left: 52 };
    const iW = W - m.left - m.right;
    const iH = H - m.top - m.bottom;

    d3.select(el).selectAll("*").remove();
    const svg = d3.select(el).attr("viewBox", `0 0 ${W} ${H}`);
    const g   = svg.append("g").attr("transform", `translate(${m.left},${m.top})`);

    const n  = priceHistory.length;
    const x  = d3.scaleLinear().domain([0, n - 1]).range([0, iW]);
    const ye = d3.extent(priceHistory);
    const yp = (ye[1] - ye[0]) * 0.12 || 1;
    const y  = d3.scaleLinear().domain([ye[0] - yp, ye[1] + yp]).range([iH, 0]);

    // Regime background bands
    if (regimeHistory.length === n) {
      let start = 0, curR = regimeHistory[0];
      const drawBand = (s, e, r) => {
        const rc = REGIME_COLORS[r] || REGIME_COLORS.trending;
        g.append("rect")
          .attr("x", x(s)).attr("y", 0)
          .attr("width", x(e) - x(s)).attr("height", iH)
          .attr("fill", rc.fill);
      };
      for (let i = 1; i < n; i++) {
        if (regimeHistory[i] !== curR || i === n - 1) {
          drawBand(start, i, curR);
          start = i; curR = regimeHistory[i];
        }
      }
    }

    // Grid
    g.append("g")
      .call(d3.axisLeft(y).ticks(4).tickSize(-iW).tickFormat(""))
      .call(ax => ax.select(".domain").remove())
      .call(ax => ax.selectAll("line").attr("stroke", "rgba(240,238,232,0.08)"));

    // Gradient
    const defs = svg.append("defs");
    const grad = defs.append("linearGradient").attr("id","rgGrad").attr("x1","0").attr("x2","0").attr("y1","0").attr("y2","1");
    const rc   = REGIME_COLORS[currentRegime] || REGIME_COLORS.trending;
    grad.append("stop").attr("offset","0%").attr("stop-color", rc.stroke).attr("stop-opacity","0.22");
    grad.append("stop").attr("offset","100%").attr("stop-color", rc.stroke).attr("stop-opacity","0");

    const area = d3.area().x((_,i)=>x(i)).y0(iH).y1(d=>y(d)).curve(d3.curveCatmullRom);
    g.append("path").datum(priceHistory).attr("fill","url(#rgGrad)").attr("d",area);

    const line = d3.line().x((_,i)=>x(i)).y(d=>y(d)).curve(d3.curveCatmullRom);
    g.append("path").datum(priceHistory)
      .attr("fill","none").attr("stroke", rc.stroke)
      .attr("stroke-width", 1.5).attr("d", line);

    // Current price dot
    const last = priceHistory[n - 1];
    g.append("circle").attr("cx", x(n-1)).attr("cy", y(last))
      .attr("r", 3).attr("fill", rc.stroke);

    // Axes
    g.append("g").attr("transform",`translate(0,${iH})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(i => `T-${n-1-i}`))
      .call(ax => ax.select(".domain").attr("stroke","rgba(240,238,232,0.12)"))
      .call(ax => ax.selectAll("text").attr("fill","rgba(240,238,232,0.55)").attr("font-size","8px").attr("font-family","Space Mono"));

    g.append("g")
      .call(d3.axisLeft(y).ticks(4).tickFormat(d=>`$${d.toFixed(0)}`))
      .call(ax => ax.select(".domain").attr("stroke","rgba(240,238,232,0.12)"))
      .call(ax => ax.selectAll("text").attr("fill","rgba(240,238,232,0.55)").attr("font-size","8px").attr("font-family","Space Mono"));

  }, [priceHistory, regimeHistory, currentRegime]);

  const MONO = "'Space Mono', monospace";
  const rc   = REGIME_COLORS[currentRegime] || REGIME_COLORS.trending;

  return (
    <div style={{ width:"100%", height:"100%", position:"relative" }}>
      {/* Live regime badge */}
      <div style={{
        position:"absolute", top:6, right:6,
        fontFamily: MONO, fontSize:9, letterSpacing:".14em",
        color: rc.stroke, background:`${rc.fill}`,
        border:`0.5px solid ${rc.stroke}40`,
        padding:"3px 8px", textTransform:"uppercase", zIndex:2,
      }}>
        ● {currentRegime.replace("_"," ")}
      </div>
      {/* Legend */}
      <div style={{ position:"absolute", bottom:30, right:6, display:"flex", flexDirection:"column", gap:3, zIndex:2 }}>
        {Object.entries(REGIME_COLORS).map(([r, c]) => (
          <div key={r} style={{ display:"flex", alignItems:"center", gap:4 }}>
            <span style={{ width:8, height:8, background:c.fill, border:`0.5px solid ${c.stroke}`, display:"block" }}/>
            <span style={{ fontFamily:MONO, fontSize:7, color:"rgba(240,238,232,0.55)", textTransform:"uppercase" }}>
              {r.replace("_"," ")}
            </span>
          </div>
        ))}
      </div>
      <svg ref={svgRef} style={{ width:"100%", height:"100%" }}/>
    </div>
  );
}
