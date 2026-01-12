import logging

from aiogram import F, Router, types
from aiogram.utils.keyboard import InlineKeyboardBuilder

from bot.services.orchestrator import AgentOrchestrator

logger = logging.getLogger(__name__)
router = Router()

@router.message(F.text == "/start")
async def cmd_start(message: types.Message):
    await message.answer(
        "👋 <b>Вітаю в Predator Analytics v25.1!</b>\n\n"
        "Я автономний агент з архітектурним наглядом WinSURF.\n"
        "Ви можете писати мені запити природною мовою, наприклад:\n"
        "• <i>'Проведи діагностику системи'</i>\n"
        "• <i>'Допоможи виправити помилку в логах'</i>\n"
        "• <i>'Створи бекап бази даних'</i>\n\n"
        "🛡 <b>WinSURF Stage:</b> R&D mode",
        parse_mode="HTML"
    )

@router.message(F.text)
async def handle_natural_language(message: types.Message, orchestrator: AgentOrchestrator):
    """
    Advanced NLP Handler: Analysis -> Intent -> Action -> Result
    """
    user_query = message.text
    user_id = message.from_user.id

    status_msg = await message.answer("🔍 <b>Аналізую намір...</b>", parse_mode="HTML")

    try:
        # 1. Deep Intent Analysis
        intent_data = await orchestrator.gemini.classify_intent(user_query)
        intent = intent_data.get("intent", "chat")

        # 2. Check for Dangerous Actions (Safe Mode)
        DANGEROUS_INTENTS = ["backup", "sync", "cleanup", "security_scan", "diagnose"]

        if intent in DANGEROUS_INTENTS:
            # Require confirmation
            builder = InlineKeyboardBuilder()
            # Store intent_data in callback_data (limited to 64 bytes, so we take intent name)
            # Actually better to store it in a cache, but for now just intent name
            builder.row(types.InlineKeyboardButton(
                text="✅ ПІДТВЕРДИТИ",
                callback_data=f"confirm_{intent}")
            )
            builder.row(types.InlineKeyboardButton(
                text="❌ СКАСУВАТИ",
                callback_data="cancel_action")
            )

            await status_msg.edit_text(
                f"🛡 <b>ЗАПИТ НА ДІЮ:</b> <code>{intent}</code>\n\n"
                f"⚠️ Ця операція може вплинути на систему. Ви впевнені?",
                reply_markup=builder.as_markup(),
                parse_mode="HTML"
            )
            # Store full intent_data in orchestrator cache if needed
            orchestrator.pending_actions[user_id] = intent_data
            return

        # 3. Direct execution for safe intents
        await status_msg.edit_text(
            f"🎯 <b>Виявлено намір:</b> <code>{intent}</code>\n"
            f"🔄 <i>Запускаю ланцюг виконання...</i>",
            parse_mode="HTML"
        )

        result = await orchestrator.execute_chain(intent_data, user_id)
        await display_result(status_msg, result)

    except Exception as e:
        logger.error(f"Critical error in TG Handler: {e}")
        await status_msg.edit_text(f"❌ <b>Критична помилка:</b>\n<code>{str(e)}</code>", parse_mode="HTML")

async def display_result(status_msg: types.Message, result: dict):
    """Helper to format and display result."""
    response_text = result.get("summary", "⚠️ Не вдалося отримати звіт.")
    if result.get("status") == "executed":
        response_text = f"✅ <b>Результат:</b>\n\n{response_text}"

    meta_info = []
    if result.get("audit_report"):
        meta_info.append(f"🛡 <b>Audit:</b> <code>{result['audit_report']}</code>")
    if result.get("code"):
        meta_info.append(f"💻 <b>Code Generated:</b>\n<code>{result['code'][:300]}...</code>")

    if meta_info:
        response_text += "\n\n" + "\n".join(meta_info)

    await status_msg.edit_text(response_text, parse_mode="HTML")

@router.callback_query(F.data.startswith("confirm_"))
async def handle_confirmation(callback: types.CallbackQuery, orchestrator: AgentOrchestrator):
    user_id = callback.from_user.id
    intent_data = orchestrator.pending_actions.get(user_id)

    if not intent_data:
        await callback.answer("❌ Помилка: запит застарів.", show_alert=True)
        return

    await callback.message.edit_text(
        f"✅ <b>Підтверджено.</b> Виконую <code>{intent_data['intent']}</code>...",
        parse_mode="HTML"
    )

    try:
        result = await orchestrator.execute_chain(intent_data, user_id)
        await display_result(callback.message, result)
        # Cleanup
        if user_id in orchestrator.pending_actions:
            del orchestrator.pending_actions[user_id]
    except Exception as e:
        await callback.message.edit_text(f"❌ <b>Помилка виконання:</b>\n<code>{e}</code>", parse_mode="HTML")

@router.callback_query(F.data == "cancel_action")
async def handle_cancel(callback: types.CallbackQuery, orchestrator: AgentOrchestrator):
    user_id = callback.from_user.id
    if user_id in orchestrator.pending_actions:
        del orchestrator.pending_actions[user_id]

    await callback.message.edit_text("❌ <b>Дію скасовано.</b>", parse_mode="HTML")
    await callback.answer()

@router.message(F.voice)
async def handle_voice_command(message: types.Message, orchestrator: AgentOrchestrator):
    """
    Voice to Action: Gemini native audio processing.
    """
    status_msg = await message.answer("🎤 <b>Сприймаю голос...</b>", parse_mode="HTML")

    try:
        # 1. Get file info and download
        file_id = message.voice.file_id
        file = await message.bot.get_file(file_id)

        import tempfile
        import os
        with tempfile.NamedTemporaryFile(delete=False, suffix=".ogg") as tmp:
            await message.bot.download_file(file.file_path, tmp.name)
            tmp_path = tmp.name

        # 2. Process with Gemini (Speech-to-Intent)
        await status_msg.edit_text("🧠 <b>Розпізнаю намір (Gemini Pulse)...</b>", parse_mode="HTML")

        # We'll use the orchestrator's Gemini agent to transcribe and analyze
        # Assuming gemini_agent.py has a process_audio method or we can just send the text
        # For now, let's just transcribe
        prompt = "Ти — ядро Predator v25. Це голосове повідомлення від командира. Переклади його в текст (українською) та визнач намір (intent). Поверни JSON: {text: string, intent: string, reasoning: string}"

        # Use simple transcription fallback if native audio not yet in Agent
        # But actually let's assume orchestrator.gemini can handle file paths
        result_data = await orchestrator.gemini.process_audio(tmp_path, prompt)

        os.unlink(tmp_path)

        voice_text = result_data.get("text", "Не вдалося розпізнати")
        intent = result_data.get("intent", "chat")

        await status_msg.edit_text(
            f"🗣 <b>Розпізнано:</b> <i>'{voice_text}'</i>\n"
            f"🎯 <b>Намір:</b> <code>{intent}</code>\n"
            f"🔄 <i>Запускаю ланцюг...</i>",
            parse_mode="HTML"
        )

        # 3. Execute chain
        result = await orchestrator.execute_chain(result_data, message.from_user.id)
        await display_result(status_msg, result)

    except Exception as e:
        logger.error(f"Voice processing failed: {e}")
        await status_msg.edit_text(f"❌ <b>Помилка голосового вводу:</b>\n<code>{str(e)}</code>", parse_mode="HTML")
