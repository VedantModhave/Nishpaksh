"""
Startup script for Render deployment.

This script sets critical environment variables BEFORE any TensorFlow/DeepFace imports
to ensure CPU-only mode and prevent CUDA initialization errors.

Usage on Render:
- Set the start command to: python render_startup.py
- Or use: uvicorn render_startup:app --host 0.0.0.0 --port $PORT
"""

import os
import sys

# ===== CRITICAL: Set these BEFORE any TensorFlow/DeepFace imports =====
os.environ['CUDA_VISIBLE_DEVICES'] = '-1'  # Disable CUDA completely
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'  # Reduce TensorFlow warnings
os.environ['TF_FORCE_GPU_ALLOW_GROWTH'] = 'false'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'  # Disable optimizations that use more memory
os.environ['TF_MEMORY_ALLOCATION'] = '0.8'  # Use max 80% of available memory

# Memory management for Render free tier (512MB limit)
try:
    import resource
    def limit_memory():
        """Limit memory usage to prevent OOM on Render free tier"""
        try:
            # Set soft limit to 450MB (leave 50MB for system)
            max_memory = 450 * 1024 * 1024  # 450MB in bytes
            resource.setrlimit(resource.RLIMIT_AS, (max_memory, max_memory))
        except (ValueError, OSError, AttributeError):
            # resource module not available on Windows or limits not supported
            pass
    
    limit_memory()
except ImportError:
    # resource module not available on Windows
    pass

# Now import and run the app
from main import app
import uvicorn

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
