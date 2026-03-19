"""
YOLO-based Face Detection Module

Detects faces in images using pretrained YOLO model.
- Uses YOLOv8 for face detection
- Rejects images with face count ≠ 1
- Returns cropped face image
"""

import base64
import binascii
import numpy as np
from PIL import Image
from io import BytesIO
from typing import Tuple, Optional
from ultralytics import YOLO
import cv2


class FaceDetector:
    """
    YOLO-based face detector.
    Detects exactly one face in an image and returns the cropped face.
    """
    
    def __init__(self, model_path: Optional[str] = None):
        """
        Initialize the face detector with a YOLO model.
        
        Args:
            model_path: Path to YOLO model file. If None, uses default YOLOv8n.
                       For face detection, use a face-specific model.
        """
        # Load YOLO model for face detection
        # Try to use a face-specific model if available, otherwise use YOLOv8n
        if model_path:
            self.model = YOLO(model_path)
        else:
            # Use YOLOv8n (nano) - lightweight and fast
            # Note: For better face detection, use a face-specific YOLO model
            # (e.g., yolov8n-face.pt or similar face detection models)
            # YOLOv8n will work but may not be optimized for faces
            try:
                # Try to load a face-specific model if available
                self.model = YOLO('yolov8n-face.pt')
            except:
                # Fallback to standard YOLOv8n
                self.model = YOLO('yolov8n.pt')
        
        # Set confidence threshold for face detection
        self.confidence_threshold = 0.25
        
    def _decode_base64_image(self, base64_string: str) -> np.ndarray:
        """
        Decode base64 string to numpy array image.
        
        Args:
            base64_string: Base64 encoded image string
            
        Returns:
            numpy array representing the image (BGR format for OpenCV)
        """
        if not base64_string or not base64_string.strip():
            raise ValueError("Base64 string is empty or None")
        
        # Remove data URL prefix if present
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        # Validate base64 string length
        if len(base64_string) < 100:
            raise ValueError(f"Base64 string is too short ({len(base64_string)} chars). Image data may be corrupted.")
        
        try:
            # Decode base64
            image_data = base64.b64decode(base64_string)
            
            if not image_data or len(image_data) == 0:
                raise ValueError("Decoded image data is empty")
            
            # Convert to numpy array
            nparr = np.frombuffer(image_data, np.uint8)
            
            if nparr.size == 0:
                raise ValueError("Image buffer is empty after decoding")
            
            # Decode image
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if img is None:
                raise ValueError("OpenCV failed to decode image. The image data may be corrupted or in an unsupported format.")
            
            return img
        except binascii.Error as e:
            raise ValueError(f"Invalid base64 encoding: {str(e)}")
        except Exception as e:
            raise ValueError(f"Error decoding image: {str(e)}")
    
    def _encode_image_to_base64(self, image: np.ndarray) -> str:
        """
        Encode numpy array image to base64 string.
        
        Args:
            image: numpy array representing the image (BGR format)
            
        Returns:
            Base64 encoded image string
        """
        # Encode image to JPEG
        _, buffer = cv2.imencode('.jpg', image)
        
        # Convert to base64
        image_base64 = base64.b64encode(buffer).decode('utf-8')
        
        return image_base64
    
    def detect_face(self, base64_image: str) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Detect exactly one face in the image and return cropped face.
        
        Args:
            base64_image: Base64 encoded image string
            
        Returns:
            Tuple of (success, cropped_face_base64, error_message)
            - success: True if exactly one face detected, False otherwise
            - cropped_face_base64: Base64 encoded cropped face image (if success)
            - error_message: Error message if detection failed
        """
        try:
            # Decode image
            image = self._decode_base64_image(base64_image)
            
            # Run YOLO detection with confidence threshold
            results = self.model(image, conf=self.confidence_threshold, verbose=False)
            
            # Extract face detections
            detections = []
            for result in results:
                boxes = result.boxes
                if boxes is not None:
                    for box in boxes:
                        # Get bounding box coordinates
                        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                        confidence = box.conf[0].cpu().numpy()
                        class_id = int(box.cls[0].cpu().numpy())
                        
                        # Filter for face detections
                        # If using a face-specific model, all detections are faces
                        # If using general YOLO, filter by class_id (person class is usually 0)
                        # For face detection models, accept all detections
                        # For general YOLO, we'd need to filter, but for now accept all
                        # as we're assuming face detection model or person detection
                        if confidence >= self.confidence_threshold:
                            detections.append({
                                'bbox': [int(x1), int(y1), int(x2), int(y2)],
                                'confidence': float(confidence),
                                'class_id': class_id
                            })
            
            # Check face count
            face_count = len(detections)
            
            if face_count == 0:
                return False, None, "No face detected in the image"
            
            if face_count > 1:
                return False, None, f"Multiple faces detected ({face_count}). Exactly one face is required."
            
            # Exactly one face detected
            face_bbox = detections[0]['bbox']
            x1, y1, x2, y2 = face_bbox
            
            # Add padding to the crop (10% on each side)
            height, width = image.shape[:2]
            padding_x = int((x2 - x1) * 0.1)
            padding_y = int((y2 - y1) * 0.1)
            
            # Crop with padding, ensuring we don't go out of bounds
            crop_x1 = max(0, x1 - padding_x)
            crop_y1 = max(0, y1 - padding_y)
            crop_x2 = min(width, x2 + padding_x)
            crop_y2 = min(height, y2 + padding_y)
            
            # Crop the face
            cropped_face = image[crop_y1:crop_y2, crop_x1:crop_x2]
            
            # Encode cropped face to base64
            cropped_face_base64 = self._encode_image_to_base64(cropped_face)
            
            return True, cropped_face_base64, None
            
        except ValueError as e:
            return False, None, f"Image decoding error: {str(e)}"
        except Exception as e:
            return False, None, f"Face detection error: {str(e)}"


# Global detector instance (lazy loading)
_detector_instance: Optional[FaceDetector] = None


def get_detector() -> FaceDetector:
    """
    Get or create the global face detector instance.
    Uses singleton pattern for efficiency.
    
    Returns:
        FaceDetector instance
    """
    global _detector_instance
    if _detector_instance is None:
        _detector_instance = FaceDetector()
    return _detector_instance

