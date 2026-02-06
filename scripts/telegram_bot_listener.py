from __future__ import annotations

# telegram_bot_listener.py
# Побудовано за архітектурою Головного DevOps-інженера Predator Analytics v25.0
import logging
import os
from pathlib import Path
import time
from typing import TYPE_CHECKING

from telegram.ext import Application, CommandHandler, ContextTypes, MessageHandler, filters


if TYPE_CHECKING:
    from telegram import Update


# Конфігурація
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN")
TASK_QUEUE_DIR = Path("/opt/predator/tasks/queue")
AUTHORIZED_USERS = os.environ.get("AUTHORIZED_USERS", "").split(",")

# Створюємо директорію черги
TASK_QUEUE_DIR.mkdir(parents=True, exist_ok=True)

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_task = update.message.text
    user_id = str(update.effective_user.id)
    username = update.effective_user.username or "Unknown"

    logger.info(f"Отримано повідомлення від {username} ({user_id}): {user_task}")

    # Перевірка авторизації
    if AUTHORIZED_USERS and AUTHORIZED_USERS != [""] and user_id not in AUTHORIZED_USERS:
        await update.message.reply_text("❌ Неавторизований доступ. Ваш ID: " + user_id)
        return

    # Додаємо завдання в чергу (через файл для triple_cli_free.sh)
    task_id = f"tg_{int(time.time())}"
    task_file = TASK_QUEUE_DIR / f"{task_id}.task"

    try:
        with open(task_file, "w") as f:
            f.write(user_task)

        await update.message.reply_text(
            f"✅ Завдання прийнято в роботу\n🆔 ID: `{task_id}`\n🧠 Моделі: Ollama/CodeLlama\n📍 Черга: `{TASK_QUEUE_DIR}`",
            parse_mode="Markdown"
        )
    except Exception as e:
        logger.exception(f"Помилка створення завдання: {e}")
        await update.message.reply_text(f"❌ Помилка сервісу: {e}")

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    help_text = f"""
🤖 *Predator Analytics AI-ланцюжок v25.0*
Я — автономна система самовідновлення.

Надішліть мені завдання українською:
• *Згенеруй митні декларації з аномаліями*
• *Виправ помилку в Docker-контейнері*
• *Оптимізуй SQL запит для PostgreSQL*

Ваш ID: `{update.effective_user.id}`
    """
    await update.message.reply_text(help_text, parse_mode="Markdown")

def main():
    if not TOKEN:
        logger.error("TELEGRAM_BOT_TOKEN не встановлено!")
        return

    application = Application.builder().token(TOKEN).build()

    application.add_handler(CommandHandler("start", start))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    logger.info("🚀 Запуск Telegram Bot Listener...")
    application.run_polling()

if __name__ == "__main__":
    main()
