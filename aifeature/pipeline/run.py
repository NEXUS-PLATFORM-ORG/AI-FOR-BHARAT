# pipeline/run.py
from .ingest import ingest_pdf
from .classify import classify_pages
from .extract_text import extract_all_pages
from .nlp_extract import run_nlp_extraction
from .section_detect import detect_sections, get_llm_chunks
from .llm_extract import run_llm_extraction
from .merge import merge_and_validate

def process_judgment(pdf_path: str) -> dict:
    print(f"[1/7] Ingesting {pdf_path}")
    ingest = ingest_pdf(pdf_path)
    if not ingest.is_readable:
        return {"error": ingest.error}
    print(f"      {ingest.page_count} pages | SHA-256: {ingest.sha256[:16]}...")

    print("[2/7] Classifying pages")
    classifications = classify_pages(pdf_path)
    a_pages = sum(1 for c in classifications if c.pipeline == "A")
    b_pages = sum(1 for c in classifications if c.pipeline == "B")
    print(f"      Pipeline A: {a_pages} pages | Pipeline B: {b_pages} pages")

    print("[3/7] Extracting text")
    pages = extract_all_pages(pdf_path, classifications)

    print("[4/7] Running NLP pre-extraction")
    full_text = "\n\n".join(p.text for p in pages)
    nlp_result = run_nlp_extraction(full_text)
    print(f"      Found {len(nlp_result.case_numbers)} case numbers, "
          f"{len(nlp_result.statutes_cited)} statutes")

    print("[5/7] Detecting sections")
    pages_text = [(p.page_num, p.text) for p in pages]
    sections = detect_sections(pages_text)
    chunks = get_llm_chunks(sections)
    total_tokens = sum(s.token_estimate for s in sections)
    llm_tokens = sum(len(t.split()) for t in chunks.values())
    print(f"      Full doc ~{total_tokens:,} tokens → sending ~{llm_tokens:,} to LLM")

    print("[6/7] Running LLM extraction")
    llm_results = run_llm_extraction(chunks)

    print("[7/7] Merging and validating")
    output = merge_and_validate(nlp_result, llm_results, ingest.sha256)

    print(f"      Extraction SHA-256: {output.extraction_sha256[:16]}...")
    return output.model_dump()
