"""
Voter ID Details Fetcher - Election Commission of India
This script uses the direct API endpoints to fetch voter details from the ECI website.
No Selenium needed - purely API-based approach.

FastAPI Backend with EPIC/CAPTCHA functionality and Face Recognition endpoints.
"""

import requests
import json
import base64
import traceback
from PIL import Image
from io import BytesIO
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from backend.face import get_embedder, get_storage
import numpy as np


class VoterIDFetcher:
    def __init__(self, epic_number, state=None):
        """
        Initialize the Voter ID Fetcher.
        
        Args:
            epic_number (str): The EPIC number to search for
            state (str, optional): State name if required for search
        """
        self.epic_number = epic_number
        self.state = state
        self.captcha_text = None
        self.captcha_id = None
        self.session = requests.Session()
        
        # API endpoints
        self.captcha_api_url = "https://gateway-voters.eci.gov.in/api/v1/captcha-service/generateCaptcha"
        self.search_api_url = "https://gateway-voters.eci.gov.in/api/v1/elastic/search-by-epic-from-national-display"
        
        # Set up session headers to match browser request
        self.session.headers.update({
            'accept': 'application/json, text/plain, */*',
            'accept-language': 'en-IN,en;q=0.9,hi;q=0.8,mr;q=0.7',
            'applicationname': 'ELECTORAL-SEARCH',
            'appname': 'ELECTORAL-SEARCH',
            'channelidobo': 'ELECTORAL-SEARCH',
            'content-type': 'application/json',
            'origin': 'https://electoralsearch.eci.gov.in',
            'referer': 'https://electoralsearch.eci.gov.in/',
            'sec-ch-ua': '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-site',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36'
        })
        
    def establish_session(self):
        """
        Visit the main website to establish a session before calling API.
        """
        print("Establishing session with ECI website...")
        try:
            # Visit the main page to get cookies
            response = self.session.get(
                "https://electoralsearch.eci.gov.in/",
                timeout=30
            )
            print(f"Session established. Status: {response.status_code}")
            return response.status_code == 200
        except Exception as e:
            print(f"Error establishing session: {e}")
            return False
    
    def generate_captcha(self):
        """
        Call the CAPTCHA generation API to get the CAPTCHA image and ID.
        """
        print("Generating CAPTCHA...")
        
        try:
            # Make GET request to CAPTCHA API
            response = self.session.get(
                self.captcha_api_url,
                timeout=30
            )
            
            print(f"CAPTCHA API Response Status: {response.status_code}")
            
            # Check if request was successful
            if response.status_code == 200:
                try:
                    data = response.json()
                    
                    # Check if captcha was generated successfully
                    if data.get("status") == "Success" and data.get("statusCode") == 200:
                        captcha_base64 = data.get("captcha")
                        captcha_id = data.get("id")
                        
                        if not captcha_base64 or not captcha_id:
                            print("Error: Missing captcha or ID in response")
                            return False
                        
                        print(f"CAPTCHA generated successfully! ID: {captcha_id}")
                        
                        # Save captcha ID for later use
                        self.captcha_id = captcha_id
                        
                        # Decode base64 image
                        captcha_image_data = base64.b64decode(captcha_base64)
                        
                        # Save as PNG file
                        captcha_screenshot_path = "captcha.png"
                        with open(captcha_screenshot_path, 'wb') as f:
                            f.write(captcha_image_data)
                        print(f"CAPTCHA saved as {captcha_screenshot_path}")
                        
                        # Try to open the image automatically
                        try:
                            img = Image.open(BytesIO(captcha_image_data))
                            img.show()
                            print("CAPTCHA image opened in default image viewer.")
                        except Exception as e:
                            print(f"Could not auto-open image: {e}")
                            print(f"Please open {captcha_screenshot_path} manually.")
                        
                        return True
                    else:
                        print(f"Error: CAPTCHA generation failed. Response: {data}")
                        return False
                        
                except json.JSONDecodeError:
                    print(f"Error: Response is not valid JSON")
                    print(f"Response text: {response.text[:500]}")
                    return False
            else:
                print(f"Error: API returned status code {response.status_code}")
                print(f"Response text: {response.text[:500]}")
                return False
                
        except requests.exceptions.RequestException as e:
            print(f"Error calling CAPTCHA API: {e}")
            return False
    
    def get_state_code(self, state_name):
        """
        Map state name to state code.
        Add more mappings as needed.
        """
        state_mapping = {
            "maharashtra": "S13",
            "delhi": "S07",
            "karnataka": "S10",
            "tamil nadu": "S22",
            "west bengal": "S25",
            "uttar pradesh": "S24",
            "gujarat": "S06",
            "rajasthan": "S20",
            "madhya pradesh": "S12",
            "kerala": "S11",
            "andhra pradesh": "S01",
            "telangana": "S29",
            "bihar": "S04",
            "odisha": "S18",
            "punjab": "S19",
            "haryana": "S08",
            "assam": "S03",
            "jharkhand": "S09",
            "chhattisgarh": "S26",
            "uttarakhand": "S28",
            "himachal pradesh": "S02",
            "goa": "S05",
            # Add more states as needed
        }
        
        state_lower = state_name.lower().strip()
        return state_mapping.get(state_lower)
    
    def get_captcha_input(self):
        """
        Get CAPTCHA text from user via terminal input.
        """
        # Get CAPTCHA text from user
        captcha_text = input("\nEnter the CAPTCHA text you see: ").strip()
        
        if not captcha_text:
            raise ValueError("CAPTCHA text cannot be empty!")
        
        self.captcha_text = captcha_text
        print("CAPTCHA text captured!")
    
    def call_search_api(self):
        """
        Call the ECI search API endpoint with EPIC number, CAPTCHA text, and CAPTCHA ID.
        """
        print("Calling ECI search API endpoint...")
        
        if not self.captcha_text or not self.captcha_id:
            print("Error: CAPTCHA text or ID is missing!")
            return None
        
        # Prepare request body - exact format from browser network inspection
        request_body = {
            "isPortal": True,  # Boolean flag indicating portal access
            "epicNumber": self.epic_number.upper(),
            "captchaData": self.captcha_text.lower(),
            "captchaId": self.captcha_id,
            "securityKey": "na"  # Fixed value as per API requirement
        }
        
        # Add state code if provided
        # Note: stateCd requires state code (e.g., "S13") not state name
        # If state name is provided, we'll try to map it to state code
        if self.state:
            state_code = self.get_state_code(self.state)
            if state_code:
                request_body["stateCd"] = state_code
        
        print(f"Request body: {json.dumps(request_body, indent=2)}")
        print(f"Session cookies: {self.session.cookies.get_dict()}")
        
        try:
            # Make POST request to search API
            response = self.session.post(
                self.search_api_url,
                json=request_body,
                timeout=30
            )
            
            print(f"Search API Response Status: {response.status_code}")
            print(f"Response Headers: {dict(response.headers)}")
            
            # Check if request was successful
            if response.status_code == 200:
                try:
                    data = response.json()
                    return data
                except json.JSONDecodeError:
                    print(f"Error: Response is not valid JSON")
                    print(f"Response text: {response.text[:500]}")
                    return None
            else:
                print(f"Error: API returned status code {response.status_code}")
                print(f"Response text: {response.text}")
                print(f"Response content type: {response.headers.get('content-type', 'unknown')}")
                
                # Try to parse error response
                try:
                    error_data = response.json()
                    print(f"Error JSON: {json.dumps(error_data, indent=2)}")
                except:
                    pass
                
                return None
                
        except requests.exceptions.RequestException as e:
            print(f"Error calling search API: {e}")
            return None
    
    def extract_voter_details(self, api_response):
        """
        Extract and format voter details from API response.
        """
        if not api_response:
            return None
        
        print("Extracting voter details from API response...")
        
        # Check if there's an error or no results
        if isinstance(api_response, dict):
            # Check for error messages
            if "message" in api_response:
                message = str(api_response.get("message", ""))
                if "not found" in message.lower() or "no data" in message.lower():
                    print(f"API Message: {message}")
                    return None
            
            # Check for success/error indicators
            if "status" in api_response:
                status = api_response.get("status")
                if status and "error" in str(status).lower():
                    error_msg = api_response.get("message", "Unknown error")
                    print(f"API Error: {error_msg}")
                    return None
        
        # Extract voter details - structure may vary, so we'll try multiple patterns
        voter_data = {}
        
        # Common field mappings based on actual API response
        field_mappings = {
            'epic_number': ['epicNumber', 'epic', 'epicNo'],
            'name': ['fullName', 'name', 'electorName', 'voterName'],
            'first_name': ['applicantFirstName'],
            'last_name': ['applicantLastName'],
            'relative_name': ['relativeFullName', 'relativeName', 'relationName', 'fatherName', 'husbandName'],
            'relation_type': ['relationType'],
            'age': ['age'],
            'gender': ['gender'],
            'state': ['stateName', 'state'],
            'district': ['districtValue', 'district', 'districtName'],
            'assembly_constituency': ['asmblyName', 'assemblyConstituency', 'constituency', 'acName'],
            'ac_number': ['acNumber'],
            'parliament_constituency': ['prlmntName'],
            'parliament_number': ['prlmntNo'],
            'part_number': ['partNumber', 'partNo'],
            'part_name': ['partName'],
            'serial_number': ['partSerialNumber', 'serialNumber', 'serialNo', 'slNo'],
            'section_number': ['sectionNo'],
            'polling_station': ['psbuildingName', 'pollingStation', 'psName'],
            'polling_station_address': ['buildingAddress'],
            'polling_station_room': ['psRoomDetails'],
            'part_lat_long': ['partLatLong', 'latLong'],
        }
        
        # Try to extract from response
        # The response is a list with objects containing "content" field
        data_to_process = None
        
        if isinstance(api_response, list) and len(api_response) > 0:
            # Get first result
            first_result = api_response[0]
            # The actual voter data is in the "content" field
            if isinstance(first_result, dict) and "content" in first_result:
                data_to_process = first_result["content"]
            else:
                data_to_process = first_result
        elif isinstance(api_response, dict):
            # Check if data is nested
            if "content" in api_response:
                data_to_process = api_response["content"]
            elif "data" in api_response:
                data_to_process = api_response["data"]
                if isinstance(data_to_process, list) and len(data_to_process) > 0:
                    data_to_process = data_to_process[0]
                    if isinstance(data_to_process, dict) and "content" in data_to_process:
                        data_to_process = data_to_process["content"]
            elif "response" in api_response:
                data_to_process = api_response["response"]
                if isinstance(data_to_process, list) and len(data_to_process) > 0:
                    data_to_process = data_to_process[0]
            else:
                data_to_process = api_response
        
        if data_to_process and isinstance(data_to_process, dict):
            # Extract fields using mappings
            for field_name, possible_keys in field_mappings.items():
                for key in possible_keys:
                    # Case-insensitive key matching
                    for actual_key in data_to_process.keys():
                        if key.lower() == actual_key.lower():
                            value = data_to_process[actual_key]
                            if value and str(value).strip() not in ['', 'N/A', 'NA', 'null', 'None']:
                                voter_data[field_name] = str(value).strip()
                                break
                    if field_name in voter_data:
                        break
            
            # If no structured data found, try to get all non-empty string values
            if not voter_data:
                print("Warning: Could not map fields using known keys. Extracting all fields...")
                for key, value in data_to_process.items():
                    if isinstance(value, (str, int)) and str(value).strip() not in ['', 'N/A', 'NA', 'null', 'None']:
                        voter_data[key] = str(value).strip()
        else:
            # Fallback: return the raw response structure
            print("Warning: Could not parse API response structure. Returning raw data.")
            return api_response
        
        return voter_data if voter_data else None
    
    def run(self):
        """Main execution method."""
        try:
            # Step 1: Establish session with website
            if not self.establish_session():
                print("Failed to establish session. Exiting.")
                return None
            
            # Step 2: Generate CAPTCHA
            if not self.generate_captcha():
                print("Failed to generate CAPTCHA. Exiting.")
                return None
            
            # Step 3: Get CAPTCHA text from user
            self.get_captcha_input()
            
            # Step 4: Call search API with EPIC number, CAPTCHA text, and CAPTCHA ID
            api_response = self.call_search_api()
            
            # Step 5: Extract and display results
            if api_response:
                print("\nRaw API Response:")
                print(json.dumps(api_response, indent=2, ensure_ascii=False))
                print("\n" + "="*50)
                
                voter_details = self.extract_voter_details(api_response)
                
                if voter_details:
                    # Print as JSON
                    print("VOTER DETAILS:")
                    print("="*50)
                    print(json.dumps(voter_details, indent=2, ensure_ascii=False))
                    print("="*50)
                    return voter_details
                else:
                    print("\nNo voter details found in API response.")
                    return None
            else:
                print("\nFailed to get response from search API.")
                return None
                
        except Exception as e:
            print(f"\nError during execution: {e}")
            import traceback
            traceback.print_exc()
            raise


