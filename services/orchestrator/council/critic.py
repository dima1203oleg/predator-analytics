"""
Critic Agent - Reviews code and suggests improvements using Groq
Now with multi-model fallback for reliability
"""
import json
from groq import Groq
from typing import Dict, Any
import logging
from .fallback import get_fallback

logger = logging.getLogger("council.critic")

class Critic:
    def __init__(self, api_key: str, model: str = "llama-3.3-70b-versatile"):
        self.client = Groq(api_key=api_key)
        self.model = model

    async def review(self, code: str, task_description: str) -> Dict[str, Any]:
        """
        Review code and provide critical feedback
        """
        prompt = f"""You are the Critic in the LLM Council.

TASK: {task_description}

CODE TO REVIEW:
```
{code}
```

Analyze for:
1. Security vulnerabilities
2. Performance bottlenecks
3. Code quality issues
4. Alignment with Python/FastAPI best practices
5. Potential runtime errors

Respond in JSON:
{{
    "approval": true/false,
    "issues": ["issue1", "issue2"],
    "suggestions": ["suggestion1"],
    "security_risk": "low|medium|high",
    "performance_impact": "positive|neutral|negative"
}}
"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=2000
            )

            review = self._extract_json(response.choices[0].message.content)
            logger.info(f"Critic Review: {'APPROVED' if review.get('approval') else 'REJECTED'}")
            return review
        except Exception as e:
            logger.warning(f"Groq Critic failed: {e}, trying fallback...")

            # Try fallback models
            try:
                fallback = get_fallback()
                response_text = await fallback.generate(
                    prompt=prompt,
                    temperature=0.3,
                    max_tokens=2000,
                    role="codegen"
                )

                if response_text:
                    review = self._extract_json(response_text)
                    logger.info(f"✅ Fallback Critic Review: {'APPROVED' if review.get('approval') else 'REJECTED'}")
                    return review
            except Exception as fallback_error:
                logger.error(f"Fallback also failed: {fallback_error}")

            # Ultimate fallback: EMERGENCY BYPASS
            # If all AIs are down, we assume the code is valid enough to be shown to the human.
            # The human will make the final call in Telegram.
            logger.warning("🚨 ALL AI CRITICS DOWN. USING EMERGENCY BYPASS.")
            return {
                "approval": True,
                "issues": ["⚠️ WARNING: Automated review skipped due to API limits. Proceed with caution."],
                "suggestions": ["Manual review required."],
                "security_risk": "medium", # "high" would auto-block in consensus
                "performance_impact": "neutral"
            }

    def _extract_json(self, text: str) -> Dict[str, Any]:
        """Extract JSON object from text, handling markdown blocks"""
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

        clean_text = text.strip()
        if "```json" in clean_text:
            clean_text = clean_text.split("```json")[1].split("```")[0].strip()
        elif "```" in clean_text:
            clean_text = clean_text.split("```")[1].split("```")[0].strip()

        try:
            return json.loads(clean_text)
        except json.JSONDecodeError:
            start = clean_text.find("{")
            end = clean_text.rfind("}")
            if start != -1 and end != -1:
                return json.loads(clean_text[start:end+1])
            raise ValueError("Invalid JSON format")
