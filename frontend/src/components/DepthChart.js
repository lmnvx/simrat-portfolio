import { useEffect, useRef } from "react";
import * as d3 from "d3";

export default function DepthChart({ bids = [], asks = [] }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!bids.length || !asks.length) return;
    const el = svgRef.current;
    const W = el.clientWidth || 300;
    const H = el.clientHeight || 140;
    const m = { top: 8, right: 8, bottom: 24, left: 44 };
    const iW = W - m.left - m.right;
    const iH = H - m.top - m.bottom;

    d3.select(el).selectAll("*").remove();
    const svg = d3.select(el).attr("viewBox", `0 0 ${W} ${H}`);
    const g = svg.append("g").attr("transform", `translate(${m.left},${m.top})`);

    const allPrices = [...bids.map(d => d.price), ...asks.map(d => d.price)];
    const allSizes = [...bids.map(d => d.cumSize), ...asks.map(d => d.cumSize)];

    const x = d3.scaleLinear().domain(d3.extent(allPrices)).range([0, iW]);
    const y = d3.scaleLinear().domain([0, d3.max(allSizes) * 1.1]).range([iH, 0]);

    const defs = svg.append("defs");
    const gBid = defs.append("linearGradient").attr("id","bidGrad").attr("x1","0").attr("x2","0").attr("y1","0").attr("y2","1");
    gBid.append("stop").attr("offset","0%").attr("stop-color","#00ffcc").attr("stop-opacity","0.3");
    gBid.append("stop").attr("offset","100%").attr("stop-color","#00ffcc").attr("stop-opacity","0");

    const gAsk = defs.append("linearGradient").attr("id","askGrad").attr("x1","0").attr("x2","0").attr("y1","0").attr("y2","1");
    gAsk.append("stop").attr("offset","0%").attr("stop-color","#ff6b6b").attr("stop-opacity","0.3");
    gAsk.append("stop").attr("offset","100%").attr("stop-color","#ff6b6b").attr("stop-opacity","0");

    // Bid area
    const bidArea = d3.area()
      .x(d => x(d.price)).y0(iH).y1(d => y(d.cumSize)).curve(d3.curveStepAfter);
    g.append("path").datum([...bids].reverse())
      .attr("fill","url(#bidGrad)").attr("d", bidArea);
    g.append("path").datum([...bids].reverse())
      .attr("fill","none").attr("stroke","#00ffcc").attr("stroke-width",1.2)
      .attr("d", d3.line().x(d=>x(d.price)).y(d=>y(d.cumSize)).curve(d3.curveStepAfter));

    // Ask area
    const askArea = d3.area()
      .x(d => x(d.price)).y0(iH).y1(d => y(d.cumSize)).curve(d3.curveStepBefore);
    g.append("path").datum(asks)
      .attr("fill","url(#askGrad)").attr("d", askArea);
    g.append("path").datum(asks)
      .attr("fill","none").attr("stroke","#ff6b6b").attr("stroke-width",1.2)
      .attr("d", d3.line().x(d=>x(d.price)).y(d=>y(d.cumSize)).curve(d3.curveStepBefore));

    // Midpoint line
    const mid = (bids[0]?.price + asks[0]?.price) / 2;
    g.append("line")
      .attr("x1", x(mid)).attr("x2", x(mid)).attr("y1", 0).attr("y2", iH)
      .attr("stroke", "rgba(255,255,255,0.15)").attr("stroke-dasharray", "3,3");

    // Axes
    g.append("g").attr("transform",`translate(0,${iH})`)
      .call(d3.axisBottom(x).ticks(4).tickFormat(d => `$${d.toFixed(1)}`))
      .call(ax => ax.select(".domain").attr("stroke","rgba(240,238,232,0.12)"))
      .call(ax => ax.selectAll("text").attr("fill","rgba(240,238,232,0.55)").attr("font-size","8px").attr("font-family","Space Mono"));

    g.append("g")
      .call(d3.axisLeft(y).ticks(3).tickFormat(d => d >= 1000 ? `${(d/1000).toFixed(1)}k` : d))
      .call(ax => ax.select(".domain").attr("stroke","rgba(240,238,232,0.12)"))
      .call(ax => ax.selectAll("text").attr("fill","rgba(240,238,232,0.55)").attr("font-size","8px").attr("font-family","Space Mono"));

  }, [bids, asks]);

  return <svg ref={svgRef} style={{ width: "100%", height: "100%" }} />;
}
