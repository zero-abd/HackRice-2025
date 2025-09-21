import ollama
import json
import logging
from typing import Dict, Any, Iterator, Generator
from datetime import datetime

# Configure logging
logger = logging.getLogger(__name__)

class ConversationSummarizer:
    """LLM service class for analyzing and summarizing medical conversations"""
    
    def __init__(self, model_name: str = "qwen3:8b"):
        self.model_name = model_name
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
            return any(self.model_name in model for model in available_models)
        except Exception as e:
            logger.error(f"Error checking Ollama connection: {e}")
            return False

    def get_ollama_status(self) -> Dict[str, Any]:
        """Get detailed Ollama status information"""
        try:
            is_connected = self.check_ollama_connection()
            models = ollama.list() if is_connected else None
            return {
                'connected': is_connected,
                'model': self.model_name,
                'available_models': [model['name'] for model in models['models']] if models else [],
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Error getting Ollama status: {e}")
            return {
                'connected': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }

    def generate_summary(self, conversation_text: str) -> Dict[str, Any]:
        """Generate structured summary using the configured LLM model"""
        if not self.check_ollama_connection():
            raise Exception(f"Ollama is not running or {self.model_name} model is not available. Please ensure Ollama is running and the model is downloaded.")
        
        try:
            # Use ollama.generate() with optimized options for qwen3:8b
            user_prompt = f"{self.system_prompt}\n\nPlease analyze the following nurse-patient conversation and extract the structured medical information:\n\n{conversation_text}"
            
            response = ollama.generate(
                model=self.model_name,
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
                        'model_used': self.model_name,
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
                        'model_used': self.model_name,
                        'conversation_length': len(conversation_text)
                    }
                }
                
        except Exception as e:
            logger.error(f"Ollama error: {e}")
            raise Exception(f"Failed to generate summary: {e}")

    def generate_summary_stream(self, conversation_text: str) -> Generator[Dict[str, Any], None, None]:
        """Generate structured summary using streaming for real-time response"""
        if not self.check_ollama_connection():
            raise Exception(f"Ollama is not running or {self.model_name} model is not available. Please ensure Ollama is running and the model is downloaded.")
        
        try:
            user_prompt = f"{self.system_prompt}\n\nPlease analyze the following nurse-patient conversation and extract the structured medical information:\n\n{conversation_text}"
            
            # Initialize metadata
            start_time = datetime.now()
            accumulated_content = ""
            
            # Yield initial metadata
            yield {
                'type': 'metadata',
                'data': {
                    'started_at': start_time.isoformat(),
                    'model_used': self.model_name,
                    'conversation_length': len(conversation_text),
                    'status': 'started'
                }
            }
            
            # Stream the response from Ollama
            for chunk in ollama.generate(
                model=self.model_name,
                prompt=user_prompt,
                stream=True,  # Enable streaming
                options={
                    'temperature': 0.2,
                    'top_p': 0.9,
                    'top_k': 40,
                    'num_predict': 1500,
                    'repeat_penalty': 1.1
                }
            ):
                if 'response' in chunk:
                    chunk_text = chunk['response']
                    accumulated_content += chunk_text
                    
                    # Yield each chunk
                    yield {
                        'type': 'chunk',
                        'data': {
                            'chunk': chunk_text,
                            'accumulated_length': len(accumulated_content),
                            'done': chunk.get('done', False)
                        }
                    }
                    
                    # If this is the final chunk, process the complete response
                    if chunk.get('done', False):
                        try:
                            # Extract thinking process and JSON from accumulated content
                            thinking_section = self._extract_thinking_process(accumulated_content)
                            parsed_data = self._extract_json_from_content(accumulated_content)
                            
                            if parsed_data:
                                # Add metadata to parsed data
                                parsed_data['metadata'] = {
                                    'processed_at': datetime.now().isoformat(),
                                    'model_used': self.model_name,
                                    'conversation_length': len(conversation_text),
                                    'thinking_process': thinking_section,
                                    'raw_response': accumulated_content,
                                    'processing_time_seconds': (datetime.now() - start_time).total_seconds()
                                }
                                
                                # Yield final processed data
                                yield {
                                    'type': 'final',
                                    'data': parsed_data
                                }
                            else:
                                # Yield raw response if JSON parsing failed
                                yield {
                                    'type': 'final',
                                    'data': {
                                        'error': 'Failed to parse JSON from response',
                                        'raw_response': accumulated_content,
                                        'thinking_process': thinking_section,
                                        'metadata': {
                                            'processed_at': datetime.now().isoformat(),
                                            'model_used': self.model_name,
                                            'conversation_length': len(conversation_text),
                                            'processing_time_seconds': (datetime.now() - start_time).total_seconds()
                                        }
                                    }
                                }
                        except Exception as parse_error:
                            logger.error(f"Error parsing final response: {parse_error}")
                            yield {
                                'type': 'error',
                                'data': {
                                    'error': f"Failed to parse final response: {parse_error}",
                                    'raw_response': accumulated_content
                                }
                            }
                        break
                        
        except Exception as e:
            logger.error(f"Ollama streaming error: {e}")
            yield {
                'type': 'error',
                'data': {
                    'error': f"Failed to generate streaming summary: {e}",
                    'timestamp': datetime.now().isoformat()
                }
            }

    def _extract_thinking_process(self, content: str) -> str:
        """Extract thinking process from content"""
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
                return content[start_idx:end_idx]
        
        # If no explicit thinking markers, look for reasoning before JSON
        json_start = content.find('{')
        if json_start > 100:  # If there's substantial text before JSON
            return content[:json_start].strip()
        
        return "No explicit thinking process captured"

    def _extract_json_from_content(self, content: str) -> Dict[str, Any]:
        """Extract and parse JSON from content"""
        try:
            start_idx = content.find('{')
            end_idx = content.rfind('}') + 1
            
            if start_idx != -1 and end_idx != 0:
                json_content = content[start_idx:end_idx]
                return json.loads(json_content)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON: {e}")
        
        return None

    def get_sample_conversation(self) -> str:
        """Returns a sample conversation for testing purposes"""
        return """
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
