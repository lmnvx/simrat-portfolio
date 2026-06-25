export default function OrderBook({ bids = [], asks = [], mid }) {
  const maxBidSize = Math.max(...bids.map(b => b.size), 1);
  const maxAskSize = Math.max(...asks.map(a => a.size), 1);
  const MONO = "'Space Mono', monospace";

  return (
    <div style={{ fontFamily: MONO, fontSize: 11, width: "100%" }}>
      {[...asks].reverse().map((a, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", position: "relative", marginBottom: 2 }}>
          <div style={{
            position: "absolute", right: 0, top: 0, bottom: 0,
            width: `${(a.size / maxAskSize) * 100}%`,
            background: "rgba(255,107,107,0.14)",
          }} />
          <span style={{ flex: 1, color: "rgba(240,238,232,0.5)", textAlign: "left", zIndex: 1, paddingLeft: 4 }}>
            {a.size.toLocaleString()}
          </span>
          <span style={{ flex: 1, color: "#ff6b6b", textAlign: "right", zIndex: 1, paddingRight: 4, fontWeight: 600 }}>
            {a.price.toFixed(2)}
          </span>
        </div>
      ))}

      <div style={{
        borderTop: "1px solid rgba(240,238,232,0.14)",
        borderBottom: "1px solid rgba(240,238,232,0.14)",
        padding: "5px 4px", display: "flex", justifyContent: "space-between",
        color: "rgba(240,238,232,0.6)", fontSize: 10, margin: "3px 0",
      }}>
        <span>MID</span>
        <span style={{ color: "#f0eee8", fontWeight: 700 }}>${mid?.toFixed(2)}</span>
        <span>SPREAD</span>
      </div>

      {bids.map((b, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", position: "relative", marginBottom: 2 }}>
          <div style={{
            position: "absolute", left: 0, top: 0, bottom: 0,
            width: `${(b.size / maxBidSize) * 100}%`,
            background: "rgba(77,255,168,0.12)",
          }} />
          <span style={{ flex: 1, color: "#4dffa8", textAlign: "left", zIndex: 1, paddingLeft: 4, fontWeight: 600 }}>
            {b.price.toFixed(2)}
          </span>
          <span style={{ flex: 1, color: "rgba(240,238,232,0.5)", textAlign: "right", zIndex: 1, paddingRight: 4 }}>
            {b.size.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}
