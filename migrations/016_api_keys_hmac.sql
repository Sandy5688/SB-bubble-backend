-- API Keys table for HMAC authentication
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_id TEXT UNIQUE NOT NULL,
  secret_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  disabled BOOLEAN DEFAULT FALSE,
  name TEXT,
  metadata JSONB
);

-- HMAC nonces table (fallback if Redis unavailable)
CREATE TABLE IF NOT EXISTS hmac_nonces (
  key_id TEXT NOT NULL,
  nonce TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (key_id, nonce)
);

-- Create index for cleanup
CREATE INDEX idx_hmac_nonces_created ON hmac_nonces(created_at);

-- HMAC audit logs
CREATE TABLE IF NOT EXISTS hmac_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID,
  path TEXT,
  method TEXT,
  timestamp TIMESTAMPTZ,
  client_ip TEXT,
  success BOOLEAN,
  failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hmac_events_key ON hmac_events(api_key_id, created_at);
CREATE INDEX idx_hmac_events_failures ON hmac_events(api_key_id, success, created_at) WHERE success = false;

-- Seed admin API key (replace secret_hash with actual encrypted secret)
INSERT INTO api_keys (key_id, secret_hash, name, metadata)
VALUES (
  'bubble_admin_key_001',
  'REPLACE_WITH_ENCRYPTED_SECRET',
  'Bubble Admin API Key',
  '{"environment": "production", "permissions": ["admin"]}'
) ON CONFLICT (key_id) DO NOTHING;

COMMENT ON TABLE api_keys IS 'API keys for HMAC request signing';
COMMENT ON TABLE hmac_nonces IS 'Nonce deduplication for replay attack prevention';
COMMENT ON TABLE hmac_events IS 'Audit log for HMAC verification attempts';
