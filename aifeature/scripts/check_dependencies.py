#!/usr/bin/env python3
"""
Dependency verification script for the document extraction pipeline.
Run this to verify all required packages are installed correctly.

Usage:
    python scripts/check_dependencies.py
"""
import sys
from pathlib import Path

# Colors for terminal output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
RESET = '\033[0m'

def check_python_version():
    """Check Python version is 3.10+."""
    version = sys.version_info
    if version.major == 3 and version.minor >= 10:
        print(f"{GREEN}✓{RESET} Python {version.major}.{version.minor}.{version.micro}")
        return True
    else:
        print(f"{RED}✗{RESET} Python {version.major}.{version.minor}.{version.micro} (need 3.10+)")
        return False

def check_package(package_name, import_name=None):
    """Check if a Python package is installed."""
    import_name = import_name or package_name
    try:
        __import__(import_name)
        print(f"{GREEN}✓{RESET} {package_name}")
        return True
    except ImportError:
        print(f"{RED}✗{RESET} {package_name} (not installed)")
        return False

def check_spacy_model():
    """Check if spaCy language model is installed."""
    try:
        import spacy
        nlp = spacy.load("en_core_web_lg")
        print(f"{GREEN}✓{RESET} spaCy model en_core_web_lg")
        return True
    except Exception:
        print(f"{RED}✗{RESET} spaCy model en_core_web_lg (run: python -m spacy download en_core_web_lg)")
        return False

def check_tesseract():
    """Check if Tesseract OCR is installed."""
    try:
        import pytesseract
        version = pytesseract.get_tesseract_version()
        print(f"{GREEN}✓{RESET} Tesseract OCR {version}")
        return True
    except Exception:
        print(f"{RED}✗{RESET} Tesseract OCR (install from: https://github.com/UB-Mannheim/tesseract/wiki)")
        return False

def check_ollama():
    """Check if Ollama is running and model is available."""
    try:
        import ollama
        # Try to list models to verify connection
        models = ollama.list()
        model_names = [m['name'] for m in models.get('models', [])]
        
        if any('qwen2.5' in name for name in model_names):
            print(f"{GREEN}✓{RESET} Ollama with qwen2.5:7b model")
            return True
        else:
            print(f"{YELLOW}⚠{RESET} Ollama running but qwen2.5:7b not found (run: ollama pull qwen2.5:7b)")
            return False
    except Exception as e:
        print(f"{RED}✗{RESET} Ollama (ensure it's running: https://ollama.ai)")
        return False

def main():
    """Run all dependency checks."""
    print("=" * 70)
    print("Document Extraction Pipeline - Dependency Verification")
    print("=" * 70)
    
    all_checks_passed = True
    
    # Python version
    print("\n[Python Version]")
    all_checks_passed &= check_python_version()
    
    # Core packages
    print("\n[Core Dependencies]")
    all_checks_passed &= check_package("PyMuPDF", "fitz")
    all_checks_passed &= check_package("numpy")
    all_checks_passed &= check_package("pydantic")
    
    # OCR packages
    print("\n[OCR Pipeline]")
    all_checks_passed &= check_package("opencv-python-headless", "cv2")
    all_checks_passed &= check_package("pytesseract")
    all_checks_passed &= check_package("Pillow", "PIL")
    all_checks_passed &= check_tesseract()
    
    # NLP packages
    print("\n[NLP & Entity Recognition]")
    all_checks_passed &= check_package("spacy")
    all_checks_passed &= check_spacy_model()
    
    # LLM packages
    print("\n[LLM Integration]")
    all_checks_passed &= check_package("ollama")
    all_checks_passed &= check_ollama()
    
    # Testing
    print("\n[Testing]")
    all_checks_passed &= check_package("pytest")
    
    # Summary
    print("\n" + "=" * 70)
    if all_checks_passed:
        print(f"{GREEN}✓ All dependencies verified successfully!{RESET}")
        print("You can now run the pipeline:")
        print("  python -m scripts.process_pdf data/input_pdfs/your_file.pdf")
    else:
        print(f"{RED}✗ Some dependencies are missing or misconfigured.{RESET}")
        print("\nInstall missing packages with:")
        print("  pip install -r requirements.txt")
        print("\nThen install the spaCy model:")
        print("  python -m spacy download en_core_web_lg")
    print("=" * 70)
    
    return 0 if all_checks_passed else 1

if __name__ == "__main__":
    sys.exit(main())
