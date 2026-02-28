"""Predator v55.0 — Post Loyalty Score (PLS).

Formula (spec 6.5):
    PLS = CompanyFlowThroughPost / TotalCompanyFlow

Measures how loyal an entity is to a specific customs post.
Output: 0-100 scale (higher = more concentrated on one post).
"""

from __future__ import annotations


def calculate_pls(
    company_flow_through_post: float,
    total_company_flow: float,
) -> float:
    """Calculate Post Loyalty Score.

    Args:
        company_flow_through_post: Volume processed through a specific post.
        total_company_flow: Total volume across all posts.

    Returns:
        PLS score (0-100). Higher = more dependent on single post.
    """
    if total_company_flow <= 0:
        return 0.0

    ratio = company_flow_through_post / total_company_flow
    return round(max(0.0, min(100.0, ratio * 100.0)), 2)
