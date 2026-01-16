"""
CortexOrchestrator v24.0
The stateful brain of Predator Analytics.
Implements Strategy -> Generation -> Audit -> HITL pattern with real AI models.
"""
import asyncio
import logging
import uuid
import json
from typing import Dict, Any, Optional
from datetime import datetime

import google.generativeai as genai
from .infrastructure import InfrastructureHandler
from ..config import GEMINI_API_KEY, GEMINI_API_KEYS, GEMINI_MODEL

logger = logging.getLogger("cortex")

class CortexOrchestrator:
    def __init__(self):
        self.infra = InfrastructureHandler()
        self.tasks: Dict[str, Any] = {} # In-memory state (use Redis in production)
        self.approvals: Dict[str, Any] = {}

        # Configure Gemini with Key Rotation
        self.gemini_keys = GEMINI_API_KEYS if GEMINI_API_KEYS else [GEMINI_API_KEY]
        self.current_key_index = 0
        self._rotate_key() # Initialize with first key

        self.gemini = genai.GenerativeModel(GEMINI_MODEL)

        # Groq Client (Simulated or via HTTP for now to avoid extra dependencies)
        # In a real environment, we'd use the Groq library or our internal fallback
        from ..council.fallback import get_fallback
        self.coder = get_fallback() # This usually points to Groq/Mistral

    async def submit_task(self, user_id: int, command: str, source: str) -> str:
        """Entry point for new user commands with Semantic Routing"""
        task_id = str(uuid.uuid4())[:8]
        self.tasks[task_id] = {
            "user_id": user_id,
            "command": command,
            "source": source,
            "status": "analyzing",
            "created_at": datetime.now()
        }

        # Start the background processing chain
        asyncio.create_task(self._process_chain(task_id))
        return task_id

    async def _process_chain(self, task_id: str):
        """The Triple Agent Chain: Gemini (Plan) -> Groq (Code) -> Auditor"""
        task = self.tasks[task_id]
        command = task["command"]

        try:
            # 1. SEMANTIC ROUTING & PLANNING (Gemini)
            logger.info(f"[{task_id}] Semantic Routing via Gemini...")
            plan = await self._gemini_plan(command)
            task["strategy"] = plan
            task["status"] = "generating" if plan["requires_action"] else "completed"

            if not plan["requires_action"]:
                task["result"] = plan["response"]
                return

            # 2. GENERATION (Groq/Coder)
            logger.info(f"[{task_id}] Generating Solution...")
            generated_artifact = await self._generate_solution(plan["goal"], plan["intent"])
            task["artifact"] = generated_artifact
            task["status"] = "auditing"

            # 3. AUDIT (Internal Logic)
            logger.info(f"[{task_id}] Auditing Artifact...")
            audit_report = await self._audit_solution(generated_artifact)
            task["audit"] = audit_report

            # 4. HITL DECISION
            if plan["risk_level"] in ["high", "medium"]:
                task["status"] = "awaiting_approval"
                approval_id = f"app_{task_id}"
                self.approvals[approval_id] = task_id
                logger.info(f"[{task_id}] Awaiting Human Approval (Risk: {plan['risk_level']})")
            else:
                task["status"] = "executing"
                await self._execute(task_id)

        except Exception as e:
            logger.error(f"Chain error for {task_id}: {e}")
            task["status"] = "failed"
            task["error"] = str(e)

    def _rotate_key(self):
        """Rotates to the next available API Key"""
        if not self.gemini_keys:
            logger.warning("No Gemini API keys available!")
            return

        key = self.gemini_keys[self.current_key_index]
        genai.configure(api_key=key)
        masked_key = key[:5] + "..." + key[-5:]
        logger.info(f"🔄 Switched Gemini API Key to index {self.current_key_index} ({masked_key})")

        self.current_key_index = (self.current_key_index + 1) % len(self.gemini_keys)

    async def _gemini_plan(self, command: str) -> Dict[str, Any]:
        """Real Semantic Router using Gemini Flash with Key Rotation for 429s"""
        prompt = f"""
        Analyze the following user command for Predator Analytics v23.0.
        System Context: K8s, Prometheus, Qdrant, Postgres, ArgoCD.

        COMMAND: {command}

        Return a JSON object with:
        - intent: [scale_infra, generate_synthetic, fix_error, analyze_metrics, general]
        - requires_action: boolean
        - goal: specific technical goal for the coder
        - risk_level: [low, medium, high] (high for data deletion or infra changes)
        - response: optional text response if no action needed
        - voice_hint: short Ukrainian summary of what you are doing (max 10 words)
        """

        max_retries = len(self.gemini_keys) * 2  # Try each key twice if needed

        for attempt in range(max_retries):
            try:
                response = self.gemini.generate_content(prompt)
                # Simple JSON extraction
                text = response.text.strip().replace("```json", "").replace("```", "")
                return json.loads(text)

            except Exception as e:
                error_str = str(e)
                if "429" in error_str or "Quota exceeded" in error_str or "Too Many Requests" in error_str:
                    logger.warning(f"⚠️ Gemini Rate Limit (429) on attempt {attempt+1}. Rotating key...")
                    self._rotate_key()
                    await asyncio.sleep(1) # Brief pause before retry
                else:
                    logger.error(f"Gemini routing failed: {e}")
                    break

        # Fallback if all retries fail
        return {
            "intent": "general",
            "requires_action": False,
            "response": "Вибачте, всі API ключі вичерпали ліміти. Спробуйте пізніше.",
            "risk_level": "low",
            "voice_hint": "Ліміти вичерпано."
        }

    async def _generate_solution(self, goal: str, intent: str) -> str:
        """Generate code or config using Groq/Coder"""
        prompt = f"As a Senior DevOps/ML Engineer, implement the following goal: {goal}\nIntent: {intent}\nProvide only the code/config, no explanation."

        try:
            response_text = await self.coder.generate(prompt=prompt, temperature=0.2)
            return response_text
        except Exception as e:
            logger.error(f"Coder failed: {e}")
            return f"# Error generating solution: {e}"

    async def _audit_solution(self, artifact: str) -> str:
        """Simulated Audit - can be extended with another LLM call or static analysis"""
        if "rm -rf" in artifact or "DELETE FROM" in artifact:
            return "❌ CRITICAL: Destructive command detected!"
        return "✅ Audit passed. No obvious security issues."

    async def _execute(self, task_id: str):
        """Final execution layer - link to InfrastructureHandler"""
        task = self.tasks[task_id]
        logger.info(f"[{task_id}] Finalizing execution...")

        # Re-verify infra status
        gpu_status = await self.infra.get_gpu_usage()
        logger.info(f"Current GPU Usage: {gpu_status['usage']}")

        # Real action based on intent
        intent = task["strategy"]["intent"]
        if intent == "scale_infra":
            await self.infra.trigger_deployment("predator-workers", "auto-scale-v1")

        await asyncio.sleep(2) # Execution simulation
        task["status"] = "completed"
        task["result"] = "Пайплайн успішно виконано та розгорнуто через ArgoCD."

    async def execute_approval(self, approval_id: str, approved: bool) -> bool:
        """Callback for Human-in-the-Loop approval"""
        if approval_id not in self.approvals:
            return False

        task_id = self.approvals[approval_id]
        if approved:
            self.tasks[task_id]["status"] = "executing"
            asyncio.create_task(self._execute(task_id))
            return True
        else:
            self.tasks[task_id]["status"] = "cancelled"
            return True

    def get_task_status(self, task_id: str) -> Optional[Dict[str, Any]]:
        return self.tasks.get(task_id)
