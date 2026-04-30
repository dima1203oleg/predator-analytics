from __future__ import annotations

import logging
import os
from typing import Any

import yaml

logger = logging.getLogger("core.linter")


class ConstitutionalLinter:
    """Constitutional Linter (v45.0).
    Checks Axiom YAML files for structural integrity and logical conflicts.
    """

    def __init__(self, laws_dir: str):
        self.laws_dir = laws_dir
        self.required_fields = ["id", "description", "constraints"]

    def lint_file(self, filename: str) -> dict[str, Any]:
        path = os.path.join(self.laws_dir, filename)
        issues = []

        try:
            with open(path) as f:
                data = yaml.safe_load(f)

            if not data:
                return {"file": filename, "status": "FAIL", "issues": ["Empty or invalid YAML"]}

            # 1. Structural Check
            for field in self.required_fields:
                if field not in data:
                    issues.append(f"Missing required field: {field}")

            # 2. Logic Check (Axiom CRC/VPC references)
            if "constraints" in data:
                constraints = data["constraints"]
                if not isinstance(constraints, list):
                    issues.append("Field 'constraints' must be a list")

            # 3. Conflict Detection (Mock)
            # e.g., an axiom that allows preemptive lethal action in emergency
            if data.get("id") == "axiom_preemptive" and "emergency" in str(data).lower():
                issues.append(
                    "CONFLICT: Preemptive lethal action is forbidden by v45.0 Red-Team Policy."
                )

            status = "PASS" if not issues else "FAIL"
            return {"file": filename, "status": status, "issues": issues}

        except Exception as e:
            return {"file": filename, "status": "ERROR", "issues": [str(e)]}

    def lint_all(self) -> list[dict[str, Any]]:
        results = []
        if not os.path.exists(self.laws_dir):
            return results
        for filename in os.listdir(self.laws_dir):
            if filename.endswith(".yaml") and not filename.startswith("._"):
                results.append(self.lint_file(filename))
        return results


def get_linter(laws_dir: str) -> ConstitutionalLinter:
    return ConstitutionalLinter(laws_dir)
