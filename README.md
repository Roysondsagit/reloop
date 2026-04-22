# 🧬 ReLoop: The Industrial Symbiosis Engine

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![React](https://img.shields.io/badge/Frontend-React_Vite-cyan)](https://react.dev/)
[![Qdrant](https://img.shields.io/badge/Vector_Database-Qdrant-red)](https://qdrant.tech/)
[![Edge AI](https://img.shields.io/badge/AI-Offline_Edge-green)]()

> **"Turning Liability (Waste) into Asset (Feedstock)."**

---

## 🌍 The Problem

The Circular Economy fails due to **Information Asymmetry**.

- **Waste Pickers** sit on piles of valuable raw material ("Trash") but don't know who buys it.
- **Factories** pay premiums for virgin material because they can't locate clean, segregated scrap.

**ReLoop** bridges this gap. It is an **Agentic AI Engine** that audits waste composition in real-time, learns from human feedback, and performs a semantic handshake with industrial procurement manifests.

---

## 📸 System Architecture (Multi-Agent)

ReLoop operates via a Hub-and-Spoke orchestration of specialized AI Agents:

| **Agent**           | **Role**              | **Tech Stack**                                                                               |
| :------------------ | :-------------------- | :------------------------------------------------------------------------------------------- |
| **👀 Urban Miner**  | Perception & Analysis | **YOLOv26** (Detection) + **Florence-2** (Captioning) + **SigLIP** (Material Classification) |
| **👂 Audio Agent**  | Intent & Override     | **OpenAI Whisper 2026** (Speech-to-Text) with Translation                                    |
| **🧠 Memory Agent** | Episodic Recall       | **Qdrant** (Vector DB) storing past user corrections & material knowledge                    |
| **🏭 Market Agent** | Demand Matching       | **FastEmbed** + **PyMuPDF** to parse factory PDFs and match vectors                          |

---

## 🚀 Key Features

### 1. Tri-Layer Perception Engine

We don't rely on a single model. ReLoop uses a **Neural-Symbolic Cascade**:

- **Layer 1:** `YOLOv26` extracts objects and dense piles.
- **Layer 2:** `SigLIP` classifies material properties (Glass vs Plastic).
- **Layer 3:** `Florence-2` provides dense context ("Crushed LDPE milk pouch").

### 2. Linguistic Override (Human-in-the-Loop)

Computer Vision can fail (e.g., Clear Plastic vs. Glass).

- **Whisper AI** listens to the user (English/Hindi/Regional).
- It **translates** intent and **overrides** the vision logic in real-time.
- _Example:_ User says _"Ye kaanch hai"_ -> System forces "Glass" tag even if it looks like plastic.

### 3. Vector Memory & Learning

The system gets smarter with use via the **Memory Agent**:

- **Episodic Memory:** Remembers specific objects user corrected previously.
- **Knowledge Base:** Stores material guidelines (e.g., "Shiny = MLP").
- **Retrieval:** Before finalizing a result, it queries **Qdrant** to see if it has seen this object before.

### 4. Semantic Market Matching

We replaced rigid SQL queries with **Vector Search**.

- Factory requirements (PDF Manifests) are parsed and embedded into **Qdrant**.
- Trash scans are matched based on **Semantic Proximity**.
- _Result:_ "Dirty Polypropylene" automatically matches with "Industrial Polymer Recycler" buy orders.

### 5. Built-in Pitch Deck

The application includes a hidden **Presentation Mode**. Swipe from the left edge of the screen to reveal the project slide deck dynamically rendered in React.

---

## 🛠️ Tech Stack

- **Orchestration:** FastAPI (Async Python)
- **Vector Database:** **Qdrant** (Local HNSW Index)
- **Vision:** Ultralytics YOLOv26 + Microsoft Florence-2 + Google SigLIP
- **Audio:** OpenAI Whisper (Base) + FFmpeg
- **Embeddings:** FastEmbed (`BAAI/bge-small-en-v1.5`)
- **Frontend:** React + Vite + Tailwind CSS + Framer Motion

---

## ⚡ Quick Start

### Prerequisites

- Python 3.10+
- Node.js & npm
- **FFmpeg** (Required for Audio Processing)
  - _Linux:_ `sudo apt install ffmpeg`
  - _Mac:_ `brew install ffmpeg`
  - _Windows:_ `winget install ffmpeg`

### 1. Backend Setup (Python)

```bash
# Clone the repository
git clone [https://github.com/aaryanmax/residuav2.git](https://github.com/aaryanmax/residuav2.git)
cd reloop

# Create Virtual Environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install Dependencies
pip install -r requirements.txt

# Run the API Server
python main.py
```

### 2. Frontend Setup (React)

```bash
# Open a new terminal in the project root
cd frontend

# Install Node modules
npm install

# Run the UI
npm run dev
```

## 3. Usage Guide

- **Scan/Upload:** Point camera at waste. Click capture or Just Upload from Gallery.

- **Speak (Opt.)**: Click the mic to add context ("This is hazardous or This is plastic").

- **Market:** Click the 'Layout' icon to switch to B2B Market view.

- **Upload:** Use the "Import Manifest" button to upload a factory PDF requirement.

---

## ☁️ AWS Deployment Guide

ReLoop is fully AWS-ready. The infrastructure uses 5 AWS services:

| Service | Role in ReLoop |
|---------|---------------|
| **S3** | Stores uploaded waste images & annotated AI results |
| **SNS** | Publishes hazardous waste alerts & scan completion events |
| **Lambda** | Processes SNS events (logging, alerting, analytics) |
| **IAM** | Least-privilege access for app user + Lambda execution role |
| **Qdrant Cloud** | Persists vector memory across deployments (replaces local Qdrant) |

### Architecture

```
User → EC2 (FastAPI + React)
         ├── S3        ← uploads raw + annotated images
         ├── SNS       ← publishes hazardous alerts & scan events
         │    └── Lambda → processes events → CloudWatch + S3 logs
         └── Qdrant Cloud ← persists AI memory (corrections + market data)
```

### Step 1: Set Up Qdrant Cloud

1. Go to [cloud.qdrant.io](https://cloud.qdrant.io) → create a free cluster
2. Copy your **Cluster URL** and **API Key**
3. Add to `.env`:
   ```
   QDRANT_URL=https://your-cluster.aws.cloud.qdrant.io
   QDRANT_API_KEY=your_key_here
   ```

### Step 2: Deploy AWS Infrastructure (CloudFormation)

```bash
# This creates S3, SNS, IAM user, Lambda, and SSM params in one command
aws cloudformation deploy \
  --template-file aws/cloudformation.yaml \
  --stack-name reloop-infra \
  --capabilities CAPABILITY_NAMED_IAM \
  --region ap-south-1 \
  --parameter-overrides \
    S3BucketName=reloop-waste-uploads \
    AlertEmail=your-email@example.com
```

After deployment, copy the **Outputs** from the CloudFormation console into your `.env` file.

### Step 3: Configure Environment

```bash
# Copy template and fill in your values
cp .env.example .env
```

Required variables:
```env
GEMINI_API_KEY=...
QDRANT_URL=...
QDRANT_API_KEY=...
AWS_ACCESS_KEY_ID=...         # From CloudFormation Outputs
AWS_SECRET_ACCESS_KEY=...     # From CloudFormation Outputs
AWS_REGION=ap-south-1
S3_BUCKET_NAME=reloop-waste-uploads
SNS_TOPIC_ARN=arn:aws:sns:ap-south-1:YOUR_ACCOUNT_ID:reloop-alerts
```

### Step 4: Build & Deploy with Docker

```bash
# Option A: Local test first
docker-compose up --build

# Option B: One-click deploy to EC2
bash aws/deploy.sh
```

### Step 5: Build Frontend for Production

```bash
cd frontend
npm install
npm run build
# → Output lands in ../static/ (FastAPI serves it at GET /)
```

### EC2 Recommended Instance

| Use Case | Instance Type | GPU |
|----------|-------------|-----|
| Demo / Hackathon | `t3.large` (CPU only) | ❌ |
| Production | `g4dn.xlarge` | ✅ NVIDIA T4 |

### Lambda Function

The SNS Processor Lambda (`aws/lambda/sns_processor/index.py`) automatically:
- Logs all scan events to CloudWatch
- Sends `🚨 ALERT` for hazardous waste detections
- Archives event JSON to S3 (`event-logs/` prefix)

Deploy it via the AWS Console (Runtime: Python 3.11, Handler: `index.lambda_handler`).

---
