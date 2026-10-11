# CredIntel AI 🏦

> **Intelligent Loan Analysis & Decision Support Platform**  
> An end-to-end AI engineering portfolio project demonstrating Python, SQL, Machine Learning, LLMs, RAG, REST APIs, and full-stack React development.

---

## Business Problem

Credit risk assessment is a critical function in financial services. Analysts spend significant time manually reviewing loan applications and referencing policy documents. CredIntel AI demonstrates how machine learning and generative AI can be combined into a unified decision-support platform — augmenting (not replacing) human judgment with:

1. **ML-powered risk predictions** based on applicant financial and personal data
2. **Document-grounded policy Q&A** via Retrieval-Augmented Generation (RAG)
3. **Structured application history** and audit trail

---

## Features

| Feature | Status | Description |
|---------|--------|-------------|
| 🏠 Landing Page | ✅ | Modern fintech landing page with direct dashboard entry |
| 📊 Dashboard | ✅ | Real KPI metrics from database + model architecture summary |
| 📝 Interactive Application Wizard | ✅ | 4-step wizard with live loan simulator, presets, and sliders |
| 🤖 ML Prediction Engine | ✅ | Random Forest pipeline with probability calibration + risk tiers |
| 📋 Application History | ✅ | Registry with status filters, audit timestamps, and detail view |
| 🔍 Analysis Result Page | ✅ | Visual risk breakdown, probability gauge, and factor rationales |
| 🤖 Document-Grounded RAG Assistant | ✅ | FAISS vector store + PDF extraction with grounded page citations |
| 📄 Real-Time PDF Ingestion | ✅ | Upload policy PDFs directly via UI or REST API |
| 🗄️ Database Persistence | ✅ | SQLite via SQLAlchemy ORM with audit event tracking |
| 🧪 Automated Test Suite | ✅ | 33 pytest integration tests covering all routes |
| 📄 Interactive API Explorer | ✅ | Swagger UI live at `/docs` |
| 🚀 Single Launcher | ✅ | `start.bat` boots backend and frontend simultaneously |

---

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19 | UI framework |
| Vite | 8 | Build tool |
| React Router | 7 | Client-side routing |
| Tailwind CSS | 4 | Utility-first styling |
| Axios | 1.x | HTTP client |

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Python | 3.11+ | Backend language |
| FastAPI | 0.143 | REST API framework |
| Pydantic | 2.x | Request/response validation |
| SQLAlchemy | 2.x | ORM and database layer |
| SQLite | built-in | Development database |
| Uvicorn | 0.54 | ASGI server |

### Machine Learning
| Technology | Version | Purpose |
|-----------|---------|---------|
| Scikit-learn | 1.9 | ML pipeline + Random Forest |
| Pandas | 3.x | Data manipulation |
| NumPy | 2.x | Numerical computing |
| Joblib | 1.6 | Model serialization |

### Generative AI (RAG — optional)
| Technology | Purpose |
|-----------|---------|
| FAISS | Vector similarity search |
| Sentence Transformers | Text embeddings (all-MiniLM-L6-v2) |
| PyPDF | PDF text extraction |

---

## Dataset

