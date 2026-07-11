"""PREDATOR C2 — Мініпульт v56.5-ELITE
Telegram бот — інтерактивний командний центр.

Мініпульт:
┌─────────────────────────────────┐
│  🦅 PREDATOR MINI-ПУЛЬТ        │
│  ┌───────┐ ┌───────┐ ┌───────┐ │
│  │🔍Пошук│ │📡OSINT│ │🤖 ШІ  │ │
│  └───────┘ └───────┘ └───────┘ │
│  ┌───────┐ ┌───────┐ ┌───────┐ │
│  │📊Стат.│ │🐳Докер│ │⚡Моделі│ │
│  └───────┘ └───────┘ └───────┘ │
│  ┌───────┐ ┌───────┐ ┌───────┐ │
│  │🛡Ризик│ │📄Звіт │ │❓Help │ │
│  └───────┘ └───────┘ └───────┘ │
└─────────────────────────────────┘
"""
import asyncio
import logging
import os

from aiogram import Bot, Dispatcher, F, Router, types
from aiogram.enums import ParseMode
from aiogram.filters import Command, CommandStart
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup
from aiogram.utils.keyboard import InlineKeyboardBuilder

from ..services.cortex import CortexOrchestrator
from ..services.voice import VoiceProcessor
from .config import ADMIN_IDS, BOT_TOKEN, BOT_VERSION, MESSAGES

# ═══════════════════════════════════════════════════════════════════════════
# ЛОГУВАННЯ
# ═══════════════════════════════════════════════════════════════════════════

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("predator_c2")

# ═══════════════════════════════════════════════════════════════════════════
# ІНІЦІАЛІЗАЦІЯ
# ═══════════════════════════════════════════════════════════════════════════

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()
router = Router()
cortex = CortexOrchestrator()
voice_processor = VoiceProcessor()


def is_admin(user_id: int) -> bool:
    """Перевірка адміна. Порожній ADMIN_IDS = дозволяємо всім (dev)."""
    if not ADMIN_IDS:
        return True
    return user_id in ADMIN_IDS


# ═══════════════════════════════════════════════════════════════════════════
# КЛАВІАТУРИ МІНІПУЛЬТА
# ═══════════════════════════════════════════════════════════════════════════

def kb_main() -> InlineKeyboardMarkup:
    """Головний пульт — 3×3 сітка модулів."""
    b = InlineKeyboardBuilder()
    b.row(
        InlineKeyboardButton(text="🔍 Пошук", callback_data="p:search"),
        InlineKeyboardButton(text="📡 OSINT", callback_data="p:osint"),
        InlineKeyboardButton(text="🤖 ШІ Чат", callback_data="p:ai"),
    )
    b.row(
        InlineKeyboardButton(text="📊 Статус", callback_data="p:status"),
        InlineKeyboardButton(text="🐳 Docker", callback_data="p:docker"),
        InlineKeyboardButton(text="⚡ Моделі", callback_data="p:models"),
    )
    b.row(
        InlineKeyboardButton(text="🛡 Ризик", callback_data="p:risk"),
        InlineKeyboardButton(text="📄 Звіт", callback_data="p:report"),
        InlineKeyboardButton(text="❓ Допомога", callback_data="p:help"),
    )
    return b.as_markup()


def kb_back() -> InlineKeyboardMarkup:
    """Кнопка повернення до пульта."""
    b = InlineKeyboardBuilder()
    b.add(InlineKeyboardButton(text="🔙 Пульт", callback_data="p:home"))
    return b.as_markup()


def kb_back_with_refresh(section: str) -> InlineKeyboardMarkup:
    """Кнопки: Оновити + Назад."""
    b = InlineKeyboardBuilder()
    b.row(
        InlineKeyboardButton(text="🔄 Оновити", callback_data=f"p:{section}"),
        InlineKeyboardButton(text="🔙 Пульт", callback_data="p:home"),
    )
    return b.as_markup()


def kb_models(models: list[dict], active: str) -> InlineKeyboardMarkup:
    """Клавіатура вибору моделі."""
    b = InlineKeyboardBuilder()
    for m in models[:12]:
        name = m["name"]
        label = f"✅ {name}" if name == active else name
        b.add(InlineKeyboardButton(text=label, callback_data=f"m:{name}"))
    b.adjust(2)
    b.row(InlineKeyboardButton(text="🔙 Пульт", callback_data="p:home"))
    return b.as_markup()


# ═══════════════════════════════════════════════════════════════════════════
# УТИЛІТИ
# ═══════════════════════════════════════════════════════════════════════════

