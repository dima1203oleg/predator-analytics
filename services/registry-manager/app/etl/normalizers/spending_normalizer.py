"""
Spending Normalizer — PREDATOR Registry Manager
Розділ 9. Нормалізація
Перетворює сирі транзакції Spending в моделі Transaction та Company.
"""
import logging
from typing import Any, Dict

logger = logging.getLogger(__name__)

class SpendingNormalizer:
    @staticmethod
    def normalize_spending(raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Нормалізує транзакцію від Spending.gov.ua
        """
        tx_id = raw_data.get("id")
        amount = raw_data.get("amount", 0.0)
        currency = raw_data.get("currency", "UAH")
        date_str = raw_data.get("trans_date")
        purpose = raw_data.get("payment_details", "")
        
        # Payer (Платник)
        payer_edrpou = raw_data.get("payer_edrpou", "")
        payer = {
            "ueid": f"UA-EDR-{payer_edrpou}",
            "name": raw_data.get("payer_name", ""),
            "edrpou": payer_edrpou,
            "role": "payer"
        }
        
        # Receiver (Одержувач)
        receiver_edrpou = raw_data.get("recipt_edrpou", "")
        receiver = {
            "ueid": f"UA-EDR-{receiver_edrpou}",
            "name": raw_data.get("recipt_name", ""),
            "edrpou": receiver_edrpou,
            "role": "receiver"
        }

        normalized_tx = {
            "ueid": f"UA-TX-{tx_id}",
            "entity_type": "Transaction",
            "source": "spending",
            "id": tx_id,
            "amount": amount,
            "currency": currency,
            "date": date_str,
            "purpose": purpose,
            "payer": payer,
            "receiver": receiver,
            "raw_data_ref": f"minio://raw/spending/{tx_id}.json"
        }
        
        logger.debug(f"Normalized spending transaction {tx_id}")
        return normalized_tx
