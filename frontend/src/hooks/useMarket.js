import { useEffect, useState, useRef } from "react";

// ── JS MARKET SIMULATOR (mirrors Python backend exactly) ─────────────────────
function randNormal() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}
function lognormal(mu, sigma) { return Math.exp(mu + sigma * randNormal()); }

class MarketSim {
  constructor() {
    this.symbol = "AAPL"; this.mid = 185.0; this.spread = 0.02;
    this.tick = 0; this.returns = []; this.priceHistory = [];
    this.volumeHistory = []; this.agentPnl = 0; this.agentPosition = 0;
    this.agentTrades = []; this.agentPnlHistory = [];
    this.regime = "trending"; this.regimeCounter = 0;
    this._seed();
  }
  _seed() {
    let p = this.mid;
    for (let i = 0; i < 80; i++) {
      p = p * Math.exp(randNormal() * 0.0015);
      this.priceHistory.push(Math.round(p * 100) / 100);
      this.volumeHistory.push(Math.round(lognormal(7, 0.5)));
    }
    this.mid = p;
  }
  _updateRegime() {
    if (++this.regimeCounter > 30 + Math.floor(Math.random() * 50)) {
      this.regime = ["trending","mean_reverting","volatile"][Math.floor(Math.random()*3)];
      this.regimeCounter = 0;
    }
  }
  step() {
    this._updateRegime(); this.tick++;
    let drift, vol;
    if (this.regime === "trending") { drift = (Math.random()>.5?1:-1)*0.0003; vol=0.0012; }
    else if (this.regime === "mean_reverting") { drift=(185-this.mid)*0.002; vol=0.0008; }
    else { drift=0; vol=0.003; }
    const ret = drift + vol * randNormal();
    this.mid = Math.max(Math.round(this.mid*Math.exp(ret)*100)/100, 1);
    this.returns.push(ret); if (this.returns.length>20) this.returns.shift();
    this.priceHistory.push(this.mid); if (this.priceHistory.length>80) this.priceHistory.shift();
    this.volumeHistory.push(Math.round(lognormal(7+Math.abs(ret)*50,0.4)));
    if (this.volumeHistory.length>80) this.volumeHistory.shift();
    this._agentStep(ret);
    return this._snapshot();
  }
  _agentStep(lastRet) {
    if (this.returns.length < 10) return;
    const momentum = this.returns.slice(-5).reduce((a,b)=>a+b,0);
    const meanRev = (185 - this.mid) / 185;
    const signal = momentum*0.6 + meanRev*0.4 + randNormal()*0.0002;
    const prev = this.agentPosition;
    this.agentPosition = signal > 0.0015 ? 1 : signal < -0.0015 ? -1 : 0;
    this.agentPnl += prev*lastRet*this.mid - Math.abs(this.agentPosition-prev)*this.mid*0.0001;
    this.agentPnlHistory.push(Math.round(this.agentPnl*10000)/10000);
    if (this.agentPnlHistory.length>80) this.agentPnlHistory.shift();
    if (this.agentPosition !== prev) {
      this.agentTrades.push({ tick:this.tick, price:this.mid,
        side: this.agentPosition===1?"BUY":this.agentPosition===-1?"SELL":"FLAT",
        pnl: Math.round(this.agentPnl*10000)/10000 });
      if (this.agentTrades.length>8) this.agentTrades.shift();
    }
  }
  _snapshot() {
    const bid = Math.round((this.mid-this.spread/2)*100)/100;
    const ask = Math.round((this.mid+this.spread/2)*100)/100;
    const bids=[], asks=[]; let cb=0, ca=0;
    for (let i=0;i<8;i++) {
      const bp=Math.round((bid-i*(this.spread+Math.random()*0.015+0.005))*100)/100;
      const ap=Math.round((ask+i*(this.spread+Math.random()*0.015+0.005))*100)/100;
      const bs=Math.round(lognormal(5.5-i*0.2,0.6));
      const as_=Math.round(lognormal(5.5-i*0.2,0.6));
      cb+=bs; ca+=as_;
      bids.push({price:bp,size:bs,cumSize:cb});
      asks.push({price:ap,size:as_,cumSize:ca});
    }
    return {
      tick:this.tick, symbol:this.symbol, mid:this.mid, bid, ask,
      spread:Math.round((ask-bid)*10000)/10000, bids, asks,
      priceHistory:[...this.priceHistory], volumeHistory:[...this.volumeHistory],
      regime:this.regime,
      agent:{ position:this.agentPosition,
        pnl:Math.round(this.agentPnl*10000)/10000,
        pnlHistory:[...this.agentPnlHistory],
        recentTrades:[...this.agentTrades] },
    };
  }
}

// ── UNIFIED HOOK ──────────────────────────────────────────────────────────────
// 1. Tries the backend WebSocket for 3 seconds
// 2. If it doesn't connect, silently falls back to the JS simulator
// 3. If it does connect, uses the real feed — JS sim never starts
// Visitors on Vercel (no backend) see identical behaviour to local dev

const WS_URL = process.env.REACT_APP_WS_URL || "ws://localhost:8000/ws/market";
const FALLBACK_DELAY_MS = 3000;

export function useMarket() {
  const [data, setData] = useState(null);
  const [connected, setConnected] = useState(false);
  const [source, setSource] = useState("connecting"); // "ws" | "sim" | "connecting"

  const simRef = useRef(null);
  const simTimerRef = useRef(null);
  const wsRef = useRef(null);
  const cancelledRef = useRef(false);
  const connectedRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    // ── Try WebSocket ──
    let ws;
    try { ws = new WebSocket(WS_URL); } catch { ws = null; }

    if (ws) {
      wsRef.current = ws;
      ws.onopen = () => {
        if (cancelledRef.current) { ws.close(); return; }
        connectedRef.current = true;
        setConnected(true);
        setSource("ws");
        // Cancel the fallback timer — backend is alive
        if (simTimerRef.current) { clearTimeout(simTimerRef.current); simTimerRef.current = null; }
      };
      ws.onmessage = (e) => {
        if (cancelledRef.current) return;
        try { setData(JSON.parse(e.data)); } catch {}
      };
      ws.onclose = () => {
        if (cancelledRef.current) return;
        setConnected(false);
        // If we were previously connected on WS and lost it, stay on WS source
        // but show reconnecting — don't switch to sim mid-session
      };
      ws.onerror = () => { ws?.close(); };
    }

    // ── Fallback timer: if WS hasn't connected in 3s, start JS sim ──
    simTimerRef.current = setTimeout(() => {
      if (connectedRef.current || cancelledRef.current) return;
      // Backend unreachable — spin up JS simulator
      simRef.current = new MarketSim();
      setSource("sim");
      setConnected(true); // sim is always "connected"
      setData(simRef.current.step());
      simTimerRef.current = setInterval(() => {
        if (cancelledRef.current) return;
        setData(simRef.current.step());
      }, 400);
    }, FALLBACK_DELAY_MS);

    return () => {
      cancelledRef.current = true;
      if (ws) { ws.onopen=null; ws.onmessage=null; ws.onclose=null; ws.onerror=null; ws.close(); }
      if (simTimerRef.current) {
        clearTimeout(simTimerRef.current);
        clearInterval(simTimerRef.current);
      }
    };
  }, []);

  return { data, connected, source };
}