async def safe_send(
    chat_id: int,
    text: str,
    reply_markup: InlineKeyboardMarkup | None = None,
) -> types.Message | None:
    """Безпечна відправка з автообрізанням та Markdown-фолбеком."""
    if len(text) > 4000:
        text = text[:4000] + "\n\n⚠️ _(скорочено)_"
    try:
        return await bot.send_message(
            chat_id, text, parse_mode=ParseMode.MARKDOWN, reply_markup=reply_markup
        )
    except Exception:
        try:
            plain = text.replace("*", "").replace("_", "").replace("`", "")
            return await bot.send_message(chat_id, plain, reply_markup=reply_markup)
        except Exception:
            logger.exception("Критична помилка send")
            return None


async def safe_edit(
    msg: types.Message,
    text: str,
    reply_markup: InlineKeyboardMarkup | None = None,
) -> None:
    """Безпечне редагування повідомлення."""
    if len(text) > 4000:
        text = text[:4000] + "\n\n⚠️ _(скорочено)_"
    try:
        await msg.edit_text(text, parse_mode=ParseMode.MARKDOWN, reply_markup=reply_markup)
    except Exception:
        try:
            plain = text.replace("*", "").replace("_", "").replace("`", "")
            await msg.edit_text(plain, reply_markup=reply_markup)
        except Exception:
            logger.exception("Критична помилка edit")


async def ai_with_thinking(
    chat_id: int,
    prompt: str,
    processor: str = "ai",
    thinking_text: str = "🧠 *Обробляю...*",
) -> None:
    """AI-запит з індикатором прогресу."""
    thinking = await safe_send(chat_id, thinking_text)
    if not thinking:
        return

    try:
        if processor == "search":
            result = await cortex.search(prompt)
        elif processor == "osint":
            result = await cortex.osint(prompt)
        elif processor == "risk":
            result = await cortex.analyze_risk(prompt)
        elif processor == "report":
            result = await cortex.generate_report()
        else:
            result = await cortex.ask_ai(prompt)

        await safe_edit(thinking, result, reply_markup=kb_back())
    except Exception as e:
        logger.exception("AI error")
        await safe_edit(thinking, f"❌ Помилка: {e}", reply_markup=kb_back())


# ═══════════════════════════════════════════════════════════════════════════
# СТАН ОЧІКУВАННЯ ВВЕДЕННЯ
# ═══════════════════════════════════════════════════════════════════════════

# {chat_id: "search" | "osint" | "ai" | "risk"}
_awaiting: dict[int, str] = {}


# ═══════════════════════════════════════════════════════════════════════════
# SLASH КОМАНДИ
# ═══════════════════════════════════════════════════════════════════════════

@router.message(CommandStart())
async def cmd_start(message: types.Message) -> None:
    if not is_admin(message.from_user.id):
        await message.answer(MESSAGES["access_denied"])
        return
    logger.info(f"User {message.from_user.id} → /start")
    dashboard = await cortex.get_dashboard()
    await message.answer(dashboard, parse_mode=ParseMode.MARKDOWN, reply_markup=kb_main())


@router.message(Command("help"))
async def cmd_help(message: types.Message) -> None:
    if not is_admin(message.from_user.id):
        return
    await message.answer(MESSAGES["help"], parse_mode=ParseMode.MARKDOWN, reply_markup=kb_back())


@router.message(Command("status"))
async def cmd_status(message: types.Message) -> None:
    if not is_admin(message.from_user.id):
        return
    t = await message.answer("📊 *Збираю дані...*", parse_mode=ParseMode.MARKDOWN)
    result = await cortex.get_system_status()
    await safe_edit(t, result, reply_markup=kb_back_with_refresh("status"))


@router.message(Command("search"))
async def cmd_search(message: types.Message) -> None:
    if not is_admin(message.from_user.id):
        return
    q = message.text.replace("/search", "").strip()
    if not q:
        await message.answer(MESSAGES["no_query"], parse_mode=ParseMode.MARKDOWN)
        return
    await ai_with_thinking(message.chat.id, q, "search", "🔍 *Шукаю...*")


@router.message(Command("ai"))
async def cmd_ai(message: types.Message) -> None:
    if not is_admin(message.from_user.id):
        return
    q = message.text.replace("/ai", "").strip()
    if not q:
        await message.answer(MESSAGES["no_query"], parse_mode=ParseMode.MARKDOWN)
        return
    await ai_with_thinking(message.chat.id, q, "ai")


@router.message(Command("osint"))
async def cmd_osint(message: types.Message) -> None:
    if not is_admin(message.from_user.id):
        return
    q = message.text.replace("/osint", "").strip()
    if not q:
        await message.answer(MESSAGES["no_query"], parse_mode=ParseMode.MARKDOWN)
        return
    await ai_with_thinking(message.chat.id, q, "osint", "📡 *Розвідка...*")


