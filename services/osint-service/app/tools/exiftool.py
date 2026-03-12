"""ExifTool Adapter — аналіз метаданих файлів."""
import json
from datetime import datetime
from typing import Any

from .base import BaseTool, ToolResult, ToolStatus


class ExifToolTool(BaseTool):
    """Адаптер для ExifTool.

    ExifTool — потужний інструмент для читання метаданих з:
    - Фото (JPEG, PNG, TIFF, RAW)
    - Відео (MP4, MOV, AVI)
    - Документів (PDF, DOCX, XLSX)
    - Аудіо (MP3, WAV, FLAC)

    GitHub: https://github.com/exiftool/exiftool
    """

    name = "exiftool"
    description = "ExifTool — аналіз метаданих файлів"
    version = "12.0"
    categories = ["file", "metadata", "geoint"]
    supported_targets = ["file"]

    async def is_available(self) -> bool:
        """Перевірка чи exiftool встановлено."""
        return await self._check_command_exists("exiftool")

    async def run(self, target: str, options: dict[str, Any] | None = None) -> ToolResult:
        """Запуск ExifTool для аналізу файлу.

        Args:
            target: Шлях до файлу
            options: Додаткові опції:
                - extract_gps: витягувати GPS координати (default: True)
                - extract_all: витягувати всі метадані (default: True)

        Returns:
            ToolResult з метаданими файлу
        """
        start_time = datetime.utcnow()
        options = options or {}

        if not await self.is_available():
            return ToolResult(
                tool_name=self.name,
                status=ToolStatus.NOT_INSTALLED,
                errors=["ExifTool не встановлено. Встановіть: brew install exiftool"],
            )

        # Формуємо команду
        cmd = ["exiftool", "-json", "-n", target]

        if options.get("extract_all", True):
            cmd.insert(2, "-all")

        # Запускаємо
        stdout, stderr, return_code = await self._run_subprocess(cmd)

        duration = (datetime.utcnow() - start_time).total_seconds()

        if return_code != 0:
            return ToolResult(
                tool_name=self.name,
                status=ToolStatus.FAILED,
                errors=[stderr or f"ExifTool завершився з кодом {return_code}"],
                duration_seconds=duration,
            )

        # Парсимо JSON
        try:
            results = json.loads(stdout)
            if not results:
                return ToolResult(
                    tool_name=self.name,
                    status=ToolStatus.PARTIAL,
                    data={"file": target, "metadata": {}},
                    duration_seconds=duration,
                )

            metadata = results[0]

        except json.JSONDecodeError as e:
            return ToolResult(
                tool_name=self.name,
                status=ToolStatus.FAILED,
                errors=[f"Помилка парсингу JSON: {e}"],
                duration_seconds=duration,
            )

        # Витягуємо ключові дані
        findings = []

        # GPS координати
        gps_lat = metadata.get("GPSLatitude")
        gps_lon = metadata.get("GPSLongitude")
        geolocation = None

        if gps_lat is not None and gps_lon is not None:
            geolocation = {
                "latitude": float(gps_lat),
                "longitude": float(gps_lon),
                "altitude": metadata.get("GPSAltitude"),
            }
            findings.append({
                "type": "geolocation",
                "value": f"{gps_lat}, {gps_lon}",
                "confidence": 0.95,
                "source": "exiftool",
                "metadata": geolocation,
            })

        # Автор
        author = (
            metadata.get("Author") or
            metadata.get("Creator") or
            metadata.get("Artist") or
            metadata.get("XPAuthor")
        )
        if author:
            findings.append({
                "type": "author",
                "value": author,
                "confidence": 0.9,
                "source": "exiftool",
            })

        # Софт
        software = (
            metadata.get("Software") or
            metadata.get("CreatorTool") or
            metadata.get("Producer")
        )

        # Дати
        creation_date = (
            metadata.get("CreateDate") or
            metadata.get("DateTimeOriginal") or
            metadata.get("CreationDate")
        )
        modification_date = (
            metadata.get("ModifyDate") or
            metadata.get("FileModifyDate")
        )

        # Камера/пристрій
        device = metadata.get("Model") or metadata.get("CameraModelName")
        make = metadata.get("Make")

        if device:
            findings.append({
                "type": "device",
                "value": f"{make} {device}" if make else device,
                "confidence": 0.9,
                "source": "exiftool",
            })

        return ToolResult(
            tool_name=self.name,
            status=ToolStatus.SUCCESS,
            data={
                "file": target,
                "file_type": metadata.get("FileType"),
                "file_size": metadata.get("FileSize"),
                "mime_type": metadata.get("MIMEType"),
                "metadata": metadata,
                "geolocation": geolocation,
                "author": author,
                "software": software,
                "device": device,
                "make": make,
                "creation_date": creation_date,
                "modification_date": modification_date,
            },
            findings=findings,
            duration_seconds=duration,
        )
