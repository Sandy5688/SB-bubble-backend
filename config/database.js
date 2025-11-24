const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');
const env = require('./env');

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Query function for PostgreSQL
const query = (text, params) => pool.query(text, params);

// Supabase clients (keeping for backward compatibility)
const supabase = createClient(env.SUPABASE_URL || 'https://placeholder.supabase.co', env.SUPABASE_ANON_KEY || 'placeholder');
const supabaseAdmin = createClient(env.SUPABASE_URL || 'https://placeholder.supabase.co', env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder');

module.exports = {
  pool,
  query,
  supabase,
  supabaseAdmin,
};
