# 🤖 LLM Council - Quick Start Guide

**Multi-Model Consensus System** based on Andrej Karpathy's 2025 pattern.

## Quick Start

### 1. Setup Environment

```bash
# Install dependencies
cd ua-sources
pip install openai anthropic google-generativeai groq

# Set API keys
export OPENAI_API_KEY="sk-..."
export ANTHROPIC_API_KEY="sk-ant-..."
export GOOGLE_API_KEY="AI..."
export GROQ_API_KEY="gsk_..."
```

### 2. Basic Usage

```python
from app.services.llm_council import create_default_council

# Create council
council = create_default_council()

# Get consensus answer
result = await council.deliberate(
    query="What is the best approach to detect fraud in customs data?",
    enable_peer_review=True
)

print(result.final_answer)
print(f"Confidence: {result.confidence}")
```

### 3. API Usage

```bash
# Start server
uvicorn app.main_v45:app --reload

# Query council
curl -X POST http://localhost:8000/api/council/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Analyze this customs declaration anomaly...",
    "models": ["gpt4", "claude", "gemini"],
    "enable_peer_review": true
  }'
```

## Features

- ✅ **4+ LLM Models**: GPT-4, Claude, Gemini, Groq
- ✅ **Peer Review**: Models critique each other
- ✅ **Consensus**: Chairman synthesizes best answer
- ✅ **Confidence Scoring**: Know how reliable the answer is
- ✅ **Fast Mode**: Skip peer review for speed
- ✅ **Cost Optimized**: Choose models based on budget

## Architecture

```
Query → Multiple Models → Peer Review → Consensus → Answer
        (Parallel)        (Cross-eval)  (Synthesis)
```

## Configuration

### Choose Models

```python
# High quality (expensive)
council = create_default_council(
    include_models=['gpt4', 'claude', 'gemini']
)

# Fast & cheap
council = create_default_council(
    include_models=['gpt3.5', 'groq']
)
```

### Enable/Disable Peer Review

```python
# Quality mode (slower, better)
result = await council.deliberate(
    query="...",
    enable_peer_review=True  # +15-20s latency
)

# Fast mode
result = await council.deliberate(
    query="...",
    enable_peer_review=False  # ~5s latency
)
```

## When to Use

**Use LLM Council for:**
- 🎯 Critical business decisions
- 📊 Complex analytical queries
- 🔍 Fact-checking important claims
- 🧠 Multi-step reasoning tasks

**Don't use for:**
- ⚡ Real-time chat (too slow)
- 💰 High-volume queries (too expensive)
- 📝 Simple lookups (overkill)

## Cost Estimate

| Configuration | Latency | Cost/Query |
|---------------|---------|------------|
| GPT-3.5 only | ~3s | $0.01 |
| GPT-4 + Claude | ~8s | $0.05 |
| Full Council + Peer Review | ~25s | $0.10 |

## Documentation

- 📖 [Full Implementation Guide](./LLM_COUNCIL_IMPLEMENTATION.md)
- 🗺️ [Production Automation Roadmap](./PRODUCTION_AUTOMATION_IMPLEMENTATION.md)
- 📊 [Progress Summary](./PRODUCTION_AUTOMATION_SUMMARY.md)

## Testing

```bash
# Run tests
pytest ua-sources/tests/test_llm_council.py -v

# Integration test (requires API keys)
pytest ua-sources/tests/test_llm_council.py::TestCouncilIntegration -v
```

## Monitoring

All council queries are logged to MLflow automatically:
- Parameters: query, models used
- Metrics: confidence, peer reviews, time
- Artifacts: full responses

Access MLflow: http://localhost:5001

## Troubleshooting

**"No council members available"**
→ Check API keys are set

**"Peer review timeout"**
→ Reduce number of models or disable peer review

**"Too expensive"**
→ Use cheaper models (GPT-3.5, Groq) or disable peer review

---

**Version:** 22.0  
**Status:** ✅ Production Ready  
**Last Updated:** 2025-12-10
