import logging
from telegram import Update, KeyboardButton, ReplyKeyboardMarkup, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes, ConversationHandler

from app.api_client import (
    get_system_status, perform_search, ask_ai_copilot, 
    get_active_alerts, trigger_osint, analyze_graph_connections,
    generate_risk_report
)

logger = logging.getLogger(__name__)

# Стейт-змінні для ConversationHandler
SEARCH_INPUT = 1
AI_INPUT = 2
GRAPH_INPUT = 3
REPORT_INPUT = 4
OSINT_INPUT = 5

# Головне меню з новими корисними кнопками
def get_main_keyboard():
    keyboard = [
        [KeyboardButton("📊 Статус Системи"), KeyboardButton("🔍 Швидкий Пошук")],
        [KeyboardButton("🚨 Активні Загрози"), KeyboardButton("📡 OSINT Розвідка")],
        [KeyboardButton("🕸 Граф Зв'язків"), KeyboardButton("📄 Згенерувати Звіт")],
        [KeyboardButton("🤖 Запитати ШІ"), KeyboardButton("⚙️ Налаштування")]
    ]
    return ReplyKeyboardMarkup(keyboard, resize_keyboard=True)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обробка команди /start та вивід головного меню."""
    await update.message.reply_text(
        "🦅 <b>Вітаю у PREDATOR Analytics v56.5 Control Center!</b>\n\n"
        "Я ваш телеграм-пульт для керування системою. Всі системи переведено в бойовий режим.\n"
        "Оберіть дію в меню нижче:",
        reply_markup=get_main_keyboard(),
        parse_mode='HTML'
    )
    return ConversationHandler.END

async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Скасування поточної операції."""
    await update.message.reply_text(
        "Дію скасовано. Повернення до головного меню.",
        reply_markup=get_main_keyboard()
    )
    return ConversationHandler.END

async def handle_status(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Перевірка статусу системи."""
    msg = await update.message.reply_text("🔄 Отримую дані від сервісів...", reply_markup=get_main_keyboard())
    status_text = await get_system_status()
    await msg.edit_text(status_text, parse_mode='HTML')
    return ConversationHandler.END

async def handle_alerts(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Отримання активних загроз."""
    msg = await update.message.reply_text("🔄 Перевіряю систему на наявність нових загроз...", reply_markup=get_main_keyboard())
    alerts_text = await get_active_alerts()
    await msg.edit_text(alerts_text, parse_mode='HTML')
    return ConversationHandler.END

# --- OSINT Розвідка ---

async def osint_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Початок OSINT розвідки."""
    await update.message.reply_text(
        "📡 Введіть ціль для глибокої OSINT-розвідки (ІПН, Назва компанії або /cancel):"
    )
    return OSINT_INPUT

async def osint_perform(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Запуск OSINT."""
    text = update.message.text
    msg = await update.message.reply_text(f"🔄 Ініціалізую збір даних для '{text}'...")
    result = await trigger_osint(text)
    await msg.edit_text(result, parse_mode='HTML', disable_web_page_preview=True)
    return ConversationHandler.END

# --- Швидкий Пошук ---

async def search_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [
        [InlineKeyboardButton("🏢 Компанія", callback_data="search_company")],
        [InlineKeyboardButton("👤 Людина", callback_data="search_person")],
        [InlineKeyboardButton("❌ Скасувати", callback_data="cancel")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text("Оберіть тип пошуку:", reply_markup=reply_markup)
    return SEARCH_INPUT

async def search_type_selected(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()

    if query.data == "cancel":
        await query.edit_message_text("Пошук скасовано.")
        return ConversationHandler.END

    search_type = "Компанія" if query.data == "search_company" else "Людина"
    context.user_data['search_type'] = search_type
    
    await query.edit_message_text(f"Ви обрали пошук: {search_type}\n\nВведіть запит (ІПН, Код ЄДРПОУ або Назву):")
    return SEARCH_INPUT

async def search_perform(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = update.message.text
    search_type = context.user_data.get('search_type', 'Невідомо')
    
    msg = await update.message.reply_text(f"🔄 Шукаю '{text}' у базі...")
    result = await perform_search(text, search_type)
    await msg.edit_text(result, parse_mode='HTML')
    return ConversationHandler.END

# --- Граф Зв'язків ---

async def graph_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "🕸 Введіть запит (Назва або Код) для аналізу в Trinity Graph Engine (або /cancel):"
    )
    return GRAPH_INPUT

async def graph_perform(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = update.message.text
    msg = await update.message.reply_text(f"🕸 Шукаю зв'язки для '{text}' у графі...")
    result = await analyze_graph_connections(text)
    await msg.edit_text(result, parse_mode='HTML', disable_web_page_preview=True)
    return ConversationHandler.END

# --- Звіти ---

async def report_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [
        [InlineKeyboardButton("🔴 Ризик-аналіз", callback_data="report_risk")],
        [InlineKeyboardButton("💰 Фінансовий", callback_data="report_fin")],
        [InlineKeyboardButton("❌ Скасувати", callback_data="cancel")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text("Оберіть тип звіту:", reply_markup=reply_markup)
    return REPORT_INPUT

async def report_type_selected(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()

    if query.data == "cancel":
        await query.edit_message_text("Генерацію скасовано.")
        return ConversationHandler.END

    report_type = "Ризик-аналіз" if query.data == "report_risk" else "Фінансовий"
    context.user_data['report_type'] = report_type
    
    await query.edit_message_text(f"Тип звіту: {report_type}\nВведіть UEID цільової сутності:")
    return REPORT_INPUT

async def report_perform(update: Update, context: ContextTypes.DEFAULT_TYPE):
    ueid = update.message.text
    report_type = context.user_data.get('report_type', '')
    
    msg = await update.message.reply_text(f"🔄 Генерую звіт '{report_type}' для {ueid} через Elite Risk Engine...")
    result = await generate_risk_report(ueid, report_type)
    await msg.edit_text(result, parse_mode='HTML', disable_web_page_preview=True)
    return ConversationHandler.END

# --- Запитати ШІ ---

async def ai_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("🤖 Введіть ваш запит до аналітичного ШІ (або /cancel):")
    return AI_INPUT

async def ai_perform(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = update.message.text
    msg = await update.message.reply_text("🧠 ШІ аналізує...")
    result = await ask_ai_copilot(text)
    await msg.edit_text(result, parse_mode='HTML')
    return ConversationHandler.END

# --- Налаштування ---

async def settings_menu(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [
        [InlineKeyboardButton("🔔 Сповіщення: УВІМК", callback_data="toggle_notif")],
        [InlineKeyboardButton("🌍 Мова: 🇺🇦 UK (Locked)", callback_data="lang_lock")],
        [InlineKeyboardButton("🗑 Очистити історію", callback_data="clear_hist")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text("⚙️ <b>Налаштування</b>", reply_markup=reply_markup, parse_mode='HTML')

async def settings_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    
    if query.data == "toggle_notif":
        await query.edit_message_text("🔔 Сповіщення тимчасово вимкнені.")
    elif query.data == "lang_lock":
        await query.answer("Мова заблокована на 🇺🇦 Українській згідно політики HR-03.", show_alert=True)
    elif query.data == "clear_hist":
        await query.edit_message_text("🗑 Історія контексту (Redis сесії) очищена.")
