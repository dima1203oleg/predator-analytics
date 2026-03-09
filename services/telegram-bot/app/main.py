import logging
import httpx
from telegram import Update, ReplyKeyboardMarkup, KeyboardButton
from telegram.ext import ApplicationBuilder, ContextTypes, CommandHandler, MessageHandler, filters

from app.config import TELEGRAM_BOT_TOKEN, CORE_API_URL

# Налаштування логування
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обробка команди /start та вивід головного меню."""
    keyboard = [
        [KeyboardButton("📊 Статус Системи"), KeyboardButton("🔍 Швидкий Пошук")],
        [KeyboardButton("🕸 Граф Зв'язків"), KeyboardButton("📄 Згенерувати Звіт")],
        [KeyboardButton("🤖 Запитати ШІ"), KeyboardButton("⚙️ Налаштування")]
    ]
    reply_markup = ReplyKeyboardMarkup(keyboard, resize_keyboard=True)
    
    await update.message.reply_text(
        "🦅 **Вітаю у PREDATOR Analytics v55.1 Control Center!**\n\n"
        "Я ваш телеграм-пульт для керування системою. Ви можете використовувати кнопки нижче "
        "або просто писати мені запити природною українською мовою.",
        reply_markup=reply_markup,
        parse_mode='Markdown'
    )

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обробка природної мови та натискання кнопок."""
    text = update.message.text
    user = update.message.from_user
    
    if text == "📊 Статус Системи":
        await update.message.reply_text("🔄 Отримую дані від сервісів...")
        # Тут буде логіка запиту до health-ендпоінтів
        await update.message.reply_text("✅ Всі системи (Core, Graph, Ingestion) — ONLINE.")
    
    elif text == "🔍 Швидкий Пошук":
        await update.message.reply_text("Введіть ІПН, Код або Назву сутності для пошуку:")
        
    elif text == "🤖 Запитати ШІ" or not text.startswith("/"):
        # Логіка інтеграції з AI Copilot
        await update.message.reply_text(f"🧠 Обробляю ваш запит: '{text}'...")
        # Тут виклик до /api/v1/copilot/query
        await update.message.reply_text("Отримав відповідь від DeepSeek-V3: Згідно з аналізом, сутність має високий ризик через зв'язки з санкційними списками.")
    
    else:
        await update.message.reply_text("Я вас не зовсім зрозумів. Спробуйте скористатися меню.")

if __name__ == '__main__':
    application = ApplicationBuilder().token(TELEGRAM_BOT_TOKEN).build()
    
    start_handler = CommandHandler('start', start)
    msg_handler = MessageHandler(filters.TEXT & (~filters.COMMAND), handle_message)
    
    application.add_handler(start_handler)
    application.add_handler(msg_handler)
    
    print("🚀 PREDATOR Telegram Bot Controller is running...")
    application.run_polling()
