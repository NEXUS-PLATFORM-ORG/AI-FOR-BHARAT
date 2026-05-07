# utils/file_utils.py
import json
from pathlib import Path
from configs.settings import INPUT_PDF_DIR, OUTPUT_JSON_DIR

def save_output(data: dict, stem: str) -> Path:
    """Persist extraction result as JSON; returns the written path."""
    OUTPUT_JSON_DIR.mkdir(parents=True, exist_ok=True)
    out_path = OUTPUT_JSON_DIR / f"{stem}.json"
    out_path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    return out_path

def load_output(stem: str) -> dict:
    """Load a previously saved extraction result."""
    path = OUTPUT_JSON_DIR / f"{stem}.json"
    return json.loads(path.read_text(encoding="utf-8"))

def list_input_pdfs() -> list[Path]:
    """Return all PDF files in the input directory."""
    INPUT_PDF_DIR.mkdir(parents=True, exist_ok=True)
    return sorted(INPUT_PDF_DIR.glob("*.pdf"))

def ensure_dirs() -> None:
    """Create all required data directories if they don't exist."""
    for d in (INPUT_PDF_DIR, OUTPUT_JSON_DIR):
        d.mkdir(parents=True, exist_ok=True)
