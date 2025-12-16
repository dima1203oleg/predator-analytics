"""
Google Gemini LLM Provider
"""
import time
import httpx
from .base import BaseLLMProvider, LLMResponse

class GeminiProvider(BaseLLMProvider):
    def __init__(self, api_key: str, model: str = "gemini-2.0-flash-exp"):
        super().__init__(api_key, model)
        self.base_url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

    @property
    def provider_name(self) -> str:
        return "gemini"

    async def generate(self, prompt: str, system: str = "", **kwargs) -> LLMResponse:
        start_time = time.time()

        url = f"{self.base_url}?key={self.api_key}"

        # Prepare contents
        contents = []
        if system:
            contents.append({
                "role": "user", # Gemini uses 'user'/'model' roles, system prompt often passed as first user message or distinct field in v1beta
                "parts": [{"text": f"System input: {system}\n\nUser input: {prompt}"}]
            })
        else:
            contents.append({
                "role": "user",
                "parts": [{"text": prompt}]
            })

        payload = {
            "contents": contents,
            "generationConfig": {
                "temperature": kwargs.get("temperature", 0.7),
                "maxOutputTokens": kwargs.get("max_tokens", 2048)
            }
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    url,
                    json=payload,
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

                # Extract content safely
                try:
                    content = data["candidates"][0]["content"]["parts"][0]["text"]
                    # Estimate tokens (Gemini returns token count in usageMetadata usually)
                    tokens = data.get("usageMetadata", {}).get("totalTokenCount", 0)
                except (KeyError, IndexError) as e:
                    return LLMResponse(
                        success=False,
                        content="",
                        provider=self.provider_name,
                        model=self.model,
                        error=f"Parsing Error: {str(e)} - Data: {str(data)[:100]}"
                    )

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
