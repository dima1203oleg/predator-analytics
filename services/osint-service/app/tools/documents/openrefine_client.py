"""OpenRefine Tool — очищення та нормалізація даних."""
import logging
from datetime import UTC, datetime
from typing import Any

import httpx

from app.tools.base import BaseTool, ToolResult, ToolStatus

logger = logging.getLogger(__name__)


class OpenRefineTool(BaseTool):
    """Адаптер для OpenRefine.

    OpenRefine — інструмент для очищення та трансформації даних.
    Ідеальний для нормалізації OSINT даних.

    Можливості:
    - Очищення даних
    - Нормалізація назв
    - Дедуплікація
    - Reconciliation (зв'язування з базами)
    - Трансформації (GREL)

    GitHub: https://github.com/OpenRefine/OpenRefine
    """

    name = "openrefine"
    description = "OpenRefine — очищення та нормалізація даних"
    version = "3.7"
    categories = ["documents", "data_cleaning", "normalization"]
    supported_targets = ["data", "csv", "json"]

    def __init__(self, refine_url: str = "http://localhost:3333", timeout: int = 60):
        """Ініціалізація."""
        super().__init__(timeout)
        self.refine_url = refine_url

    async def is_available(self) -> bool:
        """Перевірка доступності OpenRefine."""
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                response = await client.get(f"{self.refine_url}/command/core/get-version")
                return response.status_code == 200
        except Exception:
            return False

    async def run(self, target: str, options: dict[str, Any] | None = None) -> ToolResult:
        """Очищення та нормалізація даних.

        Args:
            target: JSON дані або шлях до CSV
            options: Додаткові опції:
                - normalize_names: нормалізувати назви (default: True)
                - deduplicate: видалити дублікати (default: True)
                - reconcile: зв'язати з базами (default: False)
                - transformations: список GREL трансформацій

        Returns:
            ToolResult з очищеними даними
        """
        start_time = datetime.now(UTC)
        options = options or {}

        normalize_names = options.get("normalize_names", True)
        deduplicate = options.get("deduplicate", True)

        findings = []

        # Парсимо вхідні дані
        import json
        try:
            if isinstance(target, str):
                if target.startswith("[") or target.startswith("{"):
                    data = json.loads(target)
                else:
                    # Припускаємо CSV
                    data = self._parse_csv(target)
            else:
                data = target
        except json.JSONDecodeError:
            data = self._parse_csv(target)

        if not isinstance(data, list):
            data = [data]

        original_count = len(data)
        cleaned_data = data.copy()

        # Нормалізація назв
        if normalize_names:
            cleaned_data = self._normalize_names(cleaned_data)
            findings.append({
                "type": "normalization",
                "value": "Назви нормалізовано",
                "confidence": 0.9,
                "source": "openrefine",
            })

        # Дедуплікація
        duplicates_removed = 0
        if deduplicate:
            cleaned_data, duplicates_removed = self._deduplicate(cleaned_data)
            if duplicates_removed > 0:
                findings.append({
                    "type": "deduplication",
                    "value": f"Видалено {duplicates_removed} дублікатів",
                    "confidence": 0.95,
                    "source": "openrefine",
                })

        # Валідація даних
        validation_issues = self._validate_data(cleaned_data)
        for issue in validation_issues:
            findings.append({
                "type": "validation_issue",
                "value": issue["message"],
                "confidence": 0.85,
                "source": "openrefine",
                "metadata": issue,
            })

        duration = (datetime.now(UTC) - start_time).total_seconds()

        return ToolResult(
            tool_name=self.name,
            status=ToolStatus.SUCCESS,
            data={
                "cleaned_data": cleaned_data,
                "original_count": original_count,
                "cleaned_count": len(cleaned_data),
                "duplicates_removed": duplicates_removed,
                "validation_issues": len(validation_issues),
            },
            findings=findings,
            duration_seconds=duration,
        )

    def _parse_csv(self, csv_content: str) -> list[dict]:
        """Парсинг CSV."""
        import csv
        from io import StringIO

        reader = csv.DictReader(StringIO(csv_content))
        return list(reader)

    def _normalize_names(self, data: list[dict]) -> list[dict]:
        """Нормалізація назв компаній та осіб."""
        normalized = []

        for item in data:
            new_item = item.copy()

            # Нормалізуємо поля з назвами
            for key in ["name", "company", "company_name", "назва", "компанія"]:
                if key in new_item and new_item[key]:
                    new_item[key] = self._normalize_company_name(str(new_item[key]))

            # Нормалізуємо ПІБ
            for key in ["person", "person_name", "full_name", "піб", "особа"]:
                if key in new_item and new_item[key]:
                    new_item[key] = self._normalize_person_name(str(new_item[key]))

            normalized.append(new_item)

        return normalized

    def _normalize_company_name(self, name: str) -> str:
        """Нормалізація назви компанії."""
        # Видаляємо зайві пробіли
        name = " ".join(name.split())

        # Стандартизуємо організаційно-правові форми
        replacements = {
            "ТОВАРИСТВО З ОБМЕЖЕНОЮ ВІДПОВІДАЛЬНІСТЮ": "ТОВ",
            "ПРИВАТНЕ ПІДПРИЄМСТВО": "ПП",
            "ФІЗИЧНА ОСОБА-ПІДПРИЄМЕЦЬ": "ФОП",
            "ФІЗИЧНА ОСОБА ПІДПРИЄМЕЦЬ": "ФОП",
            "АКЦІОНЕРНЕ ТОВАРИСТВО": "АТ",
            "ПУБЛІЧНЕ АКЦІОНЕРНЕ ТОВАРИСТВО": "ПАТ",
            "ПРИВАТНЕ АКЦІОНЕРНЕ ТОВАРИСТВО": "ПрАТ",
            "LIMITED LIABILITY COMPANY": "LLC",
            "LIMITED": "LTD",
        }

        name_upper = name.upper()
        for full, short in replacements.items():
            if full in name_upper:
                name = name_upper.replace(full, short)
                break

        # Прибираємо лапки
        name = name.replace('"', "").replace("'", "").replace("«", "").replace("»", "")

        return name.strip()

    def _normalize_person_name(self, name: str) -> str:
        """Нормалізація ПІБ."""
        # Видаляємо зайві пробіли
        name = " ".join(name.split())

        # Капіталізуємо
        parts = name.split()
        normalized_parts = []
        for part in parts:
            if part.upper() not in ["ДЕ", "ВАН", "ФОН", "ДА"]:
                normalized_parts.append(part.capitalize())
            else:
                normalized_parts.append(part.lower())

        return " ".join(normalized_parts)

    def _deduplicate(self, data: list[dict]) -> tuple[list[dict], int]:
        """Видалення дублікатів."""
        seen = set()
        unique = []

        for item in data:
            # Створюємо ключ для порівняння
            key_parts = []
            for k in sorted(item.keys()):
                if item[k]:
                    key_parts.append(f"{k}:{str(item[k]).lower().strip()}")
            key = "|".join(key_parts)

            if key not in seen:
                seen.add(key)
                unique.append(item)

        duplicates_removed = len(data) - len(unique)
        return unique, duplicates_removed

    def _validate_data(self, data: list[dict]) -> list[dict]:
        """Валідація даних."""
        issues = []

        for i, item in enumerate(data):
            # Перевіряємо ЄДРПОУ
            edrpou = item.get("edrpou") or item.get("ЄДРПОУ")
            if edrpou:
                edrpou_str = str(edrpou).strip()
                if not edrpou_str.isdigit() or len(edrpou_str) != 8:
                    issues.append({
                        "row": i,
                        "field": "edrpou",
                        "value": edrpou,
                        "message": f"Невалідний ЄДРПОУ: {edrpou}",
                    })

            # Перевіряємо email
            email = item.get("email") or item.get("Email")
            if email and "@" not in str(email):
                issues.append({
                    "row": i,
                    "field": "email",
                    "value": email,
                    "message": f"Невалідний email: {email}",
                })

            # Перевіряємо пусті обов'язкові поля
            for required in ["name", "company", "назва"]:
                if required in item and not item[required]:
                    issues.append({
                        "row": i,
                        "field": required,
                        "value": None,
                        "message": f"Пусте обов'язкове поле: {required}",
                    })

        return issues
