# Document Extraction Pipeline

Extracts structured data from Karnataka High Court judgment PDFs using a 7-stage pipeline. Runs entirely on CPU with a local LLM — no data leaves the machine.

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Install spaCy model
python -m spacy download en_core_web_lg

# Install and start Ollama, then pull the model
ollama pull qwen2.5:7b
```

For detailed installation instructions, see [INSTALLATION.md](INSTALLATION.md).

**Prerequisites:**
- Tesseract OCR (see [INSTALLATION.md](INSTALLATION.md) for platform-specific instructions)
- Ollama running locally

## Usage

```bash
# Single PDF
python -m scripts.process_pdf data/input_pdfs/judgment.pdf

# All PDFs in input directory
python -m scripts.process_pdf --all
```

Output JSON is written to `data/output_json/<filename>.json`.

## Verify Installation

Run the dependency checker to verify all requirements are met:

```bash
python scripts/check_dependencies.py
```

## Pipeline Stages

| Stage | File | Purpose |
|-------|------|---------|
| 1 | `pipeline/ingest.py` | SHA-256 hash, page count, readability check |
| 2 | `pipeline/classify.py` | Per-page routing: Pipeline A (digital) or B (scanned) |
| 3 | `pipeline/extract_text.py` | PyMuPDF (A) or OpenCV+Tesseract OCR (B) |
| 4 | `pipeline/nlp_extract.py` | Regex + spaCy NER — zero-hallucination extraction |
| 5 | `pipeline/section_detect.py` | Section segmentation + 97% token reduction |
| 6 | `pipeline/llm_extract.py` | Qwen2.5:7b via Ollama — 3 focused prompts |
| 7 | `pipeline/merge.py` | Pydantic validation, dedup, chain SHA-256 |

## Running Tests

```bash
pytest tests/test_pipeline.py -v
```

## Project Structure

```
document_extraction/
├── configs/
│   ├── settings.py       # All configurable constants
│   └── prompts.py        # LLM prompt templates
├── data/
│   ├── input_pdfs/       # Drop PDFs here
│   ├── output_json/      # Extraction results
│   └── debug/            # pipeline.log
├── pipeline/             # 7-stage pipeline
├── scripts/
│   ├── process_pdf.py    # CLI entry point
│   └── check_dependencies.py  # Verify installation
├── tests/
│   └── test_pipeline.py
├── utils/
│   ├── file_utils.py
│   ├── logger.py
│   └── text_utils.py
├── INSTALLATION.md       # Detailed installation guide
├── architecture.md       # Technical architecture
└── requirements.txt
```

## Documentation

- **[INSTALLATION.md](INSTALLATION.md)**: Comprehensive installation and troubleshooting guide
- **[architecture.md](architecture.md)**: Technical details and system design

## Configuration

All pipeline parameters are centralized in `configs/settings.py`:

- LLM settings (model, temperature, context window)
- OCR settings (DPI, language, preprocessing options)
- Classification thresholds (digital vs scanned)
- Section detection parameters

LLM prompts are defined in `configs/prompts.py` and can be customized without code changes.
