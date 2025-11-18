module.exports = {
  apps: [{
    name: 'bubble-backend-api',
    script: './server.js',
    instances: 'max',
    exec_mode: 'cluster',
    
    // Auto-restart configuration
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    
    // Logging
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    
    // Environment variables
    env: {
      NODE_ENV: 'development',
      PORT: 8080
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 8080
    },
    
    // Graceful shutdown
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,
    
    // Restart delays
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000,
    
    // Resource limits
    max_old_space_size: 512,
    
    // Zero-downtime reload
    instance_var: 'INSTANCE_ID'
  }]
};
