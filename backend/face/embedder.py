"""
DeepFace-based Face Embedding Module

Replaces the previous YOLO + FaceNet/ArcFace pipeline with a simpler,
more robust DeepFace pipeline:

- Uses DeepFace with VGG-Face backbone (optimized for memory-constrained environments)
- Handles face detection, alignment, and preprocessing internally
- We only call DeepFace.represent() to get embeddings
- Embeddings are used with cosine similarity for verification

Why DeepFace?
- Wraps several strong face recognition models behind a simple API
- Takes care of face detection (OpenCV), alignment, and normalization
- Lets us stay fully local/offline once models are downloaded

OPTIMIZED FOR RENDER FREE TIER (512MB RAM):
- VGG-Face: ~200MB (vs ArcFace ~400MB)
- OpenCV detector: ~50MB (vs RetinaFace ~200MB)
- Total memory usage: ~250MB (vs ~600MB with ArcFace+RetinaFace)
"""

# Force CPU-only mode (Render free tier has no GPU)
import os
os.environ['CUDA_VISIBLE_DEVICES'] = '-1'  # Disable CUDA completely
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'  # Reduce TensorFlow warnings
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'  # Disable optimizations that use more memory

import base64
import inspect
from typing import Optional

import cv2
import numpy as np
from deepface import DeepFace

# DeepFace configuration - OPTIMIZED FOR RENDER (512MB limit)
MODEL_NAME = "VGG-Face"  # Lighter than ArcFace (~200MB vs ~400MB)
DETECTOR_BACKEND = "opencv"  # Much lighter than RetinaFace (~50MB vs ~200MB)
DISTANCE_METRIC = "cosine"  # For documentation; we compute cosine similarity ourselves
SIMILARITY_THRESHOLD = 0.50  # similarity >= 0.68 → VERIFIED


class FaceEmbedder:
    """
    DeepFace-based face embedding generator.

    IMPORTANT: Face embeddings are NON-REVERSIBLE.
    - Embeddings are one-way transformations from face images to fixed-size vectors
    - You CANNOT reconstruct the original face image from an embedding
    - Embeddings are designed for similarity comparison between faces
    - This is by design for privacy and security reasons
    """

    def __init__(self) -> None:
        """
        Initialize the DeepFace pipeline.

        DeepFace will lazily load the VGG-Face model and OpenCV detector on
        first use. No training is performed; we only use pretrained weights.
        
        Optimized for memory-constrained environments (Render free tier).
        """
        self.model_name = MODEL_NAME
        self.detector_backend = DETECTOR_BACKEND

    def _decode_base64_image(self, base64_string: str) -> np.ndarray:
        """
        Decode base64 string to numpy array image (BGR format for OpenCV).
        """
        if not base64_string or not base64_string.strip():
            raise ValueError("Base64 image string is empty")

        # Remove data URL prefix if present
        if "," in base64_string:
            base64_string = base64_string.split(",", 1)[1]

        # Decode base64
        image_data = base64.b64decode(base64_string)
        if not image_data:
            raise ValueError("Decoded image data is empty")

        # Convert to numpy array
        nparr = np.frombuffer(image_data, np.uint8)
        if nparr.size == 0:
            raise ValueError("Image buffer is empty after decoding")

        # Decode image (BGR)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("OpenCV failed to decode image from base64 string")

        return img

    def _cosine_similarity(self, a: np.ndarray, b: np.ndarray) -> float:
        """
        Compute cosine similarity between two embedding vectors.
        """
        a = a.astype(np.float32)
        b = b.astype(np.float32)

        a_norm = np.linalg.norm(a)
        b_norm = np.linalg.norm(b)
        if a_norm == 0.0 or b_norm == 0.0:
            raise ValueError("One of the embeddings has zero norm")

        a_unit = a / a_norm
        b_unit = b / b_norm
        return float(np.dot(a_unit, b_unit))

    def generate_embedding_from_base64(self, base64_image: str) -> np.ndarray:
        """
        Generate a face embedding from a base64 encoded image.

        - Ensures exactly one face is detected.
        - Uses DeepFace.represent() with VGG-Face + OpenCV (memory-optimized).
        """
        # Decode base64 to image (BGR)
        image = self._decode_base64_image(base64_image)

        # DeepFace has had a few API variations across versions (arg names differ).
        # To keep this project working across DeepFace releases, we:
        # - pass the image as the first positional argument (DeepFace treats it as img_path/img)
        # - only pass keyword args that exist in the current DeepFace.represent() signature
        #
        # enforce_detection=True ensures that no-face images raise an error.
        base_kwargs = {
            "model_name": self.model_name,
            "detector_backend": self.detector_backend,
            "distance_metric": DISTANCE_METRIC,
            "enforce_detection": True,
            "align": True,
        }

        sig = inspect.signature(DeepFace.represent)
        supported = set(sig.parameters.keys())
        filtered_kwargs = {k: v for k, v in base_kwargs.items() if k in supported}

        representations = DeepFace.represent(image, **filtered_kwargs)

        if not isinstance(representations, list) or len(representations) == 0:
            raise ValueError("No face detected in the image")

        if len(representations) > 1:
            raise ValueError(
                f"Multiple faces detected ({len(representations)}). Exactly one face is required."
            )

        # DeepFace.represent returns a dict with 'embedding' key
        embedding = np.array(representations[0]["embedding"], dtype=np.float32)
        return embedding

    def compare_embeddings(self, emb1: np.ndarray, emb2: np.ndarray) -> float:
        """
        Compare two embeddings using cosine similarity.

        Returns:
            similarity score in [−1, 1], where 1.0 means identical direction.
        """
        return self._cosine_similarity(emb1, emb2)


# Global embedder instance (lazy loading)
_embedder_instance: Optional[FaceEmbedder] = None


def get_embedder(*_args, **_kwargs) -> FaceEmbedder:
    """
    Get or create the global DeepFace-based face embedder instance.

    The old API took (model_type, embedding_dim); we ignore those to keep
    backwards compatibility with existing imports.
    """
    global _embedder_instance
    if _embedder_instance is None:
        _embedder_instance = FaceEmbedder()
    return _embedder_instance


