from fastapi import FastAPI, UploadFile, File, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from agents.orchestrator import process_waste_request
from agents.urban_miner import register_user_correction
from pydantic import BaseModel
import uvicorn
import os
import random
import logging

# --- Logging Setup ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="ReLoop: Industrial Symbiosis Engine",
    version="2.0.0",
    description="AI-powered waste classification and industrial material matching engine."
)

# --- CORS Configuration (Environment-Driven) ---
raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:8000")
allowed_origins = [o.strip() for o in raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Static File Serving (Safe Mounts) ---
# Serve built React frontend
if os.path.isdir("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")

# Serve temp annotated image crops (created at runtime)
os.makedirs("temp_uploads/crops", exist_ok=True)
app.mount("/temp_uploads", StaticFiles(directory="temp_uploads"), name="temp_uploads")


# --- Request Models ---
class FeedbackRequest(BaseModel):
    image_path: str
    predicted_label: str
    correct_label: str


# ============================================================
# ROUTES
# ============================================================

@app.get("/health", tags=["Infrastructure"])
async def health_check():
    """
    AWS ALB / ECS health check endpoint.
    Returns 200 OK when the service is running.
    """
    return {"status": "healthy", "service": "reloop-api", "version": "2.0.0"}


@app.get("/", tags=["Frontend"])
async def root():
    """Serves the built React frontend index page."""
    index_path = "static/index.html"
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return JSONResponse(
        status_code=200,
        content={"message": "ReLoop API is running. Build the frontend to see the UI."}
    )


@app.post("/analyze-image", tags=["AI Engine"])
async def analyze(image: UploadFile = File(...), audio: UploadFile = File(None)):
    """
    Core endpoint: Receives waste image + optional voice audio.
    Returns AI classification, contamination score, factory match, and S3 URLs.
    """
    if audio:
        logger.info(f"📥 API: Received Audio: {audio.filename} ({audio.content_type})")
    else:
        logger.info("⚠️ API: No Audio received.")

    return await process_waste_request(image, audio)


@app.post("/feedback", tags=["AI Engine"])
async def feedback(data: FeedbackRequest):
    """
    Human-in-the-loop: Records a user correction to the Memory Agent (Qdrant).
    """
    local_path = data.image_path.lstrip("/")
    result_id = await register_user_correction(
        local_path, data.correct_label, data.predicted_label
    )
    return {"status": "success", "id": result_id}


@app.post("/upload-manifest", tags=["B2B Market"])
async def upload_manifest(pdf: UploadFile = File(...)):
    """
    Ingests a factory procurement PDF.
    Vectorizes it and pushes demand data into Qdrant.
    """
    from agents.orchestrator import process_manifest_upload
    return await process_manifest_upload(pdf)


@app.get("/live-activity", tags=["Dashboard"])
async def get_live_activity():
    """
    Returns live waste-ping data for the city map dashboard.
    (Seeded with Mumbai coordinates for demo.)
    """
    center_lat, center_lon = 19.0760, 72.8777
    materials = ["Plastic", "Glass", "Metal", "Bio-Medical", "MLP"]

    dummy_pings = [
        {
            "id": f"ping_{i}",
            "lat": center_lat + random.uniform(-0.04, 0.04),
            "lon": center_lon + random.uniform(-0.04, 0.04),
            "type": "supply",
            "material": random.choice(materials),
        }
        for i in range(12)
    ]

    factories = [
        {"id": "f1", "lat": 19.088, "lon": 72.885, "name": "GreenCycle", "material": "Plastic"},
        {"id": "f2", "lat": 19.062, "lon": 72.848, "name": "Alum-X", "material": "Metal"},
        {"id": "f3", "lat": 19.102, "lon": 72.901, "name": "PolyFuel", "material": "MLP"},
    ]

    return {
        "pings": dummy_pings,
        "factories": factories,
        "stats": {"active_users": 142, "kg_collected": 850},
    }


if __name__ == "__main__":
    port = int(os.getenv("APP_PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
