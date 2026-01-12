"""
LLM Council Models

Available council members:
- OpenAI: GPT-4, GPT-3.5 Turbo
- Anthropic: Claude 3 (Opus, Sonnet, Haiku)
- Google: Gemini Pro
- Groq: LLaMA 70B, LLaMA 8B
"""

from .openai_member import GPT4CouncilMember, GPT3_5CouncilMember
from .anthropic_member import ClaudeCouncilMember
from .gemini_member import GeminiCouncilMember
from .groq_member import GroqCouncilMember, GroqLlama8BCouncilMember

__all__ = [
    "GPT4CouncilMember",
    "GPT3_5CouncilMember",
    "ClaudeCouncilMember",
    "GeminiCouncilMember",
    "GroqCouncilMember",
    "GroqLlama8BCouncilMember",
]
