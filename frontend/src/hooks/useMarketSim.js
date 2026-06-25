import { useState, useEffect, useRef } from "react";

// ── GBM + REGIME SWITCHING MARKET SIMULATOR (JS port of Python backend) ──────

function randNormal() {
  // Box-Muller transform
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function lognormal(mu, sigma) {
  return Math.exp(mu + sigma * randNormal());
}

function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }

class MarketSim {
  constructor() {
    this.symbol = "AAPL";
    this.mid = 185.0;
    this.spread = 0.02;
    this.tick = 0;
    this.returns = [];
    this.priceHistory = [];
    this.volumeHistory = [];
    this.agentPnl = 0;
    this.agentPosition = 0;
    this.agentTrades = [];
    this.agentPnlHistory = [];
    this.regime = "trending";
    this.regimeCounter = 0;
    this._seed();
  }

  _seed() {
    let p = this.mid;
    for (let i = 0; i < 80; i++) {
      const ret = randNormal() * 0.0015;
      p = p * Math.exp(ret);
      this.priceHistory.push(Math.round(p * 100) / 100);
      this.volumeHistory.push(Math.round(lognormal(7, 0.5)));
    }
    this.mid = p;
  }

  _updateRegime() {
    this.regimeCounter++;
    if (this.regimeCounter > 30 + Math.floor(Math.random() * 50)) {
      const regimes = ["trending", "mean_reverting", "volatile"];
      this.regime = regimes[Math.floor(Math.random() * regimes.length)];
      this.regimeCounter = 0;
    }
  }

  step() {
    this._updateRegime();
    this.tick++;

    let drift, vol;
    if (this.regime === "trending") { drift = (Math.random() > 0.5 ? 1 : -1) * 0.0003; vol = 0.0012; }
    else if (this.regime === "mean_reverting") { drift = (185.0 - this.mid) * 0.002; vol = 0.0008; }
    else { drift = 0; vol = 0.003; }

    const ret = drift + vol * randNormal();
    this.mid = Math.max(Math.round(this.mid * Math.exp(ret) * 100) / 100, 1);
    this.returns.push(ret);
    if (this.returns.length > 20) this.returns.shift();

    this.priceHistory.push(this.mid);
    if (this.priceHistory.length > 80) this.priceHistory.shift();

    const volVal = Math.round(lognormal(7 + Math.abs(ret) * 50, 0.4));
    this.volumeHistory.push(volVal);
    if (this.volumeHistory.length > 80) this.volumeHistory.shift();

    this._agentStep(ret);
    return this._snapshot();
  }

  _agentStep(lastRet) {
    if (this.returns.length < 10) return;
    const momentum = this.returns.slice(-5).reduce((a, b) => a + b, 0);
    const meanRev = (185.0 - this.mid) / 185.0;
    const signal = momentum * 0.6 + meanRev * 0.4 + randNormal() * 0.0002;
    const prev = this.agentPosition;
    if (signal > 0.0015) this.agentPosition = 1;
    else if (signal < -0.0015) this.agentPosition = -1;
    else this.agentPosition = 0;

    const pnlDelta = prev * lastRet * this.mid;
    const tc = Math.abs(this.agentPosition - prev) * this.mid * 0.0001;
    this.agentPnl += pnlDelta - tc;
    this.agentPnlHistory.push(Math.round(this.agentPnl * 10000) / 10000);
    if (this.agentPnlHistory.length > 80) this.agentPnlHistory.shift();

    if (this.agentPosition !== prev) {
      this.agentTrades.push({
        tick: this.tick,
        price: this.mid,
        side: this.agentPosition === 1 ? "BUY" : this.agentPosition === -1 ? "SELL" : "FLAT",
        pnl: Math.round(this.agentPnl * 10000) / 10000,
      });
      if (this.agentTrades.length > 8) this.agentTrades.shift();
    }
  }

  _snapshot() {
    const bid = Math.round((this.mid - this.spread / 2) * 100) / 100;
    const ask = Math.round((this.mid + this.spread / 2) * 100) / 100;
    const bids = [], asks = [];
    let cumBid = 0, cumAsk = 0;
    for (let i = 0; i < 8; i++) {
      const bp = Math.round((bid - i * (this.spread + Math.random() * 0.015 + 0.005)) * 100) / 100;
      const ap = Math.round((ask + i * (this.spread + Math.random() * 0.015 + 0.005)) * 100) / 100;
      const bs = Math.round(lognormal(5.5 - i * 0.2, 0.6));
      const as_ = Math.round(lognormal(5.5 - i * 0.2, 0.6));
      cumBid += bs; cumAsk += as_;
      bids.push({ price: bp, size: bs, cumSize: cumBid });
      asks.push({ price: ap, size: as_, cumSize: cumAsk });
    }
    return {
      tick: this.tick, symbol: this.symbol,
      mid: this.mid, bid, ask,
      spread: Math.round((ask - bid) * 10000) / 10000,
      bids, asks,
      priceHistory: [...this.priceHistory],
      volumeHistory: [...this.volumeHistory],
      regime: this.regime,
      agent: {
        position: this.agentPosition,
        pnl: Math.round(this.agentPnl * 10000) / 10000,
        pnlHistory: [...this.agentPnlHistory],
        recentTrades: [...this.agentTrades],
      },
    };
  }
}

// ── HOOK ──────────────────────────────────────────────────────────────────────

export function useMarketSim(intervalMs = 400) {
  const simRef = useRef(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    simRef.current = new MarketSim();
    setData(simRef.current.step());
    const id = setInterval(() => {
      setData(simRef.current.step());
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return { data, connected: true }; // always "connected" since it's local
}
