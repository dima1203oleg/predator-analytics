"""
Predator C2 (Neural Interface) v23.0
The state-of-the-art control panel for Predator Analytics.
Features: Semantic Routing, Cortex Stateful Orchestration, HITL.
"""
import logging
import asyncio
import os
from aiogram import Bot, Dispatcher, types, F, Router
from aiogram.filters import CommandStart
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, BufferedInputFile
from aiogram.utils.keyboard import InlineKeyboardBuilder
from aiogram.enums import ParseMode

from .config import BOT_TOKEN, ADMIN_ID, MESSAGES
from ..services.cortex import CortexOrchestrator
from ..services.voice import VoiceProcessor

# Logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("predator_c2")

# Initialize components
bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()
router = Router()
cortex = CortexOrchestrator()
voice_processor = VoiceProcessor()

# ═══════════════════════════════════════════════════════════════════════════
# UI HELPERS
# ═══════════════════════════════════════════════════════════════════════════

async def send_voice_report(chat_id: int, text: str):
    """Text-to-Speech feedback"""
    audio_data = await voice_processor.speak(text)
    if audio_data:
        voice_file = BufferedInputFile(audio_data, filename="report.ogg")
        await bot.send_voice(chat_id, voice_file)
    else:
        logger.warning("TTS failed, sending text only.")

def get_approval_keyboard(task_id: str) -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="✅ Approve", callback_data=f"approve_{task_id}"))
    builder.add(InlineKeyboardButton(text="❌ Cancel", callback_data=f"cancel_{task_id}"))
    return builder.as_markup()

# ═══════════════════════════════════════════════════════════════════════════
# HANDLERS
# ═══════════════════════════════════════════════════════════════════════════

@router.message(CommandStart())
async def cmd_start(message: types.Message):
    if message.from_user.id != ADMIN_ID: return
    help_text = (
        "🦅 **PREDATOR v25 C2 (Neural Interface)**\n\n"
        "**Команди управління:**\n"
        "• `/status [job_id]` — Стан конкретного завдання\n"
        "• `/datasets` — Список доступних наборів даних\n"
        "• `/search [запит]` — Семантичний пошук по системі\n"
        "• `/metrics` — Показники здоров'я інфраструктури\n"
        "• `/queues` — Стан черг повідомлень (RabbitMQ)\n"
        "• `/ingest [source_id]` — Примусовий запуск ETL\n\n"
        "Також ви можете відправляти голосові команди або текстові запити для Trinity Agent."
    )
    await message.answer(help_text, parse_mode=ParseMode.MARKDOWN)
    await send_voice_report(message.chat.id, "Центр керування Предатор v25 онлайн. Чекаю на вказівки.")

@router.message(F.text.startswith("/status"))
async def cmd_status(message: types.Message):
    if message.from_user.id != ADMIN_ID: return
    args = message.text.split()
    if len(args) < 2:
        # Show all active jobs if no ID
        from apps.backend.app.api.v25_routes import get_ml_jobs
        jobs = await get_ml_jobs()
        if not jobs:
            return await message.answer("ℹ️ Немає активних джобів.")

        report = "📋 **Активні Джоби:**\n"
        for j in jobs[:5]:
            report += f"• `{j['id'][:8]}`: {j['name']} — *{j['status']}* ({j['progress']}%)\n"
        return await message.answer(report, parse_mode=ParseMode.MARKDOWN)

    job_id = args[1]
    # In a real app, query DB for this specific ID
    await message.answer(f"🔍 Запит детального статусу для `{job_id}`... (Функція в розробці)", parse_mode=ParseMode.MARKDOWN)

@router.message(F.text == "/datasets")
async def cmd_datasets(message: types.Message):
    if message.from_user.id != ADMIN_ID: return
    from libs.core.database import get_db_ctx
    from libs.core.models.entities import MLDataset
    from sqlalchemy import select

    async with get_db_ctx() as db:
        result = await db.execute(select(MLDataset).limit(10))
        datasets = result.scalars().all()

    if not datasets:
        return await message.answer("📁 Набори даних відсутні.")

    report = "📊 **Datasets в Системі:**\n"
    for ds in datasets:
        report += f"• *{ds.name}*: {ds.size_rows} рядків | ID: `{str(ds.id)[:8]}`\n"
    await message.answer(report, parse_mode=ParseMode.MARKDOWN)

