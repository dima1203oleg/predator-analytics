from __future__ import annotations


"""Media Processor - Audio & Video Intelligence.

Обробка мультимедійного контенту:
- Аудіо: транскрипція (Whisper), аналіз мови
- Відео: витягнення кадрів, OCR на субтитрах, транскрипція аудіо
- Автоматичне визначення мови (uk/ru/en)
- Класифікація контенту (корисний/шум)
"""

import asyncio
from datetime import UTC, datetime
import hashlib
import json
import logging
import os
from pathlib import Path
import subprocess
from typing import Any


logger = logging.getLogger("service.media_processor")


class MediaProcessor:
    """Процесор мультимедійного контенту з AI-аналізом."""

    def __init__(self):
        self.temp_dir = os.getenv("MEDIA_TEMP_DIR", "/tmp/predator_media")
        self.output_dir = os.getenv("MEDIA_OUTPUT_DIR", "/tmp/predator_transcripts")
        os.makedirs(self.temp_dir, exist_ok=True)
        os.makedirs(self.output_dir, exist_ok=True)

        # Налаштування Whisper
        self.whisper_model = os.getenv("WHISPER_MODEL", "base")
        self.default_language = os.getenv("DEFAULT_LANGUAGE", "uk")

        # Перевірка залежностей
        self._check_dependencies()

    def _check_dependencies(self):
        """Перевірка доступних інструментів."""
        self.has_whisper = False
        self.has_ffmpeg = False
        self.has_opencv = False
        self.has_groq = False

        # Whisper (OpenAI)
        try:
            import whisper

            self.has_whisper = True
            logger.info("✅ Whisper доступний для транскрипції")
        except ImportError:
            logger.warning("⚠️ whisper не встановлено - pip install openai-whisper")

        # FFmpeg
        try:
            result = subprocess.run(["ffmpeg", "-version"], capture_output=True, timeout=5)
            self.has_ffmpeg = result.returncode == 0
            if self.has_ffmpeg:
                logger.info("✅ FFmpeg доступний")
        except Exception:
            logger.warning("⚠️ FFmpeg не знайдено - brew install ffmpeg")

        # OpenCV для відео
        try:
            import cv2

            self.has_opencv = True
            logger.info("✅ OpenCV доступний для відео-аналізу")
        except ImportError:
            logger.warning("⚠️ opencv-python не встановлено")

        # Groq для швидкої транскрипції
        groq_key = os.getenv("GROQ_API_KEY")
        if groq_key:
            self.has_groq = True
            logger.info("✅ Groq API доступний для Whisper")

    async def process_audio(
        self, file_path: str, options: dict[str, Any] | None = None
    ) -> dict[str, Any]:
        """Обробка аудіо файлу з транскрипцією."""
        options = options or {}
        language = options.get("language", self.default_language)

        result = {
            "source_type": "audio",
            "file_path": file_path,
            "processed_at": datetime.now(UTC).isoformat(),
            "status": "pending",
            "transcript": None,
            "metadata": {},
        }

        try:
            # Отримання метаданих аудіо
            metadata = await self._get_audio_metadata(file_path)
            result["metadata"] = metadata

            # Транскрипція
            if self.has_groq:
                transcript = await self._transcribe_with_groq(file_path, language)
            elif self.has_whisper:
                transcript = await self._transcribe_with_whisper(file_path, language)
            else:
                result["status"] = "error"
                result["error"] = "Немає доступних транскрипторів (Whisper/Groq)"
                return result

            result["transcript"] = transcript
            result["status"] = "completed"

            # Класифікація контенту
            classification = await self._classify_content(transcript["text"])
            result["classification"] = classification

            # Збереження транскрипту
            await self._save_transcript(file_path, transcript)

        except Exception as e:
            logger.exception(f"Помилка обробки аудіо: {e}")
            result["status"] = "error"
            result["error"] = str(e)

        return result

    async def process_video(
        self, file_path: str, options: dict[str, Any] | None = None
    ) -> dict[str, Any]:
        """Обробка відео файлу."""
        options = options or {}
        extract_frames = options.get("extract_frames", True)
        frame_interval = options.get("frame_interval", 30)  # кожні N секунд

        result = {
            "source_type": "video",
            "file_path": file_path,
            "processed_at": datetime.now(UTC).isoformat(),
            "status": "pending",
            "transcript": None,
            "frames": [],
            "metadata": {},
        }

        try:
            # 1. Витягнення аудіо з відео
            audio_path = await self._extract_audio_from_video(file_path)

            if audio_path:
                # 2. Транскрипція аудіо
                audio_result = await self.process_audio(audio_path, options)
                result["transcript"] = audio_result.get("transcript")
                result["classification"] = audio_result.get("classification")

                # Видалення тимчасового аудіо
                if os.path.exists(audio_path):
                    os.unlink(audio_path)

            # 3. Витягнення ключових кадрів
            if extract_frames and self.has_opencv:
                frames = await self._extract_key_frames(file_path, frame_interval)
                result["frames"] = frames

                # 4. OCR на кадрах (для субтитрів/тексту на екрані)
                frame_texts = await self._ocr_frames(frames)
                result["frame_texts"] = frame_texts

            # 5. Метадані відео
            result["metadata"] = await self._get_video_metadata(file_path)
            result["status"] = "completed"

        except Exception as e:
            logger.exception(f"Помилка обробки відео: {e}")
            result["status"] = "error"
            result["error"] = str(e)

        return result

    async def _get_audio_metadata(self, file_path: str) -> dict[str, Any]:
        """Отримання метаданих аудіо через FFprobe."""
        if not self.has_ffmpeg:
            return {"error": "FFmpeg не доступний"}

        try:
            cmd = [
                "ffprobe",
                "-v",
                "quiet",
                "-print_format",
                "json",
                "-show_format",
                "-show_streams",
                file_path,
            ]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            data = json.loads(result.stdout)

            format_info = data.get("format", {})
            streams = data.get("streams", [])
            audio_stream = next((s for s in streams if s.get("codec_type") == "audio"), {})

            return {
                "duration": float(format_info.get("duration", 0)),
                "size": int(format_info.get("size", 0)),
                "bitrate": int(format_info.get("bit_rate", 0)),
                "format": format_info.get("format_name", ""),
                "codec": audio_stream.get("codec_name", ""),
                "sample_rate": int(audio_stream.get("sample_rate", 0)),
                "channels": int(audio_stream.get("channels", 0)),
            }
        except Exception as e:
            logger.exception(f"Помилка отримання метаданих: {e}")
            return {"error": str(e)}

    async def _get_video_metadata(self, file_path: str) -> dict[str, Any]:
        """Отримання метаданих відео."""
        if not self.has_ffmpeg:
            return {"error": "FFmpeg не доступний"}

        try:
            cmd = [
                "ffprobe",
                "-v",
                "quiet",
                "-print_format",
                "json",
                "-show_format",
                "-show_streams",
                file_path,
            ]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            data = json.loads(result.stdout)

            format_info = data.get("format", {})
            streams = data.get("streams", [])
            video_stream = next((s for s in streams if s.get("codec_type") == "video"), {})
            audio_stream = next((s for s in streams if s.get("codec_type") == "audio"), {})

            return {
                "duration": float(format_info.get("duration", 0)),
                "size": int(format_info.get("size", 0)),
                "bitrate": int(format_info.get("bit_rate", 0)),
                "format": format_info.get("format_name", ""),
                "video_codec": video_stream.get("codec_name", ""),
                "width": int(video_stream.get("width", 0)),
                "height": int(video_stream.get("height", 0)),
                "fps": eval(video_stream.get("r_frame_rate", "0/1"))
                if video_stream.get("r_frame_rate")
                else 0,
                "audio_codec": audio_stream.get("codec_name", ""),
                "has_audio": bool(audio_stream),
            }
        except Exception as e:
            logger.exception(f"Помилка отримання метаданих відео: {e}")
            return {"error": str(e)}

    async def _transcribe_with_whisper(
        self, file_path: str, language: str = "uk"
    ) -> dict[str, Any]:
        """Транскрипція через локальний Whisper."""
        import whisper

        model = whisper.load_model(self.whisper_model)

        # Запуск в thread pool (Whisper блокуючий)
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None, lambda: model.transcribe(file_path, language=language, task="transcribe")
        )

        return {
            "text": result["text"],
            "language": result.get("language", language),
            "segments": [
                {"start": seg["start"], "end": seg["end"], "text": seg["text"]}
                for seg in result.get("segments", [])
            ],
            "engine": "whisper-local",
            "model": self.whisper_model,
        }

    async def _transcribe_with_groq(self, file_path: str, language: str = "uk") -> dict[str, Any]:
        """Транскрипція через Groq Whisper API (швидше)."""
        import httpx

        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY не налаштований")

        # Перевірка розміру файлу (Groq max 25MB)
        file_size = os.path.getsize(file_path)
        if file_size > 25 * 1024 * 1024:
            logger.warning("Файл перевищує 25MB, використовуємо локальний Whisper")
            if self.has_whisper:
                return await self._transcribe_with_whisper(file_path, language)
            raise ValueError("Файл занадто великий для Groq, а локальний Whisper недоступний")

        async with httpx.AsyncClient(timeout=120) as client:
            with open(file_path, "rb") as f:
                files = {"file": (Path(file_path).name, f, "audio/mpeg")}
                data = {
                    "model": "whisper-large-v3",
                    "language": language,
                    "response_format": "verbose_json",
                }

                response = await client.post(
                    "https://api.groq.com/openai/v1/audio/transcriptions",
                    headers={"Authorization": f"Bearer {api_key}"},
                    files=files,
                    data=data,
                )
                response.raise_for_status()
                result = response.json()

        return {
            "text": result.get("text", ""),
            "language": result.get("language", language),
            "segments": [
                {
                    "start": seg.get("start", 0),
                    "end": seg.get("end", 0),
                    "text": seg.get("text", ""),
                }
                for seg in result.get("segments", [])
            ],
            "engine": "groq-whisper",
            "model": "whisper-large-v3",
            "duration": result.get("duration", 0),
        }

    async def _extract_audio_from_video(self, video_path: str) -> str | None:
        """Витягнути аудіо доріжку з відео."""
        if not self.has_ffmpeg:
            logger.error("FFmpeg не доступний для витягнення аудіо")
            return None

        output_path = os.path.join(
            self.temp_dir, f"audio_{hashlib.md5(video_path.encode()).hexdigest()[:8]}.mp3"
        )

        try:
            cmd = [
                "ffmpeg",
                "-y",
                "-i",
                video_path,
                "-vn",
                "-acodec",
                "libmp3lame",
                "-q:a",
                "2",
                output_path,
            ]
            result = subprocess.run(cmd, capture_output=True, timeout=300)

            if result.returncode == 0 and os.path.exists(output_path):
                return output_path
            logger.error(f"FFmpeg помилка: {result.stderr.decode()}")
            return None

        except Exception as e:
            logger.exception(f"Помилка витягнення аудіо: {e}")
            return None

    async def _extract_key_frames(
        self, video_path: str, interval: int = 30
    ) -> list[dict[str, Any]]:
        """Витягнення ключових кадрів з відео."""
        if not self.has_opencv:
            return []

        import cv2

        frames = []
        cap = cv2.VideoCapture(video_path)

        fps = cap.get(cv2.CAP_PROP_FPS) or 30
        int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        frame_interval = int(fps * interval)

        frame_idx = 0
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            if frame_idx % frame_interval == 0:
                timestamp = frame_idx / fps

                # Зберегти кадр
                frame_path = os.path.join(
                    self.temp_dir,
                    f"frame_{hashlib.md5(video_path.encode()).hexdigest()[:8]}_{frame_idx}.jpg",
                )
                cv2.imwrite(frame_path, frame)

                frames.append({"frame_idx": frame_idx, "timestamp": timestamp, "path": frame_path})

            frame_idx += 1

        cap.release()
        return frames

    async def _ocr_frames(self, frames: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """OCR на витягнутих кадрах."""
        try:
            from PIL import Image
            import pytesseract
        except ImportError:
            return []

        results = []
        for frame in frames:
            try:
                image = Image.open(frame["path"])
                text = pytesseract.image_to_string(image, lang="ukr+eng")

                if text.strip():
                    results.append({"timestamp": frame["timestamp"], "text": text.strip()})
            except Exception as e:
                logger.warning(f"OCR помилка для кадру: {e}")

        return results

    async def _classify_content(self, text: str) -> dict[str, Any]:
        """Класифікація контенту (корисний/шум)."""
        if not text or len(text) < 20:
            return {
                "is_valuable": False,
                "confidence": 0.9,
                "reason": "Занадто короткий текст",
                "category": "noise",
            }

        # Ключові слова для митної тематики
        customs_keywords = [
            "митни",
            "декларац",
            "імпорт",
            "експорт",
            "товар",
            "вантаж",
            "контейнер",
            "мит",
            "податок",
            "акциз",
            "розмитнен",
            "перетин",
            "кордон",
            "санкц",
            "ембарго",
            "контрабанд",
            "ліцензі",
            "сертифікат",
            "інвойс",
        ]

        business_keywords = [
            "компані",
            "фірм",
            "підприємств",
            "контракт",
            "угод",
            "постачальник",
            "покупець",
            "оплат",
            "рахунок",
            "transact",
        ]

        text_lower = text.lower()

        customs_score = sum(1 for kw in customs_keywords if kw in text_lower)
        business_score = sum(1 for kw in business_keywords if kw in text_lower)

        total_score = customs_score * 2 + business_score

        if total_score >= 3:
            return {
                "is_valuable": True,
                "confidence": min(0.5 + total_score * 0.1, 0.95),
                "reason": f"Знайдено {customs_score} митних та {business_score} бізнес-термінів",
                "category": "customs_intelligence"
                if customs_score > business_score
                else "business_intelligence",
                "keywords_found": {"customs": customs_score, "business": business_score},
            }
        if total_score >= 1:
            return {
                "is_valuable": True,
                "confidence": 0.6,
                "reason": "Потенційно релевантний контент",
                "category": "general_intelligence",
            }
        return {
            "is_valuable": False,
            "confidence": 0.7,
            "reason": "Не знайдено релевантних ключових слів",
            "category": "noise",
        }

    async def _save_transcript(self, source_path: str, transcript: dict[str, Any]) -> str:
        """Збереження транскрипту у файл."""
        file_hash = hashlib.md5(source_path.encode()).hexdigest()[:12]
        output_path = os.path.join(
            self.output_dir,
            f"transcript_{file_hash}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json",
        )

        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(
                {
                    "source": source_path,
                    "transcript": transcript,
                    "saved_at": datetime.now(UTC).isoformat(),
                },
                f,
                ensure_ascii=False,
                indent=2,
            )

        return output_path


# Singleton
_media_processor: MediaProcessor | None = None


def get_media_processor() -> MediaProcessor:
    """Get or create MediaProcessor singleton."""
    global _media_processor
    if _media_processor is None:
        _media_processor = MediaProcessor()
    return _media_processor
