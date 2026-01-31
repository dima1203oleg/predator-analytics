# Service Scaling Guide

Guide for scaling Predator Analytics services to handle increased load.

## Overview

Predator Analytics uses Kubernetes Horizontal Pod Autoscaling (HPA) and manual scaling to handle varying loads.

## Auto-Scaling (HPA)

### Current HPA Configuration

```yaml
# Backend API
Min Replicas: 2
Max Replicas: 10
Target CPU: 70%
Target Memory: 80%

# Celery Workers
Min Replicas: 3
Max Replicas: 20
Target CPU: 75%
Target Queue Length: 100 messages

# Frontend
Min Replicas: 2
Max Replicas: 5
Target CPU: 60%
```

### View HPA Status

```bash
# Check all HPAs
kubectl get hpa -n production

# Detailed HPA info
kubectl describe hpa backend -n production

# Watch HPA in real-time
watch kubectl get hpa -n production
```

## Manual Scaling

### Scale Specific Service

```bash
# Scale backend
kubectl scale deployment backend --replicas=5 -n production

# Scale celery workers
kubectl scale deployment celery-worker --replicas=10 -n production

# Scale frontend
kubectl scale deployment frontend --replicas=3 -n production
```

### Via Helm Values

Edit `helm/values-prod.yaml`:

```yaml
backend:
  replicaCount: 5
  
celeryWorker:
  replicaCount: 10
  
frontend:
  replicaCount: 3
```

Then apply:

```bash
helm upgrade predator ./helm/predator-umbrella \
  --values ./helm/values-prod.yaml \
  --namespace production
```

## Scaling Strategies

### Traffic Spike Response

**Expected Duration**: < 2 hours

```bash
# Rapid scale-up
kubectl scale deployment backend --replicas=8 -n production
kubectl scale deployment celery-worker --replicas=15 -n production

# Monitor resources
watch kubectl top pods -n production

# Scale down when traffic normalizes
# HPA will handle this automatically
```

### Sustained Load Increase

**Expected Duration**: Days/Weeks

```bash
# Update HPA min/max
kubectl patch hpa backend -n production -p '{"spec":{"minReplicas":3,"maxReplicas":15}}'

# Or update Helm values
# helm/values-prod.yaml
autoscaling:
  minReplicas: 3
  maxReplicas: 15
```

### Resource-Limited Scaling

When cluster resources are limited:

```bash
# Check cluster capacity
kubectl top nodes

# Reduce resource requests
kubectl set resources deployment backend \
  --requests=cpu=200m,memory=256Mi \
  --limits=cpu=1000m,memory=1Gi \
  -n production

# Scale more pods with lower resources
kubectl scale deployment backend --replicas=10 -n production
```

## Database Scaling

### PostgreSQL

```bash
# Vertical scaling (increase resources)
kubectl patch statefulset postgres -n production \
  -p '{"spec":{"template":{"spec":{"containers":[{"name":"postgres","resources":{"limits":{"cpu":"4","memory":"8Gi"}}}]}}}}'

# Horizontal scaling (read replicas)
kubectl scale statefulset postgres-replica --replicas=2 -n production
```

### Redis

```bash
# Scale Redis cluster
kubectl scale statefulset redis --replicas=6 -n production

# Increase max memory
kubectl set env statefulset/redis REDIS_MAXMEMORY=4gb -n production
```

### OpenSearch

```bash
# Scale data nodes
kubectl scale statefulset opensearch-data --replicas=5 -n production

# Add new node type
kubectl apply -f manifests/opensearch-ingest-nodes.yaml
```

## Queue Scaling

### RabbitMQ

```bash
# Scale RabbitMQ cluster
kubectl scale statefulset rabbitmq --replicas=3 -n production

# Increase memory
kubectl patch statefulset rabbitmq -n production \
  -p '{"spec":{"template":{"spec":{"containers":[{"name":"rabbitmq","env":[{"name":"RABBITMQ_VM_MEMORY_HIGH_WATERMARK","value":"0.8"}]}]}}}}'
```

