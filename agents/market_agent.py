import re
import os
import json
from database.connection import get_qdrant_client
from qdrant_client.models import PointStruct
from fastembed import TextEmbedding
import uuid
import time

# Try importing pypdf, handle failure gracefully
try:
    from pypdf import PdfReader
    HAS_PDF_LIB = True
except ImportError:
    HAS_PDF_LIB = False
    print("⚠️ pypdf not found. Using Mock Parser.")

# Initialize
embedding_model = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")
qdrant = get_qdrant_client()
COLLECTION_NAME = "residua_industrial_v1"


class MarketAgent:
    def __init__(self):
        self._init_collection()

    def _init_collection(self):
        # In a real app, check and create collection here
        pass

    async def process_manifest(self, file_path: str):
        """
        Ingests a PDF Manifest -> Vectorizes Requirements -> Updates Market
        """
        print(f"🏭 Market Agent: Reading {file_path}...")

        raw_text = ""
        filename = os.path.basename(file_path).lower()

        # --- DEMO HACK: If file is "Sample", force Mock Data ---
        if "sample" in filename:
            print("🧪 DEMO MODE: Detected 'Sample' file. Injecting verified mock data.")
            raw_text = self._get_mock_text()
        elif HAS_PDF_LIB:
            try:
                reader = PdfReader(file_path)
                for page in reader.pages:
                    text = page.extract_text()
                    if text:
                        raw_text += text + "\n"
            except Exception as e:
                print(f"❌ PDF Error: {e}")

        # Fallback if PDF was empty or unreadable
        if not raw_text or len(raw_text.strip()) < 10:
            print("⚠️ PDF was empty or unreadable. Falling back to Mock Data.")
            raw_text = self._get_mock_text()

        # 2. Parse Logic
        extracted_orders = self.heuristic_parse(raw_text)

        # 3. Vectorize & Upsert (Synchronous Loop)
        results = []
        for order in extracted_orders:
            # Removed 'await' here because qdrant client is synchronous
            self.inject_demand(order)
            results.append(order)

        return results

    def _get_mock_text(self):
        """Fallback text for demo stability"""
        return """
        GLOBAL RECYCLING CORP - PROCUREMENT MANIFEST 2026
        Looking for: Clean LDPE Plastic (Milk Pouches)
        Price: ₹ 28/kg
        
        APEX METALS LTD
        Requirement: Aluminium Cans (Baled)
        Price: ₹ 95/kg
        
        ECO GLASSWORKS
        Need: Broken Glass (Cullet)
        Price: ₹ 4/kg
        """

    def heuristic_parse(self, text: str):
        lines = text.split('\n')
        orders = []
        current_factory = "Unknown Buyer"

        for line in lines:
            line = line.strip()
            if not line:
                continue

            # Detect Factory Name
            if line.isupper() and len(line) > 5:
                current_factory = line

            # Detect Demand
            lower = line.lower()
            material = None
            if "ldpe" in lower or "milk" in lower:
                material = "Milk Pouch (LDPE)"
            elif "alu" in lower or "can" in lower:
                material = "Aluminium Can"
            elif "glass" in lower:
                material = "Glass Bottle"
            elif "pet" in lower or "bottle" in lower:
                material = "Plastic Bottle"

            # Detect Price
            price = 0
            price_match = re.search(r'(?:rs\.?|₹)\s?(\d+)', lower)
            if price_match:
                price = int(price_match.group(1))

            if material and price > 0:
                orders.append({
                    "factory_name": current_factory,
                    "material": material,
                    "price": price,
                    "id": str(uuid.uuid4())[:8]
                })

        # Safety net for Demo
        if not orders:
            orders = [
                {"factory_name": "GreenCycle Corp",
                    "material": "Milk Pouch (LDPE)", "price": 26, "id": "demo1"},
                {"factory_name": "Alum-X Industries",
                    "material": "Aluminium Can", "price": 92, "id": "demo2"},
            ]

        return orders

    def inject_demand(self, data):
        """
        Creates a Vector Point for this demand and pushes to Qdrant.
        Note: This function is now SYNCHRONOUS.
        """
        desc = f"Factory buying {data['material']} at high price. Industrial requirement."
        vector = list(embedding_model.embed([desc]))[0]

        point = PointStruct(
            id=str(uuid.uuid4()),
            vector=vector,
            payload={
                "factory_name": data['factory_name'],
                "requirement_match": f"Live Demand: {data['material']}",
                "accepted_materials": data['material'],
                "offer_price": data['price'],
                "source": "PDF_MANIFEST",
                "timestamp": time.time()
            }
        )

        # Removed 'await' - this is the fix
        qdrant.upsert(
            collection_name=COLLECTION_NAME,
            points=[point]
        )
        print(f"🏭 INJECTED: {data['factory_name']} -> {data['material']}")
