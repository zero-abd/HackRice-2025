#!/usr/bin/env python3
import ollama
import json
import sys
from datetime import datetime

MODEL_NAME = "qwen3:8b"

def test_conversation_summarization():
    # Sample conversation
    conversation = """
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

    print("🏥 Testing Conversation Summarization with Qwen3:8b")
    print("=" * 60)
    print("Sample Conversation:")
    print(conversation)
    print("\n" + "=" * 60)
    print("🤖 Streaming model response...")
    print("\n" + "🧠 Thinking process:")
    print("-" * 40)
    
    try:
        messages = [
            {
                "role": "user", 
                "content": f"Please analyze the following nurse-patient conversation and extract the structured medical information:\n\n{conversation}"
            }
        ]
        
        full_content = ""
        thinking_content = ""
        json_content = ""
        in_thinking = False
        in_json = False
        json_brace_count = 0
        
        # Stream response using ollama
        stream = ollama.chat(
            model=MODEL_NAME,
            messages=messages,
            stream=True,
            options={
                'temperature': 0.1,
                'top_p': 0.9,
                'num_predict': 2000
            }
        )
        
        for chunk in stream:
            if 'message' in chunk and 'content' in chunk['message']:
                content_chunk = chunk['message']['content']
                full_content += content_chunk
                
                # Check for thinking tags
                if '<think>' in content_chunk:
                    in_thinking = True
                    print("", flush=True)
                
                if in_thinking:
                    thinking_content += content_chunk
                    # Only print content inside thinking tags
                    if '<think>' in content_chunk:
                        content_chunk = content_chunk.split('<think>', 1)[-1]
                    if '</think>' in content_chunk:
                        content_chunk = content_chunk.split('</think>', 1)[0]
                        in_thinking = False
                        print("", flush=True)
                        print("-" * 40)
                        print("\n📄 JSON Response:")
                        print("-" * 40)
                    
                    if in_thinking and '<think>' not in content_chunk and '</think>' not in content_chunk:
                        print(content_chunk, end='', flush=True)
                
                # Check for JSON content
                elif '{' in content_chunk:
                    in_json = True
                    json_content += content_chunk
                    json_brace_count += content_chunk.count('{')
                    json_brace_count -= content_chunk.count('}')
                    print(content_chunk, end='', flush=True)
                elif in_json:
                    json_content += content_chunk
                    json_brace_count += content_chunk.count('{')
                    json_brace_count -= content_chunk.count('}')
                    print(content_chunk, end='', flush=True)
                    
                    if json_brace_count == 0:
                        in_json = False
        
        print("\n" + "=" * 60)
        
        # Try to parse the collected JSON
        try:
            if json_content.strip():
                parsed_data = json.loads(json_content)
                
                # Add metadata
                parsed_data['metadata'] = {
                    'processed_at': datetime.now().isoformat(),
                    'model_used': MODEL_NAME,
                    'conversation_length': len(conversation),
                    'thinking_process': thinking_content if thinking_content else "No thinking process captured"
                }
                
                print(f"\n✅ Successfully parsed JSON output")
                return parsed_data
            else:
                # Fallback: try to extract JSON from full content
                start_idx = full_content.find('{')
                end_idx = full_content.rfind('}') + 1
                
                if start_idx != -1 and end_idx != 0:
                    json_fallback = full_content[start_idx:end_idx]
                    parsed_data = json.loads(json_fallback)
                    
                    parsed_data['metadata'] = {
                        'processed_at': datetime.now().isoformat(),
                        'model_used': MODEL_NAME,
                        'conversation_length': len(conversation),
                        'thinking_process': thinking_content
                    }
                    
                    print(f"\n✅ Successfully parsed JSON output (fallback)")
                    return parsed_data
                else:
                    print("❌ No valid JSON found in response")
                    return {
                        'error': 'No JSON found',
                        'raw_response': full_content,
                        'thinking_process': thinking_content
                    }
                
        except json.JSONDecodeError as e:
            print(f"\n❌ Failed to parse JSON: {e}")
            return {
                'error': f'JSON parse error: {e}',
                'raw_response': full_content,
                'thinking_process': thinking_content
            }
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

if __name__ == "__main__":
    try:
        models = ollama.list()
        available_models = [model['name'] for model in models['models']]
        
        if MODEL_NAME in available_models:
            print(f"✅ Model {MODEL_NAME} is available")
            result = test_conversation_summarization()
            if result:
                print(f"\n🎉 Conversation summarization completed successfully!")
            else:
                print(f"\n❌ Conversation summarization failed")
        else:
            print(f"❌ Model {MODEL_NAME} not found")
            print(f"Available models: {available_models}")
            print(f"Please install with: ollama pull {MODEL_NAME}")
            
    except Exception as e:
        print(f"❌ Error connecting to Ollama: {e}")
        print("Make sure Ollama is running with: ollama serve")
