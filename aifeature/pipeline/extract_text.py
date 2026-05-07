# pipeline/extract_text.py
import fitz
import cv2
import numpy as np
import pytesseract
from pathlib import Path
from dataclasses import dataclass, field
from .classify import PageClassification
from configs.settings import OCR_DPI, OCR_LANG, OCR_CONFIG, TESSERACT_PATH

# Configure Tesseract path for Windows
if Path(TESSERACT_PATH).exists():
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_PATH

@dataclass
class PageText:
    page_num: int
    text: str
    pipeline: str
    dqs: float | None        # 0-100, None for Pipeline A
    spans: list[dict] = field(default_factory=list)  # [{text, bbox, font_size, bold, page}]

def extract_page_a(doc, page_num: int, two_column: bool) -> PageText:
    page = doc[page_num]

    if two_column:
        page_width = page.rect.width
        left_clip  = fitz.Rect(0, 0, page_width * 0.5, page.rect.height)
        right_clip = fitz.Rect(page_width * 0.5, 0, page_width, page.rect.height)
        text = (page.get_text(clip=left_clip) + "\n" +
                page.get_text(clip=right_clip))
    else:
        text = page.get_text()

    spans = []
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                spans.append({
                    "text": span["text"],
                    "bbox": list(span["bbox"]),
                    "font_size": span["size"],
                    "bold": "bold" in span.get("font", "").lower() or bool(span.get("flags", 0) & 16),
                    "page": page_num,
                })

    return PageText(page_num=page_num, text=text,
                    pipeline="A", dqs=None, spans=spans)

def extract_page_b(doc, page_num: int) -> PageText:
    page = doc[page_num]
    scale = OCR_DPI / 72
    mat = fitz.Matrix(scale, scale)
    pix = page.get_pixmap(matrix=mat)
    img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, pix.n)

    if pix.n == 4:
        img = cv2.cvtColor(img, cv2.COLOR_RGBA2RGB)
    elif pix.n == 1:
        img = cv2.cvtColor(img, cv2.COLOR_GRAY2RGB)

    img = _preprocess(img)

    data = pytesseract.image_to_data(
        img, lang=OCR_LANG, config=OCR_CONFIG,
        output_type=pytesseract.Output.DICT
    )

    # FIX: zip text and conf together directly — avoids the broken .index() lookup
    words, confs = [], []
    for word, conf in zip(data["text"], data["conf"]):
        conf_int = int(conf)
        if word.strip() and conf_int > 0:
            words.append(word)
            confs.append(conf_int)

    text = " ".join(words)
    dqs = round(sum(confs) / len(confs), 1) if confs else 0.0

    return PageText(page_num=page_num, text=text,
                    pipeline="B", dqs=dqs, spans=[])

def _preprocess(img: np.ndarray) -> np.ndarray:
    gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)

    # Deskew
    coords = np.column_stack(np.where(gray < 200))
    if len(coords) > 100:
        angle = cv2.minAreaRect(coords)[-1]
        if angle < -45:
            angle += 90
        if abs(angle) > 0.5:
            h, w = gray.shape
            M = cv2.getRotationMatrix2D((w / 2, h / 2), angle, 1.0)
            gray = cv2.warpAffine(gray, M, (w, h),
                                   flags=cv2.INTER_CUBIC,
                                   borderMode=cv2.BORDER_REPLICATE)

    denoised = cv2.fastNlMeansDenoising(gray, h=10)
    binary = cv2.adaptiveThreshold(denoised, 255,
                                    cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                    cv2.THRESH_BINARY, 31, 10)
    return binary

def extract_all_pages(pdf_path: str,
                       classifications: list[PageClassification]) -> list[PageText]:
    doc = fitz.open(pdf_path)
    results = []
    for cls in classifications:
        if cls.pipeline == "A":
            results.append(extract_page_a(doc, cls.page_num, cls.two_column))
        else:
            results.append(extract_page_b(doc, cls.page_num))
    doc.close()
    return results
