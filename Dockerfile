# =============================================================================
# ReLoop: Dockerfile
# Multi-stage build:
#   Stage 1 (node-builder) - Builds the React frontend
#   Stage 2 (python-runtime) - Runs FastAPI backend, serves built frontend
# =============================================================================

# ─── STAGE 1: Build React Frontend ───────────────────────────────────────────
FROM node:20-alpine AS node-builder

WORKDIR /app/frontend

# Install dependencies (cache layer)
COPY frontend/package*.json ./
RUN npm ci --prefer-offline

# Copy source and build
COPY frontend/ ./
RUN npm run build
# Output goes to frontend/dist/

# ─── STAGE 2: Python Runtime ─────────────────────────────────────────────────
FROM python:3.11-slim AS python-runtime

# System dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    git \
    curl \
    libgomp1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgl1-mesa-glx \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies (cache layer)
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY agents/ ./agents/
COPY database/ ./database/
COPY utils/ ./utils/
COPY scripts/ ./scripts/
COPY main.py .

# Copy built frontend into the backend's static/ folder
# FastAPI serves this at GET /
COPY --from=node-builder /app/frontend/dist/ ./static/

# Create runtime directories
RUN mkdir -p temp_uploads/crops qdrant_db data/processed data/factory_pdfs

# Expose FastAPI port
EXPOSE 8000

# Health check for AWS ALB/ECS
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start with gunicorn (production WSGI) wrapping uvicorn workers
CMD ["gunicorn", "main:app", \
     "--worker-class", "uvicorn.workers.UvicornWorker", \
     "--workers", "2", \
     "--bind", "0.0.0.0:8000", \
     "--timeout", "300", \
     "--keep-alive", "5", \
     "--log-level", "info"]