# FastAPI Application
app = FastAPI(
    title="Voter ID Checker API",
    description="API for fetching voter details from ECI and face recognition",
    version="1.0.0"
)

# CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for request/response
class GenerateCaptchaResponse(BaseModel):
    success: bool
    captcha: Optional[str] = None
    id: Optional[str] = None
    error: Optional[str] = None

class SearchVoterRequest(BaseModel):
    epicNumber: str
    state: Optional[str] = None
    captchaText: str
    captchaId: str

class SearchVoterResponse(BaseModel):
    success: bool
    data: Optional[dict] = None
    error: Optional[str] = None

class FaceRegisterRequest(BaseModel):
    voter_id: str
    image: str  # base64 encoded image
    full_name: Optional[str] = None  # Optional: voter's full name

class FaceRegisterResponse(BaseModel):
    success: bool
    message: str
    voter_id: Optional[str] = None
    cropped_face: Optional[str] = None  # Base64 encoded cropped face image

class FaceVerifyRequest(BaseModel):
    voter_id: str
    image: str  # base64 encoded image

class FaceVerifyResponse(BaseModel):
    success: bool
    verified: bool
    confidence: Optional[float] = None
    message: str
    cropped_face: Optional[str] = None  # Base64 encoded cropped face image

# FastAPI Endpoints

