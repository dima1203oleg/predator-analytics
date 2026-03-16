"""LexNLP Tool — витягування юридичних сутностей з тексту."""
import logging
import re
from datetime import UTC, datetime
from typing import Any

from app.tools.base import BaseTool, ToolResult, ToolStatus

logger = logging.getLogger(__name__)


class LexNLPTool(BaseTool):
    """Адаптер для LexNLP.

    LexNLP — бібліотека для витягування юридичних сутностей:
    - Дати та періоди
    - Грошові суми
    - Відсотки
    - Компанії та особи
    - Адреси
    - Умови контрактів

    GitHub: https://github.com/LexPredict/lexpredict-lexnlp
    """

    name = "lexnlp"
    description = "LexNLP — витягування юридичних сутностей з тексту"
    version = "2.3"
    categories = ["documents", "nlp", "legal"]
    supported_targets = ["text"]

    # Regex патерни для базового витягування
    PATTERNS = {
        "money_uah": r"(\d{1,3}(?:\s?\d{3})*(?:[.,]\d{2})?)\s*(?:грн|гривень|UAH|₴)",
        "money_usd": r"\$\s*(\d{1,3}(?:,?\d{3})*(?:\.\d{2})?)|(\d{1,3}(?:\s?\d{3})*(?:[.,]\d{2})?)\s*(?:USD|долар)",
        "money_eur": r"€\s*(\d{1,3}(?:,?\d{3})*(?:\.\d{2})?)|(\d{1,3}(?:\s?\d{3})*(?:[.,]\d{2})?)\s*(?:EUR|євро)",
        "percent": r"(\d{1,3}(?:[.,]\d{1,2})?)\s*%",
        "date_ua": r"(\d{1,2})[./](\d{1,2})[./](\d{2,4})",
        "date_text": r"(\d{1,2})\s+(січня|лютого|березня|квітня|травня|червня|липня|серпня|вересня|жовтня|листопада|грудня)\s+(\d{4})",
        "edrpou": r"ЄДРПОУ[:\s]*(\d{8})",
        "ipn": r"ІПН[:\s]*(\d{10})",
        "phone_ua": r"\+?38[\s\-]?\(?0\d{2}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}",
        "email": r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}",
        "contract_number": r"(?:договір|контракт|угода)[№#\s]*(\d+[-/]?\d*)",
        "court_case": r"справа\s*[№#]?\s*(\d+/\d+/\d+)",
    }

    # Ключові слова для класифікації документів
    DOC_KEYWORDS = {
        "contract": ["договір", "контракт", "угода", "сторони", "предмет договору"],
        "invoice": ["рахунок", "рахунок-фактура", "invoice", "до сплати", "оплата"],
        "court_decision": ["рішення", "суд", "позивач", "відповідач", "ухвала"],
        "declaration": ["декларація", "майно", "доходи", "активи"],
        "customs": ["митна декларація", "вантаж", "імпорт", "експорт", "HS код"],
    }

    async def is_available(self) -> bool:
        """Завжди доступний (локальна обробка)."""
        return True

    async def run(self, target: str, options: dict[str, Any] | None = None) -> ToolResult:
        """Аналіз тексту.

        Args:
            target: Текст для аналізу
            options: Додаткові опції:
                - extract_money: витягувати суми (default: True)
                - extract_dates: витягувати дати (default: True)
                - extract_entities: витягувати сутності (default: True)
                - classify_document: класифікувати документ (default: True)

        Returns:
            ToolResult з витягнутими сутностями
        """
        start_time = datetime.now(UTC)
        options = options or {}

        extract_money = options.get("extract_money", True)
        extract_dates = options.get("extract_dates", True)
        extract_entities = options.get("extract_entities", True)
        classify_document = options.get("classify_document", True)

        findings = []
        entities = {
            "money": [],
            "dates": [],
            "percentages": [],
            "companies": [],
            "phones": [],
            "emails": [],
            "identifiers": [],
            "contracts": [],
            "court_cases": [],
        }

        text = target

        # Витягуємо грошові суми
        if extract_money:
            # UAH
            for match in re.finditer(self.PATTERNS["money_uah"], text, re.IGNORECASE):
                amount = match.group(1).replace(" ", "").replace(",", ".")
                entities["money"].append({
                    "amount": float(amount),
                    "currency": "UAH",
                    "raw": match.group(0),
                })
                findings.append({
                    "type": "money",
                    "value": f"{amount} UAH",
                    "confidence": 0.9,
                    "source": "lexnlp",
                })

            # USD
            for match in re.finditer(self.PATTERNS["money_usd"], text, re.IGNORECASE):
                amount = (match.group(1) or match.group(2) or "0").replace(",", "").replace(" ", "")
                if amount:
                    entities["money"].append({
                        "amount": float(amount),
                        "currency": "USD",
                        "raw": match.group(0),
                    })

            # EUR
            for match in re.finditer(self.PATTERNS["money_eur"], text, re.IGNORECASE):
                amount = (match.group(1) or match.group(2) or "0").replace(",", "").replace(" ", "")
                if amount:
                    entities["money"].append({
                        "amount": float(amount),
                        "currency": "EUR",
                        "raw": match.group(0),
                    })

        # Витягуємо дати
        if extract_dates:
            for match in re.finditer(self.PATTERNS["date_ua"], text):
                day, month, year = match.groups()
                if len(year) == 2:
                    year = "20" + year
                entities["dates"].append({
                    "date": f"{year}-{month.zfill(2)}-{day.zfill(2)}",
                    "raw": match.group(0),
                })

            for match in re.finditer(self.PATTERNS["date_text"], text, re.IGNORECASE):
                day, month_name, year = match.groups()
                months = {
                    "січня": "01", "лютого": "02", "березня": "03", "квітня": "04",
                    "травня": "05", "червня": "06", "липня": "07", "серпня": "08",
                    "вересня": "09", "жовтня": "10", "листопада": "11", "грудня": "12",
                }
                month = months.get(month_name.lower(), "01")
                entities["dates"].append({
                    "date": f"{year}-{month}-{day.zfill(2)}",
                    "raw": match.group(0),
                })
                findings.append({
                    "type": "date",
                    "value": f"{year}-{month}-{day.zfill(2)}",
                    "confidence": 0.95,
                    "source": "lexnlp",
                })

        # Витягуємо сутності
        if extract_entities:
            # Відсотки
            for match in re.finditer(self.PATTERNS["percent"], text):
                entities["percentages"].append({
                    "value": float(match.group(1).replace(",", ".")),
                    "raw": match.group(0),
                })

            # ЄДРПОУ
            for match in re.finditer(self.PATTERNS["edrpou"], text, re.IGNORECASE):
                entities["identifiers"].append({
                    "type": "edrpou",
                    "value": match.group(1),
                })
                findings.append({
                    "type": "edrpou",
                    "value": match.group(1),
                    "confidence": 0.95,
                    "source": "lexnlp",
                })

            # ІПН
            for match in re.finditer(self.PATTERNS["ipn"], text, re.IGNORECASE):
                entities["identifiers"].append({
                    "type": "ipn",
                    "value": match.group(1),
                })

            # Телефони
            for match in re.finditer(self.PATTERNS["phone_ua"], text):
                entities["phones"].append(match.group(0))
                findings.append({
                    "type": "phone",
                    "value": match.group(0),
                    "confidence": 0.9,
                    "source": "lexnlp",
                })

            # Email
            for match in re.finditer(self.PATTERNS["email"], text, re.IGNORECASE):
                entities["emails"].append(match.group(0).lower())
                findings.append({
                    "type": "email",
                    "value": match.group(0).lower(),
                    "confidence": 0.95,
                    "source": "lexnlp",
                })

            # Номери договорів
            for match in re.finditer(self.PATTERNS["contract_number"], text, re.IGNORECASE):
                entities["contracts"].append(match.group(1))

            # Судові справи
            for match in re.finditer(self.PATTERNS["court_case"], text, re.IGNORECASE):
                entities["court_cases"].append(match.group(1))
                findings.append({
                    "type": "court_case",
                    "value": match.group(1),
                    "confidence": 0.9,
                    "source": "lexnlp",
                })

        # Класифікація документа
        doc_type = "unknown"
        doc_confidence = 0.0
        if classify_document:
            doc_type, doc_confidence = self._classify_document(text)

        duration = (datetime.now(UTC) - start_time).total_seconds()

        return ToolResult(
            tool_name=self.name,
            status=ToolStatus.SUCCESS,
            data={
                "entities": entities,
                "document_type": doc_type,
                "document_confidence": doc_confidence,
                "text_length": len(text),
                "summary": {
                    "money_mentions": len(entities["money"]),
                    "dates_found": len(entities["dates"]),
                    "identifiers_found": len(entities["identifiers"]),
                    "contacts_found": len(entities["phones"]) + len(entities["emails"]),
                },
            },
            findings=findings,
            duration_seconds=duration,
        )

    def _classify_document(self, text: str) -> tuple[str, float]:
        """Класифікація типу документа."""
        text_lower = text.lower()
        scores = {}

        for doc_type, keywords in self.DOC_KEYWORDS.items():
            score = sum(1 for kw in keywords if kw in text_lower)
            if score > 0:
                scores[doc_type] = score / len(keywords)

        if not scores:
            return "unknown", 0.0

        best_type = max(scores, key=scores.get)
        return best_type, scores[best_type]
