# Rollback Procedure

Guide for rolling back Predator Analytics to a previous stable version.

## When to Rollback

Initiate rollback immediately if:
- Error rate > 5%
- Critical functionality broken
- Data corruption detected
- Security vulnerability exploited
- Performance degradation > 50%

## Quick Rollback (< 5 minutes)

### Via ArgoCD (Recommended)

```bash
# List recent revisions
argocd app history predator-prod

# Rollback to previous revision
argocd app rollback predator-prod

# Or rollback to specific revision
argocd app rollback predator-prod --revision 123
```

### Via Helm

```bash
# Check revision history
helm history predator -n production

# Rollback to previous release
helm rollback predator -n production

# Or rollback to specific revision
helm rollback predator 42 -n production
```

### Via kubectl (Emergency)

```bash
# Rollback individual deployments
kubectl rollout undo deployment/backend -n production
kubectl rollout undo deployment/frontend -n production
kubectl rollout undo deployment/celery-worker -n production

# Check rollback status
kubectl rollout status deployment/backend -n production
```

## Detailed Rollback Procedure

### 1. Declare Incident

```bash
# Post in Slack
#incident-response channel:
"🚨 PRODUCTION ROLLBACK INITIATED
Reason: [brief description]
Target version: [version]
ETA: 5 minutes
Incident Commander: [your name]"
```

### 2. Capture Current State

```bash
# Save current deployment
kubectl get deployment backend -n production -o yaml > rollback-$(date +%s)-backend.yaml

# Save current pod logs
kubectl logs -l app=backend -n production --tail=1000 > rollback-$(date +%s)-logs.txt

# Save metrics snapshot
curl https://prometheus.predator.example.com/api/v1/query?query=up > metrics-$(date +%s).json
```

### 3. Execute Rollback

```bash
# Set context
kubectl config use-context production

# Identify last stable version
STABLE_VERSION=$(helm history predator -n production | grep deployed | tail -n 2 | head -n 1 | awk '{print $1}')

echo "Rolling back to revision: $STABLE_VERSION"

# Execute rollback
helm rollback predator $STABLE_VERSION -n production --wait

# Monitor rollout
watch kubectl get pods -n production
```

### 4. Validate Rollback

```bash
# Check pod status
kubectl get pods -n production
# All pods should be Running

# Check service health
curl https://api.predator.example.com/health
# Should return {"status": "healthy"}

# Run smoke tests
make test-smoke ENV=production

# Check error rates
curl https://prometheus.predator.example.com/api/v1/query?query='rate(http_requests_total{status=~"5.."}[5m])'
# Should be < 0.001
```

### 5. Post-Rollback Verification

Monitor for 15 minutes:

```bash
# Watch metrics
kubectl top pods -n production

# Monitor logs
kubectl logs -f deployment/backend -n production

# Check Grafana dashboards
open https://grafana.predator.example.com/d/production-overview
```

### 6. Communication

```bash
# Update incident channel
"✅ ROLLBACK COMPLETED
Previous version: [failed version]
Current version: [stable version]
Status: Monitoring for 15 minutes
Error rate: [current rate]"

# Update status page
# Mark incident as resolved if metrics normal
```

## Database Rollback

⚠️ **WARNING**: Database rollbacks are risky!

### Option 1: Restore from Backup

```bash
# Stop application
kubectl scale deployment backend --replicas=0 -n production

# Restore database
./scripts/restore-database.sh \
  --backup-id [backup-id] \
  --target production

# Verify restore
psql -h db.production -U predator -c "SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1;"

# Start application
kubectl scale deployment backend --replicas=3 -n production
```

### Option 2: Reverse Migrations

```bash
# List migrations
kubectl exec -it deployment/backend -n production -- \
  python manage.py showmigrations

# Reverse specific migrations
kubectl exec -it deployment/backend -n production -- \
  python manage.py migrate app_name 0042_previous_migration

# Verify database state
kubectl exec -it deployment/backend -n production -- \
  python manage.py check
```

## Rollback Scenarios

### Scenario 1: Bad Deployment

**Symptoms**: Pods crash-looping, high error rate  
**Action**: Immediate helm/argocd rollback  
**Duration**: < 5 minutes

### Scenario 2: Database Migration Issue

**Symptoms**: Database errors, data inconsistency  
**Action**: Reverse migration or restore backup  
**Duration**: 15-30 minutes  
**Risk**: High - test thoroughly

### Scenario 3: Configuration Error

**Symptoms**: Service degradation, auth failures  
**Action**: Revert ConfigMap/Secrets, restart pods  
**Duration**: < 5 minutes

### Scenario 4: External Dependency Failure

**Symptoms**: Increased latency, partial failures  
**Action**: Enable circuit breaker, fallback mode  
**Duration**: < 2 minutes  
**Note**: May not require full rollback

## Prevention

### Pre-Deployment
- Run full test suite
- Review all changes
- Conduct canary deployment
- Monitor staging for 24h

### During Deployment
- Use progressive delivery
- Monitor metrics continuously
- Have rollback ready
- Keep communication open

### Post-Deployment
- Monitor for 1 hour minimum
- Run automated tests
- Check all integrations
- Update runbooks

## Rollback Checklist

- [ ] Incident declared
- [ ] Current state captured (logs, metrics, configs)
- [ ] Rollback executed
- [ ] Pods healthy
- [ ] Services accessible
- [ ] Smoke tests passed
- [ ] Error rates normal
- [ ] Performance acceptable
- [ ] Database consistent
- [ ] Integrations working
- [ ] Monitoring confirmed
- [ ] Stakeholders notified
- [ ] Status page updated
- [ ] Incident documented
- [ ] Post-mortem scheduled

## Emergency Contacts

**During Rollback**:
- Incident Commander: [Contact]
- Database Admin: [Contact]
- Platform Engineer: [Contact]
- Security Team: [Contact]

**Escalation**:
- Engineering Manager: [Contact]
- CTO: [Contact]
- PagerDuty: #production-alerts

## Post-Rollback

1. Schedule post-mortem within 24 hours
2. Document root cause
3. Create action items
4. Update rollback procedures
5. Improve monitoring/alerting
6. Test fix in staging
7. Plan re-deployment

---

**Last Updated**: 2026-01-31  
**Reviewed By**: DevOps Team
