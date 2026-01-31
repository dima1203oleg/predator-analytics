# Backup and Restore Procedures

Comprehensive backup and restore procedures for Predator Analytics.

## Backup Strategy

### Backup Schedule

| Component | Frequency | Retention | Location |
|-----------|-----------|-----------|----------|
| PostgreSQL | Every 6 hours | 30 days | S3 + Local |
| MinIO Objects | Daily | 90 days | S3 |
| Qdrant Vectors | Daily | 14 days | S3 |
| OpenSearch Indices | Daily | 14 days | S3 |
| Kubernetes Configs | On change | Forever | Git |
| Secrets | On change | Forever | Vault |

### Backup Components

1. **Databases**
   - PostgreSQL (main database)
   - Redis (cache - no backup needed)
   
2. **Storage**
   - MinIO buckets
   - Uploaded files
   - ML model artifacts
   
3. **Search Indices**
   - OpenSearch indices
   - Qdrant collections
   
4. **Configuration**
   - Kubernetes manifests
   - Helm values
   - Environment configs
   - Secrets (encrypted)

## PostgreSQL Backup

### Automated Backup (Recommended)

```bash
# Backup via CronJob
kubectl apply -f k8s/cronjobs/postgres-backup.yaml

# Check backup status
kubectl get cronjobs -n production
kubectl logs -l job-name=postgres-backup-<timestamp> -n production
```

### Manual Backup

```bash
# Full database dump
kubectl exec -it postgres-0 -n production -- \
  pg_dump -U predator -F c -b -v predator_db > backup-$(date +%Y%m%d-%H%M%S).dump

# Schema only
kubectl exec -it postgres-0 -n production -- \
  pg_dump -U predator --schema-only predator_db > schema-$(date +%Y%m%d).sql

# Single table
kubectl exec -it postgres-0 -n production -- \
  pg_dump -U predator -t gold.documents predator_db > documents-$(date +%Y%m%d).sql
```

### Upload to S3

```bash
# Upload backup
aws s3 cp backup-$(date +%Y%m%d-%H%M%S).dump \
  s3://predator-backups/postgres/$(date +%Y%m%d)/

# Verify upload
aws s3 ls s3://predator-backups/postgres/$(date +%Y%m%d)/
```

## PostgreSQL Restore

### Full Restore

⚠️ **WARNING**: This will overwrite the database!

```bash
# 1. Stop application
kubectl scale deployment backend --replicas=0 -n production
kubectl scale deployment celery-worker --replicas=0 -n production

# 2. Download backup
aws s3 cp s3://predator-backups/postgres/20260131/backup.dump ./

# 3. Drop existing database (⚠️ DESTRUCTIVE)
kubectl exec -it postgres-0 -n production -- \
  psql -U postgres -c "DROP DATABASE predator_db;"

# 4. Recreate database
kubectl exec -it postgres-0 -n production -- \
  psql -U postgres -c "CREATE DATABASE predator_db OWNER predator;"

# 5. Restore from backup
kubectl exec -i postgres-0 -n production -- \
  pg_restore -U predator -d predator_db -v < backup.dump

# 6. Verify restore
kubectl exec -it postgres-0 -n production -- \
  psql -U predator -d predator_db -c "SELECT COUNT(*) FROM gold.documents;"

# 7. Restart application
kubectl scale deployment backend --replicas=3 -n production
kubectl scale deployment celery-worker --replicas=5 -n production

# 8. Smoke test
make test-smoke ENV=production
```

### Selective Restore

```bash
# Restore single table
kubectl exec -i postgres-0 -n production -- \
  pg_restore -U predator -d predator_db -t documents -v < backup.dump

# Restore specific schema
kubectl exec -i postgres-0 -n production -- \
  pg_restore -U predator -d predator_db -n gold -v < backup.dump
```

## MinIO Backup

### Backup Objects

