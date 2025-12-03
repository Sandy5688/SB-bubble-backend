-- Add security fields to KYC sessions

ALTER TABLE kyc_sessions 
ADD COLUMN IF NOT EXISTS session_hash VARCHAR(64),
ADD COLUMN IF NOT EXISTS nonce VARCHAR(32),
ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP DEFAULT NOW();

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_kyc_sessions_nonce ON kyc_sessions(nonce);
CREATE INDEX IF NOT EXISTS idx_kyc_sessions_hash ON kyc_sessions(session_hash);

-- Add comment
COMMENT ON COLUMN kyc_sessions.session_hash IS 'SHA256 hash for integrity verification';
COMMENT ON COLUMN kyc_sessions.nonce IS 'One-time nonce for replay prevention';
