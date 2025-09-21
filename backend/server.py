from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import logging
import json
from typing import Dict, Any, Optional, List
from datetime import datetime
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

from llm.service import ConversationSummarizer
from database.connection import connect_to_mongo, close_mongo_connection
# Auth0 verification removed - frontend handles authentication
from database.services import user_service, patient_service
from database.models import (
    UserCreate, UserUpdate, UserResponse, UserProfileResponse,
    PatientCreate, PatientUpdate, PatientResponse, PatientListResponse, PatientDetailResponse,
    StandardResponse, ConversationCreate, ConversationResponse
)

# Load environment variables
load_dotenv()

# Lifecycle management
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    try:
        await connect_to_mongo()
        logger.info("MongoDB connected successfully")
    except Exception as e:
        logger.warning(f"MongoDB connection failed: {e}. Running without database.")
    yield
    # Shutdown
    try:
        await close_mongo_connection()
    except Exception as e:
        logger.warning(f"Error closing MongoDB connection: {e}")

app = FastAPI(
    title="DocLess Medical API", 
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Ollama configuration
MODEL_NAME = "qwen3:8b"  # Using your downloaded qwen3:8b model

# Pydantic models for request/response validation
class ConversationRequest(BaseModel):
    conversation: str

class HealthResponse(BaseModel):
    status: str
    ollama_connected: bool
    model: str
    timestamp: str

class SummaryResponse(BaseModel):
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class TestConversationResponse(BaseModel):
    success: bool
    sample_conversation: Optional[str] = None
    generated_summary: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

# Initialize summarizer
summarizer = ConversationSummarizer(MODEL_NAME)

# Auth0 verification moved to frontend - backend accepts direct requests

# Simple helper to get user email from headers
def get_user_email_from_header(x_user_email: str = Header(None)) -> str:
    if not x_user_email:
        raise HTTPException(
            status_code=400,
            detail="User email header (X-User-Email) is required"
        )
    return x_user_email

# ==================== USER MANAGEMENT ENDPOINTS ====================

@app.post('/auth/register', response_model=UserProfileResponse)
async def register_user(user_data: UserCreate):
    """Register a new user or get existing user after Auth0 login"""
    try:
        # Validate required fields
        if not user_data.email or not user_data.auth0_user_id:
            raise HTTPException(
                status_code=400,
                detail="Email and Auth0 user ID are required"
            )
        
        # Create or get existing user
        user = await user_service.create_user(user_data)
        user_response = await user_service.get_user_response(user)
        
        return UserProfileResponse(
            success=True,
            message="User registered successfully" if user.created_at == user.updated_at else "User already exists",
            data=user_response
        )
        
    except Exception as e:
        logger.error(f"Error registering user: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to register user: {str(e)}"
        )

@app.get('/auth/profile', response_model=UserProfileResponse)
async def get_user_profile(user_email: str = Depends(get_user_email_from_header)):
    """Get current user's profile"""
    try:
        user = await user_service.get_user_by_email(user_email)
        
        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found. Please complete registration first."
            )
        
        user_response = await user_service.get_user_response(user)
        
        return UserProfileResponse(
            success=True,
            message="Profile retrieved successfully",
            data=user_response
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user profile: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get profile: {str(e)}"
        )

@app.put('/auth/profile', response_model=UserProfileResponse)
async def update_user_profile(
    user_update: UserUpdate,
    user_email: str = Depends(get_user_email_from_header)
):
    """Update current user's profile"""
    try:
        # Get current user
        user = await user_service.get_user_by_email(user_email)
        
        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found. Please complete registration first."
            )
        
        # Update user
        updated_user = await user_service.update_user(str(user.id), user_update)
        
        if not updated_user:
            raise HTTPException(
                status_code=400,
                detail="Failed to update profile"
            )
        
        user_response = await user_service.get_user_response(updated_user)
        
        return UserProfileResponse(
            success=True,
            message="Profile updated successfully",
            data=user_response
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating user profile: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update profile: {str(e)}"
        )

