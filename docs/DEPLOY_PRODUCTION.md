# Production Deployment Workflow

Comprehensive guide for deploying Predator Analytics to production environment.

## Pre-Deployment Checklist

- [ ] All tests passing in staging
- [ ] Security scans completed
- [ ] Database migrations reviewed
- [ ] Backup created
- [ ] Rollback plan prepared
- [ ] Stakeholders notified
- [ ] Change request approved

## Deployment Process

### 1. Pre-Deployment

```bash
# Verify staging environment
kubectl config use-context staging
kubectl get pods -n predator

# Run final tests
make test-e2e

# Create backup
./scripts/backup-production.sh
```

### 2. Deployment

#### Option A: GitOps (Recommended)

```bash
# Tag release
git tag -a v25.1.0 -m "Release v25.1.0"
git push origin v25.1.0

# Update Helm values
cd helm/predator-umbrella
vim values-prod.yaml  # Update image tags

# Commit and push
git add values-prod.yaml
git commit -m "chore: update prod to v25.1.0"
git push

# ArgoCD will auto-sync
# Or manually sync:
argocd app sync predator-prod
```

#### Option B: Manual Helm

```bash
# Set context
kubectl config use-context production

# Deploy with Helm
helm upgrade --install predator ./helm/predator-umbrella \
  --values ./helm/values-prod.yaml \
  --namespace production \
  --create-namespace \
  --wait \
  --timeout 10m

# Monitor deployment
kubectl rollout status deployment/backend -n production
kubectl rollout status deployment/frontend -n production
```

### 3. Post-Deployment Validation

```bash
# Check pod status
kubectl get pods -n production

# Check service endpoints
kubectl get svc -n production

# Run smoke tests
make test-smoke ENV=production

# Check monitoring
curl https://grafana.predator.example.com/api/health
```

### 4. Monitoring

Monitor these metrics for 1 hour after deployment:

- Error rates (should be < 0.1%)
- Response times (p95 < 800ms)
- CPU/Memory usage
- Database connections
- Queue depth

```bash
# Watch logs
kubectl logs -f deployment/backend -n production

# Check metrics
kubectl top pods -n production
```

## Rollback Procedure

If issues are detected:

```bash
# Quick rollback via Helm
helm rollback predator -n production

# Or via ArgoCD
argocd app rollback predator-prod

# Or manual
kubectl rollout undo deployment/backend -n production
kubectl rollout undo deployment/frontend -n production

# Verify rollback
kubectl rollout status deployment/backend -n production
```

## Common Issues

### Issue: Pods not starting

**Diagnosis**:
```bash
kubectl describe pod <pod-name> -n production
kubectl logs <pod-name> -n production
```

**Solutions**:
- Check image pull secrets
- Verify resource limits
- Check configuration secrets
- Review init containers

### Issue: Database migration failed

**Diagnosis**:
```bash
kubectl logs -l app=migration-job -n production
```

**Solutions**:
- Check database connectivity
- Verify migration scripts
- Check database user permissions
- Rollback migration if needed

### Issue: High error rate

**Diagnosis**:
```bash
# Check application logs
kubectl logs -l app=backend -n production --tail=100

# Check metrics
curl https://monitoring.predator.example.com/metrics
```

**Solutions**:
- Immediate rollback if > 5% errors
- Check external dependencies
- Review recent changes
- Scale up if resource issue

## Security Considerations

- Use secrets management (Vault, Sealed Secrets)
- Rotate credentials after deployment
- Scan images before deploy
- Review RBAC policies
- Enable audit logging

## Notification Channels

- Slack: #production-deploys
- Email: devops@predator.example.com
- PagerDuty: Production alerts
- Status page: status.predator.example.com

## Post-Deployment Tasks

- [ ] Update status page
- [ ] Send deployment notification
- [ ] Update runbook with any issues encountered
- [ ] Schedule post-mortem if needed
- [ ] Archive deployment logs
- [ ] Update documentation

---

**Emergency Contacts**:
- DevOps Lead: [Contact Info]
- Database Admin: [Contact Info]
- Security Team: [Contact Info]
- On-Call Engineer: Check PagerDuty
