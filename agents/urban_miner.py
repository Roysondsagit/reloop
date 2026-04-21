# ==============================================================================
# BLOCK 1: IMPORTS & SYSTEM SETUP
# ==============================================================================
from utils.audio import transcribe_audio
from database.connection import get_qdrant_client
from transformers import AutoProcessor, Florence2ForConditionalGeneration, SiglipProcessor, SiglipModel
from ultralytics import YOLO
from qdrant_client import models as qmodels
from fastembed import TextEmbedding
from PIL import Image, ImageDraw, ImageFont, ImageEnhance, ImageStat, ImageFilter
from pydantic import BaseModel
from typing import Optional, List, Tuple
from dotenv import load_dotenv
import torch
import asyncio
import sys
import os
import time
import gc
import uuid
import re
import traceback
import numpy as np

# --- AGENT INTEGRATION ---
from agents.memory_agent import MemoryAgent

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
load_dotenv()

MIN_CONFIDENCE_SCORE = 0.01
MIN_CONTAMINATION_SCORE = 0.01

RECYCLE_ROUTES = {
    "Plastic": "smart_bin_plastic",
    "Glass": "smart_bin_glass",
    "Metal": "smart_bin_metal",
    "Paper": "smart_bin_paper",
    "MLP": "smart_bin_mlp",
}

# Initialize Agents
memory_agent = MemoryAgent()
qdrant = get_qdrant_client()

# ==============================================================================
# BLOCK 2: MODEL CONFIGURATION
# ==============================================================================
print("\n========================================================")
print("              🚀 URBAN MINER BOOTING   ")
print("========================================================\n")

print("1.  Loading YOLOv26 (Perception Agent)...")
try:
    object_model = YOLO("yolo26m.pt")
    print("   ✅ YOLOv26m Active")
except:
    print("   ⚠️ YOLOv26m not found. Falling back to yolo11m...")
    object_model = YOLO("yolo11m.pt")

print("2.  Loading Florence-2 (Context Agent)...")
FLORENCE_ID = "florence-community/Florence-2-base"
try:
    florence_model = Florence2ForConditionalGeneration.from_pretrained(
        FLORENCE_ID, trust_remote_code=True).eval()
    florence_processor = AutoProcessor.from_pretrained(
        FLORENCE_ID, trust_remote_code=True, use_fast=True)
    print("   ✅ Florence-2 Active")
except:
    print("   ❌ Florence-2 Failed")

print("3.  Loading SigLIP (Analysis Agent)...")
SIGLIP_ID = "google/siglip-so400m-patch14-384"
siglip_model = SiglipModel.from_pretrained(SIGLIP_ID).to("cpu").eval()
siglip_processor = SiglipProcessor.from_pretrained(SIGLIP_ID, use_fast=True)
print("   ✅ SigLIP Active")

print("4.  Loading Embeddings...")
text_model = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")

# ==============================================================================
# BLOCK 3: UTILITIES & VISUALS
# ==============================================================================


