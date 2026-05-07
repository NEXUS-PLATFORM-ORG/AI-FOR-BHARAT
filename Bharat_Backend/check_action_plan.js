import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function check() {
  const { data, error } = await supabase.from('action_plans').select('*').limit(1);
  console.log("action_plans:", data, "Error:", error?.message);
  
  const { data: d2, error: e2 } = await supabase.from('action_plan').select('*').limit(1);
  console.log("action_plan:", d2, "Error:", e2?.message);
}
check();
