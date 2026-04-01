"""
🎤 Decision Intelligence Voice Integration

Інтеграція з Whisper AI для обробки голосових запитів
та перетворення їх в текстові команди для Decision Intelligence Engine.

Підтримувані формати:
- Голосові повідомлення Telegram
- Аудіофайли (mp3, wav, m4a)
- Прямий потік аудіо

Приклади голосових запитів:
  "Проаналізуй компанію 12345678"
  "Покажи досьє на ТОВ Приклад"
  "Дай рекомендацію для закупівлі автомобілів"
"""

import asyncio
import logging
import tempfile
from pathlib import Path
from typing import Any, Optional

import aiofiles
import whisper
from telegram import Update, Voice
from telegram.ext import ContextTypes

from app.services.decision.telegram_integration import DecisionTelegramBot

logger = logging.getLogger("predator.decision.voice")


class VoiceDecisionProcessor:
    """Обробник голосових запитів для Decision Intelligence"""
    
    def __init__(self, model_name: str = "base"):
        """
        Ініціалізація голосового процесора
        
        Args:
            model_name: Назва моделі Whisper (tiny, base, small, medium, large)
        """
        self.model_name = model_name
        self.model = None
        self.temp_dir = Path(tempfile.gettempdir()) / "decision_voice"
        self.temp_dir.mkdir(exist_ok=True)
    
    async def load_model(self):
        """Асинхронне завантаження моделі Whisper"""
        if self.model is None:
            logger.info("Завантажуємо Whisper модель: %s", self.model_name)
            # Whisper не є асинхронним, викликаємо в executor
            loop = asyncio.get_event_loop()
            self.model = await loop.run_in_executor(None, whisper.load_model, self.model_name)
            logger.info("Whisper модель завантажено")
    
    async def transcribe_voice(self, voice_file: Voice) -> Optional[str]:
        """
        Транскрибування голосового повідомлення
        
        Args:
            voice_file: Голосовий файл з Telegram
            
        Returns:
            Текст запиту або None у разі помилки
        """
        try:
            await self.load_model()
            
            # Завантажуємо голосовий файл
            file = await voice_file.get_file()
            
            # Зберігаємо тимчасово
            temp_path = self.temp_dir / f"voice_{voice_file.file_unique_id}.ogg"
            
            async with aiofiles.open(temp_path, 'wb') as f:
                await f.write(await file.download_as_bytearray())
            
            # Конвертуємо OGG в WAV (Whisper працює краще з WAV)
            wav_path = temp_path.with_suffix('.wav')
            await self._convert_to_wav(temp_path, wav_path)
            
            # Транскрибуємо
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                None, 
                self.model.transcribe, 
                str(wav_path)
            )
            
            text = result.get('text', '').strip()
            
            # Очищуємо тимчасові файли
            temp_path.unlink(missing_ok=True)
            wav_path.unlink(missing_ok=True)
            
            logger.info("Транскрибовано голос: %s", text[:50])
            return text
            
        except Exception as e:
            logger.exception("Помилка транскрибування голосу")
            return None
    
    async def _convert_to_wav(self, ogg_path: Path, wav_path: Path):
        """Конвертація OGG в WAV"""
        try:
            import subprocess
            
            # Використовуємо ffmpeg для конвертації
            cmd = [
                'ffmpeg', '-i', str(ogg_path),
                '-ar', '16000',  # Sample rate для Whisper
                '-ac', '1',      # Mono
                str(wav_path)
            ]
            
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode != 0:
                logger.error("Помилка конвертації аудіо: %s", stderr.decode())
                raise Exception("FFmpeg conversion failed")
                
        except Exception as e:
            logger.warning("FFmpeg не доступний, використовуємо OGG напряму")
            # Якщо ffmpeg недоступний, просто копіюємо файл
            import shutil
            shutil.copy2(ogg_path, wav_path)
    
    async def process_voice_command(self, text: str, bot: DecisionTelegramBot, 
                                   update: Update, context: ContextTypes.DEFAULT_TYPE):
        """
        Обробка текстової команди з голосового запиту
        
        Args:
            text: Транскрибований текст
            bot: Інстанс Telegram бота
            update: Telegram Update
            context: Telegram Context
        """
        text_lower = text.lower()
        
        # Аналізуємо команду та вилучаємо параметри
        command, params = self._parse_voice_command(text_lower)
        
        if command == "quick_score" and params:
            context.args = params
            await bot.quick_score_command(update, context)
        elif command == "counterparty" and params:
            context.args = params
            await bot.counterparty_command(update, context)
        elif command == "recommend" and len(params) >= 2:
            context.args = params
            await bot.recommend_command(update, context)
        elif command == "batch" and params:
            context.args = params
            await bot.batch_analyze_command(update, context)
        else:
            await update.message.reply_text(
                f"🎤 **Розпізнано:** \"{text}\"\n\n"
                f"🤖 Не вдалося розпізнати команду. Спробуйте:\n"
                f"• \"Проаналізуй компанію 12345678\"\n"
                f"• \"Покажи досьє на ТОВ Приклад\"\n"
                f"• \"Дай рекомендацію для 12345678 87032310\""
            )
    
    def _parse_voice_command(self, text: str) -> tuple[str, list[str]]:
        """
        Парсинг голосової команди
        
        Args:
            text: Текст з голосового повідомлення
            
        Returns:
            (команда, параметри)
        """
        # Регулярні вирази для розпізнавання команд
        import re
        
        patterns = [
            # Аналіз компанії
            (r"(?:проаналізуй|перевір|аналіз|ризик).*?(\d{8})", 
             "quick_score", lambda m: [m.group(1)]),
            
            # Досьє контрагента  
            (r"(?:досьє|контрагент|компанія).*?(\d{8})",
             "counterparty", lambda m: [m.group(1)]),
             
            # Досьє за назвою
            (r"(?:досьє|контрагент).*?([а-яа-яёїі\s]+)",
             "counterparty", lambda m: [m.group(1).strip()]),
            
            # Рекомендація
            (r"(?:рекомендація|порада|порадь|рекомендуй).*?(\d{8}).*?(\d{8})",
             "recommend", lambda m: [m.group(1), m.group(2)]),
            
            # Масовий аналіз
            (r"(?:масовий|бatch).*?(\d{8}(?:[,\s]+\d{8})*)",
             "batch", lambda m: [m.group(1).replace(' ', ',)]),
        ]
        
        for pattern, command, params_func in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    params = params_func(match)
                    return command, params
                except Exception:
                    continue
        
        return "unknown", []


class VoiceTelegramBot(DecisionTelegramBot):
    """Розширений Telegram бот з підтримкою голосових повідомлень"""
    
    def __init__(self, token: str, admin_id: int, voice_processor: VoiceDecisionProcessor):
        super().__init__(token, admin_id)
        self.voice_processor = voice_processor
    
    async def start(self):
        """Запуск з підтримкою голосових повідомлень"""
        await super().start()
        
        # Додати handlers для голосових повідомлень
        self.application.add_handler(MessageHandler(filters.VOICE, self.handle_voice))
        self.application.add_handler(MessageHandler(filters.AUDIO, self.handle_audio))
        
        logger.info("Voice Decision Intelligence Bot запущено")
    
    async def handle_voice(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Обробка голосових повідомлень"""
        if not self._check_admin(update):
            return
        
        voice = update.message.voice
        await update.message.reply_text("🎤 Обробляю голосове повідомлення...")
        
        # Транскрибуємо голос
        text = await self.voice_processor.transcribe_voice(voice)
        
        if not text:
            await update.message.reply_text(
                "❌ Не вдалося розпізнати мову. Спробуйте ще раз."
            )
            return
        
        await update.message.reply_text(f"🎤 **Розпізнано:** \"{text}\"")
        
        # Обробляємо команду
        await self.voice_processor.process_voice_command(text, self, update, context)
    
    async def handle_audio(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Обробка аудіофайлів"""
        if not self._check_admin(update):
            return
        
        audio = update.message.audio
        await update.message.reply_text("🎵 Обробляю аудіофайл...")
        
        # Створюємо тимчасовий Voice об'єкт для обробки
        class TempVoice:
            def __init__(self, audio_file):
                self.file_id = audio_file.file_id
                self.file_unique_id = audio_file.file_unique_id
                self.duration = audio_file.duration or 0
                self.mime_type = audio_file.mime_type
                self.file_size = audio_file.file_size
            
            async def get_file(self):
                return await audio_file.get_file()
        
        temp_voice = TempVoice(audio)
        
        # Транскрибуємо
        text = await self.voice_processor.transcribe_voice(temp_voice)
        
        if not text:
            await update.message.reply_text(
                "❌ Не вдалося розпізнати мову в аудіофайлі."
            )
            return
        
        await update.message.reply_text(f"🎵 **Розпізнано:** \"{text}\"")
        
        # Обробляємо команду
        await self.voice_processor.process_voice_command(text, self, update, context)


# Фабричні функції
async def create_voice_decision_bot(token: str, admin_id: int, 
                                   model_name: str = "base") -> VoiceTelegramBot:
    """
    Створення Telegram бота з підтримкою голосу
    
    Args:
        token: Telegram bot token
        admin_id: Admin user ID
        model_name: Whisper model name
        
    Returns:
        VoiceTelegramBot інстанс
    """
    voice_processor = VoiceDecisionProcessor(model_name=model_name)
    bot = VoiceTelegramBot(token, admin_id, voice_processor)
    await bot.start()
    return bot


# Приклади використання
async def example_voice_usage():
    """Приклад використання голосової інтеграції"""
    
    # Створення бота з голосовою підтримкою
    bot = await create_voice_decision_bot(
        token="YOUR_BOT_TOKEN",
        admin_id=123456789,
        model_name="base"  # або "small" для кращої якості
    )
    
    # Користувач може надіслати голосове повідомлення:
    # "Проаналізуй компанію 12345678"
    # "Покажи досьє на ТОВ Приклад" 
    # "Дай рекомендацію для закупівлі автомобілів"
    
    # Бот автоматично транскрибує та виконає відповідну команду
    
    print("Voice Decision Bot готовий до використання!")


if __name__ == "__main__":
    asyncio.run(example_voice_usage())