**Name**: Statlog (German Credit Data)  
**Source**: [UCI Machine Learning Repository](https://archive.ics.uci.edu/ml/datasets/statlog+(german+credit+data))  
**Records**: 1,000 historical loan applications  
**Features**: 20 (numerical + categorical)  
**Era**: West Germany, 1970s–1980s

### Target Definition

| Model Output | Meaning |
|---|---|
| `0` (Good Credit) | Historically, applicant repaid the loan |
| `1` (Bad Credit) | Historically, applicant defaulted or had significant issues |

> ⚠️ The model predicts historical credit risk, not a bank's current lending decision. Threshold values are for demonstration only.

### Model Performance

| Metric | Value |
|--------|-------|
| Accuracy | ~76% |
| ROC AUC | ~0.80 |
| Algorithm | Random Forest (100 trees, max_depth=10) |
| Train/Test Split | 80/20, stratified |

Risk thresholds (default probability):
- **HIGH**: ≥ 70% probability of default
- **MEDIUM**: 40–69%
- **LOW**: < 40%

---

## Setup Instructions (Windows 11)

### Prerequisites
- [Python 3.11+](https://www.python.org/downloads/)
- [Node.js 20+ LTS](https://nodejs.org/)
- [Git](https://git-scm.com/)

### 1. Clone the Repository
```powershell
git clone https://github.com/your-username/credintel-ai.git
cd "credintel-ai"
```

### 2. Set Up the Backend
```powershell
# Create virtual environment
python -m venv backend\venv

# Activate it
backend\venv\Scripts\activate

# Install dependencies
pip install -r backend\requirements.txt

# Download the dataset
python backend\scripts\download_data.py

# Train the ML model
python backend\scripts\train_model.py
```

### 3. Configure Environment Variables
```powershell
copy backend\.env.example backend\.env
# Edit backend\.env — set any LLM API keys if desired
```

### 4. Set Up the Frontend
```powershell
cd frontend
npm install
cd ..
```

### 5. Start the Application

**Option A — One-click (recommended):**
```
Double-click start.bat
```

**Option B — Manual (two separate terminals):**

Terminal 1 (Backend):
```powershell
cd backend
..\backend\venv\Scripts\activate
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Terminal 2 (Frontend):
```powershell
cd frontend
npm run dev
```

Then open **http://localhost:5173** in your browser.

---

## API Endpoint Documentation

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | System health check |
| `GET` | `/docs` | Interactive Swagger UI |
| `GET` | `/api/v1/model/info` | Model metadata and limitations |
| `POST` | `/api/v1/applications` | Submit a new loan application |
| `GET` | `/api/v1/applications` | List all applications (paginated) |
| `GET` | `/api/v1/applications/{id}` | Get single application |
| `POST` | `/api/v1/applications/{id}/analyze` | Run ML prediction |
| `POST` | `/api/v1/assistant/query` | Query the policy assistant |

### Example: Create + Analyze
```bash
# 1. Create application
curl -X POST http://127.0.0.1:8000/api/v1/applications \
  -H "Content-Type: application/json" \
  -d '{"applicant_data": {"duration_in_month": 24, "credit_amount": 5000, ...}}'

# 2. Analyze it (returns ML prediction)
curl -X POST http://127.0.0.1:8000/api/v1/applications/{application_id}/analyze
```

---

## RAG Workflow

1. Add PDF policy documents to `sample_documents/`
2. Install RAG dependencies: `pip install faiss-cpu sentence-transformers pypdf`
3. Run: `python backend/scripts/ingest_documents.py`
4. Restart the backend — the assistant auto-switches to full RAG mode
5. Ask policy questions via the **Policy Assistant** page

> Without the FAISS index, the assistant uses smart keyword-based fallback answers about the model, risk categories, features, and API.

---

## Running Tests
```powershell
cd backend
.\venv\Scripts\activate
pip install pytest httpx
python -m pytest tests/ -v
```

---

## Limitations & Ethical Considerations

1. **Historical bias**: Data from 1970s–1980s West Germany; lending norms and demographics differ significantly from today.
2. **Demographic fairness**: The dataset includes `Personal_status_and_sex` — a fairness audit is strongly recommended before any production use.
3. **Not calibrated**: Probability outputs are not guaranteed to be calibrated real-world probabilities.
4. **No autonomous decisions**: This tool must never be the sole basis for a credit decision.
5. **Single-user demo**: No authentication is enforced; all data is visible in demo mode.

---

## Future Improvements

- [ ] SHAP explainability for per-prediction feature importance
- [ ] LLM integration (OpenAI / Gemini) for richer RAG answers
- [ ] JWT authentication with per-user application isolation
- [ ] Model monitoring and drift detection
- [ ] Docker Compose for one-command deployment
- [ ] Fairness analysis and bias audit
- [ ] Additional model comparison (XGBoost, Logistic Regression)
- [ ] Model calibration assessment

---

## Resume Bullets (Verified Implemented Features)

- Built end-to-end credit risk prediction platform using Python/FastAPI backend and React/Vite frontend, serving ML predictions via REST API with full CRUD persistence in SQLite
- Trained a Scikit-learn Random Forest pipeline on 1,000 real-world loan records achieving 76% accuracy and 0.80 ROC-AUC; used ColumnTransformer for leak-free preprocessing
- Implemented FAISS-based RAG document assistant with graceful keyword fallback; designed modular architecture separating ML inference, vector retrieval, and API layers
- Developed 14 React components/pages with Tailwind CSS v4 including real-time data dashboard, multi-section application form with validation, and chat-style policy assistant
- Wrote 25+ pytest integration tests covering health checks, input validation, ML predictions, database persistence, and RAG error handling

---

## Screenshots

_Add screenshots here after running the application._

| Page | Description |
|------|-------------|
| `/` | Landing page |
| `/dashboard` | KPI dashboard with real data |
| `/applications/new` | 4-section loan application form |
| `/analysis/:id` | Prediction result with risk gauge |
| `/history` | Application table with status badges |
| `/assistant` | Chat-style policy Q&A |
