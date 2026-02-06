#!/usr/bin/env python3
"""🦅 PREDATOR TELEGRAM SETUP WIZARD
================================
This script helps set up the Telegram Parser (Telethon) and Bot.
"""
import os
import subprocess
import sys
import time


# Colors
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
RESET = "\033[0m"
BOLD = "\033[1m"

def print_header():
    print(f"{BOLD}🦅 PREDATOR ANALYTICS: TELEGRAM SETUP{RESET}")
    print("=" * 50)

def check_pip_package(package_name):
    print(f"📦 Checking {package_name}...", end=" ")
    try:
        __import__(package_name)
        print(f"{GREEN}INSTALLED{RESET}")
        return True
    except ImportError:
        print(f"{RED}MISSING{RESET}")
        return False

def install_package(package_name):
    print(f"🛠️  Attempting to install {package_name}...")
    try:
        # Try multiple pip commands
        cmds = [
            [sys.executable, "-m", "pip", "install", package_name, "--break-system-packages"],
            ["pip3", "install", package_name, "--break-system-packages"],
            ["pip", "install", package_name]
        ]

        for cmd in cmds:
            try:
                subprocess.check_call(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                print(f"{GREEN}✅ Successfully installed with: {' '.join(cmd)}{RESET}")
                return True
            except (subprocess.CalledProcessError, FileNotFoundError):
                continue

        print(f"{RED}❌ Failed to install {package_name}. Please install manually:{RESET}")
        print(f"   {YELLOW}pip install {package_name}{RESET}")
        return False
    except Exception as e:
        print(f"{RED}❌ Error: {e}{RESET}")
        return False

def check_env_file():
    print("\n📄 Checking .env configuration...")
    env_path = os.path.join(os.getcwd(), ".env")

    if not os.path.exists(env_path):
        print(f"{RED}❌ .env file missing!{RESET}")
        return {}

    config = {}
    with open(env_path) as f:
        for line in f:
            if "=" in line and not line.startswith("#"):
                key, val = line.strip().split("=", 1)
                config[key] = val

    # Check Critical Keys
    keys = ["TELEGRAM_BOT_TOKEN", "TELEGRAM_API_ID", "TELEGRAM_API_HASH"]

    for key in keys:
        val = config.get(key, "")
        if val and len(val) > 2:
            masked = val[:4] + "*" * (len(val)-4)
            print(f"   {key}: {GREEN}FOUND ({masked}){RESET}")
        else:
            print(f"   {key}: {RED}MISSING or EMPTY{RESET}")

    return config

def main():
    print_header()

    # 1. Check Libraries
    if not check_pip_package("telethon"):
        install_package("telethon")

    # 2. Check Config
    config = check_env_file()

    # 3. Verify Logic
    api_id = config.get("TELEGRAM_API_ID")
    api_hash = config.get("TELEGRAM_API_HASH")

    print("\n🔍 DIAGNOSTIC RESULT:")
    if not api_id or not api_hash:
        print(f"{YELLOW}⚠️  WARNING: API_ID and API_HASH are required for Telethon/Parsing!{RESET}")
        print("   Even with a Bot Token, Telethon needs these to initialize the MTProto client.")
        print(f"   1. Go to {BOLD}https://my.telegram.org{RESET}")
        print("   2. Log in and go to 'API development tools'")
        print("   3. Copy App api_id and App api_hash")
        print("   4. Add them to .env file")
    else:
        print(f"{GREEN}✅ Configuration looks good for Telethon!{RESET}")

    print("\n👉 To run the monitor:")
    print(f"   {BOLD}python3 scripts/run_telegram_monitor.py{RESET}")
    print(f"   {BOLD}python3 scripts/test_parser_safe.py{RESET} (for safe testing)")

if __name__ == "__main__":
    main()
