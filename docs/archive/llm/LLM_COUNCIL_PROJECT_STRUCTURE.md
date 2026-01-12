# 📁 LLM Council - Project Structure

## Directory Layout

```
ua-sources/app/services/llm_council/
├── __init__.py                      # Base classes & data models
│   ├── CouncilMember (ABC)
│   ├── CouncilResponse
│   ├── PeerReview
│   └── ConsensusResult
│
├── council_orchestrator.py          # Main orchestrator (500+ lines)
│   ├── LLMCouncilOrchestrator
│   └── create_default_council()
│
└── models/                          # Council member implementations
    ├── __init__.py
    ├── openai_member.py            # GPT-4, GPT-3.5 Turbo
    ├── anthropic_member.py         # Claude 3 (Opus, Sonnet)
    ├── gemini_member.py            # Google Gemini Pro
    └── groq_member.py              # Groq LLaMA 70B & 8B

ua-sources/app/api/routers/
└── council.py                       # FastAPI REST API (300+ lines)
    ├── POST /api/council/query
    ├── GET  /api/council/stats
    ├── GET  /api/council/health
    └── POST /api/council/reset

ua-sources/tests/
└── test_llm_council.py             # Test suite (400+ lines)
    ├── TestCouncilDataModels
    ├── TestCouncilMembers
    ├── TestCouncilOrchestrator
    ├── TestCouncilAPI
    └── TestCouncilIntegration
```

## Documentation

```
docs/
├── PRODUCTION_AUTOMATION_IMPLEMENTATION.md   # Full roadmap (1,200 lines)
├── PRODUCTION_AUTOMATION_SUMMARY.md          # Progress tracker
├── LLM_COUNCIL_IMPLEMENTATION.md             # Detailed guide (800 lines)
├── LLM_COUNCIL_QUICKSTART.md                 # Quick start
└── SESSION_PRODUCTION_AUTOMATION_2025-12-10.md # Session summary
```

## Key Files Overview

### 1. `__init__.py` - Base Classes

```python
from abc import ABC, abstractmethod
from pydantic import BaseModel

class CouncilMember(ABC):
    """Base class for all council members"""
    @abstractmethod
    async def generate_response(query: str) -> CouncilResponse
    
    @abstractmethod
    async def review_response(response: CouncilResponse) -> PeerReview

class CouncilResponse(BaseModel):
    model_id: str
    text: str
    confidence: float
    timestamp: datetime

class PeerReview(BaseModel):
    reviewer_id: str
    score: float
    critique: str
    strengths: List[str]
    weaknesses: List[str]

class ConsensusResult(BaseModel):
    final_answer: str
    confidence: float
    contributing_models: List[str]
    peer_reviews: List[PeerReview]
```

### 2. `council_orchestrator.py` - Main Logic

```python
class LLMCouncilOrchestrator:
    """
    Coordinates LLM council deliberations
    
    Workflow:
    1. Parallel generation by all members
    2. Peer review phase (optional)
    3. Chairman synthesis
    """
    
    async def deliberate(
        query: str,
        context: Optional[str] = None,
        enable_peer_review: bool = True
    ) -> ConsensusResult:
        # Step 1: Independent responses
        responses = await self._parallel_generation(query, context)
        
        # Step 2: Peer review
        peer_reviews = await self._peer_review_phase(responses, query)
        
        # Step 3: Consensus
        consensus = await self._form_consensus(query, responses, peer_reviews)
        
        return consensus
```

### 3. Council Member Implementations

Each model implements:
- `async def generate_response()` - Creates independent response
- `async def review_response()` - Reviews another model's response
- `_estimate_confidence()` - Confidence from text analysis
- `_extract_json()` - Parse review JSON (for non-OpenAI models)

**Example - GPT-4:**
```python
class GPT4CouncilMember(CouncilMember):
    async def generate_response(self, query: str) -> CouncilResponse:
        completion = await self.client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[...],
            temperature=0.7
        )
        return CouncilResponse(...)
    
    async def review_response(self, response: CouncilResponse) -> PeerReview:
        # Ask GPT-4 to critique another model's response
        review = await self.client.chat.completions.create(
            model=self.model_id,
            messages=[{"role": "user", "content": review_prompt}],
            response_format={"type": "json_object"}
        )
        return PeerReview(...)
```

### 4. API Router

```python
@router.post("/api/council/query")
async def query_council(request: CouncilQueryRequest):
    council = get_council()
    result = await council.deliberate(
        query=request.query,
        enable_peer_review=request.enable_peer_review
    )
    
    # Log to MLflow in background
    background_tasks.add_task(_log_to_mlflow, result)
    
    return CouncilQueryResponse(...)
```

## Data Flow

