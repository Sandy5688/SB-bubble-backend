-- =====================================================
-- SEED DATA (for testing)
-- =====================================================

-- Insert system config
INSERT INTO public.system_config (key, value, description, is_public) VALUES
  ('app_name', '"Bubble Backend API"', 'Application name', true),
  ('app_version', '"1.0.0"', 'Application version', true),
  ('maintenance_mode', 'false', 'Maintenance mode flag', true),
  ('max_file_size_mb', '10', 'Maximum file upload size in MB', true),
  ('ai_model', '"gpt-4-turbo-preview"', 'Default AI model', false);

-- Note: User data should be created through the auth endpoints