# ==================== PATIENT MANAGEMENT ENDPOINTS ====================

@app.post('/patients', response_model=PatientDetailResponse)
async def create_patient(
    patient_data: PatientCreate,
    user_email: str = Depends(get_user_email_from_header)
):
    """Create a new patient"""
    try:
        # Get current user
        user = await user_service.get_user_by_email(user_email)
        
        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found. Please complete registration first."
            )
        
        # Create patient
        patient = await patient_service.create_patient(patient_data, str(user.id))
        patient_response = patient_service.patient_to_response(patient)
        
        return PatientDetailResponse(
            success=True,
            message="Patient created successfully",
            data=patient_response
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating patient: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create patient: {str(e)}"
        )

@app.get('/patients', response_model=PatientListResponse)
async def get_patients(
    user_email: str = Depends(get_user_email_from_header)
):
    """Get all patients for the current user"""
    try:
        # Get current user
        user = await user_service.get_user_by_email(user_email)
        
        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found. Please complete registration first."
            )
        
        # Get patients
        patients = await patient_service.get_patients_by_doctor(str(user.id))
        patient_responses = [patient_service.patient_to_response(p) for p in patients]
        
        return PatientListResponse(
            success=True,
            message=f"Retrieved {len(patient_responses)} patients",
            data=patient_responses
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting patients: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get patients: {str(e)}"
        )

@app.get('/patients/{patient_id}', response_model=PatientDetailResponse)
async def get_patient(
    patient_id: str,
    user_email: str = Depends(get_user_email_from_header)
):
    """Get a specific patient by ID"""
    try:
        # Get current user
        user = await user_service.get_user_by_email(user_email)
        
        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found. Please complete registration first."
            )
        
        # Get patient
        patient = await patient_service.get_patient_by_id(patient_id)
        
        if not patient:
            raise HTTPException(
                status_code=404,
                detail="Patient not found"
            )
        
        # Check if patient belongs to current user
        if str(patient.doctor_id) != str(user.id):
            raise HTTPException(
                status_code=403,
                detail="Access denied. This patient does not belong to you."
            )
        
        patient_response = patient_service.patient_to_response(patient)
        
        return PatientDetailResponse(
            success=True,
            message="Patient retrieved successfully",
            data=patient_response
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting patient: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get patient: {str(e)}"
        )

@app.put('/patients/{patient_id}', response_model=PatientDetailResponse)
async def update_patient(
    patient_id: str,
    patient_update: PatientUpdate,
    user_email: str = Depends(get_user_email_from_header)
):
    """Update a patient's information"""
    try:
        # Get current user
        user = await user_service.get_user_by_email(user_email)
        
        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found. Please complete registration first."
            )
        
        # Get patient to verify ownership
        patient = await patient_service.get_patient_by_id(patient_id)
        
        if not patient:
            raise HTTPException(
                status_code=404,
                detail="Patient not found"
            )
        
        # Check if patient belongs to current user
        if str(patient.doctor_id) != str(user.id):
            raise HTTPException(
                status_code=403,
                detail="Access denied. This patient does not belong to you."
            )
        
        # Update patient
        updated_patient = await patient_service.update_patient(patient_id, patient_update)
        
        if not updated_patient:
            raise HTTPException(
                status_code=400,
                detail="Failed to update patient"
            )
        
        patient_response = patient_service.patient_to_response(updated_patient)
        
        return PatientDetailResponse(
            success=True,
            message="Patient updated successfully",
            data=patient_response
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating patient: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update patient: {str(e)}"
        )

