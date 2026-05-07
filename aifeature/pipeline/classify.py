# pipeline/classify.py
import fitz
from dataclasses import dataclass
from configs.settings import DIGITAL_CHAR_THRESHOLD, CORRUPT_ASCII_RATIO

@dataclass
class PageClassification:
    page_num: int               # 0-indexed
    pipeline: str               # "A" or "B"
    char_count: int
    two_column: bool
    text_layer_corrupt: bool

def _is_corrupt(text: str, char_count: int) -> bool:
    if char_count < 20:
        return False
    valid = sum(1 for c in text if c.isprintable() and ord(c) < 128)
    return (valid / len(text)) < CORRUPT_ASCII_RATIO

def _detect_two_column(page) -> bool:
    blocks = page.get_text("blocks")
    if len(blocks) < 4:
        return False
    page_width = page.rect.width
    x_centers = [(b[0] + b[2]) / 2 for b in blocks]
    left  = sum(1 for x in x_centers if x < page_width * 0.5)
    right = sum(1 for x in x_centers if x >= page_width * 0.5)
    return left > 2 and right > 2 and abs(left - right) < len(blocks) * 0.4

def classify_pages(pdf_path: str) -> list[PageClassification]:
    doc = fitz.open(pdf_path)
    results = []

    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text()
        char_count = len(text.strip())

        if char_count >= DIGITAL_CHAR_THRESHOLD:
            corrupt  = _is_corrupt(text, char_count)
            pipeline = "B" if corrupt else "A"
            two_col  = _detect_two_column(page) if not corrupt else False
        else:
            pipeline = "B"
            two_col  = False
            corrupt  = False

        results.append(PageClassification(
            page_num=page_num, pipeline=pipeline,
            char_count=char_count, two_column=two_col,
            text_layer_corrupt=corrupt,
        ))

    doc.close()
    return results
