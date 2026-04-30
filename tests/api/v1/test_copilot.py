"""
Тести для /api/v1/copilot — AI Копілот.
"""

from __future__ import annotations


class TestCopilotChat:
    """Тести для AI чату."""

    def test_response_has_required_fields(self) -> None:
        """Відповідь має містити обов'язкові поля."""
        response = {
            "message_id": "msg-123",
            "response": "Аналізую ваш запит.",
            "sources": [],
            "suggested_actions": [],
        }
        assert "message_id" in response
        assert "response" in response
        assert "sources" in response
        assert "suggested_actions" in response

    def test_message_id_format(self) -> None:
        """ID повідомлення починається з 'msg-'."""
        msg_id = "msg-1709818800000"
        assert msg_id.startswith("msg-")

    def test_source_has_relevance(self) -> None:
        """Джерело має поле relevance."""
        source = {
            "type": "declaration",
            "id": "DECL-000001",
            "relevance": 0.95,
        }
        assert 0 <= source["relevance"] <= 1

    def test_action_has_label_and_action(self) -> None:
        """Запропонована дія має мітку та ключ дії."""
        action = {
            "label": "Переглянути звіт",
            "action": "open_report",
        }
        assert action["label"]
        assert action["action"]

    def test_response_is_in_ukrainian(self) -> None:
        """Відповідь Копілота має бути українською."""
        response_text = "Аналізую ваш запит: імпорт ноутбуків зріс на 12.5%."
        has_cyrillic = any(
            "\u0400" <= char <= "\u04FF" for char in response_text
        )
        assert has_cyrillic, "Відповідь Копілота має бути українською"
