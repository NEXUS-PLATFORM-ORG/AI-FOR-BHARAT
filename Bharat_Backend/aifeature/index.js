import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ─── Action Plan Logic ────────────────────────────────────────────────────────
// Derives decision, required_action, risk_score from extracted fields.
const buildActionPlan = (extracted) => {
  const outcome = (extracted.outcome || '').toLowerCase();
  const directives = extracted.directives || [];
  const daysToDeadline = extracted.deadline_days ?? 30;

  // Decision mapping
  let decision = 'NO ACTION';
  let required_action = 'Archive and monitor';

  if (/dismiss|rejected|no relief/i.test(outcome)) {
    decision = 'NO ACTION';
    required_action = 'Archive and monitor';
  } else if (/allow|direct|order|compli|implement/i.test(outcome)) {
    decision = 'COMPLY';
    required_action = directives.length > 0
      ? `Implement: ${directives[0]}`
      : 'Initiate compliance steps per court directive';
  } else if (/appeal|challenge|aggriev/i.test(outcome)) {
    decision = 'APPEAL';
    required_action = 'Prepare documentation for higher court challenge';
  } else if (directives.length > 0) {
    decision = 'COMPLY';
    required_action = `Implement: ${directives[0]}`;
  }

  // Risk score (0–100): deadline urgency (40%) + directive strength (40%) + confidence (20%)
  const deadlineScore = daysToDeadline <= 7 ? 9.5
    : daysToDeadline <= 14 ? 8.0
    : daysToDeadline <= 30 ? 6.5
    : 4.0;

  const directiveScore = directives.length >= 3 ? 9.0
    : directives.length === 2 ? 7.5
    : directives.length === 1 ? 6.0
    : 3.0;

  const confidence = extracted.extraction_confidence ?? 7.0;
  const risk_score = Math.round(
    (deadlineScore * 0.4 + directiveScore * 0.4 + confidence * 0.2) * 10
  );

  const priority = risk_score >= 70 ? 'High' : risk_score >= 45 ? 'Medium' : 'Low';

  return { decision, required_action, risk_score, priority };
};

// ─── Main Export ──────────────────────────────────────────────────────────────
export const extractFromText = async (text) => {
  if (!text || text.trim().length < 100) return {};

  const snippet = text.substring(0, 6000); // keep prompt within token limits

  const prompt = `You are a legal document analyst for Indian courts. Extract structured information from the judgment text below.

Return ONLY a valid JSON object with these exact keys (use null if not found):
{
  "case_id": "petition/case number e.g. WP 1240/2023",
  "case_number": "same as case_id or alternate reference",
  "court": "exact court name",
  "judge": "judge name(s)",
  "petitioner": "petitioner/appellant name",
  "respondent": "respondent name",
  "department": "government department responsible for compliance (e.g. Revenue, Law, Public Works, Finance, Home, Education)",
  "decision_date": "ISO date string of judgment date or null",
  "deadline_days": <integer days for compliance from order date, e.g. 30>,
  "outcome": "one of: allowed / dismissed / directed / appeal / no relief",
  "directives": ["array of specific court directives/orders as strings"],
  "primary_directive": "the single most important operative order verbatim",
  "mappings": [
    {
      "anchor_phrase": "Short anchor phrase (5–12 words) exactly as it appears",
      "anchor_tokens": ["word1", "word2", "word3"],
      "label": "semantic label"
    }
  ],
  "timeline_start_phrase": "phrase indicating start date e.g. 'from the date of this order'",
  "priority_reasoning": "A concise 1-2 sentence explanation of why this case deserves High/Medium/Low priority based on urgency of deadlines, contempt risk, or gravity of court directives",
  "extraction_confidence": <float 1-10>
}

Extract semantic mappings from the PDF optimized for coordinate-based highlighting.
For each mapping:
1. Provide a short anchor_phrase (5–12 words max) that appears EXACTLY in the document.
2. Break the phrase into key anchor_tokens (important words).
3. Avoid long paragraphs or multi-line sentences.
4. Do NOT paraphrase — use exact text from the document.
5. Ensure anchors are unique and easy to locate in the text.

Judgment text:
${snippet}`;

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 1024,
    });

    const raw = completion.choices[0]?.message?.content || '';
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return {};

    const extracted = JSON.parse(jsonMatch[0]);

    // Compute deadline ISO string from deadline_days
    const deadlineDays = extracted.deadline_days ?? 30;
    const deadlineDate = new Date(Date.now() + deadlineDays * 24 * 60 * 60 * 1000);

    // Build action plan from extracted data
    const actionPlan = buildActionPlan({ ...extracted, daysToDeadline: deadlineDays });

    return {
      // Top-level case fields (merged into DB columns by cases.route.js)
      case_id:       extracted.case_id       || null,
      case_number:   extracted.case_number   || null,
      court:         extracted.court         || null,
      judge:         extracted.judge         || null,
      petitioner:    extracted.petitioner    || null,
      department:    extracted.department    || null,
      decision_date: extracted.decision_date || null,
      deadline:      deadlineDate.toISOString(),
      priority:      actionPlan.priority,

      // Rich data stored in extracted_data JSONB
      extracted_data: {
        respondent:          extracted.respondent          || null,
        outcome:             extracted.outcome             || null,
        directives:          extracted.directives          || [],
        primary_directive:   extracted.primary_directive   || null,
        semantic_phrases:    extracted.mappings            || [],
        mappings:            extracted.mappings            || [],
        timeline_start_phrase: extracted.timeline_start_phrase || null,
        priority_reasoning:  extracted.priority_reasoning  || null,
        deadline_days:       deadlineDays,
        decision:            actionPlan.decision,
        required_action:     actionPlan.required_action,
        risk_score:          actionPlan.risk_score,
        extraction_confidence: extracted.extraction_confidence || null,
        raw_text_snippet:    text.substring(0, 500),
      },
    };
  } catch (err) {
    console.error('AI extraction failed:', err.message);
    return {};
  }
};