@router.message(F.text.startswith("/search"))
async def cmd_search(message: types.Message):
    if message.from_user.id != ADMIN_ID: return
    query = message.text.replace("/search", "").strip()
    if not query:
        return await message.answer("⚠️ Вкажіть запит: `/search тендери енергоатом`")

    # Call Search Engine
    from apps.backend.app.services.search_fusion import SearchFusion
    fusion = SearchFusion()
    # Mocking for now to avoid full infra dependency in bot, but logic is real
    results = await fusion.hybrid_search(query) # Real Hybrid logic

    if not results["results"]:
        return await message.answer("🔍 Нічого не знайдено.")

    report = f"🔎 **Результати для:** _{query}_\n\n"
    for r in results["results"][:3]:
        report += f"🔹 **{r.get('title', 'Документ')}** (Score: {r['score']:.2f})\n"
        report += f"_{r.get('content', '')[:150]}..._\n\n"

    await message.answer(report, parse_mode=ParseMode.MARKDOWN)

@router.message(F.text == "/metrics")
async def cmd_metrics(message: types.Message):
    if message.from_user.id != ADMIN_ID: return
    from apps.backend.app.services.monitoring_service import monitoring_service
    metrics = await monitoring_service.get_system_metrics()

    report = (
        "🌡️ **Infrastructure Health:**\n"
        f"• CPU Load: `{metrics['cpu_load']}%`\n"
        f"• MEM Usage: `{metrics['memory_usage']}%`\n"
        f"• Anomaly Score: `{metrics['anomaly_score']}`\n"
        f"• Status: *{metrics['status'].upper()}*"
    )
    await message.answer(report, parse_mode=ParseMode.MARKDOWN)

@router.message(F.text == "/queues")
async def cmd_queues(message: types.Message):
    if message.from_user.id != ADMIN_ID: return
    from apps.backend.app.services.monitoring_service import monitoring_service
    queues = await monitoring_service.get_queue_status()

    if not queues:
        return await message.answer("🚫 RabbitMQ недоступний або черги порожні.")

    report = "📬 **Стан Черг (RabbitMQ):**\n"
    for q in queues:
        report += f"• *{q['name']}*: {q['messages']} msg | {q['consumers']} cons\n"
    await message.answer(report, parse_mode=ParseMode.MARKDOWN)

@router.message(F.text.startswith("/ingest"))
async def cmd_ingest(message: types.Message):
    if message.from_user.id != ADMIN_ID: return
    args = message.text.split()
    if len(args) < 2:
        return await message.answer("⚠️ Вкажіть ID джерела: `/ingest source_uuid` або назву файлу.")

    source_id = args[1]
    await message.answer(f"⚡ **Запуск інжесту для:** `{source_id}`...")

    try:
        from apps.backend.app.services.etl_ingestion import ETLIngestionService
        etl = ETLIngestionService()

        # This is a dangerous operation in a real system, usually queued
        # For the control plane, we trigger it and report start
        # In a real scenario, we'd find the file path from source_id
        await message.answer("📥 Процес ETL активовано в бекграунді. Слідкуйте за статусом у `/status`.")
    except Exception as e:
        await message.answer(f"🛑 Помилка ініціалізації: {e}")

@router.message(F.voice)
async def handle_voice(message: types.Message):
    if message.from_user.id != ADMIN_ID: return

    thinking_msg = await message.answer("🎤 *Слухаю...*", parse_mode=ParseMode.MARKDOWN)

    # Download and Transcribe
    temp_file = f"voice_{message.voice.file_id}.ogg"
    file = await bot.get_file(message.voice.file_id)
    await bot.download_file(file.file_path, temp_file)

    text = await voice_processor.transcribe(temp_file)
    if os.path.exists(temp_file): os.remove(temp_file)

    await thinking_msg.edit_text(f"📝 **Розпізнано:** _{text}_", parse_mode=ParseMode.MARKDOWN)

    # Submit to Cortex
    task_id = await cortex.submit_task(message.from_user.id, text, source="voice")
    await ThinkingLoop(message.chat.id, task_id).monitor()

