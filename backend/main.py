import asyncio
import json
import math
import random
from collections import deque
from typing import Any

import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Simrat Portfolio API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── MARKET SIMULATOR ──────────────────────────────────────────────────────────

class MarketSimulator:
    def __init__(self, symbol="AAPL", initial_price=185.0):
        self.symbol = symbol
        self.mid = initial_price
        self.spread = 0.02
        self.tick = 0
        self.returns = []
        self.price_history = deque(maxlen=200)
        self.volume_history = deque(maxlen=200)
        self.agent_pnl = 0.0
        self.agent_position = 0
        self.agent_trades = deque(maxlen=50)
        self.agent_pnl_history = deque(maxlen=200)
        self.regime = "trending"
        self.regime_counter = 0
        self._seed_history()

    def _seed_history(self):
        p = self.mid
        for _ in range(200):
            ret = np.random.normal(0, 0.0015)
            p = p * math.exp(ret)
            self.price_history.append(round(p, 2))
            self.volume_history.append(int(np.random.lognormal(7, 0.5)))
        self.mid = p

    def _update_regime(self):
        self.regime_counter += 1
        if self.regime_counter > random.randint(30, 80):
            self.regime = random.choice(["trending", "mean_reverting", "volatile"])
            self.regime_counter = 0

    def step(self):
        self._update_regime()
        self.tick += 1
        if self.regime == "trending":
            drift = random.choice([-1, 1]) * 0.0003
            vol = 0.0012
        elif self.regime == "mean_reverting":
            drift = (185.0 - self.mid) * 0.002
            vol = 0.0008
        else:
            drift = 0
            vol = 0.003

        ret = np.random.normal(drift, vol)
        self.mid = round(self.mid * math.exp(ret), 2)
        self.mid = max(self.mid, 1.0)
        self.returns.append(ret)
        self.price_history.append(self.mid)
        vol_val = int(np.random.lognormal(7 + abs(ret) * 50, 0.4))
        self.volume_history.append(vol_val)
        self._agent_step(ret)
        return self._build_snapshot()

    def _agent_step(self, last_ret):
        if len(self.returns) < 10:
            return
        momentum = sum(self.returns[-5:])
        mean_rev = (185.0 - self.mid) / 185.0
        noise = np.random.normal(0, 0.0002)
        signal = momentum * 0.6 + mean_rev * 0.4 + noise
        prev = self.agent_position
        if signal > 0.0015:
            self.agent_position = 1
        elif signal < -0.0015:
            self.agent_position = -1
        else:
            self.agent_position = 0
        pnl_delta = prev * last_ret * self.mid
        tc = abs(self.agent_position - prev) * self.mid * 0.0001
        self.agent_pnl += pnl_delta - tc
        self.agent_pnl_history.append(round(self.agent_pnl, 4))
        if self.agent_position != prev:
            self.agent_trades.append({
                "tick": self.tick,
                "price": self.mid,
                "side": "BUY" if self.agent_position > 0 else ("SELL" if self.agent_position < 0 else "FLAT"),
                "pnl": round(self.agent_pnl, 4),
            })

    def _build_snapshot(self):
        bid = round(self.mid - self.spread / 2, 2)
        ask = round(self.mid + self.spread / 2, 2)
        bids, asks = [], []
        for i in range(8):
            bp = round(bid - i * (self.spread + random.uniform(0.005, 0.02)), 2)
            ap = round(ask + i * (self.spread + random.uniform(0.005, 0.02)), 2)
            bids.append({"price": bp, "size": int(np.random.lognormal(5.5 - i * 0.2, 0.6))})
            asks.append({"price": ap, "size": int(np.random.lognormal(5.5 - i * 0.2, 0.6))})
        cum_bid, cum_ask = 0, 0
        for b in bids:
            cum_bid += b["size"]; b["cumSize"] = cum_bid
        for a in asks:
            cum_ask += a["size"]; a["cumSize"] = cum_ask
        return {
            "tick": self.tick,
            "symbol": self.symbol,
            "mid": self.mid,
            "bid": bid,
            "ask": ask,
            "spread": round(ask - bid, 4),
            "bids": bids,
            "asks": asks,
            "priceHistory": list(self.price_history)[-80:],
            "volumeHistory": list(self.volume_history)[-80:],
            "regime": self.regime,
            "agent": {
                "position": self.agent_position,
                "pnl": round(self.agent_pnl, 4),
                "pnlHistory": list(self.agent_pnl_history)[-80:],
                "recentTrades": list(self.agent_trades)[-8:],
            }
        }


