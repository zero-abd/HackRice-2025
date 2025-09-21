#!/usr/bin/env python3
"""
Test script for the conversation summarizer API
"""
import requests
import json

BASE_URL = "http://localhost:5000"

def test_health():
    """Test health endpoint"""
    print("Testing health endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_sample_conversation():
    """Test with the built-in sample conversation"""
    print("\nTesting sample conversation endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/test-conversation")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            if data['success']:
                print("✅ Sample conversation processed successfully!")
                print(f"Generated Summary:")
                print(json.dumps(data['generated_summary'], indent=2))
            else:
                print(f"❌ Error: {data['error']}")
        else:
            print(f"❌ HTTP Error: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_custom_conversation():
    """Test with a custom conversation"""
    print("\nTesting custom conversation...")
    
    conversation = """
    Nurse: Good afternoon, Mr. Smith. I'm here to check on you before your surgery tomorrow.
    
    Patient: Hello. I'm quite nervous about tomorrow. My back pain has been really bad lately.
    
    Nurse: I understand your concerns. Let me check your vitals first. *takes measurements* Your blood pressure is 140/90, heart rate is 95, and temperature is 98.6°F.
    
    Patient: Is my blood pressure too high? I've been taking my medication - metoprolol and amlodipine.
    
    Nurse: We'll monitor it closely. How would you rate your pain on a scale of 1 to 10?
    
    Patient: Right now it's about a 7. It's been like this for 3 months since I injured my lower back at work.
    
    Nurse: Are you allergic to any medications?
    
    Patient: Yes, I'm allergic to codeine - it makes me very nauseous.
    
    Nurse: Thank you. I'll make sure that's documented for tomorrow's procedure.
    """
    
    payload = {"conversation": conversation}
    
    try:
        response = requests.post(f"{BASE_URL}/summarize-conversation", json=payload)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            if data['success']:
                print("✅ Custom conversation processed successfully!")
                print("Generated Summary:")
                print(json.dumps(data['data'], indent=2))
            else:
                print(f"❌ Error: {data['error']}")
        else:
            print(f"❌ HTTP Error: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    print("🏥 Medical Conversation Summarizer Test")
    print("=" * 50)
    
    # Test health endpoint
    if test_health():
        print("✅ Server is healthy")
        
        # Test sample conversation
        test_sample_conversation()
        
        # Test custom conversation
        test_custom_conversation()
    else:
        print("❌ Server health check failed")
        print("Make sure:")
        print("1. The server is running (python server.py)")
        print("2. Ollama is running (ollama serve)")
        print("3. The qwen model is downloaded")
