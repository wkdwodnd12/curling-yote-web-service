const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!url || !key) {
  console.warn('[supabase] SUPABASE_URL or key is missing; Supabase client is not initialized.');
}

const supabase = url && key ? createClient(url, key) : null;

module.exports = { supabase };