market = MarketSimulator()

# ── REST ──────────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "online", "api": "Simrat Portfolio", "version": "1.0"}

@app.get("/api/snapshot")
def snapshot():
    return market._build_snapshot()

@app.get("/api/resume")
def resume():
    return {
        "name": "Simrat Kaur Randhawa",
        "title": "Data Scientist · ML Engineer · Quant Researcher",
        "location": "Jersey City, NJ",
        "phone": "201-884-0432",
        "email": "simratkr1.sr@gmail.com",
        "linkedin": "simratkaurrandhawa",
        "github": "lmnvx",
        "education": [
            {
                "degree": "MS Computer Science · Certificate in Financial Engineering",
                "institution": "Stevens Institute of Technology, Hoboken NJ",
                "gpa": 3.8,
                "period": "Sept 2024 – May 2026",
                "coursework": "Statistical Learning, Machine Learning, Deep Learning, NLP, Stochastic Calculus, Computational Methods in Finance, Pricing & Hedging"
            },
            {
                "degree": "BE Information and Communication Technology",
                "institution": "Gujarat Technological University, India",
                "gpa": 3.55,
                "period": "Sept 2019 – May 2023",
                "coursework": "Machine Learning, Probability & Statistics, Data Science, Data Structures & Algorithms"
            }
        ],
        "experience": [
            {
                "role": "Student Researcher – Algorithmic Trading",
                "org": "CRAFT Lab · Stevens Institute of Technology",
                "period": "Jan 2025 – Present",
                "color": "#5ef0ff",
                "bullets": [
                    "Designing a hierarchical RL trading system (TD3 + PPO) across multiple time scales over a live limit order book; evaluating on Sharpe ratio, cumulative return, and max drawdown",
                    "Analyzing simulated order book data in Python to identify execution patterns and inform training regimes",
                    "Contributing to SHIFT, a high-fidelity market simulation platform, in Python and C++"
                ],
                "tags": ["PyTorch", "TD3", "PPO", "C++", "SHIFT", "Hierarchical RL"]
            },
            {
                "role": "Organizer – High Frequency Trading Competition",
                "org": "Stevens Institute of Technology",
                "period": "Jan 2026 – March 2026",
                "color": "#4dffa8",
                "bullets": [
                    "Developed historic market data themes used as simulation scenarios for the competition",
                    "Onboarded competing teams onto the SHIFT platform and contributed front-end improvements to the competition web client"
                ],
                "tags": ["SHIFT", "Market Microstructure", "Event Design"]
            },
            {
                "role": "Graduate Assistant – Data Analytics",
                "org": "Stevens Institute of Technology",
                "period": "Oct 2024 – May 2026",
                "color": "#5ef0ff",
                "bullets": [
                    "Built Power BI dashboards and SQL pipelines tracking graduate enrollment health across programs via Slate CRM",
                    "Designed reporting logic to surface early indicators of funnel drop-off, enabling the admissions team to act on trends in near real-time"
                ],
                "tags": ["Power BI", "SQL", "Slate CRM", "Data Pipelines"]
            },
            {
                "role": "Data Scientist",
                "org": "Lendingkart (Small Finance Bank) · Bangalore",
                "period": "Aug 2023 – Jul 2024",
                "color": "#ffb454",
                "bullets": [
                    "Built and deployed personal loan default prediction models in production — trained on 3 years of credit history and transaction data, achieving accuracy in the low 80s across live portfolios",
                    "Designed a multi-lender ML scoring pipeline with vendor-specific feature engineering and unified scoring logic; automated end-to-end decisioning, cutting manual review overhead significantly",
                    "Work featured in Analytics India Magazine; profiled customer segments by repayment behavior and risk to inform lender underwriting policy"
                ],
                "tags": ["XGBoost", "Scikit-learn", "Python", "Credit Risk", "Production ML"]
            },
            {
                "role": "Data Science Intern – AI/ML Team",
                "org": "Lendingkart (Small Finance Bank) · Ahmedabad",
                "period": "Jan 2023 – Jul 2023",
                "color": "#ffb454",
                "bullets": [
                    "Built a multilingual speech-to-text pipeline on customer service call recordings, layering sentiment analysis and anomaly detection to surface recurring pain points and escalation triggers at scale",
                    "First end-to-end ML project shipped independently; findings reviewed by the customer experience team to inform agent coaching"
                ],
                "tags": ["NLP", "Speech-to-Text", "Sentiment Analysis", "Python"]
            }
        ],
        "projects": [
            {
                "title": "This Portfolio — Full-Stack Architecture",
                "description": "FastAPI backend serving a real-time market simulator via WebSocket (GBM + regime switching, TD3-style RL agent), with a React + D3 + Three.js frontend. The backend runs locally or on any cloud host; the deployed site uses an identical JS simulator as a zero-dependency fallback so the dashboard works without a server. Options pricing (Black-Scholes + Heston) runs in Python via scipy on the backend, exposed as a REST endpoint. Stack: FastAPI · WebSocket · NumPy · SciPy · React · D3 · Three.js · GSAP · Lenis.",
                "tech": ["FastAPI", "WebSocket", "React", "D3.js", "Three.js", "GSAP", "NumPy", "SciPy"],
                "color": "#8B5E3C"
            },
                "description": "TD3 + PPO agents operating across multiple time scales over a live limit order book on SHIFT. Evaluated on Sharpe ratio, cumulative return, and max drawdown. Architecture separates high-level strategy from tick-level execution.",
                "tech": ["PyTorch", "TD3", "PPO", "C++", "SHIFT", "Python"],
                "color": "#5ef0ff"
            },
            {
                "title": "Financial Named Entity Recognition",
                "description": "Automated entity extraction for SEC financial filings using FiNER-139 dataset (1.1M sentences, 139 XBRL types). Hybrid Transformer-BiLSTM-CRF with sec-bert-base achieved F1 of 0.59 vs 0.34 for BiLSTM-CRF baseline.",
                "tech": ["PyTorch", "BERT", "BiLSTM-CRF", "NLP", "Python"],
                "color": "#aa88ff"
            },
            {
                "title": "Stock Return Prediction",
                "description": "Compared Lasso, XGBoost, and MLP across 90+ firm-level and macro features (1957–2021). XGBoost top-100 portfolio achieved Sharpe of 0.28 and avg monthly return of 3.13%.",
                "tech": ["XGBoost", "Lasso", "MLP", "Python", "Pandas"],
                "color": "#4dffa8"
            },
            {
                "title": "SmileStudio – 3D Clinical Visualization",
                "description": "Interactive 3D interface integrating AI anatomical segmentation with clinical reference overlays for dental planning. Controlled user study with dental students and clinicians measuring accuracy and cognitive load vs 2D methods.",
                "tech": ["Three.js", "React", "Node.js", "Computer Vision"],
                "color": "#ffb454"
            },
            {
                "title": "IEEE Publication – Position Mapping",
                "description": "Position Mapping via Content-Based Image Retrieval and Annoy — published IEEE Xplore, December 2023. Applied approximate nearest-neighbor search to image-based positioning systems.",
                "tech": ["Python", "CBIR", "Annoy", "Image Retrieval"],
                "color": "#5ef0ff"
            }
        ],
        "skills": {
            "Languages": ["Python", "SQL", "C++", "Java"],
            "ML & Analytics": ["PyTorch", "TensorFlow", "XGBoost", "Scikit-learn", "SHAP", "Optuna", "PySpark", "NumPy", "Pandas"],
            "Quant & Finance": ["TD3", "PPO", "Monte Carlo", "Stochastic Calculus", "Time-series Modeling", "A/B Testing", "Bloomberg API"],
            "Data & Infra": ["Power BI", "Tableau", "SQL/RDBMS", "MongoDB", "Hadoop", "Git", "SHIFT Platform"]
        },
        "publication": {
            "title": "Position Mapping via Content-Based Image Retrieval and Annoy",
            "venue": "IEEE Xplore",
            "date": "December 2023"
        }
    }

