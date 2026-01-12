"""Customs Parser - Parse customs data"""
from typing import Dict, Any, List
import logging

logger = logging.getLogger(__name__)


class CustomsParser:
    """Parser for Ukrainian customs data"""
    
    def parse_declaration(self, raw_data: Dict) -> Dict[str, Any]:
        """Parse customs declaration"""
        return {
            "declaration_number": raw_data.get("number"),
            "date": raw_data.get("date"),
            "type": raw_data.get("type"),
            "sender": raw_data.get("sender"),
            "receiver": raw_data.get("receiver"),
            "goods": raw_data.get("goods", []),
            "value": raw_data.get("value"),
            "currency": raw_data.get("currency", "USD")
        }
    
    def parse_statistics(self, raw_data: List[Dict]) -> List[Dict]:
        """Parse customs statistics"""
        return [
            {
                "hs_code": item.get("code"),
                "description": item.get("desc"),
                "quantity": item.get("qty"),
                "value": item.get("val")
            }
            for item in raw_data
        ]


customs_parser = CustomsParser()
