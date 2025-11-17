module.exports = {
  apps: [
    {
      name: 'bubble-api',
      script: './server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      // Logging
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Advanced features
      watch: false,
      ignore_watch: ['node_modules', 'logs'],
      max_memory_restart: '500M',
      
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      
      // Auto restart
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Cron restart (optional - restart daily at 3 AM)
      // cron_restart: '0 3 * * *',
      
      // Source map support
      source_map_support: true,
      
      // Environment-specific settings
      node_args: '--max-old-space-size=4096'
    },
    {
      name: 'bubble-workers',
      script: './workers/index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        ENABLE_WORKERS: true
      },
      env_production: {
        NODE_ENV: 'production',
        ENABLE_WORKERS: true
      },
      error_file: './logs/pm2-workers-error.log',
      out_file: './logs/pm2-workers-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M'
    }
  ],
  
  // Deployment configuration
  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-username/bubble-backend-api.git',
      path: '/var/www/bubble-backend-api',
      'post-deploy': 'npm install && pm2 reload pm2.config.js --env production',
      'pre-setup': ''
    }
  }
};
