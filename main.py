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
import time

app = FastAPI(title="ReLoop: Industrial Symbiosis Engine")

# --- 1. NUCLEAR CORS FIX (Permits All Local Traffic) ---
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex='https?://.*',
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount("/temp_uploads", StaticFiles(directory="temp_uploads"),
          name="temp_uploads")


class FeedbackRequest(BaseModel):
    image_path: str
    predicted_label: str
    correct_label: str


@app.get("/")
async def root(): return FileResponse("static/index.html")


@app.post("/analyze-image")
async def analyze(image: UploadFile = File(...), audio: UploadFile = File(None)):
    # --- DEBUG LOGGING ---
    if audio:
        print(
            f"📥 API: Received Audio File: {audio.filename} ({audio.content_type})")
    else:
        print("⚠️ API: No Audio File Received in request body.")

    return await process_waste_request(image, audio)


@app.post("/feedback")
async def feedback(data: FeedbackRequest):
    local_path = data.image_path.lstrip("/")
    result_id = await register_user_correction(local_path, data.correct_label, data.predicted_label)
    return {"status": "success", "id": result_id}


# ... (Rest of main.py - get_live_activity, upload_manifest, etc.) ...
@app.post("/upload-manifest")
async def upload_manifest(pdf: UploadFile = File(...)):
    from agents.orchestrator import process_manifest_upload
    return await process_manifest_upload(pdf)


@app.get("/live-activity")
async def get_live_activity():
    # Center: Mumbai (Fort / CST region)
    center_lat, center_lon = 19.0760, 72.8777
    dummy_pings = []
    materials = ["Plastic", "Glass", "Metal", "Bio-Medical", "MLP"]

    for i in range(12):
        lat = center_lat + random.uniform(-0.04, 0.04)
        lon = center_lon + random.uniform(-0.04, 0.04)
        mat = random.choice(materials)
        dummy_pings.append({
            "id": f"ping_{i}", "lat": lat, "lon": lon, "type": "supply", "material": mat
        })

    factories = [
        {"id": "f1", "lat": 19.088, "lon": 72.885,
            "name": "GreenCycle", "material": "Plastic"},
        {"id": "f2", "lat": 19.062, "lon": 72.848,
            "name": "Alum-X", "material": "Metal"},
        {"id": "f3", "lat": 19.102, "lon": 72.901,
            "name": "PolyFuel", "material": "MLP"},
    ]

    return {
        "pings": dummy_pings,
        "factories": factories,
        "stats": {"active_users": 142, "kg_collected": 850}
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
