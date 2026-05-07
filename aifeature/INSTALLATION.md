# Installation Guide

This guide provides detailed instructions for setting up the Document Extraction Pipeline.

## System Requirements

- **Python**: 3.10 or higher
- **Operating System**: Windows, Linux, or macOS
- **Memory**: Minimum 8GB RAM (16GB recommended for large PDFs)
- **Storage**: At least 5GB free space (for models and dependencies)

## Installation Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd document_extraction
```

### 2. Create Virtual Environment (Recommended)

```bash
# Create virtual environment
python -m venv .venv

# Activate virtual environment
# On Windows:
.venv\Scripts\activate

# On Linux/macOS:
source .venv/bin/activate
```

### 3. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 4. Install spaCy Language Model

```bash
python -m spacy download en_core_web_lg
```

### 5. Install Tesseract OCR

**Windows:**
1. Download installer from: https://github.com/UB-Mannheim/tesseract/wiki
2. Run the installer
3. Add Tesseract to your PATH (usually `C:\Program Files\Tesseract-OCR`)

**Linux (Ubuntu/Debian):**
```bash
sudo apt install tesseract-ocr
```

**macOS:**
```bash
brew install tesseract
```

### 6. Install and Configure Ollama

1. Download Ollama from: https://ollama.ai
2. Install and run Ollama
3. Pull the required model:
```bash
ollama pull qwen2.5:7b
```

**Verify Ollama is running:**
```bash
ollama list
```

You should see `qwen2.5:7b` in the list of models.

## Verification

Run the dependency checker to verify all installations:

```bash
python scripts/check_dependencies.py
```

All checks should pass with green checkmarks (✓).

## Quick Test

Process a sample PDF to verify the pipeline works:

```bash
# If you have a sample PDF in data/input_pdfs/
python -m scripts.process_pdf data/input_pdfs/sample.pdf

# Or process all PDFs in the input directory
python -m scripts.process_pdf --all
```

The output will be saved to `data/output_json/`.

## Troubleshooting

### NumPy Version Conflict

If you see NumPy-related errors with OpenCV:

```bash
pip install "numpy<2.0.0"
pip install --upgrade opencv-python-headless
```

### Tesseract Not Found

If pytesseract can't find Tesseract:

1. Verify Tesseract is installed: `tesseract --version`
2. On Windows, ensure it's in your PATH
3. Or set the path in your code:
```python
import pytesseract
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
```

### Ollama Connection Failed

If Ollama connection fails:

1. Verify Ollama is running: `ollama list`
2. Check if the service is accessible: `curl http://localhost:11434/api/tags`
3. Restart Ollama if needed

### spaCy Model Not Found

If spaCy can't load the model:

```bash
python -m spacy download en_core_web_lg
```

Or check installed models:
```bash
python -m spacy info
```

### PyMuPDF Installation Issues

On some systems, PyMuPDF may require additional build tools:

**Linux:**
```bash
sudo apt install build-essential python3-dev
```

**macOS:**
```bash
xcode-select --install
```

## Platform-Specific Notes

### Windows

- Install Visual C++ Build Tools if you encounter compilation errors
- Use the Windows Tesseract installer from UB Mannheim
- Run PowerShell or Command Prompt as Administrator if needed

### Linux

- You may need to install additional system packages:
```bash
sudo apt install python3-dev build-essential
```

### macOS

- Use Homebrew for Tesseract installation
- Xcode Command Line Tools may be required: `xcode-select --install`

## Next Steps

After successful installation:

1. Review the [README.md](README.md) for usage instructions
2. Check [architecture.md](architecture.md) for technical details
3. Explore the configuration options in `configs/settings.py`
4. Run tests: `pytest tests/test_pipeline.py -v`

## Getting Help

If you encounter issues:

1. Run the dependency checker: `python scripts/check_dependencies.py`
2. Check the logs in `data/debug/pipeline.log`
3. Review the error messages and troubleshooting section above
4. Ensure all external dependencies (Tesseract, Ollama) are running
