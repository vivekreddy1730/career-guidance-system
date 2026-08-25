# 🎓 AI-Powered Student Career Guidance System

> Final Year Project — AI-Powered Decision-Support Platform for Students

---

## 🏗️ Architecture Overview

```
career-guidance-system/
├── backend/               # Flask REST API
│   ├── app.py             # App factory
│   ├── config.py          # Config classes
│   ├── extensions.py      # SQLAlchemy, JWT, Firebase
│   ├── models/            # SQLAlchemy ORM models
│   ├── routes/            # Blueprint route handlers (7 modules)
│   ├── services/          # Business logic layer
│   ├── ml/                # Machine Learning pipeline
│   ├── nlp/               # Resume parser
│   ├── migrations/        # SQL schema + seed
│   └── tests/             # pytest test suites
└── frontend/              # React (Vite) SPA
    └── src/
        ├── pages/         # 8 pages
        ├── components/    # Reusable UI
        ├── context/       # Auth context + PrivateRoute
        └── api/           # Axios client + endpoints
```

---

## ⚡ Quick Start (Local Development)

### 1. Backend Setup

```powershell
cd backend

# Create virtual environment
python -m venv venv
.\venv\Scripts\activate          # Windows
# source venv/bin/activate       # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env
# Edit .env with your DB credentials, API keys, etc.

# Run DB migrations
python migrations/run_migrations.py

# Train ML model (auto-runs on first prediction too)
python ml/train.py

# Start Flask dev server
python app.py
# → API available at http://localhost:5000
```

### 2. Frontend Setup

```powershell
cd frontend

# Copy env template
copy .env.example .env
# Edit .env with your Firebase config

# Install & run
npm install
npm run dev
# → App at http://localhost:5173
```

---

## 🔑 Environment Variables

### Backend (`backend/.env`)
| Variable | Description |
|---|---|
| `FLASK_ENV` | `development` or `production` |
| `SECRET_KEY` | Flask session secret |
| `JWT_SECRET_KEY` | JWT signing key |
| `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | MySQL credentials |
| `OPENAI_API_KEY` | OpenAI API key (for chatbot + roadmap) |
| `ADZUNA_APP_ID`, `ADZUNA_API_KEY` | Adzuna job listings |
| `JSEARCH_API_KEY` | JSearch (RapidAPI) job listings |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | Path to Firebase Admin SDK JSON |

### Frontend (`frontend/.env`)
| Variable | Description |
|---|---|
| `VITE_FIREBASE_*` | Firebase web app config |
| `VITE_API_BASE_URL` | Backend API URL (default: http://localhost:5000) |

---

## 🔐 Authentication Flow

1. User enters phone number → Firebase sends SMS OTP
2. User enters OTP → Firebase verifies → returns `idToken`
3. Frontend sends `idToken` to `POST /api/auth/verify-otp`
4. Backend verifies with Firebase Admin SDK → issues JWT
5. JWT stored in `localStorage` → attached to all API requests

**Dev Mode (no Firebase configured):** Use `id_token: "mock_+91XXXXXXXXXX"` to bypass Firebase verification.

---

## 🤖 ML Pipeline

| Model | Algorithm | Notes |
|---|---|---|
| Auto-selected | Random Forest | Default best |
| Fallback | Decision Tree | Fast training |
| Fallback | KNN | Good for small dataset |
| Optional | XGBoost | Install `xgboost` for this |

- Dataset: `backend/ml/dataset/career_data.csv` (50 synthetic rows for demo)
- Features: 40+ skills (proficiency 0–100), CGPA, assessment scores
- Output: Career label + confidence (top-3)
- Auto-retrains if `best_model.pkl` is missing

---

## 📋 API Endpoints

| Module | Method | Endpoint |
|---|---|---|
| Health | GET | `/api/health` |
| Auth | POST | `/api/auth/verify-otp` |
| Auth | GET | `/api/auth/me` |
| Profile | GET/PUT | `/api/profile` |
| Profile | POST | `/api/profile/resume` |
| Assessment | GET | `/api/assessment/questions` |
| Assessment | POST | `/api/assessment/start` |
| Assessment | POST | `/api/assessment/submit` |
| Assessment | GET | `/api/assessment/report` |
| Career | POST | `/api/career/predict` |
| Career | GET | `/api/career/gap` |
| Career | GET | `/api/career/recommend` |
| Roadmap | GET | `/api/roadmap` |
| Roadmap | POST | `/api/roadmap/generate` |
| Roadmap | PUT | `/api/roadmap/milestone/<id>/complete` |
| Jobs | GET | `/api/jobs` |
| Jobs | GET | `/api/jobs/trending` |
| Jobs | GET | `/api/jobs/salary` |
| Chat | POST | `/api/chat` |
| Chat | GET/DELETE | `/api/chat/history` |

---

## 🧪 Running Tests

```powershell
cd backend
.\venv\Scripts\activate

# ML pipeline tests
pytest tests/test_ml_pipeline.py -v

# API integration tests (uses SQLite in-memory)
pytest tests/test_api_endpoints.py -v

# All tests
pytest tests/ -v --tb=short
```

---

## 🚀 Deployment (Render)

1. Push to GitHub
2. Connect repo to [Render](https://render.com)
3. Use `backend/render.yaml` service definition
4. Set all env vars in Render dashboard
5. For frontend: Deploy `frontend/dist` to Vercel/Netlify/Render Static

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Bootstrap 5, Chart.js |
| Backend | Python Flask, Flask-JWT-Extended |
| Database | MySQL (PlanetScale for production) |
| Auth | Firebase Phone Auth (SMS OTP) |
| ML | scikit-learn, pandas, numpy |
| NLP | PyMuPDF, python-docx, spaCy |
| AI Chatbot | OpenAI GPT-4o-mini |
| Jobs API | Adzuna, JSearch (RapidAPI) |
| Storage | Firebase Storage (resumes) |
| Deployment | Render (backend) + Vercel (frontend) |
