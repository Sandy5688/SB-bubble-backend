-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parsed_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- USERS POLICIES
-- =====================================================

-- Users can read their own data
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Service role has full access (used by backend)
CREATE POLICY "Service role has full access to users"
  ON public.users FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- USER PROFILES POLICIES
-- =====================================================

CREATE POLICY "Users can view own profile data"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile data"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role has full access to profiles"
  ON public.user_profiles FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- SESSIONS POLICIES
-- =====================================================

CREATE POLICY "Users can view own sessions"
  ON public.sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role has full access to sessions"
  ON public.sessions FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- WORKFLOW POLICIES
-- =====================================================

CREATE POLICY "Users can view own workflows"
  ON public.workflow_runs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role has full access to workflows"
  ON public.workflow_runs FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Users can view own workflow actions"
  ON public.workflow_actions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.workflow_runs 
    WHERE workflow_runs.id = workflow_actions.workflow_run_id 
    AND workflow_runs.user_id = auth.uid()
  ));

CREATE POLICY "Service role has full access to workflow actions"
  ON public.workflow_actions FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- FILES POLICIES
-- =====================================================

CREATE POLICY "Users can view own files"
  ON public.files FOR SELECT
  USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can upload files"
  ON public.files FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role has full access to files"
  ON public.files FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- MESSAGES POLICIES
-- =====================================================

CREATE POLICY "Users can view own messages"
  ON public.messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role has full access to messages"
  ON public.messages FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- TRANSACTIONS POLICIES
-- =====================================================

CREATE POLICY "Users can view own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role has full access to transactions"
  ON public.transactions FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- AUDIT TRAIL POLICIES
-- =====================================================

CREATE POLICY "Service role can view all audit logs"
  ON public.audit_trail FOR SELECT
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can insert audit logs"
  ON public.audit_trail FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- SYSTEM CONFIG POLICIES
-- =====================================================

CREATE POLICY "Anyone can view public config"
  ON public.system_config FOR SELECT
  USING (is_public = true);

CREATE POLICY "Service role has full access to config"
  ON public.system_config FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');
