"""Social Media Router — OSINT по соціальних мережах."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.tools import get_tool_registry

router = APIRouter(prefix="/social", tags=["Social Media OSINT"])


# ======================== REQUEST MODELS ========================


class UsernameSearchRequest(BaseModel):
    """Запит на пошук username."""

    username: str = Field(..., description="Username для пошуку")
    platforms: list[str] | None = Field(default=None, description="Платформи для перевірки")
    fast_mode: bool = Field(default=False)


class TwitterSearchRequest(BaseModel):
    """Запит на пошук у Twitter."""

    query: str = Field(..., description="Username, ключове слово або хештег")
    search_type: str = Field(default="user", description="user | keyword | hashtag")
    limit: int = Field(default=100, ge=1, le=1000)


class InstagramSearchRequest(BaseModel):
    """Запит на пошук в Instagram."""

    query: str = Field(..., description="Username або хештег")
    search_type: str = Field(default="profile", description="profile | hashtag | location")
    include_posts: bool = Field(default=True)
    posts_limit: int = Field(default=50, ge=1, le=200)


# ======================== ENDPOINTS ========================


@router.post("/username/search")
async def search_username(request: UsernameSearchRequest):
    """Пошук username на всіх платформах.

    Перевіряє присутність username на:
    - Twitter, Instagram, Facebook, LinkedIn
    - Telegram, TikTok, YouTube
    - GitHub, Reddit, Medium

    Returns:
        Знайдені профілі та аналіз
    """
    registry = get_tool_registry()
    social_analyzer = registry.get("social_analyzer")

    if not social_analyzer:
        raise HTTPException(status_code=503, detail="Social Analyzer недоступний")

    result = await social_analyzer.run_with_timeout(
        request.username,
        options={
            "platforms": request.platforms,
            "fast_mode": request.fast_mode,
        },
    )

    return {
        "username": request.username,
        "profiles": result.data.get("profiles", []),
        "platforms_found": result.data.get("platforms_found", 0),
        "platforms_not_found": result.data.get("platforms_not_found", []),
        "coverage_percentage": result.data.get("coverage_percentage", 0),
        "findings": result.findings,
    }


@router.post("/twitter/search")
async def search_twitter(request: TwitterSearchRequest):
    """Пошук у Twitter/X.

    Можливості:
    - Профіль користувача
    - Твіти за ключовим словом
    - Твіти за хештегом

    Returns:
        Профіль та твіти
    """
    registry = get_tool_registry()
    twint = registry.get("twint")

    if not twint:
        raise HTTPException(status_code=503, detail="Twint недоступний")

    result = await twint.run_with_timeout(
        request.query,
        options={
            "search_type": request.search_type,
            "limit": request.limit,
        },
    )

    return result.data


@router.post("/instagram/search")
async def search_instagram(request: InstagramSearchRequest):
    """Пошук в Instagram.

    Можливості:
    - Профіль користувача
    - Пости за хештегом
    - Пости за локацією

    Returns:
        Профіль та пости
    """
    registry = get_tool_registry()
    instaloader = registry.get("instaloader")

    if not instaloader:
        raise HTTPException(status_code=503, detail="Instaloader недоступний")

    result = await instaloader.run_with_timeout(
        request.query,
        options={
            "search_type": request.search_type,
            "include_posts": request.include_posts,
            "posts_limit": request.posts_limit,
        },
    )

    return result.data


@router.post("/person/investigate")
async def investigate_person_social(username: str):
    """Комплексне розслідування особи у соцмережах.

    Збирає дані з:
    - Social Analyzer (всі платформи)
    - Twitter (профіль + твіти)
    - Instagram (профіль + пости)

    Returns:
        Повний соціальний профіль
    """
    registry = get_tool_registry()
    results = {}
    all_findings = []

    # Social Analyzer
    social_analyzer = registry.get("social_analyzer")
    if social_analyzer:
        sa_result = await social_analyzer.run_with_timeout(username)
        results["platforms"] = sa_result.data.get("profiles", [])
        results["platforms_found"] = sa_result.data.get("platforms_found", 0)
        all_findings.extend(sa_result.findings)

    # Twitter
    twint = registry.get("twint")
    if twint:
        twitter_result = await twint.run_with_timeout(
            username,
            options={"search_type": "user", "limit": 50},
        )
        results["twitter"] = {
            "profile": twitter_result.data.get("profile"),
            "recent_tweets": twitter_result.data.get("tweets", [])[:10],
            "hashtags": twitter_result.data.get("hashtag_frequency", {}),
        }
        all_findings.extend(twitter_result.findings)

    # Instagram
    instaloader = registry.get("instaloader")
    if instaloader:
        insta_result = await instaloader.run_with_timeout(
            username,
            options={"search_type": "profile", "posts_limit": 20},
        )
        results["instagram"] = {
            "profile": insta_result.data.get("profile"),
            "recent_posts": insta_result.data.get("posts", [])[:10],
            "hashtags": insta_result.data.get("hashtags_used", []),
            "locations": insta_result.data.get("locations", []),
        }
        all_findings.extend(insta_result.findings)

    # Аналіз
    total_followers = 0
    for platform in results.get("platforms", []):
        meta = platform.get("metadata", {})
        if "followers" in meta and isinstance(meta["followers"], int):
            total_followers += meta["followers"]

    return {
        "username": username,
        "results": results,
        "findings": all_findings,
        "summary": {
            "platforms_found": results.get("platforms_found", 0),
            "total_followers": total_followers,
            "has_twitter": "twitter" in results,
            "has_instagram": "instagram" in results,
        },
    }


@router.get("/platforms")
async def get_supported_platforms():
    """Список підтримуваних платформ."""
    return {
        "platforms": [
            {"name": "Twitter/X", "id": "twitter", "status": "active"},
            {"name": "Instagram", "id": "instagram", "status": "active"},
            {"name": "Facebook", "id": "facebook", "status": "limited"},
            {"name": "LinkedIn", "id": "linkedin", "status": "active"},
            {"name": "Telegram", "id": "telegram", "status": "active"},
            {"name": "TikTok", "id": "tiktok", "status": "planned"},
            {"name": "YouTube", "id": "youtube", "status": "active"},
            {"name": "GitHub", "id": "github", "status": "active"},
            {"name": "Reddit", "id": "reddit", "status": "active"},
        ],
    }
