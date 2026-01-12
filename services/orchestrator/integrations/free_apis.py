#!/usr/bin/env python3
"""
Free API Integration Hub
Integrates multiple free services for maximum capability
"""
import os
import logging

logger = logging.getLogger("integrations.hub")

# ============================================================================
# FREE AI/ML APIS
# ============================================================================

FREE_APIS = {
    # LLM Models
    "gemini": {
        "name": "Google Gemini",
        "endpoint": "https://generativelanguage.googleapis.com/v1/models",
        "key_env": "GEMINI_API_KEY",
        "free_tier": "60 requests/minute",
        "models": ["gemini-2.0-flash-exp", "gemini-pro"]
    },

    "groq": {
        "name": "Groq (Llama 3.3)",
        "endpoint": "https://api.groq.com/openai/v1/chat/completions",
        "key_env": "GROQ_API_KEY",
        "free_tier": "14,400 requests/day",
        "models": ["llama-3.3-70b-versatile", "mixtral-8x7b-32768"]
    },

    "deepseek": {
        "name": "DeepSeek",
        "endpoint": "https://api.deepseek.com/v1/chat/completions",
        "key_env": "DEEPSEEK_API_KEY",
        "free_tier": "10M tokens/month",
        "models": ["deepseek-chat", "deepseek-coder"]
    },

    # Code Analysis
    "anthropic_claude": {
        "name": "Anthropic Claude (if available)",
        "endpoint": "https://api.anthropic.com/v1/messages",
        "key_env": "ANTHROPIC_API_KEY",
        "free_tier": "Contact for trial",
        "models": ["claude-3-5-sonnet-20241022"]
    },

    # Embeddings
    "huggingface": {
        "name": "Hugging Face Inference",
        "endpoint": "https://api-inference.huggingface.co/models",
        "key_env": "HUGGINGFACE_API_KEY",
        "free_tier": "Unlimited (rate limited)",
        "models": ["sentence-transformers/all-MiniLM-L6-v2"]
    },

    # Monitoring
    "betterstack": {
        "name": "Better Stack (Free Monitoring)",
        "endpoint": "https://uptime.betterstack.com/api/v2",
        "key_env": "BETTERSTACK_API_KEY",
        "free_tier": "10 monitors"
    },

    # Error Tracking
    "sentry": {
        "name": "Sentry (Error Tracking)",
        "endpoint": "https://sentry.io/api/0",
        "key_env": "SENTRY_DSN",
        "free_tier": "5,000 events/month"
    }
}

# ============================================================================
# FREE INFRASTRUCTURE SERVICES
# ============================================================================

FREE_SERVICES = {
    "upstash_redis": {
        "name": "Upstash Redis (Serverless)",
        "free_tier": "10,000 commands/day",
        "use_case": "Cache, rate limiting"
    },

    "supabase": {
        "name": "Supabase (PostgreSQL)",
        "free_tier": "500MB database",
        "use_case": "Backup database"
    },

    "cloudflare_r2": {
        "name": "Cloudflare R2 (S3-compatible)",
        "free_tier": "10GB storage",
        "use_case": "ML models storage"
    },

    "render": {
        "name": "Render (App hosting)",
        "free_tier": "750 hours/month",
        "use_case": "Staging environment"
    }
}

def get_configured_apis():
    """Get list of configured APIs with keys"""
    configured = []

    for api_id, api_info in FREE_APIS.items():
        key_env = api_info.get("key_env")
        if key_env and os.getenv(key_env):
            configured.append({
                "id": api_id,
                "name": api_info["name"],
                "status": "configured"
            })

    return configured

def get_api_recommendations():
    """Get recommendations for APIs to add"""
    recommendations = []

    for api_id, api_info in FREE_APIS.items():
        key_env = api_info.get("key_env")
        if key_env and not os.getenv(key_env):
            recommendations.append({
                "id": api_id,
                "name": api_info["name"],
                "benefit": api_info.get("free_tier"),
                "setup_url": f"# Add {key_env} to .env"
            })

    return recommendations

if __name__ == "__main__":
    print("🔌 Free API Integration Hub")
    print("=" * 50)

    print("\n✅ Configured APIs:")
    for api in get_configured_apis():
        print(f"  - {api['name']}")

    print("\n💡 Recommended APIs to add:")
    for rec in get_api_recommendations():
        print(f"  - {rec['name']}: {rec['benefit']}")
