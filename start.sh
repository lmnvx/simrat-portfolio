#!/bin/bash
# Run both backend and frontend simultaneously

echo "Starting Simrat Portfolio..."
echo ""

# Backend
echo "→ Starting FastAPI backend on :8000"
cd backend
python -m venv venv 2>/dev/null || true
source venv/bin/activate
pip install -r requirements.txt -q
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

sleep 2

# Frontend
echo "→ Starting React frontend on :3000"
cd frontend
npm install --silent
npm start &
FRONTEND_PID=$!
cd ..

echo ""
echo "✓ Backend:  http://localhost:8000"
echo "✓ Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait
