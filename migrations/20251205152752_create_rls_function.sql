-- Drop any existing conflicting functions
DROP FUNCTION IF EXISTS set_user_context(text);
DROP FUNCTION IF EXISTS set_user_context(uuid);
DROP FUNCTION IF EXISTS set_user_context(varchar);

-- Create the proper function with uuid parameter
CREATE OR REPLACE FUNCTION set_user_context(p_user_id uuid)
RETURNS void AS $$
BEGIN
  -- Set the user context for RLS policies
  PERFORM set_config('app.current_user_id', p_user_id::text, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION set_user_context(uuid) TO PUBLIC;

-- Verify it was created
SELECT proname, pg_get_function_arguments(oid) 
FROM pg_proc 
WHERE proname = 'set_user_context';
