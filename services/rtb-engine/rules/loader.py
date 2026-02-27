
"""
Module: loader
Component: rtb-engine
Predator Analytics v45.1
"""
import yaml
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class RuleLoader:
    """Loads and parses RTB YAML rules."""
    
    def __init__(self, rules_path: str):
        self.rules_path = rules_path
        self._rules: List[Dict[str, Any]] = []
        self._version: str = "1.0"

    def load_rules(self) -> None:
        try:
            with open(self.rules_path, 'r') as f:
                data = yaml.safe_load(f)
                self._version = data.get("version", "1.0")
                self._rules = data.get("rules", [])
                logger.info(f"Loaded {len(self._rules)} rules from {self.rules_path} (Ver: {self._version})")
        except Exception as e:
            logger.error(f"Failed to load rules: {e}")
            raise

    def get_rules_for_event(self, event_type: str) -> List[Dict[str, Any]]:
        return [r for r in self._rules if r['trigger'] == event_type]