```bash
# Mirror entire bucket
mc mirror minio-prod/artifacts s3-backup/artifacts --preserve

# Backup with compression
mc cp --recursive minio-prod/models/ ./models-backup/
tar -czf models-$(date +%Y%m%d).tar.gz models-backup/
aws s3 cp models-$(date +%Y%m%d).tar.gz s3://predator-backups/minio/
```

### Restore Objects

```bash
# Download backup
aws s3 cp s3://predator-backups/minio/models-20260131.tar.gz ./

# Extract
tar -xzf models-20260131.tar.gz

# Upload to MinIO
mc cp --recursive models-backup/ minio-prod/models/

# Verify
mc ls minio-prod/models/
```

## Qdrant Backup

### Create Snapshot

```bash
# Create snapshot via API
curl -X POST "http://qdrant.production:6333/collections/multimodal_search/snapshots"

# Download snapshot
SNAPSHOT_NAME=$(curl "http://qdrant.production:6333/collections/multimodal_search/snapshots" | jq -r '.result[0].name')
curl "http://qdrant.production:6333/collections/multimodal_search/snapshots/$SNAPSHOT_NAME" \
  -o qdrant-snapshot-$(date +%Y%m%d).tar

# Upload to S3
aws s3 cp qdrant-snapshot-$(date +%Y%m%d).tar s3://predator-backups/qdrant/
```

### Restore Snapshot

```bash
# Download snapshot
aws s3 cp s3://predator-backups/qdrant/qdrant-snapshot-20260131.tar ./

# Upload to Qdrant
curl -X POST "http://qdrant.production:6333/collections/multimodal_search/snapshots/upload" \
  -H "Content-Type: multipart/form-data" \
  -F "snapshot=@qdrant-snapshot-20260131.tar"

# Verify
curl "http://qdrant.production:6333/collections/multimodal_search"
```

## OpenSearch Backup

### Create Snapshot Repository

```bash
# Register repository
curl -X PUT "http://opensearch.production:9200/_snapshot/s3_backup" \
  -H 'Content-Type: application/json' \
  -d '{
    "type": "s3",
    "settings": {
      "bucket": "predator-opensearch-backups",
      "region": "us-east-1",
      "base_path": "snapshots"
    }
  }'
```

### Create Snapshot

```bash
# Create snapshot of all indices
curl -X PUT "http://opensearch.production:9200/_snapshot/s3_backup/snapshot-$(date +%Y%m%d)" \
  -H 'Content-Type: application/json' \
  -d '{
    "indices": "*",
    "ignore_unavailable": true,
    "include_global_state": false
  }'

# Check snapshot status
curl "http://opensearch.production:9200/_snapshot/s3_backup/_all"
```

### Restore Snapshot

```bash
# Close indices
curl -X POST "http://opensearch.production:9200/_all/_close"

# Restore snapshot
curl -X POST "http://opensearch.production:9200/_snapshot/s3_backup/snapshot-20260131/_restore"

# Monitor restore
curl "http://opensearch.production:9200/_cat/recovery?v"

# Open indices
curl -X POST "http://opensearch.production:9200/_all/_open"
```

## Configuration Backup

### Kubernetes Resources

```bash
# Backup all resources
kubectl get all --all-namespaces -o yaml > k8s-backup-$(date +%Y%m%d).yaml

# Backup specific namespace
kubectl get all -n production -o yaml > production-backup-$(date +%Y%m%d).yaml

# Backup ConfigMaps and Secrets
kubectl get configmaps,secrets -n production -o yaml > configs-$(date +%Y%m%d).yaml
```

### Helm Values

```bash
# Backup Helm release values
helm get values predator -n production > values-backup-$(date +%Y%m%d).yaml

# Backup all Helm releases
helm list --all-namespaces -o yaml > helm-releases-$(date +%Y%m%d).yaml
```

## Disaster Recovery

### Complete System Restore

**Scenario**: Total cluster failure, need to restore everything

**Time Estimate**: 2-4 hours

**Procedure**:

#### 1. Provision New Cluster

