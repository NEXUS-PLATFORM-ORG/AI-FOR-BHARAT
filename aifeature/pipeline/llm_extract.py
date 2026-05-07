# pipeline/llm_extract.py
import ollama
import json
import re
import time
from typing import Optional
from configs.settings import (
    LLM_PROVIDER, 
    GROQ_API_KEY, GROQ_MODEL, GROQ_TEMPERATURE, GROQ_MAX_TOKENS,
    GEMINI_API_KEY, GEMINI_MODEL, GEMINI_TEMPERATURE, GEMINI_MAX_TOKENS,
    OLLAMA_MODEL, OLLAMA_TEMPERATURE, OLLAMA_NUM_CTX
)
from configs.prompts import OPERATIVE_PROMPT, FACTS_PROMPT, ANALYSIS_PROMPT
from utils.logger import get_logger

logger = get_logger(__name__)

# Import Groq with fallback
try:
    from groq import Groq
    GROQ_AVAILABLE = True
    if GROQ_API_KEY:
        groq_client = Groq(api_key=GROQ_API_KEY)
        logger.info("Groq API configured successfully")
    else:
        logger.warning("GROQ_API_KEY not set - Groq will be unavailable")
        GROQ_AVAILABLE = False
        groq_client = None
except ImportError:
    logger.warning("groq package not installed - Groq unavailable")
    GROQ_AVAILABLE = False
    groq_client = None

# Import Gemini with fallback
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
    if GEMINI_API_KEY:
        genai.configure(api_key=GEMINI_API_KEY)
        logger.info("Gemini API configured successfully")
    else:
        logger.warning("GEMINI_API_KEY not set - Gemini will be unavailable")
        GEMINI_AVAILABLE = False
except ImportError:
    logger.warning("google-generativeai not installed - Gemini unavailable")
    GEMINI_AVAILABLE = False

def _call_groq(prompt: str) -> Optional[dict]:
    """Call Groq API with error handling."""
    if not GROQ_AVAILABLE or not GROQ_API_KEY or not groq_client:
        return None
    
    try:
        response = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=GROQ_TEMPERATURE,
            max_tokens=GROQ_MAX_TOKENS,
        )
        
        if response.choices and response.choices[0].message.content:
            text = response.choices[0].message.content.strip()
            logger.info("Groq API call successful")
            return _parse_json_response(text, "Groq")
        else:
            logger.error("Groq returned empty response")
            return None
            
    except Exception as e:
        logger.error("Groq API call failed: %s", e)
        return None

def _call_gemini(prompt: str) -> Optional[dict]:
    """Call Gemini API with error handling."""
    if not GEMINI_AVAILABLE or not GEMINI_API_KEY:
        return None
    
    try:
        model = genai.GenerativeModel(GEMINI_MODEL)
        
        generation_config = genai.types.GenerationConfig(
            temperature=GEMINI_TEMPERATURE,
            max_output_tokens=GEMINI_MAX_TOKENS,
        )
        
        response = model.generate_content(
            prompt,
            generation_config=generation_config
        )
        
        if response.text:
            text = response.text.strip()
            logger.info("Gemini API call successful")
            return _parse_json_response(text, "Gemini")
        else:
            logger.error("Gemini returned empty response")
            return None
            
    except Exception as e:
        logger.error("Gemini API call failed: %s", e)
        return None

def _call_ollama(prompt: str) -> dict:
    """Call Ollama with error handling."""
    try:
        response = ollama.generate(
            model=OLLAMA_MODEL,
            prompt=prompt,
            options={
                "temperature": OLLAMA_TEMPERATURE,
                "num_ctx": OLLAMA_NUM_CTX,
            },
        )
        text = response["response"].strip()
        logger.info("Ollama call successful")
        return _parse_json_response(text, "Ollama")
    except Exception as e:
        logger.error("Ollama call failed: %s", e)
        return {"error": str(e)}

def _parse_json_response(text: str, provider: str) -> dict:
    """Parse JSON response with fallback strategies."""
    # Strip markdown code fences if model adds them
    text = re.sub(r'^```(?:json)?\s*', '', text)
    text = re.sub(r'\s*```$', '', text)

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Try to extract JSON from response
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass
        
        logger.warning(f"{provider} JSON parse failed; returning raw text.")
        return {"error": "JSON parse failed", "raw": text, "provider": provider}

def _call_llm_with_fallback(prompt: str) -> dict:
    """Call LLM with 3-tier fallback: Groq → Gemini → Ollama."""
    
    if LLM_PROVIDER == "groq":
        # Groq only
        result = _call_groq(prompt)
        return result if result else {"error": "Groq unavailable"}
    
    elif LLM_PROVIDER == "gemini":
        # Gemini only
        result = _call_gemini(prompt)
        return result if result else {"error": "Gemini unavailable"}
    
    elif LLM_PROVIDER == "ollama":
        # Ollama only
        return _call_ollama(prompt)
    
    elif LLM_PROVIDER == "groq_gemini_ollama_fallback":
        # 3-tier fallback: Groq → Gemini → Ollama
        
        # Try Groq first
        logger.info("🚀 Attempting Groq API call...")
        result = _call_groq(prompt)
        
        if result and "error" not in result:
            logger.info("✅ Groq successful")
            return result
        
        logger.warning("❌ Groq failed, trying Gemini...")
        time.sleep(0.5)  # Brief pause between attempts
        
        # Try Gemini second
        result = _call_gemini(prompt)
        
        if result and "error" not in result:
            logger.info("✅ Gemini successful (Groq fallback)")
            result["fallback_used"] = "gemini"
            return result
        
        logger.warning("❌ Gemini failed, falling back to Ollama...")
        time.sleep(1)  # Brief pause before final fallback
        
        # Try Ollama last
        ollama_result = _call_ollama(prompt)
        if "error" not in ollama_result:
            logger.info("✅ Ollama fallback successful")
            ollama_result["fallback_used"] = "ollama"
        
        return ollama_result
    
    else:
        logger.error(f"Unknown LLM_PROVIDER: {LLM_PROVIDER}")
        return {"error": f"Invalid LLM_PROVIDER: {LLM_PROVIDER}"}

def run_llm_extraction(chunks: dict[str, str]) -> dict:
    """Run LLM extraction on document chunks."""
    results: dict[str, dict] = {}

    if "operative" in chunks:
        logger.info("LLM: extracting operative section")
        results["operative"] = _call_llm_with_fallback(OPERATIVE_PROMPT.format(text=chunks["operative"]))

    if "facts" in chunks:
        logger.info("LLM: extracting facts section")
        results["facts"] = _call_llm_with_fallback(FACTS_PROMPT.format(text=chunks["facts"]))

    if "analysis" in chunks:
        logger.info("LLM: extracting analysis section")
        results["analysis"] = _call_llm_with_fallback(ANALYSIS_PROMPT.format(text=chunks["analysis"]))

    return results
