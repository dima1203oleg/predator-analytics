"""
Voice Handler for Telegram Bot
Підтримка голосових повідомлень через Google Cloud Speech-to-Text та Text-to-Speech
"""
import logging
import os
import io
from typing import Optional

logger = logging.getLogger("voice_handler")

class VoiceHandler:
    """Обробка голосових повідомлень (STT/TTS)"""

    def __init__(self):
        self.google_credentials = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        self.stt_client = None
        self.tts_client = None
        self._initialized = False

    async def initialize(self):
        """Ініціалізація Google Cloud клієнтів"""
        try:
            # Перевіряємо наявність credentials
            if not self.google_credentials or not os.path.exists(self.google_credentials):
                logger.warning("⚠️ Google credentials not found. Voice features disabled.")
                logger.info("Set GOOGLE_APPLICATION_CREDENTIALS env variable to enable STT/TTS")
                return False

            # Імпортуємо Google Cloud бібліотеки
            from google.cloud import speech_v1 as speech
            from google.cloud import texttospeech_v1 as texttospeech

            self.stt_client = speech.SpeechClient()
            self.tts_client = texttospeech.TextToSpeechClient()

            self._initialized = True
            logger.info("✅ Voice Handler initialized (Google Cloud STT/TTS)")
            return True

        except ImportError:
            logger.warning("⚠️ Google Cloud libraries not installed. Run: pip install google-cloud-speech google-cloud-texttospeech")
            return False
        except Exception as e:
            logger.error(f"❌ Voice Handler init failed: {e}")
            return False

    async def speech_to_text(self, audio_file_path: str, language_code: str = "uk-UA") -> Optional[str]:
        """
        Конвертує голосове повідомлення в текст

        Args:
            audio_file_path: Шлях до аудіо файлу
            language_code: Код мови (uk-UA для української, ru-RU для російської)

        Returns:
            Розпізнаний текст або None
        """
        if not self._initialized:
            return None

        try:
            from google.cloud import speech_v1 as speech

            # Читаємо аудіо файл
            with io.open(audio_file_path, "rb") as audio_file:
                content = audio_file.read()

            audio = speech.RecognitionAudio(content=content)

            # Налаштування розпізнавання
            config = speech.RecognitionConfig(
                encoding=speech.RecognitionConfig.AudioEncoding.OGG_OPUS,
                sample_rate_hertz=48000,  # Telegram voice messages
                language_code=language_code,
                enable_automatic_punctuation=True,
                model="default"
            )

            # Виконуємо розпізнавання
            response = self.stt_client.recognize(config=config, audio=audio)

            # Збираємо всі розпізнані фрагменти
            transcript = ""
            for result in response.results:
                transcript += result.alternatives[0].transcript + " "

            if transcript.strip():
                logger.info(f"🎤 STT: {transcript[:100]}...")
                return transcript.strip()
            else:
                logger.warning("⚠️ No speech detected in audio")
                return None

        except Exception as e:
            logger.error(f"STT Error: {e}")
            return None

    async def text_to_speech(self, text: str, language_code: str = "uk-UA", voice_gender: str = "NEUTRAL") -> Optional[bytes]:
        """
        Конвертує текст у голосове повідомлення

        Args:
            text: Текст для озвучення
            language_code: Код мови (uk-UA, ru-RU, en-US)
            voice_gender: Стать голосу (MALE, FEMALE, NEUTRAL)

        Returns:
            Аудіо дані у форматі OGG/OPUS або None
        """
        if not self._initialized:
            return None

        try:
            from google.cloud import texttospeech_v1 as texttospeech

            # Підготовка тексту
            synthesis_input = texttospeech.SynthesisInput(text=text)

            # Налаштування голосу
            gender_map = {
                "MALE": texttospeech.SsmlVoiceGender.MALE,
                "FEMALE": texttospeech.SsmlVoiceGender.FEMALE,
                "NEUTRAL": texttospeech.SsmlVoiceGender.NEUTRAL
            }

            # Voice name (Higher quality Neural2)
            voice_name = "uk-UA-Neural2-A" if language_code == "uk-UA" else None

            voice = texttospeech.VoiceSelectionParams(
                language_code=language_code,
                ssml_gender=gender_map.get(voice_gender.upper(), texttospeech.SsmlVoiceGender.NEUTRAL),
                name=voice_name
            )

            # Налаштування аудіо (OGG для Telegram)
            audio_config = texttospeech.AudioConfig(
                audio_encoding=texttospeech.AudioEncoding.OGG_OPUS,
                speaking_rate=1.0,  # Нормальна швидкість
                pitch=0.0  # Нормальна висота
            )

            # Генеруємо аудіо
            response = self.tts_client.synthesize_speech(
                input=synthesis_input,
                voice=voice,
                audio_config=audio_config
            )

            logger.info(f"🔊 TTS: Generated {len(response.audio_content)} bytes")
            return response.audio_content

        except Exception as e:
            logger.error(f"TTS Error: {e}")
            return None

    async def download_telegram_voice(self, bot, file_id: str, save_path: str) -> bool:
        """
        Завантажує голосове повідомлення з Telegram

        Args:
            bot: Telegram Bot instance
            file_id: ID файлу в Telegram
            save_path: Куди зберегти файл

        Returns:
            True якщо успішно
        """
        try:
            # Отримуємо інформацію про файл
            file = await bot.get_file(file_id)

            # Завантажуємо файл
            await bot.download_file(file.file_path, save_path)

            logger.info(f"📥 Downloaded voice message: {save_path}")
            return True

        except Exception as e:
            logger.error(f"Download error: {e}")
            return False

    def is_available(self) -> bool:
        """Перевіряє чи доступна функція голосових повідомлень"""
        return self._initialized


