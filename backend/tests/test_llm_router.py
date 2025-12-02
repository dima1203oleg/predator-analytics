import pytest
from unittest.mock import MagicMock, AsyncMock, patch
from app.services.llm_router import llm_router, LLMResponse, LLMRouter

@pytest.mark.asyncio
async def test_llm_router_init():
    # Mock settings
    with patch('app.services.llm_router.settings') as mock_settings:
        mock_settings.OPENAI_API_KEY = "sk-test"
        mock_settings.GEMINI_API_KEY = None
        mock_settings.ANTHROPIC_API_KEY = None
        mock_settings.MISTRAL_API_KEY = None
        mock_settings.GROQ_API_KEY = None
        
        router = LLMRouter() # Create new instance
        assert "openai" in router.providers
        assert "gemini" not in router.providers

@pytest.mark.asyncio
async def test_generate_openai_success():
    mock_response_data = {
        "choices": [{"message": {"content": "Hello from OpenAI"}}],
        "usage": {"total_tokens": 10}
    }
    
    # Create the response object
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = mock_response_data
    mock_resp.raise_for_status = MagicMock()
    
    # Create the client mock
    mock_client_instance = MagicMock()
    # .post needs to be an AsyncMock that returns mock_resp
    mock_client_instance.post = AsyncMock(return_value=mock_resp)
    
    # Mock the context manager
    mock_client_cls = MagicMock()
    mock_client_cls.return_value.__aenter__.return_value = mock_client_instance
    
    with patch('app.services.llm_router.httpx.AsyncClient', new=mock_client_cls):
        # Force provider to be openai
        llm_router.providers = {
            "openai": {"api_key": "sk-test", "base_url": "url", "model": "gpt-4", "available": True}
        }
        
        response = await llm_router.generate("prompt", provider="openai")
        
        assert response.success
        assert response.content == "Hello from OpenAI"
        assert response.provider == "openai"

@pytest.mark.asyncio
async def test_generate_fallback():
    # Mock OpenAI failing, Gemini succeeding
    
    with patch.object(llm_router, '_call_openai', new_callable=AsyncMock) as mock_openai, \
         patch.object(llm_router, '_call_gemini', new_callable=AsyncMock) as mock_gemini:
        
        mock_openai.return_value = LLMResponse(
            content="", provider="openai", model="", tokens_used=0, latency_ms=0, success=False, error="Error"
        )
        
        mock_gemini.return_value = LLMResponse(
            content="Hello from Gemini", provider="gemini", model="gemini-pro", tokens_used=10, latency_ms=100, success=True
        )
        
        # Setup providers
        llm_router.providers = {
            "openai": {"available": True},
            "gemini": {"available": True}
        }
        
        # Mock settings fallback chain
        with patch('app.services.llm_router.settings.LLM_FALLBACK_CHAIN', ["openai", "gemini"]):
            response = await llm_router.generate("prompt")
            
            assert response.success
            assert response.provider == "gemini"
            assert response.content == "Hello from Gemini"
            
            mock_openai.assert_called_once()
            mock_gemini.assert_called_once()
