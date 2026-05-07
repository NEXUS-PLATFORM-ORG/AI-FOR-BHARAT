# pipeline/merge.py
import hashlib
from datetime import datetime, timezone
from pydantic import BaseModel, Field
from typing import Optional
from configs.settings import PIPELINE_VERSION

class Directive(BaseModel):
    text: str
    mandatory: bool
    timeline_days: Optional[int]    = None
    responsible_dept: Optional[str] = None
    source_page: Optional[int]      = None

class ExtractionOutput(BaseModel):
    # Deterministic (NLP stage)
    case_numbers: list[str]
    neutral_citation: Optional[str]
    connected_cases: list[str]
    statutes_cited: list[str]
    judge_names: list[str]

    # LLM — operative
    pronouncement_date: Optional[str]    = None
    bench_composition: Optional[str]     = None
    advocate_petitioner: Optional[str]   = None
    advocate_respondent: Optional[str]   = None
    directives: list[Directive]          = Field(default_factory=list)
    relief_granted: Optional[str]        = None
    next_hearing_date: Optional[str]     = None
    limitation_period_days: Optional[int]= None
    cost_order: Optional[str]            = None
    named_officers: list[dict]           = Field(default_factory=list)
    interim_orders: list[dict]           = Field(default_factory=list)

    # LLM — facts
    subject_matter_tag: Optional[str]    = None
    geographical_scope: Optional[dict]   = None
    respondent_structured: Optional[dict]= None
    prior_proceedings: list[dict]        = Field(default_factory=list)
    contempt_history: bool               = False

    # LLM — analysis
    precedents_cited: list[dict]         = Field(default_factory=list)
    order_type: Optional[str]            = None

    # Pipeline metadata
    extraction_sha256: str  = ""
    extracted_at: str       = ""
    pipeline_version: str   = PIPELINE_VERSION

def merge_and_validate(nlp_result, llm_results: dict, ingest_sha256: str) -> ExtractionOutput:
    op       = llm_results.get("operative", {})
    facts    = llm_results.get("facts", {})
    analysis = llm_results.get("analysis", {})

    # Build directives safely — skip malformed entries
    directives = []
    for d in op.get("directives", []):
        if isinstance(d, dict) and "text" in d:
            try:
                directives.append(Directive(**d))
            except Exception:
                pass

    output = ExtractionOutput(
        case_numbers=nlp_result.case_numbers,
        # Prefer LLM neutral_citation over NLP if available
        neutral_citation=op.get("neutral_citation") or nlp_result.neutral_citation,
        connected_cases=list(dict.fromkeys(
            nlp_result.connected_cases + op.get("connected_cases", [])
        )),
        # Merge NLP + LLM statutes, deduplicate
        statutes_cited=list(dict.fromkeys(
            nlp_result.statutes_cited + analysis.get("statutes_cited", [])
        )),
        # Prefer LLM judge_names over NLP if available
        judge_names=op.get("judge_names", []) or nlp_result.judge_names,
        pronouncement_date=op.get("pronouncement_date"),
        bench_composition=op.get("bench_composition"),
        advocate_petitioner=op.get("advocate_petitioner"),
        advocate_respondent=op.get("advocate_respondent"),
        directives=directives,
        # NLP relief is fallback when LLM doesn't find one
        relief_granted=op.get("relief_granted") or nlp_result.relief_granted,
        next_hearing_date=op.get("next_hearing_date"),
        limitation_period_days=op.get("limitation_period_days"),
        cost_order=op.get("cost_order"),
        named_officers=op.get("named_officers", []),
        interim_orders=op.get("interim_orders", []),
        subject_matter_tag=facts.get("subject_matter_tag"),
        geographical_scope=facts.get("geographical_scope"),
        respondent_structured=facts.get("respondent_structured"),
        prior_proceedings=facts.get("prior_proceedings", []),
        contempt_history=facts.get("contempt_history", False),
        precedents_cited=analysis.get("precedents_cited", []),
        order_type=analysis.get("order_type"),
        extracted_at=datetime.now(timezone.utc).isoformat(),
    )

    # Chain hash: ingest_sha256 + serialised output → tamper-evident audit trail
    content = ingest_sha256 + output.model_dump_json()
    output.extraction_sha256 = hashlib.sha256(content.encode()).hexdigest()

    return output