@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Voter ID Checker API",
        "version": "1.0.0",
        "endpoints": {
            "generate_captcha": "GET /captcha/generate",
            "search_voter": "POST /voter/search",
            "face_register": "POST /face/register",
            "face_verify": "POST /face/verify"
        }
    }

@app.get("/captcha/generate", response_model=GenerateCaptchaResponse)
async def generate_captcha():
    """
    Generate CAPTCHA from ECI API.
    Returns base64 encoded CAPTCHA image and session ID.
    """
    try:
        # Create a temporary fetcher instance
        fetcher = VoterIDFetcher(epic_number="dummy", state=None)
        
        # Establish session
        if not fetcher.establish_session():
            return GenerateCaptchaResponse(
                success=False,
                error="Failed to establish session with ECI website"
            )
        
        # Generate CAPTCHA
        if not fetcher.generate_captcha():
            return GenerateCaptchaResponse(
                success=False,
                error="Failed to generate CAPTCHA"
            )
        
        # Get the CAPTCHA data from the saved file
        try:
            with open("captcha.png", "rb") as f:
                captcha_image_data = f.read()
                captcha_base64 = base64.b64encode(captcha_image_data).decode('utf-8')
        except Exception as e:
            return GenerateCaptchaResponse(
                success=False,
                error=f"Failed to read CAPTCHA image: {str(e)}"
            )
        
        return GenerateCaptchaResponse(
            success=True,
            captcha=captcha_base64,
            id=fetcher.captcha_id
        )
    except Exception as e:
        return GenerateCaptchaResponse(
            success=False,
            error=str(e)
        )

