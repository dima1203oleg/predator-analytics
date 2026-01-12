"""
Chairman Agent - Makes final decisions using Gemini
Now with multi-model fallback for reliability
"""
import google.generativeai as genai
from typing import Dict, Any, List
import logging
from .fallback import get_fallback

logger = logging.getLogger("council.chairman")

class Chairman:
    def __init__(self, api_key: str, model: str = "gemini-2.0-flash-exp"):
        # NOTE: gemini-2.5-flash has only 20 req/day free tier - TOO LOW!
        # Using gemini-2.0-flash-exp which has higher limits
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(model)

    async def decide(self,
                     task: str,
                     proposals: List[Dict[str, Any]],
                     context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Make final decision based on proposals from other council members
        """
        prompt = f"""You are the Chairman of the LLM Council for Predator Analytics.

TASK: {task}

PROPOSALS FROM COUNCIL:
{self._format_proposals(proposals)}

CONTEXT:
- Current System Status: {context.get('system_status', 'operational')}
- Recent Changes: {context.get('recent_changes', [])}
- Quality Metrics: {context.get('metrics', {})}

Your decision must:
1. Align with the Technical Specification (TECH_SPEC.md)
2. Improve system stability, performance, or features
3. Use only FREE components/APIs
4. Be implementable without human intervention

Respond in JSON format:
{{
    "decision": "approve|reject|modify",
    "action": "specific action to take",
    "reasoning": "why this decision",
    "implementation_steps": ["step1", "step2"],
    "risk_level": "low|medium|high"
}}
"""

        try:
            response = self.model.generate_content(prompt)
            import json
            decision = json.loads(response.text.strip().replace("```json", "").replace("```", ""))
            logger.info(f"Chairman Decision: {decision['decision']} - {decision['action']}")
            return decision
        except Exception as e:
            logger.warning(f"Gemini Chairman failed: {e}, trying fallback...")

            # Try fallback models
            try:
                fallback = get_fallback()
                response_text = await fallback.generate(
                    prompt=prompt,
                    temperature=0.5,
                    max_tokens=1000,
                    role="planner"
                )

                if response_text:
                    import json
                    decision = json.loads(response_text.strip().replace("```json", "").replace("```", ""))
                    logger.info(f"✅ Fallback Chairman: {decision['decision']} - {decision['action']}")
                    return decision
            except Exception as fallback_error:
                logger.error(f"Fallback also failed: {fallback_error}")

            # Ultimate fallback: Conservative rejection
            return {
                "decision": "reject",
                "action": "none",
                "reasoning": f"Decision error: {e}",
                "implementation_steps": [],
                "risk_level": "high"
            }

    def _format_proposals(self, proposals: List[Dict[str, Any]]) -> str:
        formatted = []
        for i, prop in enumerate(proposals, 1):
            formatted.append(f"\n{i}. {prop.get('role', 'Agent')}: {prop.get('proposal', 'N/A')}")
        return "\n".join(formatted)
