from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
import os
from dotenv import load_dotenv

load_dotenv()

client = QdrantClient(
    url=os.getenv("QDRANT_URL"),
    api_key=os.getenv("QDRANT_API_KEY")
)


def create_collections():
    """Create collections if they don't exist"""
    collections = ["products_visual", "factory_requirements"]

    for collection in collections:
        try:
            client.get_collection(collection)
            print(f"✓ Collection '{collection}' exists")
        except:
            if collection == "products_visual":
                client.create_collection(
                    collection_name=collection,
                    vectors_config=VectorParams(
                        size=512, distance=Distance.COSINE)
                )
            else:
                client.create_collection(
                    collection_name=collection,
                    vectors_config=VectorParams(
                        size=768, distance=Distance.COSINE)
                )
            print(f"✓ Created collection '{collection}'")


def search_products(embedding, top_k=3):
    """Search product collection"""
    results = client.search(
        collection_name="products_visual",
        query_vector=embedding,
        limit=top_k
    )
    return [{
        "product_name": r.payload.get("name", "Unknown"),
        "material": r.payload.get("material", "Unknown"),
        "score": r.score
    } for r in results]


def add_product(product_id, name, material, embedding):
    """Add product to collection"""
    client.upsert(
        collection_name="products_visual",
        points=[
            PointStruct(
                id=product_id,
                vector=embedding,
                payload={"name": name, "material": material}
            )
        ]
    )
    print(f"✓ Added product: {name}")


if __name__ == "__main__":
    # Test connection
    create_collections()
    print("✓ Qdrant connected successfully!")