@router.message(Command("risk"))
async def cmd_risk(message: types.Message) -> None:
    if not is_admin(message.from_user.id):
        return
    q = message.text.replace("/risk", "").strip()
    if not q:
        await message.answer(MESSAGES["no_query"], parse_mode=ParseMode.MARKDOWN)
        return
    await ai_with_thinking(message.chat.id, q, "risk", "🛡 *Аналіз ризиків...*")


@router.message(Command("report"))
async def cmd_report(message: types.Message) -> None:
    if not is_admin(message.from_user.id):
        return
    await ai_with_thinking(message.chat.id, "", "report", "📄 *Генерую звіт...*")


# ═══════════════════════════════════════════════════════════════════════════
# CALLBACK HANDLERS — МІНІПУЛЬТ
# ═══════════════════════════════════════════════════════════════════════════

@router.callback_query(F.data == "p:home")
async def cb_home(cb: types.CallbackQuery) -> None:
    if not is_admin(cb.from_user.id):
        return
    await cb.answer()
    dashboard = await cortex.get_dashboard()
    await safe_send(cb.message.chat.id, dashboard, reply_markup=kb_main())


@router.callback_query(F.data == "p:help")
async def cb_help(cb: types.CallbackQuery) -> None:
    if not is_admin(cb.from_user.id):
        return
    await cb.answer()
    await safe_send(cb.message.chat.id, MESSAGES["help"], reply_markup=kb_back())


@router.callback_query(F.data == "p:status")
async def cb_status(cb: types.CallbackQuery) -> None:
    if not is_admin(cb.from_user.id):
        return
    await cb.answer("📊 Збираю...")
    t = await safe_send(cb.message.chat.id, "📊 *Збираю дані...*")
    if t:
        result = await cortex.get_system_status()
        await safe_edit(t, result, reply_markup=kb_back_with_refresh("status"))


@router.callback_query(F.data == "p:docker")
async def cb_docker(cb: types.CallbackQuery) -> None:
    if not is_admin(cb.from_user.id):
        return
    await cb.answer("🐳 Перевіряю...")
    t = await safe_send(cb.message.chat.id, "🐳 *Перевіряю контейнери...*")
    if t:
        result = await cortex.get_docker_status()
        await safe_edit(t, result, reply_markup=kb_back_with_refresh("docker"))


@router.callback_query(F.data == "p:models")
async def cb_models(cb: types.CallbackQuery) -> None:
    if not is_admin(cb.from_user.id):
        return
    await cb.answer("⚡ Завантажую моделі...")
    models = await cortex.list_models()
    if not models:
        await safe_send(cb.message.chat.id, "❌ Не вдалося отримати список моделей.", reply_markup=kb_back())
        return

    text = (
        "⚡ *МЕНЕДЖЕР МОДЕЛЕЙ*\n"
        "━━━━━━━━━━━━━━━━━━━━━\n\n"
        f"🤖 Активна: `{cortex.active_model}`\n\n"
        "Оберіть модель для переключення:"
    )
    await safe_send(cb.message.chat.id, text, reply_markup=kb_models(models, cortex.active_model))


@router.callback_query(F.data == "p:report")
async def cb_report(cb: types.CallbackQuery) -> None:
    if not is_admin(cb.from_user.id):
        return
    await cb.answer("📄 Генерую...")
    await ai_with_thinking(cb.message.chat.id, "", "report", "📄 *Генерую звіт...*")


@router.callback_query(F.data == "p:search")
async def cb_search(cb: types.CallbackQuery) -> None:
    if not is_admin(cb.from_user.id):
        return
    await cb.answer()
    _awaiting[cb.message.chat.id] = "search"
    await safe_send(
        cb.message.chat.id,
        "🔍 *ШВИДКИЙ ПОШУК*\n━━━━━━━━━━━━━━━━\n\n"
        "Введіть пошуковий запит:\n"
        "_(компанія, ЄДРПОУ, товар, митний пост)_",
    )


@router.callback_query(F.data == "p:osint")
async def cb_osint(cb: types.CallbackQuery) -> None:
    if not is_admin(cb.from_user.id):
        return
    await cb.answer()
    _awaiting[cb.message.chat.id] = "osint"
    await safe_send(
        cb.message.chat.id,
        "📡 *OSINT РОЗВІДКА*\n━━━━━━━━━━━━━━━━━\n\n"
        "Введіть об'єкт розвідки:\n"
        "_(компанія, ФОП, код ЄДРПОУ, особа)_",
    )


