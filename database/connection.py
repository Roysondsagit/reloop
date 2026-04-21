import os
from qdrant_client import QdrantClient
from dotenv import load_dotenv

load_dotenv()

# --- SINGLETON INSTANCE ---
# This global variable prevents multiple connection attempts
_client_instance = None


def get_qdrant_client():
    """
    Returns a shared Qdrant Client instance.
    Prevents 'Storage folder is already accessed' errors in Local Mode.
    """
    global _client_instance

    # If we already connected, return the existing client immediately
    if _client_instance is not None:
        return _client_instance

    # --- FORCED LOCAL MODE (Offline) ---
    print("📁  Using LOCAL Qdrant (Offline Mode)...")

    os.makedirs("qdrant_db", exist_ok=True)

    # Initialize Local Client
    _client_instance = QdrantClient(path="qdrant_db")
    return _client_instance
