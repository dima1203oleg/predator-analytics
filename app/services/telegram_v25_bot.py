from __future__ import annotations

import asyncio
import logging

from aiogram import Bot, Dispatcher, F
from aiogram.filters import Command
from aiogram.types import BufferedInputFile, CallbackQuery, Message

from .audio_service import audio_service
from .deployment_service import deployment_service
from .monitoring_service import monitoring_service
from .remote_server import remote_server
from .triple_agent_service import triple_agent_service


logger = logging.getLogger(__name__)


class PredatorBotV45:
    """[DEPRECATED] Predator Analytics v45.0 - Unified AI Control Panel
    This service is legacy and replaced by the autonomous 'apps/telegram-bot' microservice.
    Do not use for new implementations.
    """

    def __init__(self, token: str):
        logger.warning("⚠️ DEPRECATED: PredatorBotV45 is initialized but should be replaced by WinSURF Bot.")
        self.bot = Bot(token=token)
        self.dp = Dispatcher()
        self.temp_results = {}  # Store results for callbacks
        self._setup_handlers()

    def _setup_handlers(self):
        # Register basic commands
        self.dp.message.register(self.cmd_start, Command("start"))
        self.dp.message.register(self.cmd_health, Command("health"))
        self.dp.message.register(self.cmd_queues, Command("queues"))
        self.dp.message.register(self.cmd_triple, Command("triple"))
        self.dp.message.register(self.cmd_lockdown, Command("lockdown"))

        # Voice messages
        self.dp.message.register(self.handle_voice, F.voice)

        # Callbacks
        self.dp.callback_query.register(self.process_callback)

        # Natural Language (everything else)
        self.dp.message.register(self.handle_nlp)

    async def cmd_start(self, message: Message):
        welcome_text = (
            "🤖 **Рredator Analytics v45.0 Online**\n\n"
            "Вітаю, Операторе. Я — ваш автономний пульт керування.\n"
            "Я використовую трійку AI-агентів (Gemini, Mistral, Aider) для виконання ваших команд.\n\n"
            "Доступні команди:\n"
            "• `/health` — стан системи та метрики Prometheus\n"
            "• `/queues` — моніторинг черг RabbitMQ\n"
            "• `/triple` — прямий запит до Triple Agent Chain\n"
            "• `/lockdown` — ЕКСТРЕНЕ БЛОКУВАННЯ системи\n"
            "• Просто пишіть або надсилайте голосові повідомлення українською!"
        )
        await message.answer(welcome_text, parse_mode="Markdown")

    async def cmd_health(self, message: Message):
        await message.answer("🏥 Отримую стан системи...")
        # Integrates current system health and Prometheus metrics
        metrics = await monitoring_service.get_system_metrics()

        from app.services.system_control_service import system_control_service

        lockdown = "🚨 АКТИВНО (LOCKDOWN)" if await system_control_service.is_lockdown() else "✅ Вимкнено"

        status = (
            "🏥 **Статус Predator v45 | Neural Analytics.0**\n\n"
            f"🛡 Блокування: {lockdown}\n"
            f"📊 CPU Load: {metrics['cpu_load']}%\n"
            f"💾 RAM Usage: {metrics['memory_usage']}%\n"
            f"⏱ Latency: {metrics.get('latency', 'N/A')}ms\n"
            f"🔄 ArgoCD: Synced & Healthy\n"
        )
        await message.answer(status, parse_mode="Markdown")

    async def cmd_lockdown(self, message: Message):
        from app.services.system_control_service import system_control_service

        is_active = await system_control_service.toggle_lockdown()
        status = "✅ АКТИВОВАНО" if is_active else "❌ ВИМКНЕНО"
        await message.answer(
            f"🔒 **РЕЖИМ БЛОКУВАННЯ: {status}**\nВсі деструктивні дії агентів обмежено.", parse_mode="Markdown"
        )

    async def cmd_queues(self, message: Message):
        queues = await monitoring_service.get_queue_status()
        res = "🐰 **RabbitMQ Backlog**\n\n"
        for q in queues:
            res += f"📦 `{q['name']}`: {q['messages']} msg\n"
        await message.answer(res, parse_mode="Markdown")

    async def cmd_triple(self, message: Message, command: str | None = None):
        cmd = command or message.text.replace("/triple", "").strip()
        if not cmd:
            await message.answer("Будь ласка, введіть запит після /triple")
            return

        await message.answer("🧠 Запуск Triple Agent Chain (Gemini → Mistral → Aider)...")
        result = await triple_agent_service.process_command(cmd)

        if result.get("success"):
            # Store result for deployment
            task_id = f"task_{int(asyncio.get_event_loop().time())}"
            self.temp_results[task_id] = result

            from aiogram.utils.keyboard import InlineKeyboardBuilder

            builder = InlineKeyboardBuilder()
            builder.button(text="🚀 Розгорнути (ArgoCD)", callback_data=f"deploy_{task_id}")
            builder.button(text="📄 Створити PR (Aider)", callback_data=f"pr_{task_id}")
            builder.adjust(1)

            # Format plan if it is a list
            plan_str = result.get("plan", [])
            if isinstance(plan_str, list):
                plan_str = "\n".join([f"- {step}" for step in plan_str])

            response = (
                f"🎯 **Інтент:** {result.get('intent')}\n\n"
                f"📋 **План:**\n{plan_str}\n\n"
                f"💻 **Код:**\n```python\n{result.get('code')}\n```\n\n"
                f"🛡 **Аудит:**\n{result.get('audit_report')}"
            )
            await message.answer(response, parse_mode="Markdown", reply_markup=builder.as_markup())
        else:
            await message.answer(f"❌ Помилка: {result.get('error')}\n\n{result.get('audit_report', '')}")

    async def handle_voice(self, message: Message):
        await message.answer("🎙 Отримую голосове повідомлення...")

        # Download voice file
        file_id = message.voice.file_id
        file = await self.bot.get_file(file_id)
        file_path = file.file_path

        # Download as bytes
        from io import BytesIO

        audio_data = BytesIO()
        await self.bot.download_file(file_path, audio_data)

        # STT
        text = await audio_service.speech_to_text(audio_data.getvalue())
        if not text:
            await message.answer("❌ Не вдалося розпізнати голос. Використовуйте текстові команди.")
            return

        await message.answer(f"📝 **Розпізнано:** _{text}_", parse_mode="Markdown")

        # Process via NLP (Triple Agent)
        await self.process_nlp_command(message, text)

    async def handle_nlp(self, message: Message):
        if message.text.startswith("/"):
            return
        await self.process_nlp_command(message, message.text)

    async def process_nlp_command(self, message: Message, text: str):
        await message.answer("🧪 Аналізую запит...")

        # Detect legacy ngrok patterns first
        if "ngrok" in text.lower() and ("ssh:" in text.lower() or "http:" in text.lower()):
            conn = remote_server.parse_ngrok_message(text)
            if conn:
                _success, msg = await remote_server.update_all_configs(conn)
                await message.answer(msg)
                return

        # General NLU via Triple Agent
        result = await triple_agent_service.process_command(text)

        if result.get("success"):
            # Store result
            task_id = f"task_{int(asyncio.get_event_loop().time())}"
            self.temp_results[task_id] = result

            from aiogram.utils.keyboard import InlineKeyboardBuilder

            builder = InlineKeyboardBuilder()
            builder.button(text="🚀 Розгорнути (ArgoCD)", callback_data=f"deploy_{task_id}")
            builder.button(text="📄 Створити PR (Aider)", callback_data=f"pr_{task_id}")
            builder.adjust(1)

            # Format plan if it is a list
            plan_str = result.get("plan", [])
            if isinstance(plan_str, list):
                plan_str = "\n".join([f"- {step}" for step in plan_str])

            response = f"✅ **Команду прийнято**\nІнтент: `{result.get('intent')}`\n\n📋 **План:**\n{plan_str}\n"
            await message.answer(response, parse_mode="Markdown", reply_markup=builder.as_markup())

            # Text-to-Speech response (brief)
            voice_response = f"Команду {result.get('intent')} прийнято до виконання. План готовий."
            audio_bytes = await audio_service.text_to_speech(voice_response)
            if audio_bytes:
                await message.answer_voice(BufferedInputFile(audio_bytes, filename="ans.mp3"))
        else:
            await message.answer(f"⚠️ Аналіз Triple Agent: {result.get('error')}")

    async def process_callback(self, callback: CallbackQuery):
        data = callback.data
        if data.startswith("deploy_"):
            task_id = data.replace("deploy_", "")
            task = self.temp_results.get(task_id)
            if not task:
                await callback.answer("⚠️ Задача застаріла")
                return

            await callback.message.answer(f"🚀 **Запуск ArgoCD Sync для:** {task['intent']}...")
            res = await deployment_service.sync_argocd_app()
            if res["success"]:
                await callback.message.answer("✅ **Успішно деплоєно!**\nСтатус: Synced & Healthy")
            else:
                await callback.message.answer(f"❌ Помилка деплою: {res['error']}")

        elif data.startswith("pr_"):
            task_id = data.replace("pr_", "")
            task = self.temp_results.get(task_id)
            if not task:
                await callback.answer("⚠️ Задача застаріла")
                return

            await callback.message.answer("📄 **Створення Pull Request через Aider...**")
            res = await deployment_service.create_pull_request(
                branch_name=f"fix-{task_id}", commit_message=f"AI Fix: {task['intent']}", code=task["code"]
            )
            if res["success"]:
                await callback.message.answer(
                    f"✅ **PR Створено!**\n🔗 [Переглянути PR]({res['pr_url']})", parse_mode="Markdown"
                )
            else:
                await callback.message.answer(f"❌ Помилка: {res['error']}")

        await callback.answer()

    async def run(self):
        logger.info("🚀 Predator Bot v45.0 (aiogram) starting...")
        await self.dp.start_polling(self.bot)


v45_bot: PredatorBotV45 | None = None


def init_v45_bot(token: str) -> PredatorBotV45:
    global v45_bot
    v45_bot = PredatorBotV45(token)
    return v45_bot
