#!/bin/bash
set -e
ENVIRONMENT=${1:-production}
echo "🚀 Deploying to $ENVIRONMENT..."
git pull origin main
npm ci --only=production
pm2 reload pm2.config.js --env $ENVIRONMENT
pm2 status
echo "✅ Deployment complete!"
