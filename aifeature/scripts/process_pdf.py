# scripts/process_pdf.py
"""
CLI entry point for the document extraction pipeline.

Usage:
    python -m scripts.process_pdf path/to/judgment.pdf
    python -m scripts.process_pdf --all          # process every PDF in data/input_pdfs/
"""
import sys
import json
import argparse
from pathlib import Path

# Allow running from the document_extraction root
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from pipeline.run import process_judgment
from utils.file_utils import list_input_pdfs, save_output, ensure_dirs
from utils.logger import get_logger

logger = get_logger("process_pdf")

def process_one(pdf_path: Path) -> None:
    logger.info("Processing: %s", pdf_path)
    result = process_judgment(str(pdf_path))

    if "error" in result:
        logger.error("Failed: %s — %s", pdf_path.name, result["error"])
        return

    out_path = save_output(result, pdf_path.stem)
    logger.info("Saved → %s", out_path)

def main() -> None:
    parser = argparse.ArgumentParser(description="Extract structured data from court judgment PDFs.")
    group  = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("pdf", nargs="?", help="Path to a single PDF file")
    group.add_argument("--all", action="store_true", help="Process all PDFs in data/input_pdfs/")
    args = parser.parse_args()

    ensure_dirs()

    if args.all:
        pdfs = list_input_pdfs()
        if not pdfs:
            logger.warning("No PDFs found in input directory.")
            return
        for pdf in pdfs:
            process_one(pdf)
    else:
        process_one(Path(args.pdf))

if __name__ == "__main__":
    main()