# ── WEBSOCKET ─────────────────────────────────────────────────────────────────

class ConnectionManager:
    def __init__(self):
        self.active: list[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws: WebSocket):
        if ws in self.active:
            self.active.remove(ws)

manager = ConnectionManager()

@app.websocket("/ws/market")
async def market_ws(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            snapshot = market.step()
            await websocket.send_text(json.dumps(snapshot))
            await asyncio.sleep(0.4)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)


# ── AI CHAT ───────────────────────────────────────────────────────────────────
import os
import httpx

RESUME_CONTEXT = """
You are Simrat Kaur Randhawa's portfolio AI assistant. Answer questions about Simrat concisely and professionally.

About Simrat:
- MS Computer Science + Financial Engineering Certificate, Stevens Institute of Technology, Hoboken NJ (2024-2026), GPA 3.8
- BE Information and Communication Technology, Gujarat Technological University, India (2019-2023), GPA 3.55
- Based in Jersey City, NJ | Email: simratkr1.sr@gmail.com | GitHub: github.com/lmnvx

Experience:
- Student Researcher, CRAFT Lab, Stevens (Jan 2025-Present): Designing hierarchical RL trading system (TD3 + PPO) over live limit order book on SHIFT; evaluating on Sharpe ratio, cumulative return, max drawdown; contributing to SHIFT in Python and C++
- Organizer, Stevens High Frequency Trading Competition (Jan-March 2026): Developed historic market data simulation scenarios; onboarded teams onto SHIFT; contributed to competition web client
- Graduate Assistant, Data Analytics, Stevens (Oct 2024-Present): Built Power BI dashboards and SQL pipelines in Slate CRM tracking graduate enrollment health
- Data Scientist, Lendingkart (Aug 2023-Jul 2024): Built and deployed personal loan default prediction models in production (accuracy low 80s); designed multi-lender ML scoring pipeline; featured in Analytics India Magazine
- Data Science Intern, Lendingkart (Jan-Jul 2023): Built multilingual speech-to-text pipeline with sentiment analysis and anomaly detection on customer service data

Projects:
- Hierarchical RL Trading System: TD3+PPO over live LOB on SHIFT
- Financial NER: SEC filings entity extraction, Transformer-BiLSTM-CRF, F1 0.59
- Stock Return Prediction: XGBoost Sharpe 0.28, avg monthly return 3.13% (1957-2021)
- SmileStudio: Interactive 3D dental visualization with AI segmentation and controlled user study
- IEEE Publication: Position Mapping via Content-Based Image Retrieval and Annoy, Dec 2023

Skills: Python, SQL, C++, Java, PyTorch, TensorFlow, XGBoost, Scikit-learn, SHAP, Optuna, PySpark, Power BI, Tableau, MongoDB, Hadoop, Bloomberg API, SHIFT platform, TD3, PPO, Monte Carlo, stochastic calculus

Targeting: data science, ML engineering, quant research roles in fintech and algorithmic trading

Keep answers brief (2-4 sentences). Be direct and confident. Don't make up anything not listed above.
""".strip()

