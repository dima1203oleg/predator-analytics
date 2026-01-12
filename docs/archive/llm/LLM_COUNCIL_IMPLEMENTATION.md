# LLM Council - Implementation Guide

## Overview

LLM Council реалізує патерн Andrej Karpathy для досягнення консенсусу між кількома мовними моделями. Це підвищує якість відповідей та знижує ризик галюцинацій.

## Architecture

```
                        ┌─────────────────┐
                        │   User Query    │
                        └────────┬────────┘
                                 │
                    ┌────────────▼────────────┐
                    │ Council Orchestrator    │
                    └─────────┬───────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
    ┌─────────▼────┐  ┌──────▼──────┐  ┌────▼─────────┐
    │   GPT-4      │  │   Claude    │  │   Gemini     │
    │  Response    │  │  Response   │  │  Response    │
    └──────┬───────┘  └──────┬──────┘  └──────┬───────┘
           │                  │                 │
           └──────────┬───────┴─────────────────┘
                      │
             ┌────────▼────────┐
             │  Peer Review    │
             │  (Cross-eval)   │
             └────────┬────────┘
                      │
             ┌────────▼────────┐
             │   Chairman      │
             │  (GPT-4)        │
             │  Synthesizes    │
             └────────┬────────┘
                      │
              ┌───────▼────────┐
              │ Consensus Output│
              └─────────────────┘
```

## Workflow

### Phase 1: Independent Generation
Всі моделі отримують запит одночасно і генерують відповіді незалежно один від одного.

```python
responses = await asyncio.gather(
    *[member.generate_response(query) for member in council.members]
)
```

### Phase 2: Peer Review
Кожна модель оцінює відповіді інших моделей, виставляючи оцінки та критику.

```python
for reviewer in members:
    for response in responses:
        if response.model_id != reviewer.model_id:
            review = await reviewer.review_response(response, query)
```

**Приклад peer review:**
```json
{
  "reviewer_id": "gpt-4",
  "reviewed_response_id": "claude-3-opus",
  "score": 0.85,
  "strengths": [
    "Детальний аналіз",
    "Чітка структура відповіді"
  ],
  "weaknesses": [
    "Можливо недостатньо даних для висновків"
  ],
  "critique": "Відповідь логічна та добре структурована..."
}
```

### Phase 3: Consensus Formation
Chairman (зазвичай GPT-4) синтезує фінальну відповідь на основі:
- Оригінальних відповідей
- Peer review оцінок
- Виявлених сильних/слабких сторін

```python
synthesis_prompt = f"""
You are the chairman. Based on these responses and their peer reviews:

Response 1 (GPT-4, score: 0.87): ...
Response 2 (Claude, score: 0.82): ...
Response 3 (Gemini, score: 0.79): ...

Synthesize the best answer that:
1. Takes the strongest points from each
2. Addresses weaknesses identified
3. Resolves any contradictions
"""
```

## Usage Examples

### Basic Usage

```python
from app.services.llm_council import create_default_council

# Create council with default models
council = create_default_council()

# Deliberate on a query
result = await council.deliberate(
    query="Проаналізуй аномалії в митних деклараціях",
    context="Датасет з 10,000 декларацій",
    enable_peer_review=True
)

print(f"Final Answer: {result.final_answer}")
print(f"Confidence: {result.confidence}")
print(f"Contributing Models: {result.contributing_models}")
```

### Custom Council Configuration

```python
from app.services.llm_council.council_orchestrator import LLMCouncilOrchestrator
from app.services.llm_council.models import (
    GPT4CouncilMember,
    ClaudeCouncilMember,
    GeminiCouncilMember,
    GroqCouncilMember
)

# Create custom council
council = LLMCouncilOrchestrator(
    members=[
        GPT4CouncilMember(model_id="gpt-4-turbo-preview"),
        ClaudeCouncilMember(model_id="claude-3-opus-20240229"),
        GeminiCouncilMember(model_id="gemini-pro"),
        GroqCouncilMember(model_id="llama-3.1-70b-versatile")
    ],
    chairman=GPT4CouncilMember(model_id="gpt-4"),
    min_consensus=0.75
)

result = await council.deliberate(query="Your query here")
```

### API Usage

```bash
# Query the council via REST API
curl -X POST http://localhost:8000/api/council/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Який найкращий підхід до виявлення фродів у митних деклараціях?",
    "models": ["gpt4", "claude", "gemini", "groq"],
    "enable_peer_review": true
  }'
```

