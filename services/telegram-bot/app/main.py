import logging

from telegram.ext import (
    ApplicationBuilder, 
    CommandHandler, 
    MessageHandler, 
    filters,
    ConversationHandler,
    CallbackQueryHandler
)

from app.config import TELEGRAM_BOT_TOKEN
from app.handlers import (
    start, cancel, handle_status, 
    search_start, search_type_selected, search_perform,
    graph_start, graph_perform,
    report_start, report_type_selected, report_perform,
    ai_start, ai_perform,
    settings_menu, settings_callback,
    SEARCH_INPUT, AI_INPUT, GRAPH_INPUT, REPORT_INPUT
)

logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

def main():
    application = ApplicationBuilder().token(TELEGRAM_BOT_TOKEN).build()

    # Обробники меню першого рівня без станів
    application.add_handler(CommandHandler('start', start))
    application.add_handler(MessageHandler(filters.Regex("^📊 Статус Системи$"), handle_status))
    application.add_handler(MessageHandler(filters.Regex("^⚙️ Налаштування$"), settings_menu))
    application.add_handler(CallbackQueryHandler(settings_callback, pattern="^(toggle_notif|lang_lock|clear_hist)$"))

    # Швидкий пошук Conversation
    search_conv = ConversationHandler(
        entry_points=[MessageHandler(filters.Regex("^🔍 Швидкий Пошук$"), search_start)],
        states={
            SEARCH_INPUT: [
                CallbackQueryHandler(search_type_selected, pattern="^(search_company|search_person|cancel)$"),
                MessageHandler(filters.TEXT & ~filters.COMMAND, search_perform)
            ]
        },
        fallbacks=[CommandHandler('cancel', cancel)]
    )
    application.add_handler(search_conv)

    # Граф Зв'язків Conversation
    graph_conv = ConversationHandler(
        entry_points=[MessageHandler(filters.Regex("^🕸 Граф Зв'язків$"), graph_start)],
        states={
            GRAPH_INPUT: [MessageHandler(filters.TEXT & ~filters.COMMAND, graph_perform)]
        },
        fallbacks=[CommandHandler('cancel', cancel)]
    )
    application.add_handler(graph_conv)

    # Звіти Conversation
    report_conv = ConversationHandler(
        entry_points=[MessageHandler(filters.Regex("^📄 Згенерувати Звіт$"), report_start)],
        states={
            REPORT_INPUT: [
                CallbackQueryHandler(report_type_selected, pattern="^(report_risk|report_fin|cancel)$"),
                MessageHandler(filters.TEXT & ~filters.COMMAND, report_perform)
            ]
        },
        fallbacks=[CommandHandler('cancel', cancel)]
    )
    application.add_handler(report_conv)

    # AI Copilot Conversation
    ai_conv = ConversationHandler(
        entry_points=[MessageHandler(filters.Regex("^🤖 Запитати ШІ$"), ai_start)],
        states={
            AI_INPUT: [MessageHandler(filters.TEXT & ~filters.COMMAND, ai_perform)]
        },
        fallbacks=[CommandHandler('cancel', cancel)]
    )
    application.add_handler(ai_conv)

    # Глобальний fallback для невідомих команд/текстів
    async def unknown(update, context):
        await update.message.reply_text("Я вас не зовсім зрозумів. Спробуйте скористатися меню або натисніть /start.")

    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, unknown))

    logger.info("Бот запущений і готовий до роботи.")
    application.run_polling()

if __name__ == '__main__':
    main()
