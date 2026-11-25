# FoundIT - AI Lost & Found Platform

Structure:
  client/       React (Vite) + Leaflet
  server/       Node + Express + MongoDB
  ml-service/   Python FastAPI (image tags + TF-IDF matching)

## 1. ML service (Terminal 1)
cd ml-service
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

## 2. Server (Terminal 2)
cd server
npm install
copy .env.example to .env and fill values   # Windows: copy .env.example .env
npm run dev

## 3. Client (Terminal 3)
cd client
npm install
npm run dev
Open http://localhost:5173

Notes:
- AWS keys khali chhodo to images local server/uploads me save hongi.
- MongoDB: local ya Atlas connection string MONGO_URI me daalo.
- Pehli baar ML service model download karegi (~350MB).
"# Project-Expo" 
"# Project-Expo" 
"# Project-Expo" 
"# Project-Expo" 
"# Project-Expo" 
"# Project-Expo" 
"# Project-Expo1" 
