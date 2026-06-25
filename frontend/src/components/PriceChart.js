import { useEffect, useRef } from "react";
import * as d3 from "d3";

export default function PriceChart({ priceHistory = [], pnlHistory = [], regime }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!priceHistory.length) return;
    const el = svgRef.current;
    const W = el.clientWidth || 480;
    const H = el.clientHeight || 160;
    const m = { top: 12, right: 12, bottom: 28, left: 48 };
    const iW = W - m.left - m.right;
    const iH = H - m.top - m.bottom;

    d3.select(el).selectAll("*").remove();
    const svg = d3.select(el)
      .attr("viewBox", `0 0 ${W} ${H}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    const g = svg.append("g").attr("transform", `translate(${m.left},${m.top})`);

    const x = d3.scaleLinear().domain([0, priceHistory.length - 1]).range([0, iW]);
    const yExt = d3.extent(priceHistory);
    const yPad = (yExt[1] - yExt[0]) * 0.15 || 1;
    const y = d3.scaleLinear().domain([yExt[0] - yPad, yExt[1] + yPad]).range([iH, 0]);

    // Grid
    g.append("g").attr("class", "grid")
      .call(d3.axisLeft(y).ticks(4).tickSize(-iW).tickFormat(""))
      .call(ax => ax.select(".domain").remove())
      .call(ax => ax.selectAll("line").attr("stroke", "rgba(240,238,232,0.08)"));

    // Gradient area
    const defs = svg.append("defs");
    const grad = defs.append("linearGradient").attr("id", "priceGrad").attr("x1","0").attr("x2","0").attr("y1","0").attr("y2","1");
    grad.append("stop").attr("offset","0%").attr("stop-color","#00E5FF").attr("stop-opacity","0.25");
    grad.append("stop").attr("offset","100%").attr("stop-color","#00E5FF").attr("stop-opacity","0");

    const area = d3.area()
      .x((d, i) => x(i))
      .y0(iH)
      .y1(d => y(d))
      .curve(d3.curveCatmullRom);

    g.append("path")
      .datum(priceHistory)
      .attr("fill", "url(#priceGrad)")
      .attr("d", area);

    // Price line
    const line = d3.line().x((d, i) => x(i)).y(d => y(d)).curve(d3.curveCatmullRom);
    g.append("path")
      .datum(priceHistory)
      .attr("fill", "none")
      .attr("stroke", "#00E5FF")
      .attr("stroke-width", 1.5)
      .attr("d", line);

    // Current price dot
    const last = priceHistory[priceHistory.length - 1];
    g.append("circle")
      .attr("cx", x(priceHistory.length - 1))
      .attr("cy", y(last))
      .attr("r", 3)
      .attr("fill", "#00E5FF");

    // Axes
    g.append("g").attr("transform", `translate(0,${iH})`)
      .call(d3.axisBottom(x).ticks(6).tickFormat(i => `T-${priceHistory.length - 1 - i}`))
      .call(ax => ax.select(".domain").attr("stroke", "rgba(255,255,255,0.1)"))
      .call(ax => ax.selectAll("text").attr("fill", "rgba(240,238,232,0.55)").attr("font-size", "9px").attr("font-family", "Space Mono"));

    g.append("g")
      .call(d3.axisLeft(y).ticks(4).tickFormat(d => `$${d.toFixed(1)}`))
      .call(ax => ax.select(".domain").attr("stroke", "rgba(255,255,255,0.1)"))
      .call(ax => ax.selectAll("text").attr("fill", "rgba(240,238,232,0.55)").attr("font-size", "9px").attr("font-family", "Space Mono"));

  }, [priceHistory]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <div style={{
        position: "absolute", top: 4, right: 8,
        fontFamily: "Space Mono", fontSize: 9, letterSpacing: ".12em",
        textTransform: "uppercase",
        color: regime === "volatile" ? "#ff6b6b" : regime === "trending" ? "#00E5FF" : "#00ffcc",
        opacity: .7
      }}>
        {regime}
      </div>
      <svg ref={svgRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
