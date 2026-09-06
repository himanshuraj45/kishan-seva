# 🧠 KisanSeva ML Service (Python FastAPI)

This is the lightweight Machine Learning orchestrator for **KisanSeva**. It acts as a fallback and processing layer for advanced data analysis when the Next.js edge functions require heavy lifting.

## 🚀 Tech Stack
- **Framework:** FastAPI + Uvicorn
- **Data Processing:** NumPy, Scikit-learn
- **Image Processing:** Pillow (PIL)
- **Validation:** Pydantic
- **Async HTTP:** HTTPX, aiohttp

## 📦 Key Endpoints
- GET /health : Service health check.
- POST /v1/diagnose : Crop disease diagnosis ML fallback.
- POST /v1/agent/orchestrate : Multi-agent RAG fallback logic.

## 🛠️ Local Development

1. Ensure you have Python 3.9+ installed.
2. Create and activate a virtual environment:
   `ash
   cd apps/ml-service
   python -m venv .venv
   
   # Windows
   .\.venv\Scripts\activate
   # macOS/Linux
   source .venv/bin/activate
   `
3. Install dependencies (Lite version for free-tier deployment):
   `ash
   pip install -r requirements.txt
   `
4. Run the development server:
   `ash
   uvicorn app:app --reload --port 8000
   `
5. The API will be available at [http://localhost:8000](http://localhost:8000). You can view the interactive API docs at [http://localhost:8000/docs](http://localhost:8000/docs).

## 🚀 Deployment
This service is designed to be lightweight enough to run on **Render's Free Web Service Tier** (or Hugging Face Spaces).
Heavy libraries like PyTorch and OpenCV have been omitted from equirements.txt to keep the memory footprint under 512MB.

Live Deployment: [https://kisanseva-api.onrender.com](https://kisanseva-api.onrender.com)
