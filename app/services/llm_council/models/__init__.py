from __future__ import annotations


"""LLM Council Models.

Available council members:
- OpenAI: GPT-4, GPT-3.5 Turbo
- Anthropic: Claude 3 (Opus, Sonnet, Haiku)
- Google: Gemini Pro
- Groq: LLaMA 70B, LLaMA 8B
"""

from .anthropic_member import ClaudeCouncilMember
from .gemini_member import GeminiCouncilMember
from .groq_member import GroqCouncilMember, GroqLlama8BCouncilMember
from .openai_member import GPT3_5CouncilMember, GPT4CouncilMember


__all__ = [
    "ClaudeCouncilMember",
    "GPT3_5CouncilMember",
    "GPT4CouncilMember",
    "GeminiCouncilMember",
    "GroqCouncilMember",
    "GroqLlama8BCouncilMember",
]
