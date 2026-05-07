import { createClient } from '@supabase/supabase-js';

// Admin client uses service_role key — bypasses RLS.
// Use this only on the server side, never expose service_role key to clients.
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default supabaseAdmin;
