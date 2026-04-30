"""Predator C2 (Neural Interface) v45.0
The state-of-the-art control panel for Predator Analytics.
Features: Semantic Routing, Cortex Stateful Orchestration, HITL.
"""
import asyncio
import logging
import os

from aiogram import Bot, Dispatcher, F, Router, types
from aiogram.enums import ParseMode
from aiogram.filters import CommandStart
from aiogram.types import BufferedInputFile, InlineKeyboardButton, InlineKeyboardMarkup
from aiogram.utils.keyboard import InlineKeyboardBuilder

from ..services.cortex import CortexOrchestrator
from ..services.voice import VoiceProcessor
from .config import ADMIN_ID, BOT_TOKEN, MESSAGES

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
    await message.answer(MESSAGES["welcome"], parse_mode=ParseMode.MARKDOWN)
    await send_voice_report(message.chat.id, "Система Предатор Аналітікс v45.0 в режимі очікування, оператор.")

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
