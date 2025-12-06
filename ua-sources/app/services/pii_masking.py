import hashlib
import logging
import os
from typing import Dict, Any, List
import re

logger = logging.getLogger("service.pii_masking")

class PIIMaskingService:
    """
    Service for masking Personally Identifiable Information (PII).
    Implements automatic detection and masking of sensitive data.
    """
    
    def __init__(self):
        # PII field patterns
        self.pii_fields = {
            "edrpou": r"\d{8,10}",  # Ukrainian company ID
            "ipn": r"\d{10}",  # Individual tax number
            "phone": r"\+?\d{10,13}",
            "email": r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}",
            "passport": r"[A-Z]{2}\d{6}",
            "iban": r"UA\d{27}"
        }
        
        # Fields that should always be masked in 'safe' indices
        self.always_mask = [
            "edrpou", "ipn", "phone", "email", "passport", "iban",
            "company_name", "person_name", "address", "tax_id"
        ]
    
    def mask_document(self, document: Dict[str, Any], mode: str = "safe") -> Dict[str, Any]:
        """
        Mask PII fields in a document.
        
        Args:
            document: Document to mask
            mode: 'safe' (mask all PII) or 'restricted' (keep original)
        
        Returns:
            Masked document
        """
        if mode == "restricted":
            # No masking for restricted access
            return document
        
        masked_doc = document.copy()
        
        for field in self.always_mask:
            if field in masked_doc:
                masked_doc[field] = self._mask_value(str(masked_doc[field]), field)
        
        return masked_doc
    
    def _mask_value(self, value: str, field_type: str) -> str:
        """
        Mask a specific value based on field type.
        
        Strategies:
        - EDRPOU: Keep first 2 and last 2 digits
        - Email: Keep domain, mask username
        - Phone: Keep country code, mask rest
        - Names: Keep first letter
        """
        if not value or len(value) < 3:
            return "****"
        
        if field_type in ["edrpou", "ipn", "tax_id"]:
            # Keep first 2 and last 2 characters
            return value[:2] + "****" + value[-2:]
        
        elif field_type == "email":
            # Mask username, keep domain
            if "@" in value:
                username, domain = value.split("@", 1)
                masked_username = username[0] + "****" if len(username) > 1 else "****"
                return f"{masked_username}@{domain}"
            return "****@****.com"
        
        elif field_type == "phone":
            # Keep country code
            if value.startswith("+"):
                return value[:3] + "****" + value[-2:] if len(value) > 5 else "+****"
            return "****" + value[-2:] if len(value) > 2 else "****"
        
        elif field_type in ["company_name", "person_name"]:
            # Keep first letter of each word
            words = value.split()
            return " ".join([w[0] + "****" for w in words if w])
        
        else:
            # Generic masking
            return value[:2] + "****" if len(value) > 4 else "****"
    
    def generate_hash(self, value: str, pepper: str = "") -> str:
        """
        Generate deterministic hash for PII matching.
        Used for finding same entities across datasets without exposing PII.
        """
        salted = f"{value}{pepper}{os.getenv('PII_SALT', 'predator_salt')}"
        return hashlib.sha256(salted.encode()).hexdigest()[:16]
    
    def detect_pii_in_text(self, text: str) -> List[Dict[str, Any]]:
        """
        Detect PII patterns in free text.
        Returns list of detected PII with positions.
        """
        detections = []
        
        for field_type, pattern in self.pii_fields.items():
            matches = re.finditer(pattern, text)
            for match in matches:
                detections.append({
                    "type": field_type,
                    "value": match.group(),
                    "start": match.start(),
                    "end": match.end()
                })
        
        return detections
    
    def mask_text(self, text: str) -> str:
        """
        Mask PII in free text while preserving structure.
        """
        detections = self.detect_pii_in_text(text)
        
        # Sort by position (reverse) to avoid index shifting
        detections.sort(key=lambda x: x["start"], reverse=True)
        
        masked_text = text
        for detection in detections:
            masked_value = self._mask_value(detection["value"], detection["type"])
            masked_text = (
                masked_text[:detection["start"]] +
                masked_value +
                masked_text[detection["end"]:]
            )
        
        return masked_text


# Singleton instance
pii_masking_service = PIIMaskingService()
