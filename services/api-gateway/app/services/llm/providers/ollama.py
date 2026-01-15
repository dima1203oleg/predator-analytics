import structlog
import time
import httpx
from app.core.config import settings
from .base import BaseLLMProvider, LLMResponse

logger = structlog.get_logger(__name__)

class OllamaProvider(BaseLLMProvider):
    def __init__(self, base_url: str = None, model: str = None):
        # Fallback to absolute system settings if not provided
        self.base_url = (base_url or settings.LLM_OLLAMA_BASE_URL).rstrip("/")
        self.model = model or settings.OLLAMA_MODEL

        super().__init__("", self.model)

        # Ensure we point to /chat endpoint for chat-based interactions
        if not self.base_url.endswith("/chat"):
             self.chat_url = f"{self.base_url}/chat"
        else:
             self.chat_url = self.base_url

    @property
    def provider_name(self) -> str:
        return "ollama"

    async def generate(self, prompt: str, system: str = "", **kwargs) -> LLMResponse:
        start_time = time.time()

        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": self.model,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": kwargs.get("temperature", 0.7),
                "num_predict": kwargs.get("max_tokens", 2048)
            }
        }

        try:
            logger.debug("ollama_request", model=self.model, url=self.chat_url)

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.chat_url,
                    json=payload,
                    timeout=kwargs.get("timeout", 120.0) # Local models need more time
                )

                if response.status_code != 200:
                    logger.error("ollama_api_error", status=response.status_code, error=response.text)
                    return LLMResponse(
                        success=False,
                        content="",
                        provider=self.provider_name,
                        model=self.model,
                        error=f"Ollama API Error {response.status_code}: {response.text}"
                    )

                data = response.json()
                # Extraction for /api/chat endpoint
                if "message" in data:
                    content = data["message"]["content"]
                elif "response" in data:
                    content = data["response"]
                else:
                    content = str(data)

                # Ollama token stats
                tokens = data.get("eval_count", 0) + data.get("prompt_eval_count", 0)

                logger.info("ollama_success", model=self.model, tokens=tokens)

                return LLMResponse(
                    success=True,
                    content=content,
                    provider=self.provider_name,
                    model=self.model,
                    tokens_used=tokens,
                    latency_ms=(time.time() - start_time) * 1000
                )

        except Exception as e:
            logger.exception("ollama_critical_failure", error=str(e))
            return LLMResponse(
                success=False,
                content="",
                provider=self.provider_name,
                model=self.model,
                error=str(e)
            )
