import logging
from typing import Dict, Any, List
import random

logger = logging.getLogger(__name__)

class PromptRegistry:
    """
    Prompt Registry (COMP-207)
    Version-controlled registry for AI prompts to ensure 
    consistency and reproducibility across services.
    """
    def __init__(self):
        self.prompts = {
            "risk_analysis": {
                "v1": "Analyze following text for business risks: {text}",
                "v2": "Context: Ukrainian market 2026. Task: Extract high-level risks from: {text}. Output: JSON."
            },
            "smb_advice": {
                "v1": "Provide business growth advice for: {data}"
            }
        }

    def get_prompt(self, name: str, version: str = "latest") -> str:
        """
        Retrieves a specific prompt by name and version.
        """
        if name not in self.prompts:
            return ""
        if version == "latest":
            return self.prompts[name][max(self.prompts[name].keys())]
        return self.prompts[name].get(version, "")

    def register_prompt(self, name: str, version: str, content: str):
        if name not in self.prompts:
            self.prompts[name] = {}
        self.prompts[name][version] = content
        return {"status": "registered", "name": name, "version": version}
