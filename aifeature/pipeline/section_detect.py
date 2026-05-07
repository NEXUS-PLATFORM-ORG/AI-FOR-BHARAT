# pipeline/section_detect.py
from dataclasses import dataclass, field
from configs.settings import MAX_TOKENS_PER_LLM_CALL

HEADER_SIGNALS = [
    "in the high court of karnataka",
    "in the supreme court of india",
    "writ petition no", "w.p. no", "w.a. no",
]
FACTS_SIGNALS = [
    "facts of the case", "background", "brief facts",
    "the petitioner approached", "the brief facts",
]
ANALYSIS_SIGNALS = [
    "having heard", "having considered", "we have heard",
    "heard the learned counsel", "having perused",
]
OPERATIVE_SIGNALS = [
    "in view of the above", "in view of the foregoing",
    "accordingly", "for the foregoing reasons",
    "in the result", "in the circumstances",
    "this court therefore directs", "we direct",
    "the petition is", "the writ petition is",
    "it is hereby ordered", "order accordingly",
    "disposed of with the following directions",
    "the respondents are directed", "the respondent shall",
]
OPERATIVE_END_SIGNALS = [
    "sd/-", "judge", "chief justice",
    "pronounced in open court", "i agree",
]

@dataclass
class DocumentSection:
    name: str           # "header" | "facts" | "analysis" | "operative" | "signature" | "other"
    start_page: int
    end_page: int
    text: str
    token_estimate: int

def estimate_tokens(text: str) -> int:
    return int(len(text.split()) / 0.75)

def detect_sections(pages_text: list[tuple[int, str]]) -> list[DocumentSection]:
    sections: list[DocumentSection] = []
    current_section = "header"
    section_start   = 0
    section_texts: dict[str, list[str]] = {current_section: []}

    for page_num, text in pages_text:
        text_lower = text.lower()

        if any(sig in text_lower for sig in OPERATIVE_SIGNALS):
            if current_section != "operative":
                _close_section(sections, section_texts, current_section, section_start, page_num - 1)
                current_section = "operative"
                section_start   = page_num
                section_texts["operative"] = []

        elif any(sig in text_lower for sig in ANALYSIS_SIGNALS):
            if current_section not in ("operative", "analysis"):
                _close_section(sections, section_texts, current_section, section_start, page_num - 1)
                current_section = "analysis"
                section_start   = page_num
                section_texts["analysis"] = []

        elif any(sig in text_lower for sig in FACTS_SIGNALS):
            if current_section == "header":
                _close_section(sections, section_texts, current_section, section_start, page_num - 1)
                current_section = "facts"
                section_start   = page_num
                section_texts["facts"] = []

        if current_section == "operative":
            if any(sig in text_lower for sig in OPERATIVE_END_SIGNALS):
                section_texts[current_section].append(text)
                _close_section(sections, section_texts, current_section, section_start, page_num)
                current_section = "signature"
                section_start   = page_num + 1
                section_texts["signature"] = []
                continue

        section_texts.setdefault(current_section, []).append(text)

    if section_texts.get(current_section):
        _close_section(sections, section_texts, current_section,
                        section_start, pages_text[-1][0] if pages_text else 0)

    return sections

def _close_section(sections: list, section_texts: dict,
                    name: str, start: int, end: int) -> None:
    text = "\n\n".join(section_texts.get(name, []))
    if text.strip():
        sections.append(DocumentSection(
            name=name, start_page=start, end_page=end,
            text=text, token_estimate=estimate_tokens(text),
        ))

def get_llm_chunks(sections: list[DocumentSection],
                    max_tokens_per_call: int = MAX_TOKENS_PER_LLM_CALL) -> dict[str, str]:
    priority = {
        "operative": 1,
        "header":    2,
        "facts":     3,
        "analysis":  4,
    }

    chunks: dict[str, str] = {}
    for section in sorted(sections, key=lambda s: priority.get(s.name, 99)):
        if section.name not in priority:
            continue
        if section.token_estimate <= max_tokens_per_call:
            chunks[section.name] = section.text
        else:
            words  = section.text.split()
            budget = int(max_tokens_per_call * 0.75)
            head   = " ".join(words[:int(budget * 0.8)])
            tail   = " ".join(words[-int(budget * 0.2):])
            chunks[section.name] = head + "\n\n[...]\n\n" + tail

    return chunks
