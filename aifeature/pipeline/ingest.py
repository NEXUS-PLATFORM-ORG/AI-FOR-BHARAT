# pipeline/stage1_ingest.py
import fitz  # PyMuPDF
import hashlib
from pathlib import Path
from dataclasses import dataclass

@dataclass
class IngestResult:
    path: str
    sha256: str
    page_count: int
    file_size_bytes: int
    is_readable: bool
    error: str | None = None

def ingest_pdf(pdf_path: str) -> IngestResult:
    path = Path(pdf_path)
    
    # SHA-256 before touching the file — tamper evidence starts here
    sha256 = hashlib.sha256(path.read_bytes()).hexdigest()
    file_size = path.stat().st_size
    
    try:
        doc = fitz.open(pdf_path)
        page_count = len(doc)
        doc.close()
        return IngestResult(
            path=pdf_path, sha256=sha256,
            page_count=page_count, file_size_bytes=file_size,
            is_readable=True
        )
    except Exception as e:
        return IngestResult(
            path=pdf_path, sha256=sha256,
            page_count=0, file_size_bytes=file_size,
            is_readable=False, error=str(e)
        )