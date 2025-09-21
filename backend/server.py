from flask import Flask, request, jsonify
from flask_cors import CORS
import ollama
import json
import logging
from typing import Dict, Any
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Ollama configuration
MODEL_NAME = "qwen3:8b"  # Using your downloaded qwen3:8b model

class ConversationSummarizer:
    def __init__(self):
        self.system_prompt = """You are a medical conversation analyzer. Your task is to analyze conversations between nurses and patients and extract structured medical information.

IMPORTANT INSTRUCTIONS:
- Show your thinking process before providing the final JSON output
- Only summarize and extract factual information mentioned in the conversation
- Do NOT provide medical advice, suggestions, or recommendations
- Do NOT add information that wasn't explicitly stated
- Focus on documenting what was discussed, not what should be done

Please think through the conversation step by step, then extract and organize the information into the following JSON structure:
{
    "vitals": {
        "blood_pressure": "value if mentioned",
        "heart_rate": "value if mentioned", 
        "temperature": "value if mentioned",
        "oxygen_saturation": "value if mentioned",
        "respiratory_rate": "value if mentioned",
        "weight": "value if mentioned",
        "height": "value if mentioned"
    },
    "symptoms": {
        "current_symptoms": ["list of symptoms mentioned"],
        "symptom_duration": "how long symptoms have been present",
        "symptom_severity": "severity level if mentioned",
        "pain_scale": "pain level if mentioned (1-10)"
    },
    "medical_history": {
        "current_medications": ["list if mentioned"],
        "allergies": ["list if mentioned"],
        "previous_conditions": ["list if mentioned"],
        "recent_procedures": ["list if mentioned"]
    },
    "patient_concerns": ["list of specific concerns or questions raised by patient"],
    "nurse_observations": ["list of observations made by the nurse"],
    "additional_characteristics": {
        "mobility": "patient's mobility status if mentioned",
        "mental_state": "mental/emotional state if mentioned",
        "communication": "any communication difficulties if mentioned",
        "family_present": "if family members were present/mentioned"
    },
    "summary": "A brief, factual summary of the conversation suitable for doctor review, focusing on key medical information discussed"
}

Only include fields that have actual information from the conversation. If a field has no relevant information, omit it or mark as "not mentioned"."""

    def check_ollama_connection(self) -> bool:
        """Check if Ollama is running and the model is available"""
        try:
            models = ollama.list()
            available_models = [model['name'] for model in models['models']]
            logger.info(f"Available models: {available_models}")
            return any(MODEL_NAME in model for model in available_models)
        except Exception as e:
            logger.error(f"Error checking Ollama connection: {e}")
            return False

    def generate_summary(self, conversation_text: str) -> Dict[str, Any]:
        """Generate structured summary using Qwen model"""
        if not self.check_ollama_connection():
            raise Exception(f"Ollama is not running or {MODEL_NAME} model is not available. Please ensure Ollama is running and the model is downloaded.")
        
        try:
            messages = [
                {
                    "role": "system",
                    "content": self.system_prompt
                },
                {
                    "role": "user", 
                    "content": f"Please analyze the following nurse-patient conversation and extract the structured medical information:\n\n{conversation_text}"
                }
            ]
            
            # Use ollama.generate() with optimized options for qwen3:8b
            user_prompt = f"{self.system_prompt}\n\nPlease analyze the following nurse-patient conversation and extract the structured medical information:\n\n{conversation_text}"
            
            response = ollama.generate(
                model=MODEL_NAME,
                prompt=user_prompt,
                options={
                    'temperature': 0.2,  # Low temperature for consistent, factual output
                    'top_p': 0.9,
                    'top_k': 40,
                    'num_predict': 1500,  # Reduced to prevent timeouts
                    'repeat_penalty': 1.1
                }
            )
            
            content = response['response']
            
            # Extract thinking process and JSON separately
            thinking_section = ""
            json_section = ""
            
            # Look for thinking markers (qwen3:8b uses <think> tags)
            thinking_patterns = [
                ("<think>", "</think>"),
                ("<thinking>", "</thinking>"),
                ("thinking>", "</thinking>"),
                ("think>", "</think>"),
                ("<reasoning>", "</reasoning>"),
                ("<analysis>", "</analysis>")
            ]
            
            for start_marker, end_marker in thinking_patterns:
                if start_marker in content and end_marker in content:
                    start_idx = content.find(start_marker)
                    end_idx = content.find(end_marker) + len(end_marker)
                    thinking_section = content[start_idx:end_idx]
                    break
            
            # If no explicit thinking markers, look for reasoning before JSON
            if not thinking_section:
                json_start = content.find('{')
                if json_start > 100:  # If there's substantial text before JSON
                    thinking_section = content[:json_start].strip()
            
            # Try to extract JSON from the response
            try:
                # Look for JSON content in the response
                start_idx = content.find('{')
                end_idx = content.rfind('}') + 1
                
                if start_idx != -1 and end_idx != 0:
                    json_content = content[start_idx:end_idx]
                    parsed_data = json.loads(json_content)
                    
                    # Add metadata including thinking process
                    parsed_data['metadata'] = {
                        'processed_at': datetime.now().isoformat(),
                        'model_used': MODEL_NAME,
                        'conversation_length': len(conversation_text),
                        'thinking_process': thinking_section if thinking_section else "No explicit thinking process captured",
                        'raw_response': content  # Include full raw response for debugging
                    }
                    
                    return parsed_data
                else:
                    raise ValueError("No valid JSON found in response")
                    
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse JSON: {e}")
                logger.error(f"Raw content: {content}")
                # Return the raw content for analysis
                return {
                    'error': f"Failed to parse JSON: {e}",
                    'raw_response': content,
                    'thinking_process': thinking_section,
                    'metadata': {
                        'processed_at': datetime.now().isoformat(),
                        'model_used': MODEL_NAME,
                        'conversation_length': len(conversation_text)
                    }
                }
                
        except Exception as e:
            logger.error(f"Ollama error: {e}")
            raise Exception(f"Failed to generate summary: {e}")

