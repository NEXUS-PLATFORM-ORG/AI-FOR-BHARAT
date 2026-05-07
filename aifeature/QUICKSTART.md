# Quick Start Guide

Get up and running with the Document Extraction Pipeline in 5 minutes.

## Prerequisites Check

Before starting, ensure you have:
- ✅ Python 3.10+ installed
- ✅ Git installed
- ✅ 8GB RAM minimum (16GB recommended)
- ✅ 5GB free disk space

---

## ⚡ Quick Installation (5 Steps)

### 1. Clone & Setup Virtual Environment

```bash
# Clone the repository
git clone <repository-url>
cd document_extraction

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

# Upgrade pip
python -m pip install --upgrade pip
```

### 2. Install Python Dependencies

```bash
pip install -r requirements.txt
python -m spacy download en_core_web_lg
```

### 3. Install Tesseract OCR

**Windows:**
```bash
# Download from: https://github.com/UB-Mannheim/tesseract/wiki
# Install the .exe file (default: C:\Program Files\Tesseract-OCR)
```

**Linux:**
```bash
sudo apt install tesseract-ocr
```

**macOS:**
```bash
brew install tesseract
```

### 4. Install & Start Ollama

```bash
# Download from: https://ollama.ai
# After installation:

# Pull your preferred model (choose one)
ollama pull mistral        # Recommended - faster, better for JSON
ollama pull llama3         # Alternative - more detailed reasoning
ollama pull qwen2.5:7b     # Original default

# Start Ollama server
ollama serve
```

### 5. Verify Installation

```bash
python scripts/check_dependencies.py
```

All checks should show ✅.

---

## 🚀 Running the Pipeline

### Process a Single PDF

```bash
# Place your PDF in data/input_pdfs/
python -m scripts.process_pdf data/input_pdfs/your_document.pdf
```

### Process All PDFs

```bash
python -m scripts.process_pdf --all
```

### Output Location

Extracted JSON files are saved to:
```
data/output_json/<filename>.json
```

---

## 📝 Example Workflow

```bash
# 1. Add your court order PDF
cp ~/Downloads/judgment.pdf data/input_pdfs/

# 2. Run extraction
python -m scripts.process_pdf data/input_pdfs/judgment.pdf

# 3. View results
cat data/output_json/judgment.json
```

---

## ⚙️ Configuration

### Change LLM Model

Edit `configs/settings.py`:

```python
# Line 12 - Choose your model
OLLAMA_MODEL = "mistral"  # Options: "mistral", "llama3", "qwen2.5:7b"
```

### Adjust OCR Settings

Edit `configs/settings.py`:

```python
# Lines 15-18
OCR_DPI = 300              # Increase for better quality (slower)
OCR_LANG = "eng"           # Language code
OCR_CONFIG = "--oem 1 --psm 3"
```

### Customize Tesseract Path (Windows)

If Tesseract is installed in a custom location:

```python
# configs/settings.py - Line 12
TESSERACT_PATH = r"C:\Custom\Path\To\tesseract.exe"
```

---

## 🔧 Common Issues & Fixes

### Issue: `tesseract: command not found`

**Fix:**
```bash
# Verify installation
tesseract --version

# If not in PATH, add to system PATH or configure in settings.py
```

### Issue: `Ollama connection failed`

**Fix:**
```bash
# Start Ollama server
ollama serve

# In another terminal, verify
ollama list
```

### Issue: `Model not found: qwen2.5:7b`

**Fix:**
```bash
# Pull the model
ollama pull qwen2.5:7b

# Or change to an available model in configs/settings.py
OLLAMA_MODEL = "mistral"
```

### Issue: `spaCy model not found`

**Fix:**
```bash
python -m spacy download en_core_web_lg
```

### Issue: `NumPy version conflict`

**Fix:**
```bash
pip install "numpy<2.0.0"
pip install --upgrade opencv-python-headless
```

---

## 📊 Pipeline Overview

The pipeline processes PDFs in 7 stages:

```
PDF Input
    ↓
1. Ingest (hash, page count)
    ↓
2. Classify (digital vs scanned)
    ↓
3. Extract Text (PyMuPDF or OCR)
    ↓
4. NLP Extract (regex + spaCy NER)
    ↓
5. Section Detect (segmentation)
    ↓
6. LLM Extract (structured JSON)
    ↓
7. Merge & Validate (Pydantic)
    ↓
JSON Output
```

---

## 🧪 Run Tests

```bash
# Run all tests
pytest tests/test_pipeline.py -v

# Run with coverage
pytest tests/test_pipeline.py --cov=pipeline --cov-report=html
```

---

## 📂 Project Structure

```
document_extraction/
├── data/
│   ├── input_pdfs/      ← Drop PDFs here
│   ├── output_json/     ← Results appear here
│   └── debug/           ← Logs
├── configs/
│   ├── settings.py      ← Configuration
│   └── prompts.py       ← LLM prompts
├── pipeline/            ← 7-stage pipeline
├── scripts/
│   ├── process_pdf.py   ← Main CLI
│   └── check_dependencies.py
└── tests/
```

---

## 📖 Next Steps

1. **Explore Configuration** - Review `configs/settings.py` for customization options
2. **Read Documentation** - See [INSTALLATION.md](INSTALLATION.md) for detailed setup
3. **Understand Architecture** - Check [architecture.md](architecture.md) for technical details
4. **Customize Prompts** - Edit `configs/prompts.py` for your specific use case

---

## 💡 Tips

### Faster Processing
- Use `mistral` model (faster than llama3)
- Lower `OCR_DPI` to 200 for scanned documents
- Increase `OLLAMA_NUM_CTX` for longer documents

### Better Quality
- Use `llama3` for complex legal reasoning
- Increase `OCR_DPI` to 400 for poor quality scans
- Adjust `OLLAMA_TEMPERATURE` to 0.1 for more creative extraction

### Batch Processing
```bash
# Process multiple PDFs
for pdf in data/input_pdfs/*.pdf; do
    python -m scripts.process_pdf "$pdf"
done
```

---

## 🆘 Need Help?

1. Check logs: `data/debug/pipeline.log`
2. Run dependency checker: `python scripts/check_dependencies.py`
3. Review [INSTALLATION.md](INSTALLATION.md) for detailed troubleshooting

---

## ✅ Quick Checklist

Before running your first extraction:

- [ ] Virtual environment activated
- [ ] All Python dependencies installed
- [ ] spaCy model downloaded
- [ ] Tesseract OCR installed and in PATH
- [ ] Ollama running (`ollama serve`)
- [ ] Model pulled (`ollama pull mistral`)
- [ ] Dependency check passed (all ✅)

Once all boxes are checked, you're ready to extract! 🎉
