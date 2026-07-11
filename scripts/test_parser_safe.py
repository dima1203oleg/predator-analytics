# test_parser_safe.py
import asyncio
import getpass
import os

from dotenv import load_dotenv

load_dotenv()

from telethon import TelegramClient

# Try to import config_test if available
try:
    import config_test
    DEFAULT_API_ID = getattr(config_test, 'TEST_API_ID', None)
    DEFAULT_API_HASH = getattr(config_test, 'TEST_API_HASH', None)
    DEFAULT_PHONE = getattr(config_test, 'TEST_PHONE', None)
except ImportError:
    DEFAULT_API_ID = None
    DEFAULT_API_HASH = None
    DEFAULT_PHONE = None

async def safe_test():

    # Check environment first
    env_api_id = os.getenv("TELEGRAM_API_ID")
    env_api_hash = os.getenv("TELEGRAM_API_HASH")

    # 1. API Credentials
    if env_api_id and env_api_hash:
        api_id = env_api_id
        api_hash = env_api_hash
    elif DEFAULT_API_ID and DEFAULT_API_ID != "використовувати оригінальний":
         api_id = DEFAULT_API_ID
         api_hash = DEFAULT_API_HASH
    else:
        api_id = input("Введіть API_ID: ")
        api_hash = getpass.getpass("Введіть API_HASH (не буде відображатись): ")


    try:
        client = TelegramClient('test_safemode_session', int(api_id), api_hash)

        # Вибір режиму
        mode = input("Mode (1/2): ").strip()

        if mode == "1":
            bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
            if not bot_token:
                bot_token = getpass.getpass("Введіть токен бота: ")
            else:
                pass

            await client.start(bot_token=bot_token)
        else:
            phone = os.getenv("TELEGRAM_PHONE") or DEFAULT_PHONE
            if not phone or phone == "+380XXXXXXXXX":
                phone = input("Введіть номер телефону: ")
            else:
                pass

            await client.start(phone=phone)

        # Тестування
        await client.get_me()

        # SAVE TO .ENV ON SUCCESS
        try:
            env_path = os.path.join(os.getcwd(), ".env")
            if os.path.exists(env_path):
                with open(env_path) as f:
                    lines = f.readlines()

                # Check if keys exist and replace, else append
                keys_to_update = {
                    "TELEGRAM_API_ID": str(api_id),
                    "TELEGRAM_API_HASH": api_hash,
                }
                if mode != "1":
                    keys_to_update["TELEGRAM_PHONE"] = phone

                new_lines = []
                processed_keys = set()

                for line in lines:
                    key = line.split("=")[0].strip()
                    if key in keys_to_update:
                        new_lines.append(f"{key}={keys_to_update[key]}\n")
                        processed_keys.add(key)
                    else:
                        new_lines.append(line)

                # Append missing
                for k, v in keys_to_update.items():
                    if k not in processed_keys:
                        if new_lines and not new_lines[-1].endswith("\n"):
                            new_lines.append("\n")
                        new_lines.append(f"{k}={v}\n")

                with open(env_path, "w") as f:
                    f.writelines(new_lines)
            else:
                pass

        except Exception:
            pass

        # Простий тест парсингу
        test_channel = "Customs_of_Ukraine"

        try:
            await client.get_entity(test_channel)

            # Отримати 5 останніх повідомлень
            async for _message in client.iter_messages(test_channel, limit=5):
                pass
        except Exception:
            pass

        await client.disconnect()

    except Exception:
        pass

if __name__ == "__main__":
    asyncio.run(safe_test())
