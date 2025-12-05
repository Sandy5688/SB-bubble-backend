const { pool } = require('../../config/database');

exports.runRlsMigration = async (req, res) => {
  try {
    // Security check
    const adminKey = req.headers['x-admin-key'];
    if (!adminKey || adminKey !== process.env.ADMIN_SECRET) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    console.log('Running RLS migration - dropping ALL versions...');

    // Drop ALL versions of the function
    const dropSql = `
      DROP FUNCTION IF EXISTS set_user_context(text) CASCADE;
      DROP FUNCTION IF EXISTS set_user_context(uuid) CASCADE;
      DROP FUNCTION IF EXISTS set_user_context(varchar) CASCADE;
      DROP FUNCTION IF EXISTS set_user_context(uuid, boolean) CASCADE;
      DROP FUNCTION IF EXISTS set_user_context(uuid, text) CASCADE;
    `;

    await pool.query(dropSql);
    console.log('✅ All old functions dropped');

    // Create ONE simple function
    const createSql = `
      CREATE FUNCTION set_user_context(p_user_id uuid)
      RETURNS void AS $$
      BEGIN
        PERFORM set_config('app.current_user_id', p_user_id::text, false);
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      GRANT EXECUTE ON FUNCTION set_user_context(uuid) TO PUBLIC;
    `;

    await pool.query(createSql);
    console.log('✅ New function created');

    // Verify ONLY ONE exists
    const result = await pool.query(`
      SELECT proname, pg_get_function_arguments(oid) 
      FROM pg_proc 
      WHERE proname = 'set_user_context'
    `);

    console.log('Functions found:', result.rows);

    if (result.rows.length > 1) {
      return res.json({
        success: false,
        message: 'Multiple functions still exist - manual cleanup needed',
        functions: result.rows
      });
    }

    res.json({
      success: true,
      message: 'RLS function created successfully (single version)',
      functions: result.rows
    });

  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
