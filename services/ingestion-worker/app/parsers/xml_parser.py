"""
XML Parser — PREDATOR Analytics v55.1 Ironclad.

Fast XML parsing for structured OSINT data using lxml or ElementTree.
"""
import xml.etree.ElementTree as ET
from typing import List, Dict, Any, Optional

class XMLParser:
    @staticmethod
    def parse_string(xml_data: str) -> Optional[Dict[str, Any]]:
        """Парсинг XML рядка в словник (спрощено)."""
        try:
            root = ET.fromstring(xml_data)
            return XMLParser._element_to_dict(root)
        except ET.ParseError:
            return None

    @staticmethod
    def _element_to_dict(element: ET.Element) -> Dict[str, Any]:
        """Рекурсивне перетворення XML елемента в словник."""
        result = {}
        for child in element:
            if len(child) > 0:
                result[child.tag] = XMLParser._element_to_dict(child)
            else:
                result[child.tag] = child.text
        return result