# ==================== FALLBACK: Simple TTS/STT ====================

class SimpleTTSSTT:
    """
    Простий fallback для TTS/STT без Google Cloud
    Використовує gTTS (Google Translate TTS) та SpeechRecognition
    """

    def __init__(self):
        self._initialized = False

    async def initialize(self):
        """Ініціалізація fallback бібліотек"""
        try:
            import speech_recognition as sr
            from gtts import gTTS

            self.recognizer = sr.Recognizer()
            self._initialized = True

            logger.info("✅ Simple TTS/STT initialized (offline fallback)")
            return True

        except ImportError:
            logger.warning("⚠️ Install: pip install SpeechRecognition gtts pydub")
            return False
        except Exception as e:
            logger.error(f"Simple TTS/STT init error: {e}")
            return False

    async def speech_to_text(self, audio_file_path: str, language: str = "uk") -> Optional[str]:
        """Розпізнає мову (використовує Google Speech Recognition API)"""
        if not self._initialized:
            return None

        try:
            import speech_recognition as sr

            # Конвертуємо OGG в WAV (якщо потрібно)
            wav_path = audio_file_path.replace(".ogg", ".wav")
            await self._convert_to_wav(audio_file_path, wav_path)

            # Розпізнаємо
            with sr.AudioFile(wav_path) as source:
                audio = self.recognizer.record(source)

            text = self.recognizer.recognize_google(audio, language=language)

            logger.info(f"🎤 STT (fallback): {text[:100]}...")
            return text

        except Exception as e:
            logger.error(f"STT fallback error: {e}")
            return None

    async def text_to_speech(self, text: str, language: str = "uk") -> Optional[bytes]:
        """Конвертує текст в аудіо (gTTS)"""
        if not self._initialized:
            return None

        try:
            from gtts import gTTS
            import io

            tts = gTTS(text=text, lang=language, slow=False)

            # Зберігаємо в буфер
            fp = io.BytesIO()
            tts.write_to_fp(fp)
            fp.seek(0)

            audio_data = fp.read()
            logger.info(f"🔊 TTS (fallback): Generated {len(audio_data)} bytes")

            return audio_data

        except Exception as e:
            logger.error(f"TTS fallback error: {e}")
            return None

    async def _convert_to_wav(self, input_path: str, output_path: str):
        """Конвертує аудіо в WAV формат"""
        try:
            from pydub import AudioSegment

            audio = AudioSegment.from_file(input_path)
            audio.export(output_path, format="wav")

        except Exception as e:
            logger.error(f"Audio conversion error: {e}")

    def is_available(self) -> bool:
        return self._initialized


def get_voice_handler() -> VoiceHandler:
    """Factory для отримання voice handler"""
    return VoiceHandler()
