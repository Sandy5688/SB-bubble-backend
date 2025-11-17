#!/bin/bash
MODE=${1:-dev}
echo "🚀 Starting in $MODE mode..."
case $MODE in
  dev) npm run dev ;;
  prod) pm2 start pm2.config.js --env production; pm2 save ;;
  docker) docker-compose up -d ;;
  *) echo "Usage: ./scripts/start.sh [dev|prod|docker]"; exit 1 ;;
esac