**Response:**
```json
{
  "request_id": "council_20251210_043000_123456",
  "final_answer": "На основі консенсусу моделей, найефективнішим підходом є...",
  "confidence": 0.87,
  "contributing_models": ["gpt-4", "claude-3-opus", "gemini-pro", "llama-3.1-70b"],
  "peer_review_summary": {
    "total_reviews": 12,
    "average_scores": {
      "gpt-4": 0.89,
      "claude-3-opus": 0.85,
      "gemini-pro": 0.82,
      "llama-3.1-70b": 0.80
    }
  },
  "dissenting_opinions": [],
  "metadata": {
    "deliberation_time_seconds": 12.5,
    "num_members": 4,
    "peer_reviews_conducted": 12
  }
}
```

## Configuration

### Environment Variables

```bash
# API Keys (at least one required)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AI...
GROQ_API_KEY=gsk_...

# MLflow for logging (optional)
MLFLOW_TRACKING_URI=http://mlflow:5000
```

### Model Selection Strategy

**Для критичних запитів (максимальна якість):**
```python
models = ['gpt4', 'claude', 'gemini']  # Top-tier models
enable_peer_review = True
```

**Для швидких запитів (баланс швидкості/якості):**
```python
models = ['gpt3.5', 'groq', 'gemini']  # Faster models
enable_peer_review = False  # Skip review phase
```

**Для економії (мінімальна вартість):**
```python
models = ['gpt3.5', 'groq-8b']  # Cheapest models
enable_peer_review = False
```

## Performance Considerations

### Latency

- **Without peer review:** ~5-10 seconds (parallel generation only)
- **With peer review:** ~15-30 seconds (includes cross-evaluation)
- **Chairman synthesis:** +3-5 seconds

### Cost Optimization

**Typical cost per council query (with peer review):**
- GPT-4 + Claude + Gemini: ~$0.05-0.10
- GPT-3.5 + Groq + Gemini: ~$0.01-0.02

**Cost reduction strategies:**
1. Use Groq для швидких відповідей (найдешевший)
2. Вимкнути peer review для простих запитів
3. Cache результати для повторних запитів
4. Використовувати менші моделі (GPT-3.5, Llama-8B)

## Evaluation Metrics

Tracked in MLflow:

```python
mlflow.log_metric("confidence", result.confidence)
mlflow.log_metric("num_peer_reviews", len(result.peer_reviews))
mlflow.log_metric("deliberation_time", result.metadata["deliberation_time_seconds"])
mlflow.log_param("num_models", len(result.contributing_models))
```

### Quality Metrics

- **Confidence Score:** Середня оцінка peer review (0.0-1.0)
- **Consensus Rate:** % запитів з високою згодою (>0.8)
- **Dissent Rate:** % моделей з відхиленням від консенсусу
- **Human Evaluation:** Оцінка якості відповідей людьми (optional)

## Integration with Predator Analytics

### Search Enhancement

```python
# Use council for complex analytical queries
if query_complexity > 0.8:
    result = await council.deliberate(
        query=user_query,
        context=search_results_summary
    )
    return result.final_answer
else:
    # Use single LLM for simple queries
    return await single_llm_response(query)
```

### Automated Decision Making

```python
# Council decides whether to trigger retraining
result = await council.deliberate(
    query=f"Should we retrain the model? Metrics: {current_metrics}",
    models=['gpt4', 'claude']  # High-stakes decision
)

if result.confidence > 0.85 and "yes" in result.final_answer.lower():
    trigger_automated_retraining()
```

## Troubleshooting

### Common Issues

**Issue: "No council members available"**
- Check API keys in `.env`
- Verify at least one provider is configured

**Issue: "Peer review timeout"**
- Reduce number of models
- Increase timeout in orchestrator config

**Issue: "Chairman synthesis failed"**
- Falls back to highest-scored response
- Check chairman model API key

## Best Practices

1. **Use peer review for critical decisions** - Worth the extra latency
2. **Cache frequent queries** - Many queries repeat
3. **Monitor costs in Kubecost** - Set budget alerts
4. **Log all deliberations to MLflow** - For quality tracking
5. **A/B test council vs single model** - Measure quality improvements

## References

- Andrej Karpathy's LLM Council blog post (2025)
- "Multi-Agent Debate" paper (Du et al., 2023)
- OpenAI Best Practices for LLM ensembles

---

**Next Steps:**
- [ ] Add human-in-the-loop for low-confidence results
- [ ] Implement adaptive model selection based on query type
- [ ] Add streaming responses for real-time updates
- [ ] Create Grafana dashboard for council metrics
