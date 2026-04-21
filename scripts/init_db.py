from fastembed import TextEmbedding
from qdrant_client import models as qmodels
from database.connection import get_qdrant_client
import sys
import os

# Add the parent directory (root) to sys.path so we can import 'database' and 'utils'
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))


# 1. Connect
print("🔌 Connecting to Qdrant...")
client = get_qdrant_client()
COLLECTION_NAME = "residua_industrial_v2"

# 2. Check & Delete if exists (Start Fresh)
collections = client.get_collections()
if any(c.name == COLLECTION_NAME for c in collections.collections):
    print(f"🗑️  Deleting existing collection: {COLLECTION_NAME}")
    client.delete_collection(COLLECTION_NAME)

# 3. Create Collection
print(f"🛠️  Creating Collection: {COLLECTION_NAME}")
client.create_collection(
    collection_name=COLLECTION_NAME,
    vectors_config=qmodels.VectorParams(
        size=384, distance=qmodels.Distance.COSINE)
)

# 4. Embed Factory Data
print("🧠 Generating Embeddings...")
text_model = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")

# This is the 'Market Data' your app searches for
factories = [
    {"name": "GreenCycle Plastics",
        "desc": "Buying HDPE, LDPE (Milk Packets), PP.", "materials": "Plastic", "price": 22.50},
    {"name": "Alum-X Smelters", "desc": "Smelting aluminum cans, scrap iron.",
        "materials": "Metal", "price": 95.00},
    {"name": "ClearView Glassworks", "desc": "Melting broken glass cullet, bottles.",
        "materials": "Glass", "price": 8.00},
    {"name": "EcoPulp Paper Mill", "desc": "Pulping cardboard, newspapers.",
        "materials": "Paper", "price": 14.00},
    {"name": "PolyFuel Energy",
        "desc": "Buying MLP (Chips packets), wrappers for Pyrolysis.", "materials": "MLP", "price": 6.00},
    {"name": "BioSafe Incinerators", "desc": "Handling sanitary waste, diapers, biomedical.",
        "materials": "Hazardous", "price": -5.00}
]

points = []
for idx, f in enumerate(factories):
    embed_text = f"Factory buying {f['materials']} {f['desc']}"
    # Embedding is a generator, get the first item
    vector = list(text_model.embed([embed_text]))[0]

    points.append(qmodels.PointStruct(
        id=idx+1,
        vector=vector,
        payload={
            "factory_name": f["name"],
            "requirement_match": f["desc"],
            "accepted_materials": f["materials"],
            "offer_price": f["price"]
        }
    ))

# 5. Upload
print(f"🚀 Uploading {len(points)} factories to Cloud...")
client.upsert(collection_name=COLLECTION_NAME, points=points)

print("✅ SUCCESS! Cloud Database is ready.")
