"""
OpenAI LLM Provider
"""
import time
import httpx
from .base import BaseLLMProvider, LLMResponse

class OpenAIProvider(BaseLLMProvider):
    def __init__(self, api_key: str, model: str = "gpt-4o-mini"):
        super().__init__(api_key, model)
        self.base_url = "https://api.openai.com/v1/chat/completions"

    @property
    def provider_name(self) -> str:
        return "openai"

    async def generate(self, prompt: str, system: str = "", **kwargs) -> LLMResponse:
        start_time = time.time()

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": kwargs.get("temperature", 0.7),
            "max_tokens": kwargs.get("max_tokens", 2048)
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.base_url,
                    json=payload,
                    headers=headers,
                    timeout=30.0
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
                content = data["choices"][0]["message"]["content"]
                tokens = data.get("usage", {}).get("total_tokens", 0)

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
