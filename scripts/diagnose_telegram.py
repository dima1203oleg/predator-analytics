import json
import os
import subprocess
import sys
import urllib.request


def check_internet():
    try:
        print("Checking connectivity to google.com...")
        urllib.request.urlopen('http://www.google.com', timeout=3)
        return True
    except Exception as e:
        print(f"Connectivity Check Failed: {e}")
        return False

def check_bot_token(token):
    print(f"Checking Bot Token: {token[:9]}...")
    url = f"https://api.telegram.org/bot{token}/getMe"
    try:
        resp = urllib.request.urlopen(url, timeout=5)
        data = json.load(resp)
        return data.get('ok'), data.get('result')
    except Exception as e:
        return False, str(e)

def install_telethon():
    print("Attempting to install telethon...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "telethon", "--break-system-packages"])
        return True
    except Exception as e:
        print(f"Pip Install Failed: {e}")
        return False

def main():
    print("🦅 PREDATOR TELEGRAM DIAGNOSTIC")
    print("================================")

    # 1. Network
    net = check_internet()
    print(f"🌐 Internet Access: {'✅ OK' if net else '❌ FAIL'}")

    # 2. Bot Token (Using provided token)
    token = "8562512293:AAEbO8iKWf4ZX_7STXSDDU8h-xpSQzTTrtE"

    if net:
        ok, res = check_bot_token(token)
        if ok:
            print("🤖 Bot Token: ✅ VALID")
            print(f"   Details: ID={res.get('id')}, Name={res.get('first_name')}, @{res.get('username')}")
        else:
            print("🤖 Bot Token: ❌ INVALID/ERROR")
            print(f"   Error: {res}")
    else:
        print("🤖 Bot Token: ⚠️ Unverified (No Net)")

    # 3. Telethon Library
    print("\n📦 Library Check:")
    try:
        import telethon
        print("   [telethon] ... ✅ INSTALLED")
        version = getattr(telethon, '__version__', 'unknown')
        print(f"   Version: {version}")
    except ImportError:
        print("   [telethon] ... ❌ MISSING")
        if net:
            print("   🛠️ Attempting Auto-Fix (Install)...")
            if install_telethon():
                print("   ✅ Installation Successful!")
            else:
                print("   ❌ Installation Failed. Check pip/network.")
        else:
            print("   ⚠️ Cannot install: Offline")

    # 4. Config Check
    print("\n⚙️ Configuration Check (.env):")
    api_id = os.getenv("TELEGRAM_API_ID") or ""
    api_hash = os.getenv("TELEGRAM_API_HASH") or ""

    if api_id and api_hash:
        print(f"   API_ID:   ✅ Set ({api_id[:2]}***)")
        print(f"   API_HASH: ✅ Set ({api_hash[:4]}***)")
    else:
        print("   API_ID:   ❌ MISSING")
        print("   API_HASH: ❌ MISSING")
        print("   ⚠️ Telethon Parser requires these fields!")
        print("   Please edit .env or provide them.")

    print("\n================================")

if __name__ == "__main__":
    main()
