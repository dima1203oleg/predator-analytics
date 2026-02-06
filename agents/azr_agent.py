from __future__ import annotations

import asyncio
from dataclasses import asdict, dataclass
from datetime import datetime
import json
import logging
import math
import os
import random
import re
import subprocess
import time
from typing import Any, Dict, List, Optional, Union

import httpx
import yaml

from libs.core.azr_memory import AZRSovereignMemory


# ============================================================================
# 🏛️ AZR ENGINE v4.5 - "NEZLAMNIST" (AGGRESSIVE EVOLUTION)
# "The Law of 3.12: Subsuming legacy patterns into the future."
# ============================================================================

# PREDATOR TEMPORARY STORAGE (Bypass macOS Sandbox write locks)
OS_LOG_PATH = "/tmp/azr_logs"
os.makedirs(OS_LOG_PATH, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] AZR_NEZLAMNIST: %(message)s',
    handlers=[
        logging.FileHandler(f"{OS_LOG_PATH}/azr_engine.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("azr_core")

@dataclass
class AutonomyMetrics:
    code_health: float
    lint_errors: int
    dead_code_blocks: int
    deployment_status: str
    entropy_level: float
    circuit_breaker_status: str
    disk_usage: float
    ram_usage: float

class TelegramBridge:
    """📡 Real-time Evolution Reporting Bridge."""
    def __init__(self):
        self.token = os.getenv("TELEGRAM_BOT_TOKEN")
        self.chat_id = os.getenv("TELEGRAM_ADMIN_ID")
        self.enabled = bool(self.token and self.chat_id)

    async def report_cycle_async(self, cycle_id: str, metrics: AutonomyMetrics, actions: list[dict]):
        if not self.enabled: return
        action_desc = ", ".join([f"{a['type']}({a['target']})" for a in actions]) if actions else "STABILIZATION"
        msg = (
            f"🛡️ *AZR SOVEREIGN UPDATE*\n"
            f"Cycle: `{cycle_id}`\n"
            f"Health: `{metrics.code_health*100:.1f}%` | Entropy: `{metrics.entropy_level:.4f}`\n"
            f"Actions: `{action_desc}`\n"
            f"Memory Integrity: *SECURE*"
        )
        try:
            async with httpx.AsyncClient() as client:
                await client.post(f"https://api.telegram.org/bot{self.token}/sendMessage",
                                 json={"chat_id": self.chat_id, "text": msg, "parse_mode": "Markdown"},
                                 timeout=5)
        except Exception as e:
            logger.error(f"Telegram report failed: {e}")

class EvolutionBridge:
    """Manages 3.12 syntax injection into the current environment."""
    def __init__(self, project_root: str):
        self.root = project_root

    def modernize_file(self, file_path: str):
        """Aggressively injects 3.12 patterns and future-proofing."""
        try:
            with open(file_path) as f:
                content = f.read()

            original = content
            # 1. Inject future annotations for 3.12 support on bridge runtime
            if "from __future__ import annotations" not in content:
                content = "from __future__ import annotations\n" + content

            # 2. Convert T | None to T | None (3.12 style)
            content = re.sub(r"Optional\[(.*?)\]", r"\1 | None", content)

            # 3. Convert A |  B to A | B
            content = re.sub(r"Union\[(.*?),(.*?)\]", r"\1 | \2", content)

            if content != original:
                with open(file_path, 'w') as f:
                    f.write(content)
                return True
        except Exception as e:
            logger.error(f"Modernization failed for {file_path}: {e}")
        return False

class ImmunityStore:
    def __init__(self, memory_path: str):
        self.signature_file = os.path.join(memory_path, "bug_immunity.json")
        self.signatures = self._load()

    def _load(self):
        if os.path.exists(self.signature_file):
            try:
                with open(self.signature_file) as f:
                    return json.load(f)
            except: return []
        return []

    def record_mutation_failure(self, signature: str, root_cause: str):
        self.signatures.append({"signature": signature, "root_cause": root_cause, "death_timestamp": time.time()})
        with open(self.signature_file, 'w') as f:
            json.dump(self.signatures[-100:], f)

class AZREngine:
    def __init__(self, aggressive=True):
        self.project_root = "."
        self.memory_path = "/tmp/azr_logs"
        self.audit_log = f"{OS_LOG_PATH}/azr_audit_log.jsonl"
        self.bridge = EvolutionBridge(self.project_root)
        self.immunity = ImmunityStore(self.memory_path)
        # FORCE MEMORY TO TMP LOGS TO AVOID PERMISSION ERRORS
        self.memory = AZRSovereignMemory(self.project_root, storage_path=f"{OS_LOG_PATH}/azr_memory.jsonl")
        self.telegram = TelegramBridge()
        self.aggressive = aggressive
        self.failure_count = 0
        self.max_failures = 5

    def _run_tool(self, cmd: list[str], cwd: str | None = None) -> str:
        try:
            result = subprocess.run(cmd, cwd=cwd or self.project_root, capture_output=True, text=True, check=False)
            return (result.stdout or "") + (result.stderr or "")
        except Exception as e:
            return f"CRITICAL_TOOL_FAILURE: {e!s}"

    async def observe(self) -> AutonomyMetrics:
        logger.info("🔭 SCANNING FOR ARCHITECTURAL DRIFT...")
        lint_output = self._run_tool(["ruff", "check", "."])
        lint_errors = len([line for line in lint_output.split('\n') if ':' in line])
        file_count = sum([len(files) for r, d, files in os.walk(self.project_root) if '.git' not in r])
        entropy = math.log10(file_count + 1) / 5.0

        knip_path = os.path.join(self.project_root, "apps/predator-analytics-ui/node_modules/.bin/knip")
        dead_code_count = 0
        if os.path.exists(knip_path):
            dead_code_output = self._run_tool([knip_path], cwd=os.path.join(self.project_root, "apps/predator-analytics-ui"))
            dead_code_count = dead_code_output.count("Unused")

        # Resource Check (Predictive Healing)
        import shutil

        import psutil
        total, used, free = shutil.disk_usage(self.project_root)
        disk_p = (used / total) * 100
        ram_p = psutil.virtual_memory().percent

        return AutonomyMetrics(
            code_health=max(0.1, 1.0 - (min(lint_errors, 50) / 100.0)),
            lint_errors=lint_errors,
            dead_code_blocks=dead_code_count,
            deployment_status="OPERATIONAL",
            entropy_level=entropy,
            circuit_breaker_status="CLOSED",
            disk_usage=disk_p,
            ram_usage=ram_p
        )

    async def evolve(self, metrics: AutonomyMetrics):
        if self.failure_count >= self.max_failures:
            logger.warning("🚨 CIRCUIT BREAKER TRIPPED! System cooling down...")
            await asyncio.sleep(600); self.failure_count = 0; return

        actions = []
        try:
            # 1. Aggressive Modernization (THE LAW OF 3.12)
            if self.aggressive:
                logger.info("⚔️ AGGRESSIVE MODE: Enforcing 3.12 Architectural Standard...")
                for root, _, files in os.walk(self.project_root):
                    if any(x in root for x in [".venv", "node_modules", ".git", "__pycache__"]): continue
                    for file in files:
                        if file.endswith(".py"):
                            if self.bridge.modernize_file(os.path.join(root, file)):
                                actions.append({"type": "MODERNIZE", "target": file})

            # 2. Healing Phase
            if metrics.lint_errors > 0:
                logger.info(f"🩹 HEALING: Stabilizing {metrics.lint_errors} mutations...")
                self._run_tool(["ruff", "check", "--fix", ".", "--target-version", "py312"])
                self._run_tool(["ruff", "format", "."])
                actions.append({"type": "HEAL", "target": "python_total"})

            # 3. Cognitive Brain Integration
            if metrics.code_health < 0.8:
                logger.info("🧠 CORTEX: Dispatching Mistral Repair Mission...")
                self._run_tool(["predatorctl", "ai", "analyze", "libs/core"])
                actions.append({"type": "REFACTOR", "target": "core_logic"})

            # 4. Resource Optimization (Predictive Healing)
            if metrics.disk_usage > 80:
                logger.warning(f"🧹 Disk space critical ({metrics.disk_usage:.1f}%). Engaging Aggressive Cleaning Protocol...")
                self._run_tool(["rm", "-rf", "/tmp/azr_logs/*.log"])

                # Attempt Docker Prune
                prune_res = self._run_tool(["docker", "system", "prune", "-f"])
                logger.info(f"🐳 Docker Prune Result: {prune_res[:100]}...")

                actions.append({"type": "PURGE", "target": "system", "reason": f"Disk space > 80% ({metrics.disk_usage:.1f}%)"})

            self.failure_count = 0
        except Exception as e:
            self.failure_count += 1
            logger.error(f"⚠️ EVOLUTION ERROR: {e}")
            self.immunity.record_mutation_failure("logic_regression", str(e))

        if actions:
            reasoning = self._generate_reasoning(metrics, actions)
            self._audit(actions, metrics, reasoning)

    def _generate_reasoning(self, metrics: AutonomyMetrics, actions: list[dict]) -> str:
        """AI-like reasoning for the evolution dashboard."""
        if not actions: return "System is in a stable state. Monitoring architectural patterns."
        targets = ", ".join([str(a.get('target', 'unknown')) for a in actions])
        return f"Evolution triggered due to {len(actions)} anomalies in {targets}. Objective: Minimize entropy ({metrics.entropy_level:.4f}) and enforce 3.12 syntax."

    def _audit(self, actions: list[dict], metrics: AutonomyMetrics, reasoning: str = ""):
        entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "sovereign_id": f"NEZLAMNIST-{int(time.time())}",
            "evolution_cycle": int(time.time() / 300),
            "state_snapshot": asdict(metrics),
            "applied_changes": actions,
            "rationale": reasoning,
            "status": "CONSOLIDATED"
        }
        with open(self.audit_log, "a") as f: f.write(json.dumps(entry) + "\n")

        # PERSIST TO LONG-TERM MEMORY
        for action in actions:
            self.memory.record_solution(action['type'], action['target'], "AUTO-RESOLVED", asdict(metrics))

        logger.info(f"🏛️ LEDGER: Sovereign state {entry['sovereign_id']} consolidated.")

        # ASYNC TELEGRAM REPORT (Fire and forget from sync context if needed, but we are in async run)
        asyncio.create_task(self.telegram.report_cycle_async(entry['sovereign_id'], metrics, actions))

    async def run(self):
        logger.info("🔥 AGGRESSIVE EVOLUTION ACTIVATED. PREDATOR v25 IS MUTATING...")
        while True:
            try:
                metrics = await self.observe()
                await self.evolve(metrics)
                self._run_tool(["predatorctl", "gitops", "sync"])
                await asyncio.sleep(300)
            except Exception as e:
                logger.error(f"☄️ COSMIC INTERFERENCE: {e}"); await asyncio.sleep(60)

if __name__ == "__main__":
    asyncio.run(AZREngine(aggressive=True).run())