@app.post("/voter/search", response_model=SearchVoterResponse)
async def search_voter(request: SearchVoterRequest):
    """
    Search for voter details by EPIC number.
    Requires CAPTCHA text and CAPTCHA ID from generate_captcha endpoint.
    """
    try:
        # Create fetcher instance
        fetcher = VoterIDFetcher(epic_number=request.epicNumber, state=request.state)
        fetcher.captcha_text = request.captchaText
        fetcher.captcha_id = request.captchaId
        
        # Establish session
        if not fetcher.establish_session():
            return SearchVoterResponse(
                success=False,
                error="Failed to establish session with ECI website"
            )
        
        # Call search API
        api_response = fetcher.call_search_api()
        
        if api_response:
            # Extract voter details
            voter_details = fetcher.extract_voter_details(api_response)
            
            if voter_details:
                return SearchVoterResponse(
                    success=True,
                    data=voter_details
                )
            else:
                return SearchVoterResponse(
                    success=False,
                    error="No voter details found for this EPIC number"
                )
        else:
            return SearchVoterResponse(
                success=False,
                error="Failed to get response from ECI search API"
            )
    except Exception as e:
        return SearchVoterResponse(
            success=False,
            error=str(e)
        )

@app.post("/face/register", response_model=FaceRegisterResponse)
async def face_register(request: FaceRegisterRequest):
    """
    Register a face for a voter ID.
    
    Flow:
    1. Accept voter_id and base64 image
    2. Use DeepFace (ArcFace + RetinaFace) to detect exactly one face and generate embedding
    3. Store embedding in DB (rejects if voter_id already exists)
    4. Return success response
    """
    try:
        # Step 1: Validate inputs
        if not request.voter_id or not request.voter_id.strip():
            raise HTTPException(status_code=400, detail="voter_id is required")
        
        if not request.image or not request.image.strip():
            raise HTTPException(status_code=400, detail="image (base64) is required")
        
        voter_id = request.voter_id.strip()
        
        # Check if voter_id already exists (duplicate check)
        storage = get_storage()
        if storage.voter_exists(voter_id):
            raise HTTPException(
                status_code=400, 
                detail=f"Duplicate registration: voter_id '{voter_id}' already exists in database"
            )
        
        # Step 2: Generate embedding from base64 image using DeepFace
        embedder = get_embedder()
        try:
            embedding = embedder.generate_embedding_from_base64(request.image)
        except ValueError as e:
            # DeepFace will raise if no face or multiple faces are detected
            raise HTTPException(status_code=400, detail=str(e))
        
        # Step 3: Store embedding in DB
        # Get full_name from request or use voter_id as fallback
        full_name = request.full_name.strip() if request.full_name else voter_id
        
        store_success, store_error = storage.store_embedding(
            voter_id=voter_id,
            full_name=full_name,
            embedding=embedding
        )
        
        if not store_success:
            raise HTTPException(status_code=400, detail=store_error)
        
        # Step 4: Return success response
        return FaceRegisterResponse(
            success=True,
            message=f"Face successfully registered for voter_id: {voter_id}",
            voter_id=voter_id,
            cropped_face=None
        )
        
    except HTTPException:
        raise
    except Exception as exc:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail="Internal server error during face processing"
        )

