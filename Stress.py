from agents.urban_miner import process_waste, ensure_collection_exists
import sys
import os
import time
import torch
import psutil
from PIL import Image

# Fix imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Configuration
TEST_IMAGE = "temp_uploads/capture.jpg"  # Ensure this file exists!
ITERATIONS = 20  # How many loops


def get_vram_usage():
    if torch.cuda.is_available():
        allocated = torch.cuda.memory_allocated() / 1024**3
        reserved = torch.cuda.memory_reserved() / 1024**3
        return f"{allocated:.2f}GB / {reserved:.2f}GB"
    return "N/A"


async def run_stress_test():
    print(f"🔥 STARTING STRESS TEST on {torch.cuda.get_device_name(0)}")
    print(f"   Initial VRAM: {get_vram_usage()}")

    # 1. Warmup (Loads models into VRAM)
    print("\n[1/3] Warming up models...")
    await process_waste(TEST_IMAGE)
    print(f"   Post-Load VRAM: {get_vram_usage()}")

    # 2. Latency Test
    print(f"\n[2/3] Running {ITERATIONS} iterations...")
    times = []

    for i in range(ITERATIONS):
        start = time.time()
        await process_waste(TEST_IMAGE)
        duration = time.time() - start
        times.append(duration)
        sys.stdout.write(
            f"\r   Loop {i+1}/{ITERATIONS}: {duration:.2f}s | VRAM: {get_vram_usage()}")
        sys.stdout.flush()

    # 3. Report
    avg_time = sum(times) / len(times)
    fps = 1.0 / avg_time

    print("\n\n📊 RESULTS 📊")
    print(f"   Average Latency: {avg_time:.2f} seconds/image")
    print(f"   Throughput:      {fps:.2f} FPS")
    print(
        f"   Peak VRAM:       {torch.cuda.max_memory_allocated() / 1024**3:.2f} GB")

    if fps < 0.5:
        print("⚠️  SYSTEM WARNING: Too slow for real-time video.")
    else:
        print("✅  SYSTEM PASS: Acceptable for demo.")

if __name__ == "__main__":
    import asyncio
    # Create dummy image if missing
    if not os.path.exists(TEST_IMAGE):
        Image.new('RGB', (640, 640), color='gray').save(TEST_IMAGE)

    asyncio.run(run_stress_test())