@router.callback_query(F.data == "p:ai")
async def cb_ai(cb: types.CallbackQuery) -> None:
    if not is_admin(cb.from_user.id):
        return
    await cb.answer()
    _awaiting[cb.message.chat.id] = "ai"
    await safe_send(
        cb.message.chat.id,
        "🤖 *ШІ ЧАТ*\n━━━━━━━━━━\n\n"
        f"Модель: `{cortex.active_model}`\n\n"
        "Введіть ваше питання:",
    )


@router.callback_query(F.data == "p:risk")
async def cb_risk(cb: types.CallbackQuery) -> None:
    if not is_admin(cb.from_user.id):
        return
    await cb.answer()
    _awaiting[cb.message.chat.id] = "risk"
    await safe_send(
        cb.message.chat.id,
        "🛡 *АНАЛІЗ РИЗИКІВ*\n━━━━━━━━━━━━━━━━━━\n\n"
        "Введіть об'єкт для оцінки ризику:\n"
        "_(компанія, операція, маршрут)_",
    )


# ═══════════════════════════════════════════════════════════════════════════
# MODEL SWITCHING
# ═══════════════════════════════════════════════════════════════════════════

@router.callback_query(F.data.startswith("m:"))
async def cb_model_switch(cb: types.CallbackQuery) -> None:
    if not is_admin(cb.from_user.id):
        return
    model_name = cb.data[2:]
    cortex.set_model(model_name)
    await cb.answer(f"✅ Модель: {model_name}")

    models = await cortex.list_models()
    text = (
        "⚡ *МЕНЕДЖЕР МОДЕЛЕЙ*\n"
        "━━━━━━━━━━━━━━━━━━━━━\n\n"
        f"🤖 Активна: `{cortex.active_model}`\n\n"
        "✅ Модель переключена!"
    )
    try:
        await cb.message.edit_text(
            text, parse_mode=ParseMode.MARKDOWN,
            reply_markup=kb_models(models, cortex.active_model),
        )
    except Exception:
        await safe_send(cb.message.chat.id, text, reply_markup=kb_models(models, cortex.active_model))


# ═══════════════════════════════════════════════════════════════════════════
# ГОЛОСОВІ ПОВІДОМЛЕННЯ
# ═══════════════════════════════════════════════════════════════════════════

@router.message(F.voice)
async def handle_voice(message: types.Message) -> None:
    if not is_admin(message.from_user.id):
        return

    t = await message.answer("🎤 *Слухаю...*", parse_mode=ParseMode.MARKDOWN)
    try:
        temp_file = f"/tmp/voice_{message.voice.file_id}.ogg"
        file = await bot.get_file(message.voice.file_id)
        await bot.download_file(file.file_path, temp_file)

        text = await voice_processor.transcribe(temp_file)
        if os.path.exists(temp_file):
            os.remove(temp_file)

        await safe_edit(t, f"📝 *Розпізнано:* _{text}_\n\n🧠 Обробляю...")
        result = await cortex.ask_ai(text)
        await safe_edit(t, result, reply_markup=kb_back())
    except Exception as e:
        logger.exception("Voice error")
        await safe_edit(t, f"❌ Помилка: {e}", reply_markup=kb_back())


# ═══════════════════════════════════════════════════════════════════════════
# ТЕКСТОВІ ПОВІДОМЛЕННЯ (CATCH-ALL)
# ═══════════════════════════════════════════════════════════════════════════

@router.message(F.text & ~F.text.startswith("/"))
async def handle_text(message: types.Message) -> None:
    if not is_admin(message.from_user.id):
        return

    text = message.text.strip()
    if not text:
        return

    chat_id = message.chat.id
    processor = _awaiting.pop(chat_id, "ai")

    thinking_labels = {
        "search": "🔍 *Шукаю...*",
        "osint": "📡 *Розвідка...*",
        "risk": "🛡 *Аналіз ризиків...*",
        "ai": "🧠 *Думаю...*",
    }

    logger.info(f"User {message.from_user.id} [{processor}]: {text[:80]}")
    await ai_with_thinking(
        chat_id, text, processor, thinking_labels.get(processor, "🧠 *Обробляю...*")
    )


# ═══════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════

async def main() -> None:
    logger.info(f"🦅 PREDATOR C2 {BOT_VERSION} Online.")
    logger.info(f"   Admin IDs: {ADMIN_IDS or 'ALL (dev mode)'}")
    logger.info(f"   Bot Token: ...{BOT_TOKEN[-6:] if BOT_TOKEN else 'MISSING'}")
    logger.info(f"   Модель: {cortex.active_model}")

    dp.include_router(router)
    await bot.delete_webhook(drop_pending_updates=True)
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