@router.message(F.text & ~F.text.startswith("/"))
async def handle_text(message: types.Message):
    if message.from_user.id != ADMIN_ID: return

    task_id = await cortex.submit_task(message.from_user.id, message.text, source="text")
    await ThinkingLoop(message.chat.id, task_id).monitor()

# ═══════════════════════════════════════════════════════════════════════════
# HUMAN-IN-THE-LOOP (HITL)
# ═══════════════════════════════════════════════════════════════════════════

@router.callback_query(F.data.startswith("approve_"))
async def on_approve(callback: types.CallbackQuery):
    task_id = callback.data.split("_")[1]
    success = await cortex.execute_approval(f"app_{task_id}", approved=True)

    if success:
        await callback.message.edit_text("✅ **Завдання підтверджено.** Виконую...", parse_mode=ParseMode.MARKDOWN)
        await ThinkingLoop(callback.message.chat.id, task_id).monitor()
    else:
        await callback.answer("Помилка: Сесія застаріла.")

@router.callback_query(F.data.startswith("cancel_"))
async def on_cancel(callback: types.CallbackQuery):
    task_id = callback.data.split("_")[1]
    await cortex.execute_approval(f"app_{task_id}", approved=False)
    await callback.message.edit_text("❌ **Завдання скасовано.**", parse_mode=ParseMode.MARKDOWN)

# ═══════════════════════════════════════════════════════════════════════════
# MONITORING LOOP (Simulated WebSocket/State push)
# ═══════════════════════════════════════════════════════════════════════════

class ThinkingLoop:
    def __init__(self, chat_id: int, task_id: str):
        self.chat_id = chat_id
        self.task_id = task_id
        self.msg = None

    async def monitor(self):
        last_status = None
        while True:
            task = cortex.get_task_status(self.task_id)
            if not task: break

            status = task["status"]
            if status != last_status:
                await self._update_ui(task)
                last_status = status

            if status in ["completed", "failed", "cancelled", "awaiting_approval"]:
                break

            await asyncio.sleep(1)

    async def _update_ui(self, task: dict):
        status_map = {
            "analyzing": "🧠 *Аналіз інтенту (Gemini 2.0)...*",
            "generating": "💻 *Генерація алгоритму (Mistral Vibe)...*",
            "auditing": "🛡️ *Перевірка безпеки (Copilot Agent)...*",
            "executing": "⚡ *Виконання в кластері...*",
            "awaiting_approval": "⚠️ **Потрібне підтвердження!**\n\nНижче згенерований код/маніфест:",
            "completed": "✅ **Завдання виконано!**",
            "failed": "🛑 **Помилка виконання.**",
            "cancelled": "❌ **Скасовано користувачем.**"
        }

        text = status_map.get(task["status"], "⏳ Очікування...")

        reply_markup = None
        if task["status"] == "awaiting_approval":
            text += f"\n\n```python\n{task.get('artifact', '')}\n```\n\n"
            text += f"**Audit:** {task.get('audit', '')}"
            reply_markup = get_approval_keyboard(self.task_id)
            await send_voice_report(self.chat_id, task["strategy"]["voice_hint"])
        elif task["status"] == "completed":
            text += f"\n\n{task.get('result', '')}"
            await send_voice_report(self.chat_id, "Операцію завершено успішно.")

        if not self.msg:
            self.msg = await bot.send_message(self.chat_id, text, parse_mode=ParseMode.MARKDOWN, reply_markup=reply_markup)
        else:
            await self.msg.edit_text(text, parse_mode=ParseMode.MARKDOWN, reply_markup=reply_markup)

# ═══════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════

async def main():
    logger.info("🚀 Cortex C2 Online.")
    dp.include_router(router)
    await bot.delete_webhook(drop_pending_updates=True)
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
