from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import logging
import json
from typing import Dict, Any, Optional
from datetime import datetime
from llm_service import ConversationSummarizer

app = FastAPI(title="Medical Conversation Summarizer API", version="1.0.0")

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

@app.post('/summarize-conversation', response_model=SummaryResponse)
async def summarize_conversation(request: ConversationRequest):
    """Endpoint to summarize nurse-patient conversations"""
    try:
        conversation_text = request.conversation
        
        if not conversation_text.strip():
            raise HTTPException(status_code=400, detail='Conversation text cannot be empty')
        
        logger.info(f"Processing conversation of length: {len(conversation_text)} characters")
        
        # Generate summary
        summary = summarizer.generate_summary(conversation_text)
        
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
