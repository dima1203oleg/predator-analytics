"""
Ollama Local LLM Provider
"""
import time
import httpx
from .base import BaseLLMProvider, LLMResponse

class OllamaProvider(BaseLLMProvider):
    def __init__(self, base_url: str, model: str = "qwen2.5-coder:7b"):
        # api_key is not used usually, passing base_url as key hack or config
        super().__init__(base_url, model)
        self.base_url = f"{base_url}/api/chat"

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
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.base_url,
                    json=payload,
                    timeout=60.0 # Local inference can be slow
                )

                if response.status_code != 200:
                    return LLMResponse(
                        success=False,
                        content="",
                        provider=self.provider_name,
                        model=self.model,
                        error=f"API Error {response.status_code}: {response.text}"
                    )

                data = response.json()
                content = data["message"]["content"]
                # Ollama returns token stats
                tokens = data.get("eval_count", 0) + data.get("prompt_eval_count", 0)

                return LLMResponse(
                    success=True,
                    content=content,
                    provider=self.provider_name,
                    model=self.model,
                    tokens_used=tokens,
                    latency_ms=(time.time() - start_time) * 1000
                )

        except Exception as e:
            return LLMResponse(
                success=False,
                content="",
                provider=self.provider_name,
                model=self.model,
                error=str(e)
            )
