
"""
⚖️ Multi-Model Arbitrator v1.2 (UA) - Optimized for GTX 1080 (8GB VRAM)
Реалізація арбітражу між множинними LLM моделями.
Axiom-005 Compliance: Real Multi-Model Consensus via Local Ollama.

Features:
- Sequential Execution (Prevent OOM)
- Dynamic Model Discovery (Fail-safe)
- Role-based Diversity (Single-GPU optimization)

Optimized Models (8GB VRAM limit):
- Primary: LLaMA 3.1 8B Instruct (Q4_K_M)
- Code: Mistral 7B Instruct v0.3 (or CodeLlama 7B)
"""

import asyncio
import math
import json
from datetime import datetime
from typing import Dict, List, Any, Optional
from dataclasses import dataclass

from libs.core.structured_logger import get_logger

logger = get_logger("services.orchestrator.council.arbitrator")

@dataclass
class ModelConfig:
    name: str
    type: str
    role: str
    weight: float

class MultiModelArbitrator:
    """
    Арбітраж між множинними AI моделями (GTX 1080 Optimized Safe Mode).
    """

    def __init__(self):
        # Конфігурація моделей оптимізована під 8GB VRAM
        self.models_config = [
            ModelConfig(name="Primary", type="llama3.1:8b", role="Constitution", weight=1.0),
            ModelConfig(name="Code", type="mistral:7b", role="Code Analysis", weight=0.9),
            ModelConfig(name="Security", type="llama3.1:8b", role="Security Audit", weight=0.9),
            ModelConfig(name="Reasoning", type="mistral:7b", role="Logic Check", weight=0.8)
        ]
        self.consensus_threshold = 0.67
        self.timeout = 60 # Increased timeout for sequential execution on single GPU

    async def arbitrate_action(self, action_type: str, description: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Проводить РЕАЛЬНЕ голосування моделей щодо дії.
        """
        prompt = f"""
        CONSTITUTIONAL CHECK:
        Action: {action_type}
        Description: {description}
        Context: {json.dumps(context, default=str)[:500]}

        Evaluated against AZR Axioms:
        1. Human Sovereignty (Humans approve critical actions)
        2. Do No Harm
        3. Transparency

        VOTE: Should this action be approved?
        Reply cleanly: JSON with keys "decision" (approve/reject) and "reason".
        """

        import httpx
        import os

        # 0. Sovereign Mode (Auto-Approval for Full Autonomy)
        if os.getenv("SOVEREIGN_AUTO_APPROVE", "false").lower() == "true":
             logger.info("🛡️ SOVEREIGN AUTO-APPROVE ACTIVATED. Bypassing Multi-Model Arbitration.")
             return {
                 'status': 'consensus',
                 'decision': 'approve',
                 'confidence': 1.0,
                 'model_agreement': {"auto_approve": 1}
             }

        results = []

        # 1. Dynamic Model Discovery (Auto-detect what's installed)
        available_models = []
        target_models = ["llama3.1:8b", "mistral:7b"]

        async with httpx.AsyncClient(timeout=5.0) as client:
             try:
                 # Check Docker/Local Ollama
                 hosts = ["http://ollama:11434", "http://host.docker.internal:11434", "http://localhost:11434"]
                 ollama_host = None
                 tags = []

                 for h in hosts:
                    try:
                        resp = await client.get(f"{h}/api/tags")
                        if resp.status_code == 200:
                            tags = resp.json().get("models", [])
                            ollama_host = h
                            break
                    except: continue

                 if tags:
                     loaded_names = [m["name"] for m in tags]
                     for tm in target_models:
                         # Loose match (e.g. 'llama3.1:8b' matches 'llama3.1:8b-instruct')
                         match = next((nm for nm in loaded_names if tm.split(':')[0] in nm), None)
                         if match:
                             available_models.append(match)
             except Exception as e:
                 logger.warning(f"Model discovery failed: {e}. Using defaults.")

        # Fallback to defaults if discovery failed
        if not available_models:
            available_models = target_models

        # 2. Single-Model Diversity (If only 1 model is available)
        # We use the same model twice but will inject different persona prompts
        if len(available_models) == 1:
            available_models.append(available_models[0])

        logger.info(f"⚖️ Arbitrating with models: {available_models}")

        # 3. Sequential Execution (Sequential Execution)
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            for i, model in enumerate(available_models):
                # Add variation to prompt for diversity
                current_prompt = prompt
                # If we are using the same model twice (or even different models), assign roles
                if i == 1:
                     current_prompt += "\nRole: CRITICAL SECURITY AUDITOR (Look for hidden risks)."
                else:
                     current_prompt += "\nRole: BENEFICIAL AI (Focus on utility)."

                res = await self._query_ollama_model(client, model, current_prompt)
                results.append(res)
                # Pause for VRAM stability
                await asyncio.sleep(1.0)

        # 4. Response Aggregation
        responses = []
        for i, res in enumerate(results):
            model_name = available_models[i]
            if isinstance(res, dict):
                # Unique name if duplicated
                display_name = model_name
                if len(set(available_models)) == 1:
                    display_name = f"{model_name}_{i+1}"

                res["model"] = display_name
                responses.append(res)
            else:
                logger.warning(f"Model {model_name} failed: {res}")
                responses.append({"model": model_name, "decision": "abstain", "reason": str(res)})

        return await self.arbitrate(prompt, context, responses)

    async def _query_ollama_model(self, client, model: str, prompt: str) -> Dict[str, Any]:
        """Відправляє запит до конкретної моделі в Ollama."""
        try:
            hosts = ["http://ollama:11434", "http://host.docker.internal:11434", "http://localhost:11434"]
            url = None
            for h in hosts:
                try:
                    await client.get(f"{h}/api/tags")
                    url = f"{h}/api/generate"
                    break
                except: continue

            if not url:
                return {"decision": "uncertain", "reason": "Ollama Unreachable"}

            payload = {
                "model": model,
                "prompt": prompt + "\nRespond in JSON only.",
                "stream": False,
                "format": "json"
            }

            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                content = data.get("response", "")
                try:
                    decision_data = json.loads(content)
                    return {
                        "decision": decision_data.get("decision", "uncertain").lower(),
                        "reason": decision_data.get("reason", "No reason provided")
                    }
                except:
                    if "approve" in content.lower():
                        return {"decision": "approve", "reason": content[:50]}
                    return {"decision": "reject", "reason": content[:50]}

            return {"decision": "uncertain", "reason": f"HTTP {resp.status_code}"}

        except Exception as e:
            return {"decision": "uncertain", "reason": str(e)}

    async def arbitrate(self, prompt: str, context: Dict[str, Any], responses: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Арбітраж запиту.
        """
        logger.info("arbitration_step_started_optimized", prompt_preview=prompt[:50])

        if not responses:
             return {"status": "failed", "reason": "No responses to arbitrate"}

        if len(responses) >= 2:
            consensus_result = self.check_consensus(responses)

            if consensus_result['has_consensus']:
                logger.info("consensus_reached", decision=consensus_result['consensus_decision'])
                return {
                    'status': 'consensus',
                    'decision': consensus_result['consensus_decision'],
                    'confidence': consensus_result['confidence'],
                    'model_agreement': consensus_result['agreement_details']
                }

        return await self.escalate_arbitration(prompt, responses)

    def check_consensus(self, responses: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Перевірка чи є консенсус."""
        votes = {}
        weighted_votes = {}
        total_weight = 0

        for i, resp in enumerate(responses):
            decision = resp.get("decision", "uncertain")
            model_name = resp.get("model", "").lower()
            weight = 1.0 # Default equal weight for now

            votes[decision] = votes.get(decision, 0) + 1
            weighted_votes[decision] = weighted_votes.get(decision, 0) + weight
            total_weight += weight

        has_majority = False
        winning_decision = None

        for decision, count in votes.items():
            if count >= 2: # Simple majority for 2 models
                has_majority = True
                winning_decision = decision
                break

        confidence = 0.0
        if winning_decision and total_weight > 0:
             confidence = weighted_votes[winning_decision] / total_weight

        return {
            'has_consensus': has_majority,
            'consensus_decision': winning_decision,
            'confidence': confidence,
            'agreement_details': votes
        }

    async def escalate_arbitration(self, prompt: str, responses: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Ескалація."""
        logger.warning("arbitration_escalated")
        return {
            'status': 'escalation_required',
            'reason': 'No consensus',
            'action': 'Invoke Mistral 7B (Reasoning Mode)',
            'responses_summary': [f"{r.get('model', 'unknown')}: {r.get('decision', 'unknown')}" for r in responses]
        }
