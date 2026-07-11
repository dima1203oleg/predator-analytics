#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
New API Keys Validator — Test Additional Providers
Перевіряє нові ключи на живість
"""

import requests
import json
from concurrent.futures import ThreadPoolExecutor, as_completed

# Disable SSL warnings
import urllib3
urllib3.disable_warnings()

GREEN = '\033[0;32m'
RED = '\033[0;31m'
YELLOW = '\033[1;33m'
BLUE = '\033[0;34m'
NC = '\033[0m'

TIMEOUT = 3
RESULTS = []

def test_glm(key: str, name: str) -> tuple:
    """Test GLM API Key"""
    try:
        response = requests.get(
            "https://api.z.ai/api/coding/paas/v4/models",
            headers={"Authorization": f"Bearer {key}"},
            timeout=TIMEOUT,
            verify=False
        )
        if response.status_code in [200, 401]:
            return f"GLM_{name}", True
        return f"GLM_{name}", False
    except:
        return f"GLM_{name}", False

def test_kimi(key: str) -> tuple:
    """Test Kimi 2.7 API Key"""
    try:
        response = requests.get(
            "https://api.moonshot.cn/v1/models",
            headers={"Authorization": f"Bearer {key}"},
            timeout=TIMEOUT,
            verify=False
        )
        if response.status_code in [200, 401]:
            return "KIMI_2.7", True
        return "KIMI_2.7", False
    except:
        return "KIMI_2.7", False

def test_gemini(key: str, name: str) -> tuple:
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

def test_groq(key: str) -> tuple:
    """Test GROQ API Key"""
    try:
        response = requests.get(
            "https://api.groq.com/openai/v1/models",
            headers={"Authorization": f"Bearer {key}"},
            timeout=TIMEOUT,
            verify=False
        )
        if response.status_code in [200, 401]:
            return "GROQ_NEW", True
        return "GROQ_NEW", False
    except:
        return "GROQ_NEW", False

def test_unknown(key: str, idx: int) -> tuple:
    """Test unknown provider keys"""
    try:
        # Try OpenAI-style
        response = requests.get(
            "https://api.openai.com/v1/models",
            headers={"Authorization": f"Bearer {key}"},
            timeout=TIMEOUT,
            verify=False
        )
        if response.status_code in [200, 401]:
            return f"UNKNOWN_{idx}", True
        return f"UNKNOWN_{idx}", False
    except:
        return f"UNKNOWN_{idx}", False

def main():
    print(f"{BLUE}════════════════════════════════════════════════════════════════════════════════${NC}")
    print(f"{BLUE}🔑 New API Keys Validation${NC}")
    print(f"{BLUE}════════════════════════════════════════════════════════════════════════════════${NC}\n")
    
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = []
        
        # GLM Keys
        glm_keys = [
            ("15bf665e9973467d9cb9cb0b5a34383a.FujLouw4cGpulV4F", "KEY_1"),
            ("c9c9fe06e1f54a9ebe1d6fae1ae9e379.ttndidPjTYDSnB1m", "KEY_2"),
            ("bd39ed3a72b54632a98eb50515578272.F3D34MOPpAfbP7vg", "KEY_3"),
        ]
        
        for key, name in glm_keys:
            futures.append(executor.submit(test_glm, key, name))
        
        # Kimi 2.7
        futures.append(executor.submit(test_kimi, "sk-LMFGmypmMofzmTuIaEXEaNHsPULB4fszvfqEFQWgp47NjJHG"))
        
        # Gemini Pro
        futures.append(executor.submit(test_gemini, "AQ.Ab8RN6LjLcAHpcUY2mYkjRXO461k2wU9i95FPSt89eL9I3dqQA", "PRO"))
        
        # GROQ
        futures.append(executor.submit(test_groq, "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"))
        
        # Unknown keys
        unknown_keys = [
            "9mQc9pb6dlVY0yv4oXEV3w5m8YU6nso3",
            "sf3Vv95FrsUPVxT7WKYthAuyfGlWDbbS"
        ]
        
        for idx, key in enumerate(unknown_keys):
            futures.append(executor.submit(test_unknown, key, idx + 1))
        
        # Collect results
        for future in as_completed(futures):
            name, is_live = future.result()
            status = f"{GREEN}✅ LIVE${NC}" if is_live else f"{RED}❌ DEAD${NC}"
            print(f"   {name:<20} {status}")
            if is_live:
                RESULTS.append((name, True))
            else:
                RESULTS.append((name, False))
    
    # Summary
    live_count = sum(1 for _, is_live in RESULTS if is_live)
    dead_count = sum(1 for _, is_live in RESULTS if not is_live)
    
    print(f"\n${BLUE}════════════════════════════════════════════════════════════════════════════════${NC}")
    print(f"📊 Results: ${GREEN}{live_count} LIVE${NC} | ${RED}{dead_count} DEAD${NC}")
    print(f"${BLUE}════════════════════════════════════════════════════════════════════════════════${NC}\n")
    
    live_keys = [name for name, is_live in RESULTS if is_live]
    if live_keys:
        print(f"${GREEN}✅ NEW LIVE KEYS:${NC}")
        for key in sorted(live_keys):
            print(f"   • {key}")

if __name__ == "__main__":
    main()
