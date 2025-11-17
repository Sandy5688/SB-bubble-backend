# Workers Directory

This directory contains background job processors for the Bubble Backend API.

## Structure

- `index.js` - Main worker manager
- `queue.js` - BullMQ queue configuration
- `jobs/` - Individual job processors
- `private/` - **PRIVATE** worker implementations (NOT committed to repo)

## Private Workers

The `/workers/private/` directory contains sensitive business logic and must NOT be committed to the repository. These workers are referenced in code but their implementations are kept secure.

Private workers include:
- workflow-engine.worker.js
- document-processor.worker.js
- ai-orchestrator.worker.js
- comparison-engine.worker.js
- long-action-runner.worker.js
- external-interaction.worker.js
- cleanup-worker.js

## Running Workers
```bash
# Start all workers
node workers/index.js

# Or with PM2
pm2 start workers/index.js --name workers
```

## Environment Variables

Required:
- `REDIS_HOST` - Redis host for queue
- `REDIS_PORT` - Redis port
- `REDIS_PASSWORD` - Redis password (optional)
- `ENABLE_WORKERS` - Enable/disable workers
- `WORKER_CONCURRENCY` - Number of concurrent jobs

## Adding New Jobs

1. Create job processor in `workers/jobs/`
2. Register job in `workers/index.js`
3. Queue job using `queueService.addJob()`
