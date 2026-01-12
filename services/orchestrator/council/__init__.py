"""
LLM Council - Inspired by Andrej Karpathy's approach
Multiple LLMs debate and reach consensus on decisions
"""
from .chairman import Chairman
from .critic import Critic
from .analyst import Analyst
from .consensus import reach_consensus

__all__ = ["Chairman", "Critic", "Analyst", "reach_consensus"]
