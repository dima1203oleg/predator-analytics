from __future__ import annotations

#!/usr/bin/env python3
"""🔍 PREDATOR TELEGRAM DEBUGGER
Діагностика та виправлення проблем з ботом.
"""
import asyncio
import contextlib
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
    try:
        bot = Bot(token=token)
        me = await bot.get_me()
        await bot.session.close()
        return True, me.username
    except Exception:
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

async def main():

    # 1. Check Env
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    admin_id = os.getenv("TELEGRAM_ADMIN_ID")


    # 2. Verify Token
    valid = False
    username = None

    if token:
        valid, username = await check_token(token)

    if not valid:
        new_token = input(f"{Colors.BOLD}Enter new Bot Token (from @BotFather):{Colors.ENDC} ").strip()

        if new_token:
            valid, _username = await check_token(new_token)
            if valid:
                update_env_file("TELEGRAM_BOT_TOKEN", new_token)
                token = new_token
                os.environ["TELEGRAM_BOT_TOKEN"] = token
            else:
                return

    # 3. Verify Admin ID
    if not admin_id:

        new_id = input(f"{Colors.BOLD}Enter your ID:{Colors.ENDC} ").strip()
        if new_id:
            update_env_file("TELEGRAM_ADMIN_ID", new_id)
            admin_id = new_id
            os.environ["TELEGRAM_ADMIN_ID"] = admin_id

    # 4. Test Message
    if valid and admin_id:
        try:
            bot = Bot(token=token)
            await bot.send_message(admin_id, "✅ **DIAGNOSTIC TEST SUCCESSFUL**\n\nYour bot is configured correctly!", parse_mode="Markdown")
            await bot.session.close()
        except Exception:
            pass


if __name__ == "__main__":
    with contextlib.suppress(KeyboardInterrupt):
        asyncio.run(main())
