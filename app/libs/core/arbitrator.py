from __future__ import annotations


"""Multi-Model Arbitration - AZR Engine v28-S."""
import asyncio
from datetime import datetime
import logging
from typing import Any, Dict, List, Optional

import numpy as np


logger = logging.getLogger(__name__)

class MultiModelArbitrator:
    """Арбітраж між множинними AI моделями."""

    def __init__(self, models: list[Any], config: dict[str, Any | None] = None):
        self.models = models  # List of model client objects
        config = config or {}
        self.consensus_threshold = config.get('consensus_threshold', 0.67)
        self.timeout = config.get('timeout', 30)

    async def arbitrate(self, prompt: str, context: str, options: dict[str, Any | None] = None):
        """Арбітраж запиту між множинними моделями."""
        logger.info(f"Starting arbitration for prompt: {prompt[:50]}...")

        # Основні 3 моделі
        primary_models = self.models[:3]
        tasks = []
        for model in primary_models:
            # Assuming model.generate is an async method
            tasks.append(asyncio.create_task(self._safe_generate(model, prompt, context, options)))

        try:
            # Очікування відповідей з таймаутом
            responses = await asyncio.wait_for(
                asyncio.gather(*tasks, return_exceptions=True),
                timeout=self.timeout
            )

            # Аналіз відповідей
            valid_responses = [r for r in responses if not isinstance(r, Exception) and r is not None]

            if len(valid_responses) >= 2:
                consensus_result = self.check_consensus(valid_responses)

                if consensus_result['has_consensus']:
                    logger.info("Consensus reached.")
                    return {
                        'status': 'consensus',
                        'decision': consensus_result['consensus_decision'],
                        'confidence': consensus_result['confidence'],
                        'model_agreement': consensus_result['agreement_matrix'],
                        'timestamp': datetime.utcnow().isoformat()
                    }

            # Немає консенсусу - ескалація до 4-ї моделі
            logger.warning("No consensus among primary models. Escalating...")
            return await self.escalate_arbitration(prompt, context, responses)

        except TimeoutError:
            logger.exception("Arbitration timeout.")
            return await self.handle_timeout(prompt, context)
        except Exception as e:
            logger.exception(f"Arbitration error: {e}")
            return {'status': 'error', 'detail': str(e)}

    async def _safe_generate(self, model, prompt, context, options):
        try:
            # This is a placeholder for actual LLM call
            # In our system it might be calling Ollama or a remote API
            return await model.generate(prompt, context, options)
        except Exception as e:
            logger.warning(f"Model generation failed: {e}")
            return None

    def check_consensus(self, responses: list[str]) -> dict:
        """Перевірка чи є консенсус між моделями."""
        if not responses:
            return {'has_consensus': False}

        # Mock embedding/similarity for implementation structure
        # In real case, use sentence-transformers or similar
        sim_matrix = np.ones((len(responses), len(responses)))

        # Simple string comparison as baseline if embeddings aren't available
        for i in range(len(responses)):
            for j in range(len(responses)):
                if i != j:
                    # Very crude similarity for the sake of logic demonstration
                    if responses[i].strip() == responses[j].strip():
                        sim_matrix[i][j] = 1.0
                    else:
                        sim_matrix[i][j] = 0.5 # Default low similarity

        consensus = False
        consensus_decision = None

        for i in range(len(responses)):
            similar_count = 0
            for j in range(len(responses)):
                if i != j and sim_matrix[i][j] > 0.8:
                    similar_count += 1

            if similar_count >= 1:
                consensus = True
                consensus_decision = responses[i]
                break

        return {
            'has_consensus': consensus,
            'consensus_decision': consensus_decision,
            'confidence': float(np.mean(sim_matrix)),
            'agreement_matrix': sim_matrix.tolist()
        }

    async def escalate_arbitration(self, prompt, context, responses):
        """Ескалація при відсутності консенсусу."""
        if len(self.models) < 4:
            return {'status': 'human_arbitration_required', 'reason': 'No backup model available'}

        # 1. 4-та модель (DeepSeek-R1)
        try:
            fourth_model_response = await self._safe_generate(self.models[3], prompt, context, {'break_tie': True})
            if not fourth_model_response:
                raise Exception("Backup model failed")

            # 2. Перевірити чи 4-та модель погоджується з будь-якою з 3
            # (Simplified check)
            for resp in responses:
                if not isinstance(resp, Exception) and resp is not None:
                    if resp.strip() == fourth_model_response.strip():
                        return {
                            'status': 'escalation_resolved',
                            'decision': resp,
                            'tie_breaker': 'fourth_model',
                            'confidence': 1.0
                        }
        except Exception as e:
            logger.exception(f"Escalation failed: {e}")

        # 3. Ескалація до людини
        return {
            'status': 'human_arbitration_required',
            'prompt': prompt,
            'model_responses': [str(r) for r in responses],
            'timestamp': datetime.utcnow().isoformat()
        }

    async def handle_timeout(self, prompt, context):
        return {
            'status': 'timeout',
            'emergency_action': 'System freeze until resolution',
            'timestamp': datetime.utcnow().isoformat()
        }