class ChatRequest(BaseModel if False else object):
    pass

from pydantic import BaseModel

class ChatRequest(BaseModel):
    message: str

@app.post("/api/chat")
async def chat(req: ChatRequest):
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        return {"reply": "AI chat is not configured. Set ANTHROPIC_API_KEY environment variable to enable it."}

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": "claude-haiku-4-5-20251001",
                    "max_tokens": 300,
                    "system": RESUME_CONTEXT,
                    "messages": [{"role": "user", "content": req.message}],
                }
            )
        data = resp.json()
        reply = data["content"][0]["text"]
        return {"reply": reply}
    except Exception as e:
        return {"reply": f"Something went wrong: {str(e)[:80]}"}


# ── OPTIONS PRICING ───────────────────────────────────────────────────────────
from scipy.stats import norm
from scipy.optimize import brentq

def bs_price(S, K, T, r, sigma, option_type="call"):
    """Black-Scholes closed-form price."""
    if T <= 0 or sigma <= 0:
        return max(S - K, 0) if option_type == "call" else max(K - S, 0)
    d1 = (math.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * math.sqrt(T))
    d2 = d1 - sigma * math.sqrt(T)
    if option_type == "call":
        return S * norm.cdf(d1) - K * math.exp(-r * T) * norm.cdf(d2)
    else:
        return K * math.exp(-r * T) * norm.cdf(-d2) - S * norm.cdf(-d1)

