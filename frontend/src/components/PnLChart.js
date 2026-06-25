import { useEffect, useRef } from "react";
import * as d3 from "d3";

export default function PnLChart({ pnlHistory = [] }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!pnlHistory.length) return;
    const el = svgRef.current;
    const W = el.clientWidth || 280;
    const H = el.clientHeight || 80;
    const m = { top: 6, right: 6, bottom: 18, left: 40 };
    const iW = W - m.left - m.right;
    const iH = H - m.top - m.bottom;

    d3.select(el).selectAll("*").remove();
    const svg = d3.select(el).attr("viewBox", `0 0 ${W} ${H}`);
    const g = svg.append("g").attr("transform", `translate(${m.left},${m.top})`);

    const x = d3.scaleLinear().domain([0, pnlHistory.length - 1]).range([0, iW]);
    const yExt = d3.extent(pnlHistory);
    const yPad = Math.max(Math.abs(yExt[1] - yExt[0]) * 0.1, 0.01);
    const y = d3.scaleLinear().domain([yExt[0] - yPad, yExt[1] + yPad]).range([iH, 0]);
    const zero = y(0);

    // Zero line
    if (zero >= 0 && zero <= iH) {
      g.append("line")
        .attr("x1",0).attr("x2",iW).attr("y1",zero).attr("y2",zero)
        .attr("stroke","rgba(240,238,232,0.12)").attr("stroke-dasharray","2,2");
    }

    const lastPnl = pnlHistory[pnlHistory.length - 1];
    const color = lastPnl >= 0 ? "#00ffcc" : "#ff6b6b";

    const defs = svg.append("defs");
    const grad = defs.append("linearGradient").attr("id","pnlGrad").attr("x1","0").attr("x2","0").attr("y1","0").attr("y2","1");
    grad.append("stop").attr("offset","0%").attr("stop-color", color).attr("stop-opacity","0.3");
    grad.append("stop").attr("offset","100%").attr("stop-color", color).attr("stop-opacity","0");

    const area = d3.area().x((d,i)=>x(i)).y0(Math.min(zero,iH)).y1(d=>y(d)).curve(d3.curveCatmullRom);
    g.append("path").datum(pnlHistory).attr("fill","url(#pnlGrad)").attr("d",area);

    const line = d3.line().x((d,i)=>x(i)).y(d=>y(d)).curve(d3.curveCatmullRom);
    g.append("path").datum(pnlHistory)
      .attr("fill","none").attr("stroke", color).attr("stroke-width",1.5).attr("d",line);

    g.append("g").attr("transform",`translate(0,${iH})`)
      .call(d3.axisBottom(x).ticks(3).tickFormat(() => ""))
      .call(ax => ax.select(".domain").attr("stroke","rgba(255,255,255,0.06)"));

    g.append("g")
      .call(d3.axisLeft(y).ticks(3).tickFormat(d => d.toFixed(2)))
      .call(ax => ax.select(".domain").attr("stroke","rgba(255,255,255,0.06)"))
      .call(ax => ax.selectAll("text").attr("fill","rgba(240,238,232,0.55)").attr("font-size","8px").attr("font-family","Space Mono"));

  }, [pnlHistory]);

  return <svg ref={svgRef} style={{ width: "100%", height: "100%" }} />;
}