```bash
# Create cluster (example: using Terraform)
cd terraform/
terraform apply -var="environment=production-dr"

# Verify cluster
kubectl get nodes
```

#### 2. Restore Infrastructure

```bash
# Install core components
kubectl apply -f k8s/namespaces/
kubectl apply -f k8s/storage/
kubectl apply -f k8s/networking/

# Install Helm charts
helm install predator ./helm/predator-umbrella \
  --values ./helm/values-prod.yaml \
  --namespace production
```

#### 3. Restore Databases

```bash
# PostgreSQL
aws s3 cp s3://predator-backups/postgres/latest/backup.dump ./
kubectl exec -i postgres-0 -n production -- \
  pg_restore -U predator -d predator_db -v < backup.dump

# Verify
kubectl exec -it postgres-0 -n production -- \
  psql -U predator -d predator_db -c "SELECT COUNT(*) FROM gold.documents;"
```

#### 4. Restore Storage

```bash
# MinIO
aws s3 sync s3://predator-backups/minio/latest/ ./minio-restore/
mc cp --recursive ./minio-restore/ minio-prod/

# Verify
mc ls minio-prod/
```

#### 5. Restore Search Indices

```bash
# Qdrant
aws s3 cp s3://predator-backups/qdrant/latest/snapshot.tar ./
curl -X POST "http://qdrant.production:6333/collections/multimodal_search/snapshots/upload" \
  -F "snapshot=@snapshot.tar"

# OpenSearch
curl -X POST "http://opensearch.production:9200/_snapshot/s3_backup/latest/_restore"
```

#### 6. Validate System

```bash
# Check all pods
kubectl get pods -n production

# Run health checks
curl https://api.predator.example.com/health

# Run smoke tests
make test-smoke ENV=production

# Check metrics
curl https://prometheus.predator.example.com/api/v1/query?query=up
```

#### 7. Update DNS

```bash
# Point DNS to new cluster
# Update A/CNAME records to new load balancer IP
```

## Backup Verification

### Regular Backup Testing

Schedule monthly backup restore tests:

```bash
# Create test environment
kubectl create namespace backup-test

# Restore to test environment
kubectl exec -i postgres-0 -n backup-test -- \
  pg_restore -U predator -d predator_db -v < latest-backup.dump

# Verify data integrity
./scripts/verify-backup.sh --namespace backup-test

# Cleanup
kubectl delete namespace backup-test
```

## Backup Checklist

### Daily Tasks
- [ ] Verify automated backups completed
- [ ] Check backup logs for errors
- [ ] Verify S3 uploads successful
- [ ] Monitor backup storage usage

### Weekly Tasks
- [ ] Test restore of one database table
- [ ] Verify backup retention policy
- [ ] Review backup metrics in Grafana
- [ ] Update backup documentation

### Monthly Tasks
- [ ] Full disaster recovery test
- [ ] Review and update RTO/RPO targets
- [ ] Audit backup access controls
- [ ] Test restore from oldest backup

### Quarterly Tasks
- [ ] Review backup strategy
- [ ] Update disaster recovery plan
- [ ] Conduct tabletop DR exercise
- [ ] Review backup costs

## Monitoring & Alerts

### Backup Alerts

Set up alerts for:
- Backup job failures
- Missing backups
- Backup size anomalies
- Restore test failures
- Storage quota exceeded

### Grafana Dashboard

Monitor backup health:
- Backup success rate
- Backup duration
- Backup size trends
- Storage usage
- Time since last backup

## Recovery Objectives

| Component | RTO | RPO |
|-----------|-----|-----|
| Application | 30 min | 6 hours |
| Database | 1 hour | 6 hours |
| Search Indices | 2 hours | 24 hours |
| Object Storage | 2 hours | 24 hours |
| Full System | 4 hours | 24 hours |

**RTO**: Recovery Time Objective (how long to restore)  
**RPO**: Recovery Point Objective (how much data loss is acceptable)

---

**Last Updated**: 2026-01-31  
**Maintainer**: Database & Infrastructure Team
