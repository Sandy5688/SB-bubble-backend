# Post-Deployment Checklist

## Immediate (0-15 minutes)

- [ ] Check Railway deployment status (green)
- [ ] Test health endpoint: `/health`
- [ ] Test API health: `/api/v1/health?detailed=true`
- [ ] Verify all services healthy (DB, Redis, S3)
- [ ] Check logs for errors
- [ ] Test authentication (signup, signin)
- [ ] Test file upload
- [ ] Test payment endpoint (test mode)

## Within 1 Hour

- [ ] Monitor error rates
- [ ] Check response times
- [ ] Verify rate limiting working
- [ ] Test webhook endpoints
- [ ] Check database connections
- [ ] Verify Redis connection
- [ ] Test email sending
- [ ] Test SMS sending

## Within 24 Hours

- [ ] Review all logs
- [ ] Check for any security alerts
- [ ] Monitor resource usage
- [ ] Verify backups running
- [ ] Test all critical flows
- [ ] Check monitoring dashboards
- [ ] Review performance metrics

## Contact

If issues arise:
- Check logs: Railway Dashboard → Deployments → Logs
- Health check: https://your-api.railway.app/api/v1/health?detailed=true
- Support: [Your contact info]
