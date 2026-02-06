# test_parser_safe.py
import asyncio
import getpass
import os

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
    print("🔒 Безпечний тест парсера")
    print("=" * 50)

    # Check environment first
    env_api_id = os.getenv("TELEGRAM_API_ID")
    env_api_hash = os.getenv("TELEGRAM_API_HASH")

    # 1. API Credentials
    if env_api_id and env_api_hash:
        print(f"✅ Found credentials in ENV: ID={env_api_id[:4]}***")
        api_id = env_api_id
        api_hash = env_api_hash
    elif DEFAULT_API_ID and DEFAULT_API_ID != "використовувати оригінальний":
         print(f"✅ Found credentials in config_test.py: ID={DEFAULT_API_ID}")
         api_id = DEFAULT_API_ID
         api_hash = DEFAULT_API_HASH
    else:
        print("⚠️ Credentials not found in ENV or config_test.py")
        api_id = input("Введіть API_ID: ")
        api_hash = getpass.getpass("Введіть API_HASH (не буде відображатись): ")

    print("\n2. Session Setup...")

    try:
        client = TelegramClient('test_safemode_session', int(api_id), api_hash)

        # Вибір режиму
        print("\nChoose Login Mode:")
        print("1 - Bot Token (from .env or input)")
        print("2 - User Phone (from .env or input)")
        mode = input("Mode (1/2): ").strip()

        if mode == "1":
            bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
            if not bot_token:
                bot_token = getpass.getpass("Введіть токен бота: ")
            else:
                print(f"Using Bot Token from ENV: {bot_token[:10]}...")

            await client.start(bot_token=bot_token)
            print("✅ Підключено як бот")
        else:
            phone = os.getenv("TELEGRAM_PHONE") or DEFAULT_PHONE
            if not phone or phone == "+380XXXXXXXXX":
                phone = input("Введіть номер телефону: ")
            else:
                print(f"Using Phone from configuration: {phone}")

            await client.start(phone=phone)
            print("✅ Підключено як користувач")

        # Тестування
        me = await client.get_me()
        print(f"\n👤 Успіх! Акаунт: {me.first_name} (@{me.username})")

        # SAVE TO .ENV ON SUCCESS
        print("\n💾 Saving credentials to .env...")
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
                print("✅ .env updated successfully with API credentials!")
            else:
                print("⚠️ .env file not found, skipping save.")

        except Exception as env_e:
            print(f"⚠️ Failed to save to .env: {env_e}")

        # Простий тест парсингу
        test_channel = "Customs_of_Ukraine"
        print(f"\nTesting channel: {test_channel}")

        try:
            entity = await client.get_entity(test_channel)
            print(f"📊 Канал знайдено: {entity.title}")

            # Отримати 5 останніх повідомлень
            async for message in client.iter_messages(test_channel, limit=5):
                print(f"  [{message.date}] {message.text[:100] if message.text else '[Media]'}...")
        except Exception as e:
            print(f"⚠️ Помилка парсингу: {e}")

        await client.disconnect()
        print("\n✅ Тест пройдено успішно!")

    except Exception as e:
        print(f"\n❌ Помилка: {e}")
        print("\nПеревірте:")
        print("1. Чи правильні API_ID/API_HASH")
        print("2. Чи підключення до інтернету")
        print("3. Чи не потрібен 2FA код")

if __name__ == "__main__":
    asyncio.run(safe_test())
