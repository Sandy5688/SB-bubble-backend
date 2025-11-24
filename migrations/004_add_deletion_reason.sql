-- Add missing reason column to data_deletion_requests table
ALTER TABLE data_deletion_requests ADD COLUMN IF NOT EXISTS reason TEXT;
ALTER TABLE data_deletion_requests ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Add index for efficient querying
CREATE INDEX IF NOT EXISTS idx_data_deletion_user_status 
ON data_deletion_requests(user_id, status);
