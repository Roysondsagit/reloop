import os
from qdrant_client import QdrantClient
from dotenv import load_dotenv

load_dotenv()

# --- SINGLETON INSTANCE ---
_client_instance = None


def get_qdrant_client() -> QdrantClient:
    """
    Returns a shared Qdrant Client instance.
    - If QDRANT_URL is set in .env → connects to Qdrant Cloud.
    - Otherwise → falls back to local disk-based mode (development).
    """
    global _client_instance

    # If we already have a connection, return it immediately
    if _client_instance is not None:
        return _client_instance

    qdrant_url = os.getenv("QDRANT_URL")
    qdrant_api_key = os.getenv("QDRANT_API_KEY")

    if qdrant_url:
        # --- QDRANT CLOUD MODE ---
        print(f"☁️  Connecting to Qdrant Cloud: {qdrant_url}")
        _client_instance = QdrantClient(
            url=qdrant_url,
            api_key=qdrant_api_key,
            timeout=30,
        )
        print("✅ Qdrant Cloud Connected.")
    else:
        # --- LOCAL FALLBACK MODE (Development) ---
        print("📁  QDRANT_URL not set. Using LOCAL Qdrant (Offline/Dev Mode)...")
        os.makedirs("qdrant_db", exist_ok=True)
        _client_instance = QdrantClient(path="qdrant_db")
        print("✅ Local Qdrant Ready.")

    return _client_instance
