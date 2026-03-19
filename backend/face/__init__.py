"""
Nishpaksh - Face Recognition Backend Module

निष्पक्ष (Impartial) - Biometric Voter Verification System

Face recognition backend: detection, embedding, and storage.

Core Components:
- FaceDetector: YOLO-based face detection in images
- FaceEmbedder: DeepFace-based face embedding generation
- FaceStorage: SQLite database for face embeddings

This package now uses DeepFace (ArcFace + RetinaFace) for face detection
and embedding, replacing the older YOLO + custom embedding pipeline.

Key Features:
- One-face-per-voter enforcement
- Face embedding generation and storage
- SQLite-based persistence
- Fraud prevention through biometric verification
- Memory-optimized for Render free tier (512MB RAM)
- Lazy loading for optional dependencies

Performance Optimization:
- VGG-Face backbone: ~200MB (vs ArcFace ~400MB)
- OpenCV detector: ~50MB (vs RetinaFace ~200MB)
- Total: ~250MB memory usage

Module Structure:
- __init__.py: Module initialization and imports
- detector.py: YOLO face detection
- embedder.py: DeepFace embedding generation
- storage.py: SQLite database management

Author: Nishpaksh Team
Version: 1.0.0
Last Updated: March 2026
"""

from .storage import FaceStorage, get_storage

# DeepFace-based embedder is defined in embedder.py
# Import lazily to avoid requiring deepface for scripts that only need storage
# This allows clear_database.py and other storage-only scripts to work without deepface
try:
    from .embedder import FaceEmbedder, get_embedder
except ImportError:
    FaceEmbedder = None

    def get_embedder():
        raise ImportError(
            "DeepFace embedder is not available. "
            "Install deepface and its dependencies: pip install deepface tf-keras"
        )

__all__ = [
    'FaceEmbedder',
    'get_embedder',
    'FaceStorage',
    'get_storage',
]

