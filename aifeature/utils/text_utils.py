# utils/text_utils.py
import re
import unicodedata

def normalise_whitespace(text: str) -> str:
    """Collapse runs of whitespace and strip leading/trailing space."""
    return re.sub(r'\s+', ' ', text).strip()

def remove_control_chars(text: str) -> str:
    """Strip non-printable control characters (keeps newlines and tabs)."""
    return "".join(
        ch for ch in text
        if unicodedata.category(ch)[0] != "C" or ch in ("\n", "\t")
    )

def clean_ocr_text(text: str) -> str:
    """Apply both normalisation steps — useful after Tesseract output."""
    return normalise_whitespace(remove_control_chars(text))

def truncate_to_tokens(text: str, max_tokens: int) -> str:
    """
    Rough token-budget truncation (1 token ≈ 0.75 words).
    Returns the first `max_tokens` worth of words.
    """
    words = text.split()
    limit = int(max_tokens * 0.75)
    return " ".join(words[:limit])

def word_count(text: str) -> int:
    return len(text.split())

def estimate_tokens(text: str) -> int:
    return int(word_count(text) / 0.75)
