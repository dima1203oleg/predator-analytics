"""
Test suite for LLM Council functionality
"""

import pytest
import os
from unittest.mock import AsyncMock, patch, MagicMock

# Only run if API keys are available
SKIP_IF_NO_KEYS = pytest.mark.skipif(
    not os.getenv("OPENAI_API_KEY"),
    reason="API keys not configured"
)


class TestCouncilDataModels:
    """Test Pydantic models"""
    
    def test_council_response_creation(self):
        from app.services.llm_council import CouncilResponse
        from datetime import datetime
        
        response = CouncilResponse(
            model_id="gpt-4",
            text="Test response",
            confidence=0.85,
            timestamp=datetime.now()
        )
        
        assert response.model_id == "gpt-4"
        assert response.confidence == 0.85
        assert response.text == "Test response"
    
    def test_peer_review_creation(self):
        from app.services.llm_council import PeerReview
        
        review = PeerReview(
            reviewer_id="claude-3",
            reviewed_response_id="gpt-4",
            score=0.9,
            critique="Excellent analysis",
            strengths=["Clear", "Accurate"],
            weaknesses=[]
        )
        
        assert review.score == 0.9
        assert len(review.strengths) == 2


class TestCouncilMembers:
    """Test individual council members"""
    
    @SKIP_IF_NO_KEYS
    @pytest.mark.asyncio
    async def test_gpt4_member_generation(self):
        from app.services.llm_council.models import GPT4CouncilMember
        
        member = GPT4CouncilMember()
        
        response = await member.generate_response(
            query="What is 2+2?",
            context=None
        )
        
        assert response.model_id == "gpt-4-turbo-preview"
        assert response.text is not None
        assert "4" in response.text or "four" in response.text.lower()
        assert 0.0 <= response.confidence <= 1.0
    
    @pytest.mark.asyncio
    async def test_confidence_estimation(self):
        from app.services.llm_council.models import GPT4CouncilMember
        
        member = GPT4CouncilMember()
        
        # High confidence text
        confidence_high = member._estimate_confidence("The answer is definitely 4.")
        assert confidence_high > 0.7
        
        # Low confidence text
        confidence_low = member._estimate_confidence(
            "I'm not sure, but it might possibly be 4, perhaps."
        )
        assert confidence_low < 0.6


class TestCouncilOrchestrator:
    """Test council orchestration"""
    
    @pytest.mark.asyncio
    async def test_orchestrator_initialization(self):
        from app.services.llm_council.council_orchestrator import LLMCouncilOrchestrator
        from app.services.llm_council.models import GPT4CouncilMember
        
        member = GPT4CouncilMember()
        orchestrator = LLMCouncilOrchestrator(
            members=[member],
            chairman=member,
            min_consensus=0.7
        )
        
        assert len(orchestrator.members) == 1
        assert orchestrator.min_consensus == 0.7
    
    @SKIP_IF_NO_KEYS
    @pytest.mark.asyncio
    async def test_single_member_deliberation(self):
        """Test with single member (no peer review)"""
        from app.services.llm_council import create_default_council
        
        council = create_default_council(include_models=['gpt3.5'])
        
        result = await council.deliberate(
            query="What is the capital of France?",
            enable_peer_review=False
        )
        
        assert result.final_answer is not None
        assert "paris" in result.final_answer.lower()
        assert result.confidence > 0.5
        assert len(result.contributing_models) == 1
    
    @pytest.mark.asyncio
    async def test_mock_deliberation(self):
        """Test council with mocked responses"""
        from app.services.llm_council.council_orchestrator import LLMCouncilOrchestrator
        from app.services.llm_council import CouncilResponse
        from datetime import datetime
        
        # Create mock member
        mock_member = AsyncMock()
        mock_member.model_id = "mock-model"
        mock_member.generate_response = AsyncMock(
            return_value=CouncilResponse(
                model_id="mock-model",
                text="Mock response",
                confidence=0.85,
                timestamp=datetime.now()
            )
        )
        
        orchestrator = LLMCouncilOrchestrator(
            members=[mock_member],
            chairman=mock_member,
            min_consensus=0.7
        )
        
        result = await orchestrator.deliberate(
            query="Test query",
            enable_peer_review=False
        )
        
        assert result.final_answer is not None
        assert len(result.contributing_models) == 1
        mock_member.generate_response.assert_called()


class TestCouncilAPI:
    """Test FastAPI endpoints"""
    
    @pytest.mark.asyncio
    async def test_council_health_endpoint(self):
        from app.api.routers.council import council_health
        
        # Mock the get_council function
        with patch('app.api.routers.council.get_council') as mock_get_council:
            mock_council = MagicMock()
            mock_council.members = [MagicMock(model_id="gpt-4")]
            mock_council.chairman = MagicMock(model_id="gpt-4")
            mock_council.deliberation_history = []
            
            mock_get_council.return_value = mock_council
            
            result = await council_health()
            
            assert result["status"] == "healthy"
            assert "gpt-4" in result["members"]
    
    @pytest.mark.asyncio
    async def test_council_stats_endpoint(self):
        from app.api.routers.council import get_council_stats
        
        with patch('app.api.routers.council.get_council') as mock_get_council:
            mock_council = MagicMock()
            mock_council.get_deliberation_stats.return_value = {
                "total_deliberations": 10,
                "average_confidence": 0.85,
                "average_deliberation_time": 15.0,
                "member_participation": {"gpt-4": 10}
            }
            
            mock_get_council.return_value = mock_council
            
            result = await get_council_stats()
            
            assert result.total_deliberations == 10
            assert result.average_confidence == 0.85


@pytest.mark.integration
class TestCouncilIntegration:
    """Integration tests (require API keys)"""
    
    @SKIP_IF_NO_KEYS
    @pytest.mark.asyncio
    async def test_full_council_workflow(self):
        """Test complete council workflow with real APIs"""
        from app.services.llm_council import create_default_council
        
        # This will use real API calls - be mindful of costs!
        council = create_default_council(include_models=['gpt3.5'])
        
        result = await council.deliberate(
            query="What is 5 + 3?",
            enable_peer_review=False  # Faster
        )
        
        assert result.final_answer is not None
        assert "8" in result.final_answer or "eight" in result.final_answer.lower()
        assert result.confidence > 0.0
        assert result.metadata["deliberation_time_seconds"] > 0
    
    @SKIP_IF_NO_KEYS
    @pytest.mark.asyncio
    async def test_council_with_peer_review(self):
        """Test peer review phase (expensive!)"""
        from app.services.llm_council import create_default_council
        
        council = create_default_council(include_models=['gpt3.5', 'gpt4'])
        
        result = await council.deliberate(
            query="Explain photosynthesis in one sentence",
            enable_peer_review=True
        )
        
        assert result.final_answer is not None
        assert len(result.peer_reviews) > 0  # At least one cross-review
        assert result.metadata["peer_reviews_conducted"] > 0


# Fixtures
@pytest.fixture
def mock_openai_response():
    """Mock OpenAI API response"""
    return {
        "choices": [
            {
                "message": {
                    "content": "This is a mock response"
                },
                "finish_reason": "stop"
            }
        ],
        "usage": {
            "prompt_tokens": 10,
            "completion_tokens": 5,
            "total_tokens": 15
        }
    }


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
