"""
Analyst Agent - Analyzes system metrics and suggests optimizations
Integrated with Mixed Top CLI Stack (Uses Gemini 2.5 primarily)
"""
import logging
import json
from typing import Dict, Any
from .ultimate_fallback import get_ultimate_fallback

logger = logging.getLogger("council.analyst")

class Analyst:
    def __init__(self, api_key: str = None, base_url: str = None):
        """
        Analyst now uses the universal fallback system which handles
        Gemini, Mistral, and Ollama.
        """
        self.fallback = get_ultimate_fallback()

    async def analyze(self, metrics: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze system metrics and provide recommendations using strategic AI (Gemini 2.5)
        """
        prompt = f"""You are the Lead System Analyst for Predator Analytics.

        CURRENT SYSTEM METRICS:
        {json.dumps(metrics, indent=2)}

        Analyze and provide a strategic report:
        1. Identify any performance bottlenecks.
        2. Evaluate resource utilization (CPU/GPU/RAM).
        3. Suggest specific optimizations.
        4. Predict potential failures based on trends.

        REQUIRED FORMAT: Return ONLY valid JSON.
        {{
            "health_status": "healthy|degraded|critical",
            "bottlenecks": ["list of strings"],
            "optimizations": ["list of strings"],
            "action_required": true/false,
            "priority": "low|medium|high"
        }}
        """

        try:
            # Analysts use the 'planner' role to trigger Gemini 2.5
            response_text = await self.fallback.generate(
                prompt=prompt,
                temperature=0.2,
                max_tokens=2000,
                role="planner"
            )

            if not response_text:
                raise Exception("No response from AI stack")

            analysis = self._extract_json(response_text)
            logger.info(f"Analysis complete: Status {analysis.get('health_status')}")
            return analysis

        except Exception as e:
            logger.error(f"AI Analysis failed: {e}. Using basic heuristic.")
            return self._heuristic_analysis(metrics)

    def _extract_json(self, text: str) -> Dict[str, Any]:
        """Extract JSON from AI response"""
        try:
            # Clean possible markdown
            clean = text.strip()
            if "```json" in clean:
                clean = clean.split("```json")[1].split("```")[0].strip()
            elif "```" in clean:
                clean = clean.split("```")[1].split("```")[0].strip()

            return json.loads(clean)
        except Exception:
            # Try finding braces
            import re
            match = re.search(r'\{.*\}', text, re.DOTALL)
            if match:
                return json.loads(match.group())
            raise ValueError("Failed to parse JSON")

    def _heuristic_analysis(self, metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Fallback to local logic if AI is down"""
        status = "healthy"
        bottlenecks = []

        if metrics.get('cpu_usage', 0) > 90:
            status = "degraded"
            bottlenecks.append("High CPU Usage")

        return {
            "health_status": status,
            "bottlenecks": bottlenecks,
            "optimizations": ["Monitor system manually while AI is offline"],
            "action_required": status != "healthy",
            "priority": "medium"
        }
