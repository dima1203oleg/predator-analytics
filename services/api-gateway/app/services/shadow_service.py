"""
Shadow Service - The Hidden Encrypted Layer
Manages AES-256 encrypted storage for sensitive intelligence.
This is the "Shadow Logic" component of Predator.
"""
import os
import json
import base64
import logging
from typing import Optional, Dict, Any, List
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

logger = logging.getLogger(__name__)

class ShadowService:
    """
    Manages the 'Shadow Layer' - an encrypted local file store.
    """
    
    def __init__(self, storage_path: str = "data/shadow_layer"):
        self.storage_path = storage_path
        self._ensure_storage()
        # Default key for demo purposes (In prod, this comes from Vault or Env)
        # We generate a key from a fixed "master password" for consistency in this demo environment.
        self.cipher = self._generate_cipher("predator_omega_protocol_2025")

    def _ensure_storage(self):
        if not os.path.exists(self.storage_path):
            os.makedirs(self.storage_path, exist_ok=True)

    def _generate_cipher(self, password: str) -> Fernet:
        """Derive a Fernet key from a password"""
        salt = b'predator_salt_v1' # In prod, random salt stored separately
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
        return Fernet(key)

    def seal_document(self, doc_id: str, content: Dict[str, Any]) -> bool:
        """Encrypt and store a document"""
        try:
            json_str = json.dumps(content)
            encrypted_data = self.cipher.encrypt(json_str.encode())
            
            file_path = os.path.join(self.storage_path, f"{doc_id}.enc")
            with open(file_path, "wb") as f:
                f.write(encrypted_data)
            
            logger.info(f"Sealed document {doc_id} into Shadow Layer")
            return True
        except Exception as e:
            logger.error(f"Failed to seal document: {e}")
            return False

    def reveal_document(self, doc_id: str) -> Optional[Dict[str, Any]]:
        """Decrypt and retrieve a document"""
        try:
            file_path = os.path.join(self.storage_path, f"{doc_id}.enc")
            if not os.path.exists(file_path):
                return None
                
            with open(file_path, "rb") as f:
                encrypted_data = f.read()
                
            decrypted_data = self.cipher.decrypt(encrypted_data)
            return json.loads(decrypted_data.decode())
            
        except Exception as e:
            logger.error(f"Failed to reveal document: {e}")
            return None

    def list_classified_docs(self) -> List[str]:
        """List available classified documents"""
        try:
            files = [f.replace(".enc", "") for f in os.listdir(self.storage_path) if f.endswith(".enc")]
            return files
        except Exception:
            return []

# Singleton
# Use absolute path relative to this file to be safe, or just utilize a data dir env var
_base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))) # ua-sources root
_shadow_path = os.path.join(_base_dir, "data", "shadow_layer")

shadow_service = ShadowService(storage_path=_shadow_path)

# Seed some dummy data for the demo
if not shadow_service.list_classified_docs():
    shadow_service.seal_document("omega_directive", {
        "title": "OMEGA Directive - Autonomous Drone Swarm",
        "clearance": "TOP SECRET",
        "content": "The OMEGA protocol authorizes autonomous engagement of digital threats. Edge nodes are permitted to counter-scan hostile IPs without human intervention.",
        "author": "The Architect"
    })
    shadow_service.seal_document("black_ledger", {
        "title": "Project Black Ledger",
        "clearance": "RESTRICTED",
        "content": "Financial anomalies detected in Sector 7 suggest a massive money laundering operation using shell companies linked to 'GrainCorp'.",
        "author": "Financial Auditor Agent"
    })
