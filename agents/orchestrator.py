from fastapi import UploadFile, HTTPException
from .urban_miner import process_waste
from .market_agent import MarketAgent
from utils.s3_uploader import upload_image_to_s3
from utils.sns_notifier import notify_hazardous_waste, notify_analysis_complete
import os
import shutil
import uuid
import logging

logger = logging.getLogger(__name__)

# Initialize Market Agent
market_agent = MarketAgent()


# --- HELPER: Save Uploads Locally ---

def save_temp_file(upload_file: UploadFile) -> str | None:
    """Saves an uploaded FastAPI file to disk so local AI models can read it."""
    try:
        if not upload_file:
            return None

        os.makedirs("temp_uploads", exist_ok=True)

        ext = upload_file.filename.split(".")[-1] if "." in upload_file.filename else "bin"
        filename = f"{uuid.uuid4()}.{ext}"
        path = os.path.join("temp_uploads", filename)

        with open(path, "wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)

        return path
    except Exception as e:
        logger.error(f"❌ Error saving temp file: {e}")
        return None


# --- ORCHESTRATOR ---

async def process_waste_request(image: UploadFile, audio: UploadFile):
    """
    Main Orchestrator Pipeline:
    1. Save uploaded files to disk temporarily.
    2. Upload raw image to S3.
    3. Run the Urban Miner AI pipeline.
    4. Upload annotated result image to S3.
    5. Publish SNS events (hazardous alert or scan complete).
    6. Cleanup local temp files.
    7. Return enriched result with S3 URLs.
    """
    image_path = save_temp_file(image)
    audio_path = save_temp_file(audio) if audio else None

    if audio_path:
        logger.info(f"🔗 Orchestrator: Audio path '{audio_path}' queued for Urban Miner.")

    # --- Upload raw input image to S3 ---
    raw_s3_url = upload_image_to_s3(image_path, prefix="raw-uploads") if image_path else None
    if raw_s3_url:
        logger.info(f"☁️ S3: Raw image uploaded → {raw_s3_url}")

    try:
        if not image_path:
            raise HTTPException(status_code=400, detail="Image is required.")

        logger.info(f"🔄 Orchestrator: Processing '{image.filename}' via Urban Miner...")

        # --- Run the full AI pipeline ---
        miner_result = await process_waste(
            image_path=image_path,
            audio_path=audio_path
        )

        # --- Upload annotated visual proof to S3 ---
        annotated_s3_url = None
        visual_proof_local = miner_result.get("visual_proof_url", "").lstrip("/")
        if visual_proof_local and os.path.exists(visual_proof_local):
            annotated_s3_url = upload_image_to_s3(visual_proof_local, prefix="annotated")
            if annotated_s3_url:
                logger.info(f"☁️ S3: Annotated image uploaded → {annotated_s3_url}")

        items = miner_result.get("items", [])
        total_items = miner_result.get("total_items", 0)
        batch_dna = miner_result.get("batch_dna", {})

        # --- SNS: Hazardous Waste Alerts ---
        for item in items:
            if item.get("is_hazardous") or item.get("material") == "Hazardous":
                logger.warning(f"🚨 Hazardous item detected: {item.get('product_name')}")
                notify_hazardous_waste(
                    item_name=item.get("product_name", "Unknown"),
                    material=item.get("material", "Hazardous"),
                    image_url=annotated_s3_url or raw_s3_url,
                )

        # --- SNS: Scan Complete Notification ---
        if total_items > 0:
            notify_analysis_complete(
                total_items=total_items,
                batch_dna=batch_dna,
                image_s3_url=annotated_s3_url or raw_s3_url,
            )

        return {
            "status": "success",
            "raw_image_s3_url": raw_s3_url,
            "annotated_image_s3_url": annotated_s3_url,
            **miner_result,
        }

    except Exception as e:
        logger.error(f"❌ Orchestrator Pipeline Failed: {e}")
        return {
            "status": "error",
            "message": str(e),
            "items": [],
            "best_factory_match": None,
            "raw_image_s3_url": raw_s3_url,
        }

    finally:
        # --- Cleanup local temp files ---
        if image_path and os.path.exists(image_path):
            os.remove(image_path)
        if audio_path and os.path.exists(audio_path):
            os.remove(audio_path)


async def process_manifest_upload(pdf: UploadFile):
    """
    Handles PDF Manifest ingestion:
    1. Saves PDF temporarily.
    2. Uploads PDF to S3.
    3. Routes to Market Agent for parsing and vectorization.
    4. Publishes SNS event for new market demand.
    """
    pdf_path = save_temp_file(pdf)

    # Upload PDF to S3
    pdf_s3_url = upload_image_to_s3(pdf_path, prefix="manifests") if pdf_path else None
    if pdf_s3_url:
        logger.info(f"☁️ S3: Manifest PDF uploaded → {pdf_s3_url}")

    try:
        logger.info(f"📄 Orchestrator: Routing Manifest '{pdf.filename}' to Market Agent...")
        extracted_orders = await market_agent.process_manifest(pdf_path)
        return {
            "status": "success",
            "orders": extracted_orders,
            "manifest_s3_url": pdf_s3_url,
        }
    except Exception as e:
        logger.error(f"❌ Manifest Orchestration Error: {e}")
        return {"status": "error", "message": str(e)}
    finally:
        if pdf_path and os.path.exists(pdf_path):
            os.remove(pdf_path)
