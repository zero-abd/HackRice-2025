#!/usr/bin/env python3
"""
Simple demo script to test streaming functionality
Run this while the server is running to see streaming in action
"""
import requests
import json
import time

def demo_streaming():
    print("🌊 Streaming Demo - Medical Conversation Summarizer")
    print("=" * 60)
    
    # Simple test conversation
    conversation = """
Nurse: Hello, how are you feeling today?
Patient: I have a bad headache and feel nauseous.
Nurse: Let me check your blood pressure. It's 140/90.
Patient: I'm taking medication for high blood pressure.
"""
    
    print("📝 Test conversation:")
    print(conversation)
    print("-" * 40)
    
    try:
        print("🚀 Starting streaming request...")
        
        response = requests.post(
            "http://127.0.0.1:8000/summarize-conversation-stream",
            json={"conversation": conversation},
            stream=True,
            headers={'Accept': 'text/event-stream'},
            timeout=60
        )
        
        if response.status_code == 200:
            print("✅ Connected! Streaming response:")
            print("-" * 40)
            
            for line in response.iter_lines(decode_unicode=True):
                if line and line.startswith("data: "):
                    try:
                        data = json.loads(line[6:])
                        chunk_type = data.get('type', 'unknown')
                        
                        if chunk_type == 'metadata':
                            print(f"🚀 Started analysis with {data['data']['model_used']}")
                        
                        elif chunk_type == 'chunk':
                            chunk_text = data['data']['chunk']
                            print(f"📥 Received: '{chunk_text.strip()}'")
                        
                        elif chunk_type == 'final':
                            print("✅ Final result received!")
                            final_data = data['data']
                            print(f"🩺 Analysis complete!")
                            
                            # Show key extracted data
                            if 'vitals' in final_data:
                                vitals = final_data['vitals']
                                for key, value in vitals.items():
                                    if value and value != "not mentioned":
                                        print(f"   - {key}: {value}")
                            
                            if 'symptoms' in final_data:
                                symptoms = final_data['symptoms'].get('current_symptoms', [])
                                if symptoms:
                                    print(f"   - Symptoms: {', '.join(symptoms)}")
                            break
                        
                        elif chunk_type == 'complete':
                            print("🏁 Stream completed!")
                            break
                        
                        elif chunk_type == 'error':
                            print(f"❌ Error: {data['data']['error']}")
                            break
                            
                    except json.JSONDecodeError as e:
                        print(f"⚠️  Could not parse: {line}")
            
            print("-" * 40)
            print("✅ Streaming demo completed!")
                        
        else:
            print(f"❌ HTTP Error {response.status_code}: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to server.")
        print("Make sure the server is running:")
        print("   python -m uvicorn server:app --host 127.0.0.1 --port 8000")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    demo_streaming()
