import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testInsert() {
  const { data: caseRow, error: caseErr } = await supabase.from('cases').select('*').limit(1).single();
  if (caseErr) return console.log(caseErr);

  console.log("Found case:", caseRow.id);

  const { data, error } = await supabase.from('extractions').insert([{ case_id: caseRow.id, raw_pdf_text: "test", extracted_json: {} }]).select();
  console.log("Extractions Insert:", data, "Err:", error);
  
  const { data: d2, error: e2 } = await supabase.from('action_plans').insert([{ case_id: caseRow.id, status: 'TEST' }]).select();
  console.log("Action Plan Insert:", d2, "Err:", e2);
}
testInsert();
