"""
Quick test script for live face registration/verification.

This script helps test the face endpoints with a live webcam capture.
"""

import cv2
import base64
import requests
import json

def capture_webcam_image():
    """Capture a single frame from webcam and return as base64."""
    print("Opening webcam...")
    cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        print("Error: Could not open webcam")
        return None
    
    print("Press SPACE to capture, ESC to cancel")
    
    while True:
        ret, frame = cap.read()
        if not ret:
            print("Error: Could not read frame")
            break
        
        # Display the frame
        cv2.imshow('Face Capture - Press SPACE to capture, ESC to cancel', frame)
        
        key = cv2.waitKey(1) & 0xFF
        
        if key == ord(' '):  # Space to capture
            # Encode to JPEG
            _, buffer = cv2.imencode('.jpg', frame)
            # Convert to base64
            image_base64 = base64.b64encode(buffer).decode('utf-8')
            # Add data URL prefix
            image_base64 = f"data:image/jpeg;base64,{image_base64}"
            cap.release()
            cv2.destroyAllWindows()
            print("Image captured!")
            return image_base64
        
        elif key == 27:  # ESC to cancel
            cap.release()
            cv2.destroyAllWindows()
            print("Cancelled")
            return None
    
    cap.release()
    cv2.destroyAllWindows()
    return None

def test_register(voter_id: str, image_base64: str):
    """Test face registration endpoint."""
    print(f"\nTesting face registration for voter_id: {voter_id}")
    
    url = "http://localhost:8000/face/register"
    payload = {
        "voter_id": voter_id,
        "image": image_base64
    }
    
    try:
        response = requests.post(url, json=payload)
        data = response.json()
        
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(data, indent=2)}")
        
        if response.status_code == 200 and data.get('success'):
            print("✓ Registration successful!")
        else:
            print("✗ Registration failed")
            
    except Exception as e:
        print(f"Error: {str(e)}")

def test_verify(voter_id: str, image_base64: str):
    """Test face verification endpoint."""
    print(f"\nTesting face verification for voter_id: {voter_id}")
    
    url = "http://localhost:8000/face/verify"
    payload = {
        "voter_id": voter_id,
        "image": image_base64
    }
    
    try:
        response = requests.post(url, json=payload)
        data = response.json()
        
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(data, indent=2)}")
        
        if response.status_code == 200:
            if data.get('verified'):
                print("✓ Verification successful - Face matched!")
            else:
                print("✗ Verification failed - Face did not match")
        else:
            print("✗ Verification request failed")
            
    except Exception as e:
        print(f"Error: {str(e)}")

def main():
    print("=" * 70)
    print("Live Face Registration/Verification Test")
    print("=" * 70)
    print()
    print("Make sure FastAPI server is running on http://localhost:8000")
    print()
    
    # Capture image from webcam
    image_base64 = capture_webcam_image()
    
    if not image_base64:
        print("No image captured. Exiting.")
        return
    
    # Get voter_id
    voter_id = input("\nEnter voter_id to test (e.g., XIC5988183): ").strip()
    
    if not voter_id:
        print("No voter_id provided. Exiting.")
        return
    
    # Choose action
    print("\nChoose action:")
    print("1. Register face")
    print("2. Verify face")
    print("3. Both")
    
    choice = input("Enter choice (1/2/3): ").strip()
    
    if choice == "1" or choice == "3":
        test_register(voter_id, image_base64)
    
    if choice == "2" or choice == "3":
        test_verify(voter_id, image_base64)
    
    print("\n" + "=" * 70)
    print("Test complete!")
    print("=" * 70)

if __name__ == "__main__":
    main()