def print_progress_bar(iteration, total, prefix='', suffix='', length=30, fill='█'):
    percent = ("{0:.1f}").format(100 * (iteration / float(total)))
    filled_length = int(length * iteration // total)
    bar = fill * filled_length + '-' * (length - filled_length)
    sys.stdout.write(f'\r{prefix} |{bar}| {percent}% {suffix}')
    sys.stdout.flush()
    if iteration == total:
        print()


def calculate_iou(boxA, boxB):
    xA = max(boxA[0], boxB[0])
    yA = max(boxA[1], boxB[1])
    xB = min(boxA[2], boxB[2])
    yB = min(boxA[3], boxB[3])
    interArea = max(0, xB - xA) * max(0, yB - yA)
    boxAArea = (boxA[2] - boxA[0]) * (boxA[3] - boxA[1])
    boxBArea = (boxB[2] - boxB[0]) * (boxB[3] - boxB[1])
    denom = float(boxAArea + boxBArea - interArea)
    return interArea / denom if denom > 0 else 0


def non_max_suppression(boxes, iou_threshold=0.4):
    if not boxes:
        return []
    boxes = sorted(boxes, key=lambda x: x['conf'], reverse=True)
    keep = []
    while boxes:
        current = boxes.pop(0)
        keep.append(current)
        boxes = [b for b in boxes if calculate_iou(
            current['coords'], b['coords']) < iou_threshold]
    return keep


def filter_contained_boxes(boxes):
    if not boxes:
        return []
    boxes.sort(key=lambda x: (x['coords'][2]-x['coords'][0])
               * (x['coords'][3]-x['coords'][1]), reverse=True)
    keep = []
    for i, big in enumerate(boxes):
        is_inside = False
        bx1, by1, bx2, by2 = big['coords']
        big_area = (bx2-bx1) * (by2-by1)
        for larger in keep:
            lx1, ly1, lx2, ly2 = larger['coords']
            ix1, iy1, ix2, iy2 = max(bx1, lx1), max(
                by1, ly1), min(bx2, lx2), min(by2, ly2)
            inter_area = max(0, ix2-ix1) * max(0, iy2-iy1)
            if inter_area / big_area > 0.70:
                is_inside = True
                break
        if not is_inside:
            keep.append(big)
    return keep


def analyze_visual_profile(image):
    img_small = image.resize((64, 64))
    img_hsv = img_small.convert("HSV")
    h, s, v = img_hsv.split()
    avg_s = ImageStat.Stat(s).mean[0]
    avg_v = ImageStat.Stat(v).mean[0]
    edges = img_small.convert("L").filter(ImageFilter.FIND_EDGES)
    edge_avg = ImageStat.Stat(edges).mean[0]

    props = []
    if avg_v < 50:
        props.append("Dark")
    elif avg_v > 120 and avg_s < 30:
        props.append("White")
    elif avg_s > 60:
        props.append("Colorful")
    else:
        props.append("Neutral")

    if edge_avg > 20:
        props.append("Printed")
    else:
        props.append("Uniform")

    return props, f"V:{int(avg_v)} S:{int(avg_s)} Edge:{int(edge_avg)}"


def analyze_voice_intent(text: str):
    """Maps spoken words to material overrides."""
    if not text:
        return None
    t = text.lower()

    if "glass" in t:
        return ("Glass Bottle", "Glass")
    if "metal" in t or "aluminium" in t or "can" in t:
        return ("Aluminium Can", "Metal")
    if "cardboard" in t or "paper" in t or "box" in t:
        return ("Cardboard Box", "Paper")
    if "medical" in t or "hazardous" in t or "diaper" in t:
        return ("Hazardous Waste", "Hazardous")
    if "plastic" in t:
        return ("Plastic Waste", "Plastic")
    return None


def preprocess_for_wa_yolo(image_path: str) -> Tuple[str, dict]:
    """
    Adaptive preprocessing stage for WA-YOLO style flow.
    - Dynamic resolution scaling (speed vs precision profile)
    - Contrast normalization for low-light robustness
    """
    image = Image.open(image_path).convert("RGB")
    w, h = image.size

    probe = image.resize((256, 256)).convert("L")
    edge_strength = ImageStat.Stat(probe.filter(ImageFilter.FIND_EDGES)).mean[0]

    # Higher texture scenes use faster profile, cleaner scenes use precision profile.
    if edge_strength > 26:
        target = 640
        profile = "high_volume_fast"
    else:
        target = 960
        profile = "low_volume_precise"

    preprocessed = image.resize((target, target), Image.Resampling.BICUBIC)
    preprocessed = ImageEnhance.Contrast(preprocessed).enhance(1.08)

    os.makedirs("temp_uploads", exist_ok=True)
    processed_path = os.path.join("temp_uploads", f"wa_pre_{uuid.uuid4().hex}.jpg")
    preprocessed.save(processed_path, quality=95)

    return processed_path, {
        "input_size": f"{w}x{h}",
        "preprocessed_size": f"{target}x{target}",
        "adaptive_profile": profile,
        "edge_strength": round(float(edge_strength), 2),
    }


def compute_contamination_score(crop: Image.Image, material: str, confidence: float) -> float:
    """Heuristic contamination score in [0.01, 0.99]."""
    hsv = crop.resize((96, 96)).convert("HSV")
    _, s, v = hsv.split()
    mean_s = ImageStat.Stat(s).mean[0]
    mean_v = ImageStat.Stat(v).mean[0]
    edge_strength = ImageStat.Stat(crop.resize((96, 96)).convert("L").filter(ImageFilter.FIND_EDGES)).mean[0]

    score = 0.15
    if material == "Hazardous":
        score = 0.95
    else:
        if mean_v < 70:
            score += 0.30
        if mean_s < 40:
            score += 0.12
        if edge_strength > 38:
            score += 0.14
        if confidence < 0.25:
            score += 0.12

    return float(np.clip(score, MIN_CONTAMINATION_SCORE, 0.99))


def run_decision_engine(material: str, contamination_score: float) -> Tuple[str, str]:
    """Decision stage: SORT or REJECT plus actuator route."""
    if material not in RECYCLE_ROUTES:
        return "REJECT", "reject_lane"

    threshold = 0.55 if material == "Paper" else 0.65
    if contamination_score >= threshold:
        return "REJECT", "reject_lane"

    return "SORT", RECYCLE_ROUTES[material]

# ==============================================================================
# BLOCK 4: INFERENCE ENGINES
# ==============================================================================


def run_florence_caption(image_path: str) -> str:
    try:
        image = Image.open(image_path).convert("RGB")
        inputs = florence_processor(
            text="<DETAILED_CAPTION>", images=image, return_tensors="pt")
        inputs = {k: v.to(florence_model.device)
                  for k, v in inputs.items() if v is not None}
        generated_ids = florence_model.generate(
            input_ids=inputs["input_ids"], pixel_values=inputs["pixel_values"], max_new_tokens=50, do_sample=False
        )
        text = florence_processor.batch_decode(
            generated_ids, skip_special_tokens=False)[0]
        return florence_processor.post_process_generation(text, task="<DETAILED_CAPTION>", image_size=image.size).get("<DETAILED_CAPTION>", "")
    except:
        return "A photo of waste"


def run_florence_od(image_path: str) -> List[dict]:
    try:
        image = Image.open(image_path).convert("RGB")
        w, h = image.size
        inputs = florence_processor(
            text="<OD>", images=image, return_tensors="pt")
        inputs = {k: v.to(florence_model.device)
                  for k, v in inputs.items() if v is not None}
        generated_ids = florence_model.generate(
            input_ids=inputs["input_ids"], pixel_values=inputs["pixel_values"], max_new_tokens=1024, do_sample=False, num_beams=3
        )
        text = florence_processor.batch_decode(
            generated_ids, skip_special_tokens=False)[0]
        result = florence_processor.post_process_generation(
            text, task="<OD>", image_size=image.size)
        boxes = []
        for bbox in result.get("<OD>", {}).get("bboxes", []):
            x1, y1, x2, y2 = bbox
            if ((x2-x1)*(y2-y1)) / (w*h) > 0.80:
                continue
            boxes.append({"coords": bbox, "conf": 0.45, "source": "Florence"})
        return boxes
    except:
        return []


def run_siglip_classifier(crop_images: List[Image.Image]) -> List[dict]:
    if not crop_images:
        return []
    labels = [
        "White Milk Pouch", "Blue Milk Packet",
        "Shiny Chips Packet", "Metallized Foil Wrapper",
        "Green Trash Bag", "Black Garbage Bag",
        "Clear Plastic Water Bottle", "Glass Bottle", "Aluminium Can",
        "Cardboard Box", "Sanitary Pad", "Baby Diaper",
        "Human Person", "A Hand", "Background"
    ]
    mapping = {
        "White Milk Pouch": ("Milk Pouch (LDPE)", "Plastic"),
        "Blue Milk Packet": ("Milk Pouch (LDPE)", "Plastic"),
        "Shiny Chips Packet": ("Snack Packet (MLP)", "MLP"),
        "Metallized Foil Wrapper": ("Snack Packet (MLP)", "MLP"),
        "Green Trash Bag": ("Green Trash Bag", "Plastic"),
        "Black Garbage Bag": ("Black Trash Bag", "Plastic"),
        "Clear Plastic Water Bottle": ("Plastic Bottle", "Plastic"),
        "Glass Bottle": ("Glass Bottle", "Glass"),
        "Aluminium Can": ("Aluminium Can", "Metal"),
        "Cardboard Box": ("Cardboard", "Paper"),
        "Sanitary Pad": ("Sanitary Pad", "Hazardous"),
        "Baby Diaper": ("Diaper", "Hazardous"),
        "Human Person": ("Noise", "Ignore"),
        "A Hand": ("Noise", "Ignore")
    }
    results = []
    total = len(crop_images)
    print_progress_bar(0, total, prefix='   🧠 Analyzing:',
                       suffix='Complete', length=20)
    try:
        batch_size = 4
        for i in range(0, total, batch_size):
            batch = crop_images[i:i+batch_size]
            inputs = siglip_processor(
                text=labels, images=batch, return_tensors="pt", padding="max_length").to(siglip_model.device)
            with torch.no_grad():
                outputs = siglip_model(**inputs)
            # Use relative confidence across candidate labels for stable UI percentages.
            probs = torch.softmax(outputs.logits_per_image, dim=1).cpu().numpy()
            for j, prob_arr in enumerate(probs):
                top_idx = prob_arr.argmax()
                raw = labels[top_idx]
                conf = max(float(prob_arr[top_idx]), MIN_CONFIDENCE_SCORE)
                name, mat = mapping.get(raw, ("Unknown", "Mixed"))
                results.append({"name": name, "mat": mat,
                               "conf": conf, "raw": raw})
            print_progress_bar(min(i + batch_size, total), total,
                               prefix='   🧠 Analyzing:', suffix='Complete', length=20)
    except:
        return [{"name": "Error", "mat": "Mixed", "conf": MIN_CONFIDENCE_SCORE}] * len(crop_images)
    return results


class IdentificationResult(BaseModel):
    product_name: str
    verbose_description: str
    material: str
    is_hazardous: bool
    final_confidence_score: float
    source_of_truth: str
    debug_visual_score: float
    contamination_score: float
    decision: str
    actuator_route: str

# ==============================================================================
# BLOCK 5: MAIN LOGIC PIPELINE
# ==============================================================================


async def register_user_correction(image_path: str, correct_label: str, incorrect_label: str):
    print(f"🧠 TEACHING: Converting '{incorrect_label}' -> '{correct_label}'")
    caption = await asyncio.to_thread(run_florence_caption, image_path)
    mat = "Mixed"
    l = correct_label.lower()
    if "plastic" in l or "milk" in l:
        mat = "Plastic"
    elif "glass" in l:
        mat = "Glass"
    elif "metal" in l or "can" in l:
        mat = "Metal"
    elif "mlp" in l:
        mat = "MLP"

    memory_agent.learn(
        description=f"{caption}. Identified as {correct_label}",
        label=correct_label, material=mat, source="USER_EPISODIC_MEMORY"
    )
    return "Memory Updated"


async def process_waste(image_path: str, user_lat: float = 28.61, user_lon: float = 77.20, audio_path: str = None) -> dict:
    logs = []

    def log(msg): print(msg); logs.append(
        f"[{time.strftime('%H:%M:%S')}] {msg}")
    gc.collect()
    torch.cuda.empty_cache()

    log(f"🔍 SCAN: {os.path.basename(image_path)}")

    # --- PIPELINE 1: INPUT + PREPROCESSING ---
    log("🧩 PIPELINE 1/6: Input received (Camera/Image Upload)")
    preprocessed_path, preprocess_meta = preprocess_for_wa_yolo(image_path)
    log(f"🧩 PIPELINE 2/6: Preprocessing complete ({preprocess_meta['adaptive_profile']})")

    # --- 0. AUDIO PROCESSING (The "Ears") ---
    voice_override = None
    voice_text = ""

    # --- DEBUGGING AUDIO PATH ---
    if audio_path:
        if os.path.exists(audio_path):
            log(f"🎤 Found Audio File: {os.path.basename(audio_path)}")
            try:
                # Transcribe
                voice_text = await asyncio.to_thread(transcribe_audio, audio_path)

                if voice_text:
                    log(f"   🗣️ Heard: \"{voice_text}\"")
                    voice_override = analyze_voice_intent(voice_text)
                    if voice_override:
                        log(
                            f"   ⚠️ VOICE OVERRIDE ACTIVE: Force {voice_override[0]}")
                else:
                    log("   ⚠️ Audio processed but result was empty.")
            except Exception as e:
                log(f"   ❌ Audio Error: {e}")
        else:
            log(f"   ⚠️ Audio path provided but file missing: {audio_path}")
    else:
        # <--- THIS PROVES IF API IS SENDING IT
        log("   ℹ️ No Audio File Received in Request")

    # --- 1. DETECTION (The "Eyes") ---
    raw_detections = []
    try:
        log("🧩 PIPELINE 3/6: WA-YOLO detection pass")
        yolo_res = await asyncio.to_thread(object_model, preprocessed_path, conf=0.25)
        if yolo_res and len(yolo_res[0].boxes) > 0:
            for box in yolo_res[0].boxes:
                cls_name = object_model.names[int(box.cls)]
                if cls_name == 'person':
                    continue
                raw_detections.append(
                    {"coords": box.xyxy[0].tolist(), "conf": float(box.conf), "source": "YOLO"})
    except:
        pass

    if len(raw_detections) < 5:
        flo_boxes = await asyncio.to_thread(run_florence_od, preprocessed_path)
        raw_detections.extend(flo_boxes)

    nms_boxes = non_max_suppression(raw_detections, iou_threshold=0.5)
    visual_boxes = filter_contained_boxes(nms_boxes)
    log(f"🎯 Objects Isolated: {len(visual_boxes)}")

    detected_items = []
    full_img = Image.open(preprocessed_path)
    img_w, img_h = full_img.size
    crops = []
    valid_indices = []

    # --- 2. CROP ---
    for i, item in enumerate(visual_boxes):
        c = item["coords"]
        x1, y1, x2, y2 = max(0, c[0]), max(
            0, c[1]), min(img_w, c[2]), min(img_h, c[3])
        if x2-x1 < 25 or y2-y1 < 25:
            continue
        crops.append(full_img.crop((x1, y1, x2, y2)).convert("RGB"))
        valid_indices.append(i)

    # --- 3. ANALYSIS (The "Brain") ---
    if crops:
        siglip_res = await asyncio.to_thread(run_siglip_classifier, crops)

        for idx, (res, crop) in enumerate(zip(siglip_res, crops)):
            label = res["raw"]
            final_name = res["name"]
            final_mat = res["mat"]
            conf = max(res["conf"], MIN_CONFIDENCE_SCORE)
            props, stats = analyze_visual_profile(crop)
            source = "Vision Agent"

            if final_mat == "Ignore":
                log(f"   #{idx+1}: Ignored (Human/Noise)")
                continue

            # --- AGENT COLLABORATION ---
            visual_query = f"{label}. Visuals: {props}"

            # Priority 1: VOICE OVERRIDE (User Command)
            if voice_override:
                final_name = voice_override[0]
                final_mat = voice_override[1]
                conf = 0.99
                source = "Voice Command (Human)"

            else:
                # Priority 2: Memory Agent
                mem_label, mem_mat, mem_conf = await asyncio.to_thread(memory_agent.remember, visual_query)
                if mem_conf > 0.85:
                    final_name = mem_label
                    final_mat = mem_mat
                    conf = mem_conf
                    source = "Memory Agent"
                    log(f"   [🧠 MEMORY] Recalled: {final_name}")
                else:
                    # Priority 3: Logic Guardrails

                    # Rule 1: Milk/LDPE
                    if "Milk" in label or "Bag" in label:
                        final_name = "Plastic/LDPE"
                        final_mat = "Plastic"
                        if "Milk" in label and "White" in props and "Printed" in props and conf > 0.5:
                            final_name = "Milk Pouch (LDPE)"
                        elif "Trash" in label and ("Dark" in props or "Colorful" in props):
                            final_name = "Trash Bag"

                    # Rule 2: Shiny = MLP
                    if final_mat == "Plastic" and "Shiny" in props and "Colorful" in props:
                        final_name = "Snack Packet (MLP)"
                        final_mat = "MLP"
                        source = "Logic (Visuals)"

                    # Rule 3: Bottle/Can/Glass
                    if "Bottle" in label or "Can" in label:
                        if "Can" in label:
                            final_name = "Aluminium Can"
                            final_mat = "Metal"
                        elif "Glass" in label:
                            final_name = "Glass Bottle"
                            final_mat = "Glass"
                        else:
                            final_name = "Plastic Bottle"
                            final_mat = "Plastic"

            log(f"   #{idx+1}: {final_name} ({int(conf*100)}%) | Source: {source}")

            contamination_score = compute_contamination_score(crop, final_mat, conf)
            decision, actuator_route = run_decision_engine(final_mat, contamination_score)

            detected_items.append(IdentificationResult(
                product_name=final_name,
                verbose_description=f"{final_name} ({int(conf*100)}%)",
                material=final_mat, is_hazardous=(final_mat == "Hazardous"),
                final_confidence_score=max(conf, MIN_CONFIDENCE_SCORE), source_of_truth=source, debug_visual_score=0.0
                , contamination_score=contamination_score,
                decision=decision,
                actuator_route=actuator_route
            ))

    log("🧩 PIPELINE 4/6: Detection + Classification complete")
    log("🧩 PIPELINE 5/6: Contamination analysis complete")
    log("🧩 PIPELINE 6/6: Decision engine + actuator routing complete")

    # --- 4. DRAWING ---
    annotated_img = Image.open(preprocessed_path).convert("RGB")
    draw = ImageDraw.Draw(annotated_img)
    font_path = "arial.ttf"
    try:
        font = ImageFont.truetype(font_path, 14)
    except:
        font = None

    valid_count = 0
    for i, list_idx in enumerate(valid_indices):
        if valid_count < len(detected_items):
            item = detected_items[valid_count]
            box = visual_boxes[list_idx]["coords"]
            color = {"Plastic": "#00FFFF", "MLP": "#FFA500", "Glass": "#0000FF",
                     "Metal": "#FF0000", "Hazardous": "#FF00FF"}.get(item.material, "#00FF00")

            draw.rectangle(box, outline=color, width=2)
            bx, by = box[0], box[1]
            text_y = max(0, by - 18)

            # Label background
            label_text = f"{item.product_name}"
            if voice_text:
                label_text += " (🎤)"

            if font:
                bbox = draw.textbbox((bx, text_y), label_text, font=font)
                draw.rectangle(
                    (bbox[0]-2, bbox[1]-2, bbox[2]+2, bbox[3]+2), fill="black")
                draw.text((bx, text_y), label_text, fill=color, font=font)
            else:
                draw.rectangle((bx, text_y, bx+100, text_y+12), fill="black")
                draw.text((bx, text_y), label_text, fill=color)

            valid_count += 1

    annotated_filename = f"visual_proof_{os.path.basename(image_path)}"
    annotated_img.save(f"temp_uploads/crops/{annotated_filename}")

    # --- 5. STATS ---
    dna = {}
    if detected_items:
        counts = {}
        for x in detected_items:
            counts[x.material] = counts.get(x.material, 0) + 1
        for m, c in counts.items():
            dna[m] = {"count": c, "percent": round(
                (c/len(detected_items))*100), "recyclability": "High", "color_class": "bg-green-500" if m == "Plastic" else "bg-orange-500"}

    # Build explicit actuator plan from decisions.
    sort_count = sum(1 for x in detected_items if x.decision == "SORT")
    reject_count = len(detected_items) - sort_count
    contamination_avg = (sum(float(x.contamination_score) for x in detected_items) / len(detected_items)) if detected_items else MIN_CONTAMINATION_SCORE
    contamination_max = max((float(x.contamination_score) for x in detected_items), default=MIN_CONTAMINATION_SCORE)
    reject_rate = round((reject_count / len(detected_items)) * 100, 2) if detected_items else 0.0
    actuator_plan = [
        {
            "item": x.product_name,
            "material": x.material,
            "contamination_score": round(float(x.contamination_score), 3),
            "decision": x.decision,
            "route": x.actuator_route,
        }
        for x in detected_items
    ]

    if os.path.exists(preprocessed_path):
        os.remove(preprocessed_path)

    return {
        "items": [i.model_dump() for i in detected_items],
        "total_items": len(detected_items),
        "batch_dna": dna,
        "summary": f"Detected {len(detected_items)} items.",
        "visual_proof_url": f"/temp_uploads/crops/{annotated_filename}",
        "trace_logs": logs,
        "pipeline": {
            "stages": [
                "Input (Camera Feed)",
                "Preprocessing (Resize + Normalize)",
                "WA-YOLO Model",
                "Detection + Classification",
                "Contamination Analysis",
                "Decision Engine (Sort / Reject)",
                "Actuator (Smart Bin / Conveyor)",
            ],
            "preprocessing": preprocess_meta,
        },
        "decision_summary": {
            "sort": sort_count,
            "reject": reject_count,
            "reject_rate": reject_rate,
            "avg_contamination_score": round(float(contamination_avg), 3),
            "max_contamination_score": round(float(contamination_max), 3),
            "actuator_plan": actuator_plan,
        },
        "best_factory_match": {"factory_name": "EcoHub", "offer_price": 25.0, "requirement_match": "High", "confidence_score": 0.95},
        "eco_impact": {"saved_carbon_kg": len(detected_items)*0.5, "credits_earned": len(detected_items)*10, "energy_saved_kwh": len(detected_items)*0.2}
    }