@app.post("/face/verify", response_model=FaceVerifyResponse)
async def face_verify(request: FaceVerifyRequest):
    """
    Verify a face against a registered voter ID using DeepFace (ArcFace).
    - Accepts voter_id and base64 encoded image.
    - Uses DeepFace.represent() to generate embeddings.
    - Compares embeddings with cosine similarity and threshold.
    """
    try:
        # Validate inputs
        if not request.voter_id or not request.voter_id.strip():
            raise HTTPException(status_code=400, detail="voter_id is required")
        
        if not request.image or not request.image.strip():
            raise HTTPException(status_code=400, detail="image (base64) is required")
        
        voter_id = request.voter_id.strip()
        
        # Step 1: Check if voter_id exists in database
        storage = get_storage()
        registered_data = storage.get_embedding(voter_id)
        
        if not registered_data:
            raise HTTPException(
                status_code=404,
                detail=f"voter_id '{voter_id}' not found in database. Please register first."
            )
        
        # Step 2: Generate embedding from captured face using DeepFace
        embedder = get_embedder()
        try:
            captured_embedding = embedder.generate_embedding_from_base64(request.image)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        
        # Step 3: Get registered embedding
        registered_embedding = registered_data['embedding']
        
        # Step 4: Compare embeddings using cosine similarity
        similarity = embedder.compare_embeddings(captured_embedding, registered_embedding)
        
        # DeepFace's default ArcFace + cosine verification threshold is ~0.68
        # DeepFace's default ArcFace + cosine verification threshold is ~0.68
        # User requested override to 0.50
        similarity_threshold = 0.50
        
        verified = similarity >= similarity_threshold
        confidence = float(similarity)
        
        # Step 7: Return verification result
        if verified:
            message = f"Face verified successfully! Similarity: {confidence:.2%}"
        else:
            message = f"Face verification failed. Similarity: {confidence:.2%} (threshold: {similarity_threshold:.2%})"
        
        return FaceVerifyResponse(
            success=True,
            verified=verified,
            confidence=confidence,
            message=message,
            cropped_face=None
        )
    except HTTPException:
        raise
    except Exception as exc:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail="Internal server error during face processing"
        )

# CLI function for backward compatibility
def main():
    """Main function to run the script as CLI."""
    print("="*50)
    print("Voter ID Details Fetcher - ECI (Pure API Mode)")
    print("="*50)
    
    # Get EPIC number from user
    epic_number = input("Enter EPIC Number: ").strip()
    if not epic_number:
        print("EPIC number is required!")
        return
    
    # Get state (optional)
    state = input("Enter State (optional, press Enter to skip): ").strip()
    if not state:
        state = None
    
    # Create fetcher instance and run
    fetcher = VoterIDFetcher(epic_number=epic_number, state=state)
    fetcher.run()


if __name__ == "__main__":
    import uvicorn
    # Run FastAPI server
    uvicorn.run(app, host="0.0.0.0", port=8000)
