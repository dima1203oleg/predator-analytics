"""XML Parser — PREDATOR Analytics v55.1 Ironclad.

Fast XML parsing for structured OSINT data using lxml or ElementTree.
"""
from typing import Any

from defusedxml import ElementTree


class XMLParser:
    @staticmethod
    def parse(xml_data: str) -> dict[str, Any]:
        """Парсинг XML рядка в словник (спрощено)."""
        try:
            root = ElementTree.fromstring(xml_data)
            return XMLParser._element_to_dict(root)
        except ElementTree.ParseError:
            return {}

    @staticmethod
    def _element_to_dict(element: ElementTree.Element) -> dict[str, Any]:
        """Рекурсивне перетворення XML елемента в словник."""
        result = {}
        for child in element:
            if len(child) > 0:
                result[child.tag] = XMLParser._element_to_dict(child)
            else:
                result[child.tag] = child.text
        return result
