# Requirements.txt Update Summary

## Changes Made

### 1. Updated `requirements.txt`

**Added:**
- Explicit `numpy>=1.24.0,<2.0.0` dependency with version constraint to prevent compatibility issues with OpenCV

**Improved:**
- Better organization with clear section headers
- More descriptive comments
- Added external dependencies section with installation instructions
- Version constraints for better reproducibility

**Before:**
```
# Core PDF processing
PyMuPDF>=1.23.0

# OCR pipeline
opencv-python-headless>=4.8.0
pytesseract>=0.3.10
Pillow>=10.0.0

# NLP
spacy>=3.7.0
...
```

**After:**
```
# ── Core PDF Processing ─────────────────────────────────────────────────────
PyMuPDF>=1.23.0

# ── OCR Pipeline ────────────────────────────────────────────────────────────
opencv-python-headless>=4.8.0
pytesseract>=0.3.10
Pillow>=10.0.0
numpy>=1.24.0,<2.0.0

# ── NLP & Entity Recognition ────────────────────────────────────────────────
spacy>=3.7.0
...
```

### 2. Created `scripts/check_dependencies.py`

A comprehensive dependency verification script that checks:
- Python version compatibility
- All required Python packages
- External dependencies (Tesseract, Ollama)
- spaCy language model
- Model availability in Ollama

**Usage:**
```bash
python scripts/check_dependencies.py
```

### 3. Created `INSTALLATION.md`

A detailed installation guide covering:
- System requirements
- Step-by-step installation for all platforms
- Troubleshooting common issues
- Platform-specific notes
- Verification steps

### 4. Updated `README.md`

**Improvements:**
- Added quick start section
- Referenced INSTALLATION.md for detailed setup
- Added verification section
- Better organized structure
- Links to documentation

## Dependencies Identified from Codebase Analysis

### Python Packages (via pip)

1. **PyMuPDF** (imported as `fitz`)
   - Used in: `pipeline/ingest.py`, `pipeline/classify.py`, `pipeline/extract_text.py`
   - Purpose: PDF text extraction and manipulation

2. **opencv-python-headless** (imported as `cv2`)
   - Used in: `pipeline/extract_text.py`
   - Purpose: Image preprocessing for OCR

3. **numpy**
   - Used in: `pipeline/extract_text.py`
   - Purpose: Array operations for image processing

4. **pytesseract**
   - Used in: `pipeline/extract_text.py`
   - Purpose: OCR engine wrapper

5. **Pillow** (imported as `PIL`)
   - Used in: Image handling (implicit dependency)
   - Purpose: Image manipulation

6. **spacy**
   - Used in: `pipeline/nlp_extract.py`
   - Purpose: Named entity recognition

7. **pydantic**
   - Used in: `pipeline/merge.py`
   - Purpose: Data validation and serialization

8. **ollama**
   - Used in: `pipeline/llm_extract.py`
   - Purpose: LLM integration

9. **pytest**
   - Used in: `tests/test_pipeline.py`
   - Purpose: Testing framework

### External Dependencies (Manual Installation)

1. **Tesseract OCR Engine**
   - Required by: pytesseract
   - Installation: Platform-specific (see INSTALLATION.md)

2. **Ollama**
   - Required by: ollama package
   - Model: qwen2.5:7b
   - Installation: Download from ollama.ai

3. **spaCy Language Model**
   - Model: en_core_web_lg
   - Installation: `python -m spacy download en_core_web_lg`

### Standard Library Dependencies

The following are part of Python's standard library and don't need installation:
- `hashlib` - SHA-256 hashing
- `pathlib` - Path manipulation
- `dataclasses` - Data structures
- `re` - Regular expressions
- `json` - JSON handling
- `logging` - Logging
- `sys` - System utilities
- `argparse` - CLI argument parsing
- `datetime` - Date/time handling
- `typing` - Type hints
- `unicodedata` - Unicode character handling

## Verification

To verify all dependencies are correctly installed:

```bash
python scripts/check_dependencies.py
```

This will check:
- ✓ Python version
- ✓ All Python packages
- ✓ Tesseract installation
- ✓ Ollama running and model available
- ✓ spaCy language model

## Next Steps

1. Run the dependency checker to identify any missing components
2. Follow INSTALLATION.md for detailed setup instructions
3. Process a test PDF to verify the pipeline works end-to-end