def bs_greeks(S, K, T, r, sigma, option_type="call"):
    """Delta, Gamma, Vega, Theta, Rho."""
    if T <= 0 or sigma <= 0:
        return {"delta": 0, "gamma": 0, "vega": 0, "theta": 0, "rho": 0}
    d1 = (math.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * math.sqrt(T))
    d2 = d1 - sigma * math.sqrt(T)
    pdf_d1 = norm.pdf(d1)
    gamma = pdf_d1 / (S * sigma * math.sqrt(T))
    vega  = S * pdf_d1 * math.sqrt(T) / 100  # per 1% vol move
    if option_type == "call":
        delta = norm.cdf(d1)
        theta = (-(S * pdf_d1 * sigma) / (2 * math.sqrt(T))
                 - r * K * math.exp(-r * T) * norm.cdf(d2)) / 365
        rho   = K * T * math.exp(-r * T) * norm.cdf(d2) / 100
    else:
        delta = norm.cdf(d1) - 1
        theta = (-(S * pdf_d1 * sigma) / (2 * math.sqrt(T))
                 + r * K * math.exp(-r * T) * norm.cdf(-d2)) / 365
        rho   = -K * T * math.exp(-r * T) * norm.cdf(-d2) / 100
    return {
        "delta": round(delta, 4), "gamma": round(gamma, 6),
        "vega":  round(vega,  4), "theta": round(theta, 4),
        "rho":   round(rho,   4),
    }

def implied_vol(market_price, S, K, T, r, option_type="call"):
    """Brent's method IV solver."""
    if T <= 0 or market_price <= 0:
        return None
    intrinsic = max(S - K, 0) if option_type == "call" else max(K - S, 0)
    if market_price <= intrinsic:
        return None
    try:
        iv = brentq(
            lambda s: bs_price(S, K, T, r, s, option_type) - market_price,
            1e-6, 5.0, xtol=1e-6, maxiter=200
        )
        return round(iv, 6)
    except Exception:
        return None

def heston_price(S, K, T, r, v0, kappa, theta, sigma_v, rho, option_type="call"):
    """
    Simplified Heston model via numerical integration (characteristic function).
    Uses the Carr-Madan / standard Heston formula with 64-point Gauss-Laguerre.
    """
    if T <= 0:
        return max(S - K, 0) if option_type == "call" else max(K - S, 0)

    def char_fn(phi, j):
        """Heston characteristic function for P1 (j=1) and P2 (j=2)."""
        if j == 1:
            u, b = 0.5, kappa - rho * sigma_v
        else:
            u, b = -0.5, kappa
        a = kappa * theta
        x = math.log(S / K)
        d = cmath_sqrt((rho * sigma_v * 1j * phi - b)**2
                       - sigma_v**2 * (2 * u * 1j * phi - phi**2))
        g = (b - rho * sigma_v * 1j * phi + d) / (b - rho * sigma_v * 1j * phi - d)
        C = (r * 1j * phi * T
             + a / sigma_v**2 * ((b - rho * sigma_v * 1j * phi + d) * T
                                  - 2 * math.log((1 - g * cmath_exp(d * T)) / (1 - g))))
        D = ((b - rho * sigma_v * 1j * phi + d) / sigma_v**2
             * (1 - cmath_exp(d * T)) / (1 - g * cmath_exp(d * T)))
        return cmath_exp(C + D * v0 + 1j * phi * x)

    import cmath
    cmath_sqrt = cmath.sqrt
    cmath_exp  = cmath.exp

    # 64-point numerical integration
    n_pts = 64
    dphi  = 0.1
    P = [0.0, 0.0]
    for j_idx, j in enumerate([1, 2]):
        integral = 0.0
        for n in range(1, n_pts + 1):
            phi = (n - 0.5) * dphi
            cf  = char_fn(phi, j)
            integrand = (cmath_exp(-1j * phi * math.log(K)) * cf / (1j * phi)).real
            integral += integrand * dphi
        P[j_idx] = 0.5 + integral / math.pi

    call = S * P[0] - K * math.exp(-r * T) * P[1]
    call = max(call, max(S - K * math.exp(-r * T), 0))
    if option_type == "call":
        return round(call, 4)
    else:
        put = call - S + K * math.exp(-r * T)
        return round(max(put, 0), 4)