# Initialize summarizer
summarizer = ConversationSummarizer()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        ollama_status = summarizer.check_ollama_connection()
        return jsonify({
            'status': 'healthy',
            'ollama_connected': ollama_status,
            'model': MODEL_NAME,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/summarize-conversation', methods=['POST'])
def summarize_conversation():
    """Endpoint to summarize nurse-patient conversations"""
    try:
        data = request.get_json()
        
        if not data or 'conversation' not in data:
            return jsonify({
                'error': 'Missing conversation data',
                'required_format': {'conversation': 'text of the conversation'}
            }), 400
        
        conversation_text = data['conversation']
        
        if not conversation_text.strip():
            return jsonify({'error': 'Conversation text cannot be empty'}), 400
        
        logger.info(f"Processing conversation of length: {len(conversation_text)} characters")
        
        # Generate summary
        summary = summarizer.generate_summary(conversation_text)
        
        return jsonify({
            'success': True,
            'data': summary
        })
        
    except Exception as e:
        logger.error(f"Error processing conversation: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/test-conversation', methods=['GET'])
def test_conversation():
    """Test endpoint with sample conversation"""
    sample_conversation = """
Nurse: Good morning, Mrs. Johnson. How are you feeling today?

Patient: Hi, I'm not feeling great. I've been having this persistent cough for about a week now, and it's getting worse.

Nurse: I'm sorry to hear that. Can you describe the cough? Is it dry or are you bringing anything up?

Patient: It's mostly dry, but sometimes I cough up a little bit of clear mucus. And I've been feeling really tired.

Nurse: Okay, let me take your vital signs. *takes measurements* Your blood pressure is 130 over 85, heart rate is 88 beats per minute, and your temperature is 99.2 degrees Fahrenheit.

Patient: Is that fever concerning? I've also been having some chest tightness, especially when I try to exercise.

Nurse: We'll make sure the doctor reviews all of this. Are you currently taking any medications?

Patient: Yes, I take lisinopril for my blood pressure, and I have an inhaler for my asthma, but I haven't needed it much lately.

Nurse: Any allergies I should know about?

Patient: I'm allergic to penicillin - it gives me a rash.

Nurse: Thank you for that information. The chest tightness with the cough and low-grade fever are definitely things we want the doctor to evaluate. Have you been around anyone who's been sick recently?

Patient: My grandson had a cold last week when I was babysitting him.

Nurse: That's helpful to know. I'm going to get all this information to Dr. Smith, and she'll be in to see you shortly.
"""
    
    try:
        summary = summarizer.generate_summary(sample_conversation)
        return jsonify({
            'success': True,
            'sample_conversation': sample_conversation,
            'generated_summary': summary
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    print("Starting Medical Conversation Summarizer Server...")
    print(f"Using model: {MODEL_NAME}")
    print("Make sure Ollama is running with: ollama serve")
    print(f"And that you have the model: ollama pull {MODEL_NAME}")
    app.run(debug=True, host='0.0.0.0', port=5000)
