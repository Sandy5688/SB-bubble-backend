const { createClient } = require('@supabase/supabase-js');
const env = require('./env');

// Supabase client for general use (with anon key)
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

// Supabase admin client (with service role key - use carefully!)
const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

module.exports = {
  supabase,
  supabaseAdmin
};
