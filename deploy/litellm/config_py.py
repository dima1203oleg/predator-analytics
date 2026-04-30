"""🚀 ULTRA-ROUTER v55.3 — LiteLLM Proxy Configuration (Python)
STATELESS MODE (без БД)
"""

# ═══════════════════════════════════════════════════════════════
# MODEL LIST (безплатні провайдери тільки)
# ═══════════════════════════════════════════════════════════════

model_list = [
    # 🚀 GROQ (ОСНОВНА) — 10 ключів
    {
        "model_name": "groq-fast",
        "litellm_params": {
            "model": "groq/llama-3.3-70b-versatile",
            "api_key": "gsk_test_1",
        }
    },
    {
        "model_name": "groq-fast-2",
        "litellm_params": {
            "model": "groq/llama-3.3-70b-versatile",
            "api_key": "gsk_test_2",
        }
    },
    {
        "model_name": "groq-fast-3",
        "litellm_params": {
            "model": "groq/llama-3.3-70b-versatile",
            "api_key": "gsk_test_3",
        }
    },
    {
        "model_name": "groq-fast-4",
        "litellm_params": {
            "model": "groq/llama-3.3-70b-versatile",
            "api_key": "gsk_test_4",
        }
    },
    {
        "model_name": "groq-fast-5",
        "litellm_params": {
            "model": "groq/llama-3.3-70b-versatile",
            "api_key": "gsk_test_5",
        }
    },

    # 📚 HUGGINGFACE (резерв)
    {
        "model_name": "hf-llama2",
        "litellm_params": {
            "model": "huggingface/meta-llama/Llama-2-70b-chat-hf",
            "api_key": "hf_test_key",
        }
    },

    # 🤝 TOGETHER AI
    {
        "model_name": "together-llama3",
        "litellm_params": {
            "model": "together_ai/meta-llama/Llama-3-70b-chat-hf",
            "api_key": "together_test_key",
        }
    },

    # 🖥️ OLLAMA (локально)
    {
        "model_name": "ollama-llama2",
        "litellm_params": {
            "model": "ollama/llama2",
            "api_base": "http://194.177.1.240:11434",
        }
    },
]

# ═══════════════════════════════════════════════════════════════
# ROUTER SETTINGS (STATELESS)
# ═══════════════════════════════════════════════════════════════

router_settings = {
    "enable_model_routing": True,
    "track_cost_per_token": False,  # ❌ БЕЗ БД
    "track_all_requests": False,    # ❌ БЕЗ БД
}

# ═══════════════════════════════════════════════════════════════
# LITELLM SETTINGS
# ═══════════════════════════════════════════════════════════════

litellm_settings = {
    "num_retries": 2,
    "request_timeout": 30,
    "context_window_fallback": {
        "groq/llama-3.3-70b-versatile": 8192,
        "huggingface/meta-llama/Llama-2-70b-chat-hf": 4096,
        "together_ai/meta-llama/Llama-3-70b-chat-hf": 8192,
        "ollama/llama2": 4096,
    },
}
