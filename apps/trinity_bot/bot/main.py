from __future__ import annotations

import asyncio
import logging
import os

# Add common libs path if needed or rely on package install
import sys

from aiogram import Bot, Dispatcher, F, types
from aiogram.fsm.storage.memory import MemoryStorage
from aiogram.types import FSInputFile


sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from core.cortex import TrinityOrchestrator
from utils.voice import VoiceEngine


# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("trinity.bot")

# Init
TOKEN = os.getenv("TELEGRAM_TOKEN")
if not TOKEN:
    logger.warning("TELEGRAM_TOKEN not set. Bot will not start.")
    # For dev purposes, we might want to fail or mock, but let's assume it fails hard in prod.

bot = Bot(token=TOKEN) if TOKEN else None
dp = Dispatcher(storage=MemoryStorage())
cortex = TrinityOrchestrator()
voice_engine = VoiceEngine()

# --- Voice Handling ---
@dp.message(F.voice)
async def handle_voice(message: types.Message):
    if not bot: return
    await bot.send_chat_action(message.chat.id, "record_voice")

    # 1. Download
    file = await bot.get_file(message.voice.file_id)
    file_path = f"/tmp/{message.voice.file_id}.ogg"
    await bot.download_file(file.file_path, file_path)

    # 2. STT
    try:
        text_command = await voice_engine.transcribe_google(file_path)
    except Exception as e:
        logger.warning(f"Google STT failed: {e}. Falling back to Whisper.")
        text_command = await voice_engine.transcribe_whisper(file_path)

    await message.reply(f"🎤 Почув: *{text_command}*", parse_mode="Markdown")

    # 3. Cortex Processing
    await process_command(message, text_command)

# --- Text Handling ---
@dp.message(F.text)
async def handle_text(message: types.Message):
    await process_command(message, message.text)

async def process_command(message: types.Message, text: str):
    if not bot: return
    status_msg = await message.answer("🧠 Трійка агентів аналізує запит...")

    # Process
    # Hardcoded role 'admin' for demo as requested
    result = await cortex.process_request(text, "admin")

    # Response Handling
    if result.get("status") == "error":
         await message.answer(f"⚠️ Error: {result.get('message')}")
    elif result.get("status") == "denied":
         await message.answer(f"🚫 Access Denied: {result.get('reason')}")
    else:
        res_type = result.get("type")
        summary = result.get("summary", "Done.")

        if res_type == "code":
            # Save to file to send as doc
            doc_path = f"/tmp/generated_{message.message_id}.py"
            with open(doc_path, "w") as f:
                f.write(result.get("content", ""))

            await message.answer_document(
                FSInputFile(doc_path, filename="generated_script.py"),
                caption=f"✅ Mistral згенерував скрипт, Copilot перевірив.\nSummary: {summary}"
            )
        elif res_type == "action":
            results_str = "\n".join([str(r) for r in result.get("results", [])])
            await message.answer(f"⚡ Action Executed:\n{summary}\nResults:\n{results_str}")
        else:
            await message.answer(f"🤖 **Cortex Response**:\n{summary}\n\n{result.get('content', '')}")

    await bot.delete_message(message.chat.id, status_msg.message_id)

async def main():
    if not bot:
        logger.error("Bot token missing. Exiting.")
        return
    logger.info("Starting Trinity Bot...")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