```
1. API Request
   ↓
2. Council Orchestrator
   ↓
3. Parallel Generation
   ├─→ GPT-4       → Response A
   ├─→ Claude      → Response B
   ├─→ Gemini      → Response C
   └─→ Groq        → Response D
   ↓
4. Peer Review (Optional)
   GPT-4 reviews B, C, D
   Claude reviews A, C, D
   Gemini reviews A, B, D
   Groq reviews A, B, C
   ↓
5. Score Aggregation
   Response A: avg(3 reviews) = 0.87
   Response B: avg(3 reviews) = 0.82
   Response C: avg(3 reviews) = 0.79
   Response D: avg(3 reviews) = 0.75
   ↓
6. Chairman Synthesis
   GPT-4 reads all responses + reviews
   Synthesizes best answer
   ↓
7. Consensus Result
   {
     final_answer: "...",
     confidence: 0.87,
     contributing_models: [A, B, C, D]
   }
   ↓
8. MLflow Logging
   Log params, metrics, artifacts
   ↓
9. API Response
```

## Performance Characteristics

### Latency Breakdown

```
Without Peer Review (Fast Mode):
├─ Parallel Generation:  3-7s
├─ Chairman Synthesis:   2-3s
└─ Total:               5-10s

With Peer Review (Quality Mode):
├─ Parallel Generation:  3-7s
├─ Peer Review (12 reviews): 10-15s
├─ Chairman Synthesis:   2-3s
└─ Total:              15-25s
```

### Cost Breakdown

```
Example: 4 models with peer review
├─ Initial Generation (4 models):     ~$0.04
├─ Peer Reviews (12 cross-reviews):   ~$0.03
├─ Chairman Synthesis:                ~$0.01
└─ Total:                             ~$0.08
```

## Integration Points

### With Existing Services

```
LLM Council
├─→ MLflow         # Automatic experiment logging
├─→ FastAPI        # REST API
├─→ Prometheus     # Metrics (ready)
├─→ Redis          # Caching (future)
└─→ PostgreSQL     # History (future)
```

### With Predator Analytics

```
Search Results
    ↓
Is query complex? → Yes → LLM Council
    ↓                        ↓
    No                   Consensus Answer
    ↓                        ↓
Single LLM          ←────────┘
    ↓
Return to User
```

## Configuration Options

### Environment Variables

```bash
# Required (at least one)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AI...
GROQ_API_KEY=gsk_...

# Optional
MLFLOW_TRACKING_URI=http://mlflow:5000
COUNCIL_MIN_CONSENSUS=0.7
COUNCIL_PEER_REVIEW_TIMEOUT=30
```

### Runtime Configuration

```python
# Custom council
council = LLMCouncilOrchestrator(
    members=[GPT4CouncilMember(), ClaudeCouncilMember()],
    chairman=GPT4CouncilMember(),
    min_consensus=0.75  # Threshold for accepting answer
)

# Fast mode
result = await council.deliberate(
    query="...",
    enable_peer_review=False  # Skip expensive review
)
```

## Monitoring & Observability

### MLflow Metrics

Every deliberation logs:
```python
mlflow.log_param("query", query[:200])
mlflow.log_param("num_models", len(members))
mlflow.log_metric("confidence", result.confidence)
mlflow.log_metric("deliberation_time", elapsed)
mlflow.log_metric("num_peer_reviews", len(reviews))
mlflow.log_text(result.final_answer, "answer.txt")
```

### Prometheus Metrics (Ready)

```python
llm_council_requests_total = Counter(...)
llm_council_latency_seconds = Histogram(...)
llm_council_confidence_score = Gauge(...)
llm_council_cost_usd = Counter(...)
```

## Error Handling

### Graceful Degradation

```python
# Model failure → excluded from consensus
try:
    response = await member.generate_response(query)
except Exception as e:
    logger.error(f"Model {member.model_id} failed: {e}")
    # Continue with other models

# Chairman failure → use highest scored response
try:
    consensus = await chairman.synthesize(...)
except Exception:
    consensus = max(responses, key=lambda r: r.score)
```

### Retry Logic

```python
# Automatic retries for transient failures
@retry(stop=stop_after_attempt(3), wait=wait_exponential())
async def generate_with_retry(...):
    return await model.generate_response(...)
```

## Testing Strategy

```
Unit Tests
├─ Data models (Pydantic validation)
├─ Confidence estimation
└─ JSON extraction

Component Tests
├─ Individual member generation
├─ Individual member reviews
└─ Mocked API calls

Integration Tests
├─ Full deliberation workflow
├─ Peer review mechanism
└─ Chairman synthesis

API Tests
├─ Endpoint availability
├─ Request validation
└─ Response format
```

## Future Enhancements

### Planned Features

```
□ Streaming responses (real-time updates)
□ Response caching (Redis)
□ Adaptive model selection (by query type)
□ Human-in-the-loop for low confidence
□ Custom chairman models
□ Dynamic timeout adjustment
□ A/B testing framework
□ Grafana dashboard
```

---

**Total Lines:** ~2,500  
**Files:** 14 created  
**Documentation:** 8,000+ words  
**Status:** ✅ Production Ready
