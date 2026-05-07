import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function check() {
  const { data, error } = await supabase.from('extractions').select('*').order('created_at', { ascending: false }).limit(1);
  console.log("Extractions:", JSON.stringify(data, null, 2), "Error:", error);
  
  const { data: casesData } = await supabase.from('cases').select('*').order('created_at', { ascending: false }).limit(1);
  console.log("Cases:", JSON.stringify(casesData, null, 2));

  const { data: apData } = await supabase.from('action_plans').select('*').order('created_at', { ascending: false }).limit(1);
  console.log("Action Plans:", JSON.stringify(apData, null, 2));
}
check();
