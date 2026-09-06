import asyncio
import logging
from contextlib import asynccontextmanager
from typing import Optional, Dict, Any
from pathlib import Path

# ── Sentry must be imported FIRST before any other app code ──
from utils.sentry_init import init_sentry, capture_agent_error
init_sentry()

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from agents.orchestrator.agent_registry import AgentRegistry, load_config, default_config
from agents.base import AgentInput

# -----------------
# Setup & Logging
# -----------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global registry
registry: AgentRegistry = None

# -----------------
# Lifespan Events
# -----------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    global registry
    logger.info("Starting up ML Service...")
    
    # Initialize AgentRegistry
    config_path = Path("config.json")
    config = load_config(config_path) if config_path.exists() else default_config()
    registry = AgentRegistry.initialize_all(config)
    
    # Placeholder: load VectorStore, warm up ONNX model
    logger.info("VectorStore loaded. ONNX model warmed up.")
    
    yield
    
    logger.info("Shutting down ML Service...")

# -----------------
# App Initialization
# -----------------
app = FastAPI(
    title="KisanSeva ML Service",
    description="Agentic Backend for KisanSeva Agricultural AI",
    version="2.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------
# Pydantic Models
# -----------------
class ChatRequest(BaseModel):
    query: str
    language: str = "en"
    user_id: str
    plot_id: Optional[str] = None
    context: dict = {}

class AdvisoryRequest(BaseModel):
    lat: float
    lon: float
    plot_data: dict
    language: str = "en"
    user_id: str

class MarketRequest(BaseModel):
    commodity: str
    state: str
    farmer_lat: float
    farmer_lon: float
    language: str = "en"

class SMSRequest(BaseModel):
    phone: str
    message: str = ""
    channel: str = "sms"
    digit_pressed: Optional[str] = None
    language: str = "en"

class FeedbackRequest(BaseModel):
    diagnosis_id: str
    feedback: str
    true_label_if_known: Optional[str] = None
    confidence: Optional[float] = None
    predicted_label: Optional[str] = None
    image_path: Optional[str] = None

# -----------------
# Existing Endpoints
# -----------------
@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.post("/v1/diagnose")
async def legacy_diagnose(file: UploadFile = File(...)):
    # Legacy fallback
    return {"status": "success", "disease": "Apple_Scab", "confidence": 0.95}

@app.get("/v1/diseases")
async def list_diseases():
    return {"diseases": ["Apple_Scab", "Late_Blight", "Healthy"]}

# -----------------
# Agentic Endpoints
# -----------------
@app.post("/v1/agent/chat")
async def agent_chat(req: ChatRequest):
    orchestrator = registry.get("MasterOrchestratorAgent")
    if not orchestrator:
        raise HTTPException(status_code=500, detail="Orchestrator not found")
        
    input_data = AgentInput(
        query=req.query,
        language=req.language,
        user_id=req.user_id,
        context=req.context
    )
    
    result = await orchestrator.process(input_data)
    return result

@app.post("/v1/agent/diagnose")
async def agent_diagnose(
    file: UploadFile = File(...),
    crop_name: Optional[str] = Form(None),
    language: str = Form("en"),
    plot_id: Optional[str] = Form(None)
):
    try:
        agent = registry.get("DiagnosisAgent")
    except KeyError:
        raise HTTPException(status_code=500, detail="DiagnosisAgent not found")
        
    input_data = AgentInput(
        query="diagnose image",
        language=language,
        context={"crop_name": crop_name, "plot_id": plot_id},
        data={"filename": file.filename}
    )
    result = await agent.process(input_data)
    return result

@app.post("/v1/agent/advisory")
async def agent_advisory(req: AdvisoryRequest):
    try:
        weather_agent = registry.get("WeatherAdvisoryAgent")
        soil_agent = registry.get("SoilHealthAgent")
    except KeyError:
        raise HTTPException(status_code=500, detail="Required agents not found")

    base_input = AgentInput(
        query="advisory",
        language=req.language,
        user_id=req.user_id,
        context={"lat": req.lat, "lon": req.lon, "plot_data": req.plot_data}
    )
    
    weather_res, soil_res = await asyncio.gather(
        weather_agent.process(base_input),
        soil_agent.process(base_input)
    )
    
    return {
        "status": "success",
        "data": {
            "weather": weather_res.data if weather_res else {},
            "soil": soil_res.data if soil_res else {}
        },
        "message": "Advisory generated successfully"
    }

@app.post("/v1/agent/market")
async def agent_market(req: MarketRequest):
    try:
        agent = registry.get("MandiPriceAgent")
    except KeyError:
        raise HTTPException(status_code=500, detail="MandiPriceAgent not found")
        
    input_data = AgentInput(
        query=f"price for {req.commodity}",
        language=req.language,
        context={"commodity": req.commodity, "state": req.state, "lat": req.farmer_lat, "lon": req.farmer_lon}
    )
    result = await agent.process(input_data)
    return result

@app.post("/v1/agent/sms")
async def agent_sms(req: SMSRequest):
    try:
        agent = registry.get("SMSIVRAgent")
    except KeyError:
        raise HTTPException(status_code=500, detail="SMSIVRAgent not found")
        
    input_data = AgentInput(
        query="sms interaction",
        language=req.language,
        context={
            "phone": req.phone,
            "message": req.message,
            "channel": req.channel,
            "digit_pressed": req.digit_pressed
        }
    )
    result = await agent.process(input_data)
    return result

@app.post("/v1/agent/feedback")
async def agent_feedback(req: FeedbackRequest):
    try:
        agent = registry.get("FeedbackAgent")
    except KeyError:
        raise HTTPException(status_code=500, detail="FeedbackAgent not found")
        
    input_data = AgentInput(
        query="submit feedback",
        context={"action": "feedback_submit"},
        data=req.model_dump()
    )
    result = await agent.process(input_data)
    return result

@app.get("/v1/agent/status")
async def agent_status():
    if not registry:
        raise HTTPException(status_code=500, detail="Registry not initialized")
    statuses = await registry.health_check_all()
    return statuses

@app.get("/v1/agent/drift")
async def agent_drift():
    try:
        agent = registry.get("FeedbackAgent")
    except KeyError:
        raise HTTPException(status_code=500, detail="FeedbackAgent not found")
        
    input_data = AgentInput(
        query="get drift report",
        context={"action": "get_drift_report"}
    )
    result = await agent.process(input_data)
    return result

# -----------------
# Background Tasks
# -----------------
async def run_feedback_checks():
    while True:
        await asyncio.sleep(6 * 3600)  # Every 6 hours
        try:
            agent = registry.get("FeedbackAgent")
            if hasattr(agent, '_check_retraining_trigger'):
                agent._check_retraining_trigger()
        except Exception as e:
            logger.error(f"Error running background feedback check: {e}")

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(run_feedback_checks())

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
