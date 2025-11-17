#!/bin/bash
MODE=${1:-prod}
echo "🛑 Stopping..."
case $MODE in
  prod) pm2 stop all; pm2 delete all ;;
  docker) docker-compose down ;;
  *) echo "Usage: ./scripts/stop.sh [prod|docker]"; exit 1 ;;
esac
