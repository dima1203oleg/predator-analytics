from __future__ import annotations


#!/usr/bin/env python3
"""🔍 PREDATOR TELEGRAM DEBUGGER
Діагностика та виправлення проблем з ботом.
"""
import asyncio
import logging
import os

from aiogram import Bot


# Кольори
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    GREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

logging.basicConfig(level=logging.ERROR)

async def check_token(token: str):
    print(f"{Colors.BLUE}🔄 Checking token: {token[:5]}...{Colors.ENDC}")
    try:
        bot = Bot(token=token)
        me = await bot.get_me()
        print(f"{Colors.GREEN}✅ SUCCESS!{Colors.ENDC}")
        print(f"   Bot Name: {me.first_name}")
        print(f"   Username: @{me.username}")
        print(f"   Bot ID:   {me.id}")
        await bot.session.close()
        return True, me.username
    except Exception as e:
        print(f"{Colors.FAIL}❌ FAILED: {e}{Colors.ENDC}")
        return False, None

def update_env_file(key: str, value: str):
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")

    # Read existing
    lines = []
    if os.path.exists(env_path):
        with open(env_path) as f:
            lines = f.readlines()

    # Update or Add
    found = False
    new_lines = []
    for line in lines:
        if line.startswith(f"{key}="):
            new_lines.append(f"{key}={value}\n")
            found = True
        else:
            new_lines.append(line)

    if not found:
        new_lines.append(f"{key}={value}\n")

    # Write back
    with open(env_path, "w") as f:
        f.writelines(new_lines)
    print(f"{Colors.GREEN}✅ Updated .env file{Colors.ENDC}")

async def main():
    print(f"{Colors.HEADER}🔎 TELEGRAM BOT DIAGNOSTIC TOOL{Colors.ENDC}")
    print("====================================")

    # 1. Check Env
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    admin_id = os.getenv("TELEGRAM_ADMIN_ID")

    print("Current Config:")
    print(f"  TOKEN:    {token[:5] + '...' if token else 'NOT SET'}")
    print(f"  ADMIN_ID: {admin_id or 'NOT SET'}")
    print()

    # 2. Verify Token
    valid = False
    username = None

    if token:
        valid, username = await check_token(token)

    if not valid:
        print(f"\n{Colors.WARNING}⚠️  TOKEN IS INVALID OR MISSING!{Colors.ENDC}")
        new_token = input(f"{Colors.BOLD}Enter new Bot Token (from @BotFather):{Colors.ENDC} ").strip()

        if new_token:
            valid, _username = await check_token(new_token)
            if valid:
                update_env_file("TELEGRAM_BOT_TOKEN", new_token)
                token = new_token
                os.environ["TELEGRAM_BOT_TOKEN"] = token
            else:
                print(f"{Colors.FAIL}❌ Token is still invalid. Aborting.{Colors.ENDC}")
                return

    # 3. Verify Admin ID
    if not admin_id:
        print(f"\n{Colors.WARNING}⚠️  ADMIN ID IS MISSING!{Colors.ENDC}")
        print("You need to know your Telegram User ID.")
        print("1. Open Telegram")
        print("2. Search for @userinfobot")
        print("3. Click Start")
        print("4. Copy the 'Id' number")

        new_id = input(f"{Colors.BOLD}Enter your ID:{Colors.ENDC} ").strip()
        if new_id:
            update_env_file("TELEGRAM_ADMIN_ID", new_id)
            admin_id = new_id
            os.environ["TELEGRAM_ADMIN_ID"] = admin_id

    # 4. Test Message
    if valid and admin_id:
        print(f"\n{Colors.BLUE}🔄 Sending test message to {admin_id}...{Colors.ENDC}")
        try:
            bot = Bot(token=token)
            await bot.send_message(admin_id, "✅ **DIAGNOSTIC TEST SUCCESSFUL**\n\nYour bot is configured correctly!", parse_mode="Markdown")
            await bot.session.close()
            print(f"{Colors.GREEN}✅ Message sent! Check your Telegram.{Colors.ENDC}")
        except Exception as e:
            print(f"{Colors.FAIL}❌ Failed to send message: {e}{Colors.ENDC}")
            print("Check if you have started the bot (clicked /start) before.")

    print("\n====================================")
    print(f"{Colors.BOLD}🎉 DIAGNOSTIC COMPLETE!{Colors.ENDC}")
    print()
    print("To start the bot now, run:")
    print(f"{Colors.GREEN}python3 backend/orchestrator/agents/telegram_bot_v2.py{Colors.ENDC}")
    print()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nCANCELLED")
