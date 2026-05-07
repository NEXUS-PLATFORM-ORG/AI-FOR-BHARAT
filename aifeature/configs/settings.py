# configs/settings.py
from pathlib import Path
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# ── Paths ──────────────────────────────────────────────────────────────────
BASE_DIR        = Path(__file__).resolve().parent.parent
INPUT_PDF_DIR   = BASE_DIR / "data" / "input_pdfs"
OUTPUT_JSON_DIR = BASE_DIR / "data" / "output_json"
DEBUG_DIR       = BASE_DIR / "data" / "debug"

# ── LLM ───────────────────────────────────────────────────────────────────
# 3-Tier Fallback: Groq (fastest) → Gemini (quality) → Ollama (reliable)
LLM_PROVIDER        = "groq_gemini_ollama_fallback"  # Options: "groq", "gemini", "ollama", "groq_gemini_ollama_fallback"

# Groq API settings (Primary - fastest)
GROQ_API_KEY        = os.getenv("GROQ_API_KEY")  # Loaded from .env file
GROQ_MODEL          = "llama-3.1-70b-versatile"  # 128K context window
GROQ_TEMPERATURE    = 0.0
GROQ_MAX_TOKENS     = 32768  # Increased for larger extractions

# Gemini API settings (Secondary - high quality)
GEMINI_API_KEY      = os.getenv("GEMINI_API_KEY")  # Loaded from .env file
GEMINI_MODEL        = "gemini-2.5-flash"  # 1M context window
GEMINI_TEMPERATURE  = 0.0
GEMINI_MAX_TOKENS   = 32768  # Increased for larger extractions

# Ollama fallback settings (Tertiary - local reliable)
OLLAMA_MODEL        = "mistral"  # Fallback model: "mistral", "llama3", "qwen2.5:7b"
OLLAMA_TEMPERATURE  = 0.0
OLLAMA_NUM_CTX      = 8192
OLLAMA_TEMPERATURE  = 0.0
OLLAMA_NUM_CTX      = 8192

# ── Classification ─────────────────────────────────────────────────────────
DIGITAL_CHAR_THRESHOLD  = 50    # chars/page below which → Pipeline B
TWO_COLUMN_X_GAP        = 0.45  # text centroid gap ratio → two-column
CORRUPT_ASCII_RATIO     = 0.6   # below this → corrupt text layer

# ── OCR ───────────────────────────────────────────────────────────────────
# Windows: Update this path after installing Tesseract
# Default installation path: C:\Program Files\Tesseract-OCR\tesseract.exe
TESSERACT_PATH      = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
OCR_DPI             = 300
OCR_LANG            = "eng"
OCR_CONFIG          = "--oem 1 --psm 3"
OCR_MIN_CONFIDENCE  = 0         # Tesseract word confidence threshold

# ── NLP ───────────────────────────────────────────────────────────────────
SPACY_MODEL         = "en_core_web_lg"
NER_CHAR_LIMIT      = 50_000    # run NER only on first N chars

# ── Section detection ──────────────────────────────────────────────────────
# Increased for better handling of large court documents
MAX_TOKENS_PER_LLM_CALL = 15_000  # Groq can handle up to 128K context

# ── Pipeline metadata ──────────────────────────────────────────────────────
PIPELINE_VERSION = "1.0.0"
