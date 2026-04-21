from database.connection import get_qdrant_client
from qdrant_client import models as qmodels
from fastembed import TextEmbedding
import uuid
import time


class MemoryAgent:
    def __init__(self):
        self.client = get_qdrant_client()
        self.embedder = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")
        self.kb_collection = "residua_fast_kb_v2"
        self._init_kb()

    def _init_kb(self):
        """Ensures the Brain exists."""
        try:
            cols = self.client.get_collections()
            if not any(c.name == self.kb_collection for c in cols.collections):
                self.client.create_collection(
                    collection_name=self.kb_collection,
                    vectors_config=qmodels.VectorParams(
                        size=384, distance=qmodels.Distance.COSINE)
                )
                # SEED KNOWLEDGE (The "Pre-Trained" Brain)
                self.learn("A large green plastic garbage bag trash bag",
                           "Green Trash Bag", "Plastic")
                self.learn("A white plastic milk pouch milk packet",
                           "Milk Pouch (LDPE)", "Plastic")
                self.learn("A shiny silver chips packet snack wrapper",
                           "Snack Packet (MLP)", "MLP")
                print("🧠 Memory Agent: Knowledge Base Initialized")
        except Exception as e:
            print(f"⚠️ Memory Agent Error: {e}")

    def remember(self, visual_description: str):
        """
        Retrieves relevant memories for a visual cue.
        Returns: (label, material, confidence_score)
        """
        try:
            vector = list(self.embedder.embed([visual_description]))[0]
            hits = self.client.search(
                collection_name=self.kb_collection,
                query_vector=vector,
                limit=1
            )
            if hits and hits[0].score > 0.80:
                payload = hits[0].payload
                return payload['label'], payload['mat'], hits[0].score
        except:
            pass
        return None, None, 0.0

    def learn(self, description: str, label: str, material: str, source="SYSTEM"):
        """
        Stores a new memory (Episodic Learning).
        """
        vector = list(self.embedder.embed([description]))[0]
        point = qmodels.PointStruct(
            id=str(uuid.uuid4()),
            vector=vector,
            payload={
                "label": label, "mat": material,
                "text": description, "source": source,
                "timestamp": time.time()
            }
        )
        self.client.upsert(collection_name=self.kb_collection, points=[point])
        return True
