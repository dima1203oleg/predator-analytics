# 📊 Grafana Dashboard - ML Services Monitoring

## Dashboard для моніторингу ML-сервісів (Embeddings, Reranking, Summarization)

### Metrics to Track:

1. **Embedding Service**
   - Model load time
   - Inference latency (p50, p95, p99)
   - Batch size distribution
   - GPU/CPU utilization
   - Cache hit rate

2. **Reranker Service**
   - Model load time  
   - Reranking latency per document
   - Total reranking time
   - Top-K distribution

3. **Summarization Service**
   - Summary generation time
   - Input token count distribution
   - Output token count distribution
   - Cache hit rate
   - Model selection frequency

### Prometheus Queries:

```promql
# Embedding latency (p95)
histogram_quantile(0.95, rate(embedding_duration_seconds_bucket[5m]))

# Reranking throughput
rate(rerank_total[5m])

# Summarization success rate
rate(summary_success_total[5m]) / rate(summary_total[5m])

# ML service errors
rate(ml_errors_total[5m])

# Cache effectiveness
ml_cache_hits_total / (ml_cache_hits_total + ml_cache_misses_total)
```

### Grafana JSON (Import this):

```json
{
  "dashboard": {
    "title": "Predator ML Services",
    "panels": [
      {
        "title": "Embedding Latency (p95)",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(embedding_duration_seconds_bucket[5m]))",
            "legendFormat": "p95"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Reranking Performance",
        "targets": [
          {
            "expr": "rate(rerank_duration_seconds_sum[5m]) / rate(rerank_duration_seconds_count[5m])",
            "legendFormat": "avg latency"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Cache Hit Rate",
        "targets": [
          {
            "expr": "rate(ml_cache_hits_total[5m]) / (rate(ml_cache_hits_total[5m]) + rate(ml_cache_misses_total[5m]))",
            "legendFormat": "hit rate"
          }
        ],
        "type": "gauge"
      }
    ]
  }
}
```

## Implementation Steps:

1. **Add Prometheus metrics to ML services:**
   ```python
   from prometheus_client import Histogram, Counter
   
   EMBEDDING_DURATION = Histogram('embedding_duration_seconds', 'Time to generate embeddings')
   RERANK_DURATION = Histogram('rerank_duration_seconds', 'Time to rerank documents')
   SUMMARY_DURATION = Histogram('summary_duration_seconds', 'Time to generate summary')
   ML_CACHE_HITS = Counter('ml_cache_hits_total', 'ML cache hits')
   ML_CACHE_MISSES = Counter('ml_cache_misses_total', 'ML cache misses')
   ```

2. **Instrument the code:**
   ```python
   @EMBEDDING_DURATION.time()
   async def generate_embedding(text: str):
       # ... embedding logic
       pass
   ```

3. **Import dashboard to Grafana:**
   - Navigate to http://localhost:3001
   - Dashboards → Import
   - Paste JSON above
   - Select Prometheus datasource

4. **Set up alerts:**
   - p95 latency > 5s → Warning
   - Error rate > 1% → Critical
   - Cache hit rate < 50% → Warning

## Dashboard URL:
Once imported: http://localhost:3001/d/ml-services/predator-ml-services

## Ready for production monitoring! ✅