@app.delete('/patients/{patient_id}', response_model=StandardResponse)
async def delete_patient(
    patient_id: str,
    user_email: str = Depends(get_user_email_from_header)
):
    """Delete a patient (soft delete)"""
    try:
        # Get current user
        user = await user_service.get_user_by_email(user_email)
        
        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found. Please complete registration first."
            )
        
        # Get patient to verify ownership
        patient = await patient_service.get_patient_by_id(patient_id)
        
        if not patient:
            raise HTTPException(
                status_code=404,
                detail="Patient not found"
            )
        
        # Check if patient belongs to current user
        if str(patient.doctor_id) != str(user.id):
            raise HTTPException(
                status_code=403,
                detail="Access denied. This patient does not belong to you."
            )
        
        # Delete patient
        success = await patient_service.delete_patient(patient_id)
        
        if not success:
            raise HTTPException(
                status_code=400,
                detail="Failed to delete patient"
            )
        
        return StandardResponse(
            success=True,
            message="Patient deleted successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting patient: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete patient: {str(e)}"
        )

# ==================== CONVERSATION HISTORY ENDPOINTS ====================

@app.get('/patients/{patient_id}/conversations', response_model=StandardResponse)
async def get_patient_conversations(
    patient_id: str,
    user_email: str = Depends(get_user_email_from_header)
):
    """Get conversation history for a specific patient"""
    try:
        # Get current user
        user = await user_service.get_user_by_email(user_email)
        
        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found. Please complete registration first."
            )
        
        # Verify patient belongs to user
        patient = await patient_service.get_patient_by_id(patient_id)
        
        if not patient:
            raise HTTPException(
                status_code=404,
                detail="Patient not found"
            )
        
        if str(patient.doctor_id) != str(user.id):
            raise HTTPException(
                status_code=403,
                detail="Access denied. This patient does not belong to you."
            )
        
        # Get conversations
        from database.connection import get_database, CONVERSATIONS_COLLECTION
        from bson import ObjectId
        
        db = get_database()
        cursor = db[CONVERSATIONS_COLLECTION].find({
            "patient_id": ObjectId(patient_id)
        }).sort("conversation_date", -1)  # Most recent first
        
        conversations = []
        async for conv_doc in cursor:
            conversations.append({
                "id": str(conv_doc["_id"]),
                "conversation_date": conv_doc["conversation_date"],
                "summary": conv_doc["summary"],
                "created_at": conv_doc["created_at"]
            })
        
        return StandardResponse(
            success=True,
            message=f"Retrieved {len(conversations)} conversations",
            data=conversations
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting patient conversations: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get conversations: {str(e)}"
        )

# ==================== EXISTING CONVERSATION ENDPOINTS ===================

@app.get('/health', response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    try:
        ollama_status = summarizer.check_ollama_connection()
        return HealthResponse(
            status='healthy',
            ollama_connected=ollama_status,
            model=MODEL_NAME,
            timestamp=datetime.now().isoformat()
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                'status': 'error',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
        )

class ConversationRequestWithPatient(BaseModel):
    conversation: str
    patient_id: Optional[str] = None

@app.post('/summarize-conversation', response_model=SummaryResponse)
async def summarize_conversation(
    request: ConversationRequestWithPatient,
    user_email: str = Depends(get_user_email_from_header)
):
    """Endpoint to summarize nurse-patient conversations with optional patient linking"""
    try:
        conversation_text = request.conversation
        
        if not conversation_text.strip():
            raise HTTPException(status_code=400, detail='Conversation text cannot be empty')
        
        logger.info(f"Processing conversation of length: {len(conversation_text)} characters")
        
        # Generate summary
        summary = summarizer.generate_summary(conversation_text)
        
        # If patient_id is provided, save the conversation to database
        if request.patient_id:
            try:
                # Get current user
                user = await user_service.get_user_by_email(user_email)
                
                if user:
                    # Verify patient belongs to user
                    patient = await patient_service.get_patient_by_id(request.patient_id)
                    
                    if patient and str(patient.doctor_id) == str(user.id):
                        # Save conversation to database
                        from database.connection import get_database, CONVERSATIONS_COLLECTION
                        from bson import ObjectId
                        
                        db = get_database()
                        conversation_doc = {
                            "patient_id": ObjectId(request.patient_id),
                            "doctor_id": user.id,
                            "conversation_text": conversation_text,
                            "summary": summary,
                            "conversation_date": datetime.utcnow(),
                            "created_at": datetime.utcnow()
                        }
                        
                        await db[CONVERSATIONS_COLLECTION].insert_one(conversation_doc)
                        logger.info(f"Saved conversation for patient: {request.patient_id}")
                        
            except Exception as e:
                logger.warning(f"Failed to save conversation to database: {e}")
                # Continue without saving - don't fail the summarization
        
        return SummaryResponse(
            success=True,
            data=summary
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing conversation: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                'success': False,
                'error': str(e)
            }
        )

