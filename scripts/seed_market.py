from fastembed import TextEmbedding
from qdrant_client import models as qmodels
from database.connection import get_qdrant_client
import sys
import os
import random
# Fix imports since we are in a subfolder
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))


# 1. SETUP
print("🔌 Connecting to Qdrant Cloud...")
client = get_qdrant_client()
COLLECTION_NAME = "residua_industrial_v1"
text_model = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")

# 2. CONFIG
CENTER_LAT = 28.6139
CENTER_LON = 77.2090
RADIUS_KM = 0.15

# 3. THE "GOLDEN BUYERS"
golden_buyers = [
    {"name": "Balaji Pyrolysis Plant", "mat": "MLP",
        "desc": "Buying multi-layered plastic wrappers, chips packets (Lay's, Kurkure) for fuel generation.", "price": 8.50},
    {"name": "Mother Dairy recycling unit", "mat": "Plastic",
        "desc": "Specialized center for washing and recycling LDPE milk pouches and white polybags.", "price": 14.00},
    {"name": "Alum-X Smelters", "mat": "Metal",
        "desc": "Buying aluminum beverage cans, soda tins, and shiny metal scrap.", "price": 98.00},
    {"name": "Reliance Green Fibers", "mat": "Plastic",
        "desc": "Buying clear PET water bottles and beverage containers for textile fiber.", "price": 32.00},
    {"name": "Kanch Glassworks", "mat": "Glass",
        "desc": "Buying whole or broken glass bottles, brown beer bottles, and cullet.", "price": 6.50},
    {"name": "Kraft Paper Mills", "mat": "Paper",
        "desc": "Recycling corrugated cardboard boxes, amazon cartons, and brown paper.", "price": 18.00},
    {"name": "GreenDot Composites", "mat": "Composite",
        "desc": "Separating paper and alum from juice boxes and Tetra Paks.", "price": 10.00},
    {"name": "Bio-Med Incinerators", "mat": "Hazardous",
        "desc": "Safe disposal of sanitary pads, diapers, and biomedical waste.", "price": -5.00},
    {"name": "Hard-Plast Molders", "mat": "Plastic",
        "desc": "Buying thick HDPE plastic bottles, shampoo containers, and jerry cans.", "price": 28.00},
    {"name": "Times Pulping", "mat": "Paper",
        "desc": "Recycling old newspapers, magazines, and office raddi.", "price": 15.00}
]

# 4. GENERATE POINTS
points = []
print("🏭 Generating Market Data...")

# A. Add Golden Buyers
for i, b in enumerate(golden_buyers):
    desc_text = b['desc']
    # --- FIXED LINE BELOW: Parenthesis moved before [0] ---
    vector = list(text_model.embed(
        [f"Factory buying {b['mat']} {desc_text}"]))[0]

    lat = CENTER_LAT + random.uniform(-0.02, 0.02)
    lon = CENTER_LON + random.uniform(-0.02, 0.02)

    points.append(qmodels.PointStruct(
        id=i+1,
        vector=vector,
        payload={
            "factory_name": b['name'],
            "material": b['mat'],
            "requirement_match": desc_text,
            "offer_price": b['price'],
            "location": {"lat": lat, "lon": lon}
        }
    ))

# B. Add 40 Random "Shadow" Dealers
dealer_suffixes = ["Traders", "Scrap", "Recyclers",
                   "Enterprises", "Waste Sol.", "Hub"]
names_first = ["Gupta", "Aggarwal", "Khan",
               "Singh", "Delhi", "Eco", "Green", "Metro"]
materials_config = {
    "Plastic": {"base": 22.0, "var": 5.0, "desc": ["mixed plastic scrap"]},
    "Metal":   {"base": 90.0, "var": 15.0, "desc": ["iron rods and scrap"]},
    "Glass":   {"base": 3.0,  "var": 1.0,  "desc": ["mixed broken glass"]},
    "Paper":   {"base": 10.0, "var": 2.0,  "desc": ["waste paper mix"]},
}

for i in range(40):
    mat_type = random.choice(list(materials_config.keys()))
    config = materials_config[mat_type]
    name = f"{random.choice(names_first)} {random.choice(dealer_suffixes)}"
    price = round(config["base"] +
                  random.uniform(-config["var"], config["var"]), 2)
    lat = CENTER_LAT + random.uniform(-RADIUS_KM, RADIUS_KM)
    lon = CENTER_LON + random.uniform(-RADIUS_KM, RADIUS_KM)
    desc_text = random.choice(config["desc"])

    vector = list(text_model.embed([f"Factory for {mat_type} {desc_text}"]))[0]

    payload = {
        "factory_name": name,
        "material": mat_type,
        "requirement_match": desc_text,
        "offer_price": price,
        "location": {"lat": lat, "lon": lon}
    }
    points.append(qmodels.PointStruct(
        id=i+100, vector=vector, payload=payload))

# 5. UPLOAD
print(f"🚀 Uploading {len(points)} dealers (10 Golden + 40 Shadow)...")

if client.collection_exists(collection_name=COLLECTION_NAME):
    client.delete_collection(collection_name=COLLECTION_NAME)

client.create_collection(
    collection_name=COLLECTION_NAME,
    vectors_config=qmodels.VectorParams(
        size=384, distance=qmodels.Distance.COSINE)
)

client.create_payload_index(collection_name=COLLECTION_NAME,
                            field_name="location", field_schema=qmodels.PayloadSchemaType.GEO)
client.create_payload_index(collection_name=COLLECTION_NAME,
                            field_name="material", field_schema=qmodels.PayloadSchemaType.KEYWORD)

client.upsert(collection_name=COLLECTION_NAME, points=points)
print("✅ MARKET LIVE: Golden Buyers are ready!")