def build_iv_surface(S, r, strikes_pct, expiries):
    """
    Build an IV surface: for each (K, T) compute BS IV assuming
    a vol smile parameterised as: σ(K,T) = σ_atm + skew*(K/S-1) + convexity*(K/S-1)²
    σ_atm decays slightly with T (term structure).
    Returns list of {strike, expiry, iv, price} dicts.
    """
    surface = []
    for T in expiries:
        sigma_atm = 0.18 + 0.04 * math.exp(-2 * T)   # ATM vol with term structure
        skew      = -0.15 * math.exp(-T)               # negative skew
        convexity = 0.12
        for kp in strikes_pct:
            K = S * kp
            moneyness = kp - 1.0
            sigma = sigma_atm + skew * moneyness + convexity * moneyness**2
            sigma = max(sigma, 0.02)
            price = bs_price(S, K, T, r, sigma, "call")
            surface.append({
                "strike": round(K, 2),
                "strikePct": round(kp * 100, 1),
                "expiry": round(T, 4),
                "expiryDays": round(T * 365),
                "iv": round(sigma * 100, 2),
                "price": round(price, 4),
            })
    return surface


class OptionRequest(BaseModel):
    S: float = 185.0
    K: float = 185.0
    T: float = 0.25
    r: float = 0.05
    sigma: float = 0.20
    option_type: str = "call"
    model: str = "bs"
    # Heston params (optional)
    v0: float = 0.04
    kappa: float = 2.0
    theta: float = 0.04
    sigma_v: float = 0.30
    rho: float = -0.70


@app.post("/api/price-option")
def price_option(req: OptionRequest):
    S, K, T, r = req.S, req.K, req.T, req.r
    ot = req.option_type.lower()
    if req.model == "heston":
        price = heston_price(S, K, T, r, req.v0, req.kappa,
                             req.theta, req.sigma_v, req.rho, ot)
        sigma_used = req.sigma_v  # display only
    else:
        price = bs_price(S, K, T, r, req.sigma, ot)
        sigma_used = req.sigma

    greeks = bs_greeks(S, K, T, r, req.sigma, ot)
    iv     = implied_vol(price, S, K, T, r, ot)

    return {
        "price":  price,
        "model":  req.model,
        "greeks": greeks,
        "iv":     iv,
        "inputs": {"S": S, "K": K, "T": T, "r": r, "sigma": sigma_used},
    }


@app.get("/api/iv-surface")
def iv_surface(S: float = 185.0, r: float = 0.05):
    strikes_pct = [0.80, 0.85, 0.875, 0.90, 0.925, 0.95, 0.975,
                   1.00, 1.025, 1.05, 1.075, 1.10, 1.125, 1.15, 1.20]
    expiries    = [7/365, 14/365, 30/365, 60/365, 90/365,
                   120/365, 180/365, 270/365, 365/365]
    surface = build_iv_surface(S, r, strikes_pct, expiries)
    return {"surface": surface, "S": S, "r": r}
