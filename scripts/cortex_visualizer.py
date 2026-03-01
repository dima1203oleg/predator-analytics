#!/usr/bin/env python3
from __future__ import annotations


"""
🧠 AZR CORTEX VISUALIZER v1.0
Generates a graphical schema of the usage of components and their compliance with
Constitutional Axioms (specifically Python 3.12 purity and structure).

Outputs:
- terminal: Rich tree or ASCII representation
- file: cortex_map.mmd (Mermaid Diagram)
- file: cortex_map.json (for UI dashboard)
"""

from datetime import UTC, datetime, timezone
import json
import os
from pathlib import Path
from typing import Dict, List, Optional
import uuid


# ANSI Colors
RESET = "\033[0m"
RED = "\033[31m"
GREEN = "\033[32m"
YELLOW = "\033[33m"
BLUE = "\033[34m"
MAGENTA = "\033[35m"
CYAN = "\033[36m"
BOLD = "\033[1m"

PROJECT_ROOT = Path("/Users/dima-mac/Documents/Predator_21")

class Component:
    def __init__(self, name: str, path: str, type: str, dependencies: list[str] = None):
        self.id = str(uuid.uuid4())[:8]
        self.name = name
        self.path = PROJECT_ROOT / path
        self.type = type # 'service', 'frontend', 'database', 'agent'
        self.dependencies = dependencies or []
        self.compliant = False
        self.compliance_notes = []
        self.version = "unknown"

    def check_compliance(self):
        """Checks compliance with AZR Constitution (Python 3.12, presence of configs)."""
        self.compliant = True # Assume true, prove false
        self.compliance_notes = []

        if self.type == 'service' or self.type == 'agent':
            # 1. Check Python Version
            dockerfile = self.path / "Dockerfile"
            py_version_file = self.path / ".python-version"

            found_312 = False

            if dockerfile.exists():
                with open(dockerfile) as f:
                    content = f.read()
                    if "python:3.12" in content or "python:3.12-slim" in content:
                        found_312 = True
                        self.version = "3.12"
                    elif "python:3.11" in content:
                         self.version = "3.11"
                         self.compliant = False
                         self.compliance_notes.append("Legacy Python 3.11 in Dockerfile")
                    else:
                        self.compliance_notes.append("Unknown Python version in Dockerfile")

            if py_version_file.exists():
                 with open(py_version_file) as f:
                    ver = f.read().strip()
                    if "3.12" in ver:
                        found_312 = True
                        self.version = "3.12"

            if not found_312 and (dockerfile.exists() or py_version_file.exists()):
                 # If we found files but not 3.12
                 if self.version != "3.12":
                     # Double check if we didn't confirm 3.12 yet
                     pass

            # Special case for some directories that might not have strict dockerfiles yet
            if not dockerfile.exists() and not py_version_file.exists():
                self.compliance_notes.append("No runtime definition found")
                self.compliant = False # Strict!

            # 2. Check for Constitutional Core usage (if applicable)
            # This is a heuristic: check if imports 'constitutional_core' or 'som'
            # (Skipping for now to keep it simple)

        elif self.type == 'frontend':
            # Check for generic frontend rules
            package_json = self.path / "package.json"
            if not package_json.exists():
                self.compliant = False
                self.compliance_notes.append("Missing package.json")
            else:
                self.version = "Vite/React"

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "type": self.type,
            "compliant": self.compliant,
            "version": self.version,
            "notes": self.compliance_notes,
            "dependencies": self.dependencies
        }