### Celery Worker Pools

```bash
# Scale worker concurrency
kubectl set env deployment/celery-worker \
  CELERY_WORKER_CONCURRENCY=8 \
  -n production

# Add specialized worker pools
kubectl apply -f manifests/celery-worker-priority.yaml
```

## Monitoring During Scaling

### Key Metrics to Watch

```bash
# CPU/Memory
kubectl top pods -n production

# Request rate
curl 'http://prometheus:9090/api/v1/query?query=rate(http_requests_total[5m])'

# Error rate
curl 'http://prometheus:9090/api/v1/query?query=rate(http_requests_total{status=~"5.."}[5m])'

# Response time
curl 'http://prometheus:9090/api/v1/query?query=histogram_quantile(0.95,rate(http_request_duration_seconds_bucket[5m]))'
```

### Grafana Dashboards

- Production Overview: https://grafana.predator.example.com/d/prod-overview
- Scaling Dashboard: https://grafana.predator.example.com/d/scaling
- Resource Usage: https://grafana.predator.example.com/d/resources

## Cost Optimization

### Right-Sizing

```bash
# Analyze resource usage
kubectl top pods -n production --sort-by=memory

# Check recommendations
kubectl describe vpa backend -n production

# Apply right-sized resources
kubectl set resources deployment backend \
  --requests=cpu=500m,memory=512Mi \
  --limits=cpu=2000m,memory=2Gi \
  -n production
```

### Spot Instances (Cloud)

```yaml
# Add node affinity for spot instances
nodeSelector:
  node.kubernetes.io/instance-type: spot

tolerations:
- key: spot
  operator: Equal
  value: "true"
  effect: NoSchedule
```

### Schedule-Based Scaling

```bash
# Scale down during low-traffic hours (via CronJob)
# 0 2 * * * kubectl scale deployment backend --replicas=2 -n production
# 0 8 * * * kubectl scale deployment backend --replicas=5 -n production
```

## Scaling Checklist

Before scaling:
- [ ] Check cluster capacity
- [ ] Review resource limits
- [ ] Verify HPA is functioning
- [ ] Check database connections
- [ ] Review queue depth
- [ ] Notify team

During scaling:
- [ ] Monitor pod startup
- [ ] Watch error rates
- [ ] Check response times
- [ ] Verify load balancing
- [ ] Monitor resource usage

After scaling:
- [ ] Validate all services healthy
- [ ] Check logs for errors
- [ ] Update capacity docs
- [ ] Review costs
- [ ] Document changes

## Troubleshooting

### Pods Not Scheduling

**Symptoms**: Pods stuck in Pending
**Diagnosis**:
```bash
kubectl describe pod <pod-name> -n production
```

**Solutions**:
- Insufficient cluster resources: Add nodes
- Resource requests too high: Reduce requests
- Node affinity issues: Review affinity rules

### OOM Kills

**Symptoms**: Pods restarting frequently
**Diagnosis**:
```bash
kubectl logs <pod-name> -n production --previous
kubectl describe pod <pod-name> -n production
```

**Solutions**:
- Increase memory limits
- Fix memory leaks
- Optimize queries
- Add memory profiling

### Database Connection Pool Exhausted

**Symptoms**: Connection errors in logs
**Solutions**:
```bash
# Increase pool size
kubectl set env deployment/backend \
  DATABASE_POOL_SIZE=50 \
  -n production

# Or scale database
kubectl scale statefulset postgres --replicas=3 -n production
```

## Emergency Scale-Down

If costs are exceeding budget:

```bash
# Immediate scale-down
kubectl scale deployment backend --replicas=2 -n production
kubectl scale deployment celery-worker --replicas=3 -n production
kubectl scale deployment frontend --replicas=1 -n production

# Enable aggressive auto-scaling
kubectl patch hpa backend -n production \
  -p '{"spec":{"targetCPUUtilizationPercentage":85}}'
```

---

**Last Updated**: 2026-01-31  
**Maintainer**: Platform Team
