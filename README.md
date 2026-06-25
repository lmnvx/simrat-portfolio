# Simrat Kaur Randhawa — Portfolio

**Live site:** [simrat-portfolio.vercel.app](https://simrat-portfolio.vercel.app)

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React · D3.js · Three.js · GSAP · Lenis |
| Backend | FastAPI · WebSocket · NumPy · SciPy |
| Visualizations | D3 (price/depth/PnL charts) · Three.js (3D agent, skills graph, globe) |
| Quant | Black-Scholes · Heston model · GBM market sim · TD3-style RL agent |

## Architecture

The frontend has two data modes that switch automatically:

**Mode 1 — FastAPI WebSocket (local dev)**
When the backend is running locally, the frontend connects via WebSocket and receives real-time market snapshots from a Python GBM + regime-switching simulator. Options pricing (Black-Scholes + Heston) runs via scipy on the backend.

**Mode 2 — JS Simulator fallback (Vercel deploy)**
If the WebSocket doesn't connect within 3 seconds (i.e. no backend running), the frontend silently switches to an identical JavaScript market simulator. The dashboard looks and behaves exactly the same. The feed source badge in the dashboard header shows `FASTAPI WS` or `JS SIM` accordingly.

This means the public site works with zero backend infrastructure — no sleeping servers, no cold starts.

## Running locally

**Backend:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm start
```

## Deploying to Vercel (free)

1. Push to GitHub (backend/venv and frontend/node_modules are gitignored)
2. Go to vercel.com → New Project → import your repo
3. Set **root directory** to `frontend`
4. Add environment variable:
   ```
   REACT_APP_API_URL = https://your-backend-url.com
   ```
   (optional — only needed for AI chat and Heston pricing. Site works fully without it.)
5. Deploy — done.

The market dashboard, regime detection, 3D visualizations, options pricer (Black-Scholes), skills graph, career globe, and CV section all work with no backend.

## Optional: deploy backend to Render (free)

If you want the AI chat and Heston model live:
1. Go to render.com → New Web Service → connect your repo
2. Set root directory to `backend`
3. Start command: `python -m uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add env var: `ANTHROPIC_API_KEY=sk-ant-...`
5. Copy the Render URL → add to Vercel as `REACT_APP_API_URL`

Note: Render free tier spins down after 15min inactivity (~30s cold start).