def analyze_system():
    print(f"{BOLD}{MAGENTA}🧠 AZR CORTEX VISUALIZER{RESET} - Scanning Neural Architecture...")

    components = [
        Component("API Gateway", "services/api_gateway", "service", ["PostgreSQL", "Redis", "Ollama"]),
        Component("Constitutional Guard", "services/constitutional_core", "service", ["Truth Ledger"]),
        Component("SOM (Sovereign Observer)", "services/constitutional_core/app/modules/som", "service", ["API Gateway", "PostgreSQL"]),
        Component("MCP DevTools", "services/mcp_devtools", "service", []),
        Component("Predator Analytics UI", "apps/predator-analytics-ui", "frontend", ["API Gateway", "SOM"]),
        Component("AZR Agent", "agents", "agent", ["predatorctl"]), # Assuming root agents dir or specific
        # Infra
        Component("PostgreSQL", "docker/postgres", "database", []), # Virtual path
        Component("Redis", "docker/redis", "database", []),
        Component("Ollama", "docker/ollama", "service", []),
        Component("Qdrant", "docker/qdrant", "database", []),
    ]

    # Perform checks
    for comp in components:
        comp.check_compliance()
        status_icon = "✅" if comp.compliant else "❌"
        ver_str = f"({comp.version})" if comp.version != "unknown" else ""
        print(f"  {status_icon} {BOLD}{comp.name:<25}{RESET} {ver_str} {RED if not comp.compliant else GREEN}{', '.join(comp.compliance_notes)}{RESET}")

    return components

def generate_mermaid(components: list[Component]):
    lines = ["graph TD"]

    # Styling
    lines.append("    classDef compliant fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#000;")
    lines.append("    classDef noncompliant fill:#fee2e2,stroke:#dc2626,stroke-width:2px,color:#000;")
    lines.append("    classDef db fill:#e0f2fe,stroke:#0284c7,stroke-width:2px,color:#000;")

    name_map = {}

    for comp in components:
        safe_name = comp.name.replace(" ", "_").replace("(", "").replace(")", "")
        name_map[comp.name] = safe_name

        # Node definition
        icon = "🛡️" if comp.compliant else "⚠️"
        if comp.type == 'database':
            lines.append(f'    {safe_name}[("{icon} {comp.name}")]')
            lines.append(f"    class {safe_name} db;")
        else:
            lines.append(f'    {safe_name}["{icon} {comp.name}<br/>v.{comp.version}"]')
            if comp.compliant:
                lines.append(f"    class {safe_name} compliant;")
            else:
                lines.append(f"    class {safe_name} noncompliant;")

    # Edges
    for comp in components:
        source = name_map[comp.name]
        for dep in comp.dependencies:
            # Only if dep explicitly exists in our list (by name)
            if dep in name_map:
                target = name_map[dep]
                lines.append(f"    {source} --> {target}")
            else:
                 # External or not explicitly tracked node
                 safe_dep = dep.replace(" ", "_")
                 lines.append(f"    {source} -.-> {safe_dep}")

    return "\n".join(lines)

def main():
    components = analyze_system()

    # Generate schema
    mermaid_code = generate_mermaid(components)

    # Output to TMP to avoid permissions issues
    OUTPUT_DIR = Path("/tmp/azr_logs")
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    dest_file = OUTPUT_DIR / "cortex_schema.mmd"
    with open(dest_file, "w") as f:
        f.write(mermaid_code)

    # Generate JSON for Dashboard
    json_data = {
        "timestamp": datetime.now(UTC).isoformat(),
        "system_status": "OPERATIONAL",
        "compliance_score": len([c for c in components if c.compliant]) / len(components),
        "nodes": [c.to_dict() for c in components]
    }

    json_file = OUTPUT_DIR / "cortex_map.json"
    with open(json_file, "w") as f:
        json.dump(json_data, f, indent=2)

    print(f"\n{BOLD}{CYAN}🔹 Graphical Schema Generated:{RESET}")
    print(f"   📂 {dest_file}")
    print(f"   📂 {json_file}")

    print(f"\n{BOLD}Mermaid Preview:{RESET}")
    print("-" * 40)
    print(mermaid_code)
    print("-" * 40)

    print(f"\n{BOLD}{GREEN}✅ Cortex Visualization Complete. Ready for Omniscience Dashboard integration.{RESET}")

if __name__ == "__main__":
    main()