@app.get('/test-conversation', response_model=TestConversationResponse)
async def test_conversation():
    """Test endpoint with sample conversation"""
    try:
        sample_conversation = summarizer.get_sample_conversation()
        summary = summarizer.generate_summary(sample_conversation)
        
        return TestConversationResponse(
            success=True,
            sample_conversation=sample_conversation,
            generated_summary=summary
        )
    except Exception as e:
        logger.error(f"Error in test conversation: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                'success': False,
                'error': str(e)
            }
        )

@app.post('/summarize-conversation-stream')
async def summarize_conversation_stream(request: ConversationRequest):
    """Streaming endpoint for real-time conversation summarization"""
    try:
        conversation_text = request.conversation
        
        if not conversation_text.strip():
            raise HTTPException(status_code=400, detail='Conversation text cannot be empty')
        
        logger.info(f"Starting streaming processing of conversation of length: {len(conversation_text)} characters")
        
        def event_stream():
            """Generator function for Server-Sent Events"""
            try:
                for chunk in summarizer.generate_summary_stream(conversation_text):
                    # Format as Server-Sent Events
                    event_data = json.dumps(chunk)
                    yield f"data: {event_data}\n\n"
                
                # Send final event to indicate completion
                yield f"data: {json.dumps({'type': 'complete', 'data': {'message': 'Stream completed'}})}\n\n"
                
            except Exception as e:
                logger.error(f"Error in streaming: {e}")
                error_data = json.dumps({
                    'type': 'error',
                    'data': {
                        'error': str(e),
                        'timestamp': datetime.now().isoformat()
                    }
                })
                yield f"data: {error_data}\n\n"
        
        return StreamingResponse(
            event_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"  # Disable nginx buffering
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error setting up streaming: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                'success': False,
                'error': str(e)
            }
        )

@app.get('/test-conversation-stream')
async def test_conversation_stream():
    """Streaming test endpoint with sample conversation"""
    try:
        sample_conversation = summarizer.get_sample_conversation()
        logger.info("Starting streaming test with sample conversation")
        
        def event_stream():
            """Generator function for Server-Sent Events"""
            try:
                # First send the sample conversation
                initial_data = json.dumps({
                    'type': 'sample',
                    'data': {
                        'sample_conversation': sample_conversation,
                        'message': 'Starting analysis...'
                    }
                })
                yield f"data: {initial_data}\n\n"
                
                # Then stream the analysis
                for chunk in summarizer.generate_summary_stream(sample_conversation):
                    event_data = json.dumps(chunk)
                    yield f"data: {event_data}\n\n"
                
                # Send completion event
                yield f"data: {json.dumps({'type': 'complete', 'data': {'message': 'Stream completed'}})}\n\n"
                
            except Exception as e:
                logger.error(f"Error in test streaming: {e}")
                error_data = json.dumps({
                    'type': 'error',
                    'data': {
                        'error': str(e),
                        'timestamp': datetime.now().isoformat()
                    }
                })
                yield f"data: {error_data}\n\n"
        
        return StreamingResponse(
            event_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"
            }
        )
        
    except Exception as e:
        logger.error(f"Error in test streaming: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                'success': False,
                'error': str(e)
            }
        )

if __name__ == '__main__':
    import uvicorn
    print("Starting Medical Conversation Summarizer Server...")
    print(f"Using model: {MODEL_NAME}")
    print("Make sure Ollama is running with: ollama serve")
    print(f"And that you have the model: ollama pull {MODEL_NAME}")
    print("API documentation will be available at: http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000)
