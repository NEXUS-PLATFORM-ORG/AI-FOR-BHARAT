# configs/prompts.py

OPERATIVE_PROMPT = """\
Extract structured data from the court order text below.
Output ONLY a JSON object. No explanation. No markdown.

Rules:
- Extract ONLY what is explicitly stated. Never infer or guess.
- Use null for any field not found in the text.
- All dates must be in YYYY-MM-DD format.

Required JSON structure:
{{
"neutral_citation": "<e.g. 2024:KHC:38471>" or null,
"pronouncement_date": "<YYYY-MM-DD>" or null,
"judge_names": ["<full judge name with title>"],
"bench_composition": "<one of: SINGLE | DIVISION | FULL_BENCH>",
"advocate_petitioner": "<name and designation>" or null,
"advocate_respondent": "<name and designation>" or null,
"connected_cases": ["<case number>"],
"relief_granted": "<one of: ALLOWED | DISMISSED | DISPOSED_WITH_DIRECTIONS | QUASHED | STAYED | REMANDED | DISPOSED>",
"directives": [
  {{
    "text": "<exact order text>",
    "mandatory": true or false,
    "timeline_days": <integer> or null,
    "responsible_dept": "<department name>" or null
  }}
],
"named_officers": [
  {{
    "designation": "<title>",
    "location": "<place>" or null,
    "name_if_stated": "<name>" or null
  }}
],
"cost_order": "<one of: NO_COSTS | NO_ORDER_AS_TO_COSTS | COSTS_AWARDED | COSTS_TO_PETITIONER>" or null,
"interim_orders": [
  {{
    "type": "<one of: STAY | INJUNCTION | OTHER>",
    "granted_date": "<YYYY-MM-DD>" or null,
    "status": "<one of: GRANTED | VACATED | CONTINUED>"
  }}
],
"next_hearing_date": "<YYYY-MM-DD>" or null,
"limitation_period_days": <integer> or null,
"confidence": {{
  "neutral_citation": <0-100>,
  "pronouncement_date": <0-100>,
  "judge_names": <0-100>,
  "bench_composition": <0-100>,
  "relief_granted": <0-100>,
  "directives": <0-100>,
  "named_officers": <0-100>,
  "cost_order": <0-100>,
  "interim_orders": <0-100>,
  "next_hearing_date": <0-100>,
  "limitation_period_days": <0-100>
}},
"ambiguity_flags": ["<field_name>"]
}}

TEXT:
{text}

JSON:"""

FACTS_PROMPT = """\
Extract structured data from the factual background text below.
Output ONLY a JSON object. No explanation. No markdown.

Rules:
- Extract ONLY what is explicitly stated. Never infer or guess.
- Use null for any field not found in the text.

Required JSON structure:
{{
"subject_matter_tag": "<one of: LAND_RECORDS_RTC | LABOUR_COMPLIANCE | URBAN_PLANNING | HOME_DEPT | EDUCATION | ENVIRONMENT | WATER_SUPPLY | PWD_INFRASTRUCTURE | OTHER>",
"geographical_scope": {{
  "district": "<district name>" or null,
  "taluk": "<taluk name>" or null,
  "village": "<village name>" or null
}},
"respondent_structured": {{
  "department": "<department name>" or null,
  "designation": "<designation>" or null,
  "name_if_stated": "<name>" or null
}},
"prior_proceedings": [
  {{
    "case_number": "<case number>",
    "outcome": "<outcome>",
    "court": "<court name>"
  }}
],
"contempt_history": true or false,
"confidence": {{
  "subject_matter_tag": <0-100>,
  "geographical_scope": <0-100>,
  "respondent_structured": <0-100>,
  "prior_proceedings": <0-100>,
  "contempt_history": <0-100>
}}
}}

TEXT:
{text}

JSON:"""

ANALYSIS_PROMPT = """\
Extract structured data from the legal analysis text below.
Output ONLY a JSON object. No explanation. No markdown.

Rules:
- Extract ONLY what is explicitly stated. Never infer or guess.
- If both CrPC and BNSS numbers are mentioned for the same provision, include both.
- Use empty list [] for any list field not found in the text.

Required JSON structure:
{{
"statutes_cited": ["<statute name and section>"],
"precedents_cited": [
  {{
    "citation": "<full case citation>",
    "relevance_one_sentence": "<one sentence on how it was used>"
  }}
],
"order_type": "<one of: DISPOSED_WITH_DIRECTIONS | ALLOWED | DISMISSED | STAYED | REMANDED>",
"confidence": {{
  "statutes_cited": <0-100>,
  "precedents_cited": <0-100>,
  "order_type": <0-100>
}}
}}

TEXT:
{text}

JSON:"""
