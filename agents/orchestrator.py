from fastapi import UploadFile, HTTPException
from .urban_miner import process_waste
from .market_agent import MarketAgent
import os
import shutil
import uuid

# Initialize Market Agent
market_agent = MarketAgent()

# --- HELPER: Save Uploads Locally ---


def save_temp_file(upload_file: UploadFile) -> str:
    """Saves uploaded file to disk so local AI models can read it"""
    try:
        if not upload_file:
            return None

        # Create temp directory if not exists
        os.makedirs("temp_uploads", exist_ok=True)

        # Generate safe filename
        ext = upload_file.filename.split(".")[-1]
        filename = f"{uuid.uuid4()}.{ext}"
        path = os.path.join("temp_uploads", filename)

        # Write to disk
        with open(path, "wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)

        return path
    except Exception as e:
        print(f"Error saving file: {e}")
        return None

# --- ORCHESTRATOR LOGIC ---


async def process_waste_request(image: UploadFile, audio: UploadFile):
    """
    Orchestrator: Now a simple pass-through.
    It delegates 100% of the logic to the Urban Miner (Version 4.0).
    """
    # 1. Save files temporarily
    image_path = save_temp_file(image)
    audio_path = save_temp_file(audio) if audio else None

    # Debug Log
    if audio_path:
        print(f"🔗 Orchestrator: passing audio path '{audio_path}' to Miner")

    try:
        if not image_path:
            raise HTTPException(status_code=400, detail="Image is required")

        print(f" Orchestrator: Processing {image.filename} via Urban Miner...")

        # 2. CALL URBAN MINER (FIXED)
        # We use KEYWORD ARGUMENTS to ensure audio_path goes to the right place
        # skipping user_lat/user_lon defaults
        miner_result = await process_waste(
            image_path=image_path,
            audio_path=audio_path
        )

        return {
            "status": "success",
            **miner_result
        }

    except Exception as e:
        print(f" Orchestrator Failed: {e}")
        return {
            "status": "error",
            "message": str(e),
            "items": [],
            "best_factory_match": None
        }

    finally:
        # 4. Cleanup
        if image_path and os.path.exists(image_path):
            os.remove(image_path)
        if audio_path and os.path.exists(audio_path):
            os.remove(audio_path)


async def process_manifest_upload(pdf: UploadFile):
    """
    Handles PDF Manifest processing via Market Agent.
    """
    pdf_path = save_temp_file(pdf)
    try:
        print(
            f"📄 Orchestrator: Routing Manifest {pdf.filename} to Market Agent...")
        extracted_orders = await market_agent.process_manifest(pdf_path)
        return {"status": "success", "orders": extracted_orders}
    except Exception as e:
        print(f"❌ Manifest Orchestration Error: {e}")
        return {"status": "error", "message": str(e)}
    finally:
        if pdf_path and os.path.exists(pdf_path):
            os.remove(pdf_path)
