import whisper
import os
import torch
import shutil  # --- FIX: Import shutil for checks

# Load the model once to save time (Lazy Loading)
MODEL_SIZE = "base"
_model = None


def load_whisper():
    global _model
    if _model is None:
        print(f"🎙️ Loading Whisper ({MODEL_SIZE})...")
        device = "cuda" if torch.cuda.is_available() else "cpu"
        _model = whisper.load_model(MODEL_SIZE, device=device)
    return _model


def transcribe_audio(file_path: str) -> str:
    """
    Transcribes AND Translates audio to English.
    """
    if not file_path or not os.path.exists(file_path):
        return None

    # --- FIX: CHECK FFMPEG EXISTENCE ---
    if not shutil.which("ffmpeg"):
        print("❌ CRITICAL: FFmpeg not found on server. Cannot process audio.")
        return None

    try:
        print(f"   🎙️ Listening to {os.path.basename(file_path)}...")
        model = load_whisper()

        # Task="translate" forces Hindi/Global -> English
        result = model.transcribe(file_path, task="translate", fp16=False)

        text = result.get("text", "").strip()
        if len(text) < 2:
            return None

        print(f"   🗣️ User Voice (Translated): '{text}'")
        return text

    except Exception as e:
        print(f"   ⚠️ Whisper Error: {e}")
        return None
