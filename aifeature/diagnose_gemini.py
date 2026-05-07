#!/usr/bin/env python3
"""Diagnose Gemini API issues."""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_gemini_connection():
    """Test Gemini API connection and identify issues."""
    
    print("🔍 Diagnosing Gemini API Issues...")
    print("=" * 50)
    
    # Test 1: Import check
    try:
        import google.generativeai as genai
        print("✅ google-generativeai library imported successfully")
    except ImportError as e:
        print(f"❌ Failed to import google-generativeai: {e}")
        return
    
    # Test 2: Configuration check
    from configs.settings import GEMINI_API_KEY, GEMINI_MODEL
    
    if not GEMINI_API_KEY or GEMINI_API_KEY == "":
        print("❌ GEMINI_API_KEY is not set")
        return
    
    if GEMINI_API_KEY == "your-api-key-here":
        print("❌ GEMINI_API_KEY is still placeholder")
        return
    
    print(f"✅ API Key is set (length: {len(GEMINI_API_KEY)})")
    print(f"📋 Model: {GEMINI_MODEL}")
    
    # Test 3: API Key configuration
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        print("✅ API key configured")
    except Exception as e:
        print(f"❌ Failed to configure API key: {e}")
        return
    
    # Test 4: List available models
    print("\n🔍 Checking available models...")
    try:
        models = genai.list_models()
        available_models = []
        for model in models:
            if 'generateContent' in model.supported_generation_methods:
                available_models.append(model.name)
        
        print("✅ Available models:")
        for model in available_models[:10]:  # Show first 10
            print(f"   - {model}")
        
        # Check if our model exists
        model_exists = any(GEMINI_MODEL in model for model in available_models)
        if model_exists:
            print(f"✅ Model '{GEMINI_MODEL}' is available")
        else:
            print(f"❌ Model '{GEMINI_MODEL}' is NOT available")
            print("💡 Suggested models:")
            suggested = [m for m in available_models if 'gemini' in m.lower()][:3]
            for model in suggested:
                print(f"   - {model.replace('models/', '')}")
            
    except Exception as e:
        print(f"❌ Failed to list models: {e}")
        return
    
    # Test 5: Simple API call
    print("\n🧪 Testing simple API call...")
    try:
        model = genai.GenerativeModel(GEMINI_MODEL)
        response = model.generate_content("Say 'Hello, World!' in JSON format: {\"message\": \"Hello, World!\"}")
        
        if response.text:
            print("✅ API call successful!")
            print(f"📤 Response: {response.text[:100]}...")
        else:
            print("❌ API call returned empty response")
            if hasattr(response, 'prompt_feedback'):
                print(f"🔍 Prompt feedback: {response.prompt_feedback}")
            
    except Exception as e:
        print(f"❌ API call failed: {e}")
        
        # Check for common error types
        error_str = str(e).lower()
        if "api_key" in error_str or "authentication" in error_str:
            print("💡 This looks like an API key issue")
        elif "quota" in error_str or "limit" in error_str:
            print("💡 This looks like a quota/rate limit issue")
        elif "model" in error_str or "not found" in error_str:
            print("💡 This looks like a model availability issue")
        else:
            print("💡 This is an unexpected error")

if __name__ == "__main__":
    test_gemini_connection()