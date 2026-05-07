# pipeline/nlp_extract.py
import re
import spacy
from dataclasses import dataclass, field
from configs.settings import SPACY_MODEL, NER_CHAR_LIMIT

nlp = spacy.load(SPACY_MODEL)

# ── Regex patterns for Karnataka HC judgments ──────────────────────────────
CASE_NUMBER_RE = re.compile(
    r'\b(W\.?P\.?\s*(?:No\.?)?\s*\d{1,6}\s*/\s*\d{4}|'
    r'W\.?A\.?\s*(?:No\.?)?\s*\d{1,6}\s*/\s*\d{4}|'
    r'CRL\.?\s*P\.?\s*\d{1,6}\s*/\s*\d{4})',
    re.IGNORECASE,
)
NEUTRAL_CITE_RE = re.compile(r'\b\d{4}\s*:\s*KHC\s*[-:]\s*[A-Z]?\s*\d+\b', re.IGNORECASE)
DATE_RE = re.compile(
    r'\b(\d{1,2})[thstndrd]*\s+'
    r'(January|February|March|April|May|June|July|August|September|October|November|December)'
    r'\s+(\d{4})\b|'
    r'\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b',
    re.IGNORECASE,
)
CONNECTED_CASES_RE = re.compile(
    r'C/?W\.?\s*(W\.?[PA]\.?\s*(?:No\.?)?\s*\d{1,6}\s*/\s*\d{4})',
    re.IGNORECASE,
)
STATUTE_RE = re.compile(
    r'(?:Section|S\.)\s*\d+[A-Z]?\s*(?:of\s+the\s+)?'
    r'(?:[A-Z][a-z]+\s+){1,6}(?:Act|Code|Rules?|Regulations?),?\s*\d{4}|'
    r'Article\s+\d+[A-Z]?\s+(?:of\s+the\s+Constitution)?',
    re.IGNORECASE,
)
BENCH_RE = re.compile(
    r'\b(HON\'?BLE\s+(?:MR\.?\s*)?JUSTICE\s+[A-Z][A-Z\s\.]+)',
    re.IGNORECASE,
)
RELIEF_RE = re.compile(
    r'\b(petition\s+is\s+(?:allowed|dismissed|disposed\s+of|allowed\s+in\s+part)|'
    r'writ\s+(?:petition|appeal)\s+is\s+(?:allowed|dismissed|disposed)|'
    r'order\s+is\s+(?:quashed|set\s+aside|modified)|'
    r'matter\s+is\s+remanded)\b',
    re.IGNORECASE,
)

@dataclass
class NLPExtractionResult:
    case_numbers: list[str]      = field(default_factory=list)
    neutral_citation: str | None = None
    connected_cases: list[str]   = field(default_factory=list)
    dates_found: list[str]       = field(default_factory=list)
    statutes_cited: list[str]    = field(default_factory=list)
    judge_names: list[str]       = field(default_factory=list)
    relief_granted: str | None   = None
    org_entities: list[str]      = field(default_factory=list)
    person_entities: list[str]   = field(default_factory=list)
    location_entities: list[str] = field(default_factory=list)

def run_nlp_extraction(full_text: str) -> NLPExtractionResult:
    result = NLPExtractionResult()

    result.case_numbers = list({m.group().strip() for m in CASE_NUMBER_RE.finditer(full_text)})

    cite_match = NEUTRAL_CITE_RE.search(full_text)
    if cite_match:
        result.neutral_citation = cite_match.group().strip()

    result.connected_cases = list({m.group(1).strip() for m in CONNECTED_CASES_RE.finditer(full_text)})
    result.statutes_cited  = list({m.group().strip() for m in STATUTE_RE.finditer(full_text)})
    result.judge_names     = list({m.group(1).strip() for m in BENCH_RE.finditer(full_text[:3000])})

    result.dates_found = list({m.group().strip() for m in DATE_RE.finditer(full_text)})

    relief_match = RELIEF_RE.search(full_text[-8000:])
    if relief_match:
        result.relief_granted = relief_match.group().strip()

    doc = nlp(full_text[:NER_CHAR_LIMIT])
    for ent in doc.ents:
        if ent.label_ == "PERSON":
            result.person_entities.append(ent.text.strip())
        elif ent.label_ == "ORG":
            result.org_entities.append(ent.text.strip())
        elif ent.label_ in ("GPE", "LOC"):
            result.location_entities.append(ent.text.strip())

    result.person_entities   = list(dict.fromkeys(result.person_entities))
    result.org_entities      = list(dict.fromkeys(result.org_entities))
    result.location_entities = list(dict.fromkeys(result.location_entities))

    return result
