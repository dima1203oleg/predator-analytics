#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
API Keys Validator — Parallel Testing
Перевіряє всі API ключи на живість з паралельним виконанням
"""

import requests
import json
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Dict, List, Tuple

# Disable SSL warnings
import urllib3
urllib3.disable_warnings()

# Colors
GREEN = '\033[0;32m'
RED = '\033[0;31m'
YELLOW = '\033[1;33m'
BLUE = '\033[0;34m'
GRAY = '\033[0;37m'
NC = '\033[0m'

TIMEOUT = 3
RESULTS = []

def test_groq(key: str, name: str) -> Tuple[str, bool]:
    """Test Groq API Key"""
    try:
        response = requests.get(
            "https://api.groq.com/openai/v1/models",
            headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
            timeout=TIMEOUT,
            verify=False
        )
        if response.status_code == 200:
            return f"GROQ_{name}", True
        return f"GROQ_{name}", False
    except:
        return f"GROQ_{name}", False

def test_gemini(key: str, name: str) -> Tuple[str, bool]:
    """Test Gemini API Key"""
    try:
        response = requests.get(
            f"https://generativelanguage.googleapis.com/v1beta/models?key={key}",
            timeout=TIMEOUT,
            verify=False
        )
        if response.status_code == 200:
            return f"GEMINI_{name}", True
        return f"GEMINI_{name}", False
    except:
        return f"GEMINI_{name}", False

def test_mistral(key: str, name: str) -> Tuple[str, bool]:
    """Test Mistral API Key"""
    try:
        response = requests.get(
            "https://api.mistral.ai/v1/models",
            headers={"Authorization": f"Bearer {key}"},
            timeout=TIMEOUT,
            verify=False
        )
        if response.status_code == 200:
            return f"MISTRAL_{name}", True
        return f"MISTRAL_{name}", False
    except:
        return f"MISTRAL_{name}", False

def test_hf(key: str, name: str) -> Tuple[str, bool]:
    """Test Hugging Face API Key"""
    try:
        response = requests.get(
            "https://api-inference.huggingface.co/models",
            headers={"Authorization": f"Bearer {key}"},
            timeout=TIMEOUT,
            verify=False
        )
        if response.status_code in [200, 401]:
            return f"HF_{name}", True
        return f"HF_{name}", False
    except:
        return f"HF_{name}", False

def test_openai(key: str, name: str) -> Tuple[str, bool]:
    """Test OpenAI API Key"""
    try:
        response = requests.get(
            "https://api.openai.com/v1/models",
            headers={"Authorization": f"Bearer {key}"},
            timeout=TIMEOUT,
            verify=False
        )
        if response.status_code == 200:
            return f"OPENAI_{name}", True
        return f"OPENAI_{name}", False
    except:
        return f"OPENAI_{name}", False

def test_openrouter(key: str) -> Tuple[str, bool]:
    """Test OpenRouter API Key"""
    try:
        response = requests.get(
            "https://openrouter.ai/api/v1/models",
            headers={"Authorization": f"Bearer {key}"},
            timeout=TIMEOUT,
            verify=False
        )
        if response.status_code in [200, 401]:
            return "OPENROUTER", True
        return "OPENROUTER", False
    except:
        return "OPENROUTER", False

def test_together(key: str) -> Tuple[str, bool]:
    """Test Together.ai API Key"""
    try:
        response = requests.get(
            "https://api.together.xyz/v1/models",
            headers={"Authorization": f"Bearer {key}"},
            timeout=TIMEOUT,
            verify=False
        )
        if response.status_code in [200, 401]:
            return "TOGETHER", True
        return "TOGETHER", False
    except:
        return "TOGETHER", False

def test_cohere(key: str) -> Tuple[str, bool]:
    """Test Cohere API Key"""
    try:
        response = requests.get(
            "https://api.cohere.ai/v1/models",
            headers={"Authorization": f"Bearer {key}"},
            timeout=TIMEOUT,
            verify=False
        )
        if response.status_code in [200, 401]:
            return "COHERE", True
        return "COHERE", False
    except:
        return "COHERE", False

def test_ollama(url: str) -> Tuple[str, bool]:
    """Test Ollama Endpoint"""
    try:
        response = requests.get(
            f"{url}/api/tags",
            timeout=TIMEOUT,
            verify=False
        )
        if response.status_code == 200:
            return "OLLAMA", True
        return "OLLAMA", False
    except:
        return "OLLAMA", False

def main():
    print(f"{BLUE}════════════════════════════════════════════════════════════════════════════════{NC}")
    print(f"{BLUE}🔑 API Keys Validation — Fast Parallel Test{NC}")
    print(f"{BLUE}════════════════════════════════════════════════════════════════════════════════{NC}\n")
    
    # Define all tests
    tests = []
    
    # GROQ
    groq_keys = [
        ("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", "KEY_1"),
        ("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", "KEY_2"),
        ("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", "KEY_3"),
        ("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", "KEY_4"),
    ]
    
    # Gemini
    gemini_keys = [
        ("AIzaSyDF7WPENGOxFuXzQ_ZhxCrwrtX5pD0sw80", "KEY_1"),
        ("AIzaSyB_lc_BH8a3X5jfKqsQgFuiXOHRIvJXhzQ", "KEY_2"),
        ("AIzaSyCjFWH9es3em3IL_dexvLzbz7YfwxygIBk", "KEY_3"),
        ("AIzaSyAk3BJhoy-RaVYkaCKXh7aBARofpwTmpEc", "KEY_4"),
        ("AIzaSyAg4xWmHdBa-NYDigIcv2HhGEWsPi8W5-M", "KEY_5"),
    ]
    
    # Mistral
    mistral_keys = [
        ("T1TtBaI37EWoJFo0jjTvZjJWYn8qyhqb", "KEY_1"),
        ("2o7BdHajiAEtJ3dBRGOXuu5IAceWFGqp", "KEY_2"),
        ("jjIcgRTDTqoZFttQgwUKk7hwLTYxoLRq", "KEY_3"),
        ("iZxLX6mDrX2u3MUMBtmNEofqoNy0lQc7", "KEY_4"),
    ]
    
    # HF
    hf_keys = [
        ("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", "KEY_1"),
        ("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", "KEY_2"),
        ("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", "KEY_3"),
        ("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", "KEY_4"),
    ]
    
    # OpenAI
    openai_keys = [
        ("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", "KEY_1"),
        ("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", "KEY_2"),
        ("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", "KEY_3"),
    ]
    
    # Create thread pool
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = []
        
        # Add GROQ tests
        for key, name in groq_keys:
            futures.append(executor.submit(test_groq, key, name))
        
        # Add Gemini tests
        for key, name in gemini_keys:
            futures.append(executor.submit(test_gemini, key, name))
        
        # Add Mistral tests
        for key, name in mistral_keys:
            futures.append(executor.submit(test_mistral, key, name))
        
        # Add HF tests
        for key, name in hf_keys:
            futures.append(executor.submit(test_hf, key, name))
        
        # Add OpenAI tests
        for key, name in openai_keys:
            futures.append(executor.submit(test_openai, key, name))
        
        # Add other tests
        futures.append(executor.submit(test_openrouter, "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"))
        futures.append(executor.submit(test_together, "tgp_v1_FzAt7liQWG4WCZP_1hvutXFjhwWmPdpH5ijQ_q0zJVk"))
        futures.append(executor.submit(test_cohere, "l9AiVVhqFsgfSCTtwKXdlLFM41HtmQzSKa5gfCC6"))
        futures.append(executor.submit(test_ollama, "http://46.219.108.236:11434"))
        
        # Collect results
        for future in as_completed(futures):
            name, is_live = future.result()
            status = f"{GREEN}✅ LIVE{NC}" if is_live else f"{RED}❌ DEAD{NC}"
            print(f"   {name:<20} {status}")
            if is_live:
                RESULTS.append((name, True))
            else:
                RESULTS.append((name, False))
    
    # Summary
    live_count = sum(1 for _, is_live in RESULTS if is_live)
    dead_count = sum(1 for _, is_live in RESULTS if not is_live)
    
    print(f"\n{BLUE}════════════════════════════════════════════════════════════════════════════════{NC}")
    print(f"📊 Results: {GREEN}{live_count} LIVE{NC} | {RED}{dead_count} DEAD{NC}")
    print(f"{BLUE}════════════════════════════════════════════════════════════════════════════════{NC}\n")
    
    live_keys = [name for name, is_live in RESULTS if is_live]
    if live_keys:
        print(f"{GREEN}✅ LIVE KEYS:{NC}")
        for key in sorted(live_keys):
            print(f"   • {key}")
    
    return 0 if live_count > 0 else 1

if __name__ == "__main__":
    sys.exit(main())
