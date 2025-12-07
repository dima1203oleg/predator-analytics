# Kubernetes Deployment Configuration for Predator Analytics

## Prerequisites
- Kubernetes cluster (K8s/K3s)
- kubectl configured
- Helm 3.x installed

## 1. Create Namespace

```bash
kubectl create namespace predator-analytics
kubectl config set-context --current --namespace=predator-analytics
```

## 2. Secrets Configuration

```bash
# Create secret for database credentials
kubectl create secret generic predator-db-secret \
  --from-literal=postgres-password='your-secure-password' \
  --from-literal=postgres-user='predator'

# Create secret for MinIO
kubectl create secret generic minio-secret \
  --from-literal=root-user='minioadmin' \
  --from-literal=root-password='minioadmin123'

# Create secret for API keys (if needed)
kubectl create secret generic predator-api-keys \
  --from-literal=openai-key='sk-...' \
  --from-literal=slack-token='xoxb-...'
```

## 3. Persistent Volume Claims

```yaml
# File: k8s/pvc.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 20Gi
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: qdrant-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: opensearch-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 15Gi
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: minio-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 50Gi
```

Apply:
```bash
kubectl apply -f k8s/pvc.yaml
```

## 4. Backend Deployment

```yaml
# File: k8s/backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: predator-backend
  labels:
    app: predator-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: predator-backend
  template:
    metadata:
      labels:
        app: predator-backend
    spec:
      containers:
      - name: backend
        image: your-registry/predator-backend:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          value: "postgresql://predator:$(POSTGRES_PASSWORD)@postgres:5432/predator_db"
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: predator-db-secret
              key: postgres-password
        - name: REDIS_URL
          value: "redis://redis:6379"
        - name: OPENSEARCH_URL
          value: "http://opensearch:9200"
        - name: QDRANT_URL
          value: "http://qdrant:6333"
        - name: MINIO_ENDPOINT
          value: "minio:9000"
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: predator-backend
spec:
  selector:
    app: predator-backend
  ports:
  - port: 8000
    targetPort: 8000
  type: ClusterIP
```

Apply:
```bash
kubectl apply -f k8s/backend-deployment.yaml
```

## 5. Frontend Deployment

```yaml
# File: k8s/frontend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: predator-frontend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: predator-frontend
  template:
    metadata:
      labels:
        app: predator-frontend
    spec:
      containers:
      - name: frontend
        image: your-registry/predator-frontend:latest
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: predator-frontend
spec:
  selector:
    app: predator-frontend
  ports:
  - port: 80
    targetPort: 80
  type: ClusterIP
```

## 6. Database (PostgreSQL)

```yaml
# File: k8s/postgres-deployment.yaml  
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
spec:
  serviceName: postgres
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15
        ports:
        - containerPort: 5432
        env:
        - name: POSTGRES_DB
          value: predator_db
        - name: POSTGRES_USER
          valueFrom:
            secretKeyRef:
              name: predator-db-secret
              key: postgres-user
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: predator-db-secret
              key: postgres-password
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
  - metadata:
      name: postgres-storage
    spec:
      accessModes: [ "ReadWriteOnce" ]
      resources:
        requests:
          storage: 20Gi
---
apiVersion: v1
kind: Service
metadata:
  name: postgres
spec:
  selector:
    app: postgres
  ports:
  - port: 5432
  clusterIP: None
```

## 7. Ingress (Nginx)

```yaml
# File: k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: predator-ingress
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  tls:
  - hosts:
    - predator.yourdomain.com
    secretName: predator-tls
  rules:
  - host: predator.yourdomain.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: predator-backend
            port:
              number: 8000
      - path: /
        pathType: Prefix
        backend:
          service:
            name: predator-frontend
            port:
              number: 80
```

## 8. Deploy All Components

```bash
# Apply all configurations
kubectl apply -f k8s/

# Check deployment status
kubectl get pods
kubectl get services
kubectl get ingress

# View logs
kubectl logs -f deployment/predator-backend
```

## 9. Scale Services

```bash
# Scale backend
kubectl scale deployment predator-backend --replicas=5

# Scale frontend
kubectl scale deployment predator-frontend --replicas=3
```

## 10. Rolling Updates

```bash
# Update backend image
kubectl set image deployment/predator-backend \
  backend=your-registry/predator-backend:v2.0.0

# Check rollout status
kubectl rollout status deployment/predator-backend

# Rollback if needed
kubectl rollout undo deployment/predator-backend
```

## Monitoring

```bash
# Watch pod status
kubectl get pods -w

# Resource usage
kubectl top pods
kubectl top nodes

# Events
kubectl get events --sort-by='.lastTimestamp'
```

## Cleanup

```bash
kubectl delete namespace predator-analytics
```

---

**Ready for K8s deployment!** 🚀
