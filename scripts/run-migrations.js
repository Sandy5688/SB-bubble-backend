const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  try {
    console.log('Running pending migrations...');
    
    // Create migrations table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        executed_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    
    // Get all migration files
    const migrationsDir = path.join(__dirname, '../migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();
    
    for (const file of files) {
      // Check if already run
      const check = await pool.query(
        'SELECT id FROM migrations WHERE name = $1',
        [file]
      );
      
      if (check.rows.length === 0) {
        console.log(`Running migration: ${file}`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        await pool.query(sql);
        await pool.query(
          'INSERT INTO migrations (name) VALUES ($1)',
          [file]
        );
        console.log(`✅ ${file}`);
      }
    }
    
    console.log('All migrations complete');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
