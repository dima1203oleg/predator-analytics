"""
Synthetic Data Agent
Generates high-fidelity synthetic datasets for training Predator models.
Specializes in Customs, Tax, and Economic Fraud scenarios.
"""
import logging
import json
import uuid
import asyncio
from typing import List, Dict, Any
from datetime import datetime
import pandas as pd

# LLM Providers
try:
    from groq import AsyncGroq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False

try:
    from mistralai import Mistral
    MISTRAL_AVAILABLE = True
except ImportError:
    MISTRAL_AVAILABLE = False

try:
     from openai import AsyncOpenAI
     OPENAI_AVAILABLE = True
except ImportError:
     OPENAI_AVAILABLE = False

from orchestrator.config import (
    GROQ_API_KEY, GROQ_MODEL,
    GEMINI_API_KEY, GEMINI_MODEL,
    MISTRAL_API_KEY, MISTRAL_MODEL,
    DEEPSEEK_API_KEY
)

logger = logging.getLogger(__name__)

class SyntheticDataAgent:
    def __init__(self, output_dir: str = "data/processed"):
        self.output_dir = output_dir

        # Init Groq
        if GROQ_AVAILABLE and GROQ_API_KEY and GROQ_API_KEY != "your_groq_api_key_here":
            self.groq_client = AsyncGroq(api_key=GROQ_API_KEY, max_retries=0)
            self.groq_model = GROQ_MODEL
        else:
            self.groq_client = None

        # Init Gemini
        if GEMINI_AVAILABLE and GEMINI_API_KEY:
            genai.configure(api_key=GEMINI_API_KEY)
            self.gemini_model = genai.GenerativeModel(GEMINI_MODEL)
        else:
            self.gemini_model = None

        # Init Mistral
        if MISTRAL_AVAILABLE and MISTRAL_API_KEY and MISTRAL_API_KEY != "your_mistral_api_key_here":
            self.mistral_client = Mistral(api_key=MISTRAL_API_KEY)
            self.mistral_model = MISTRAL_MODEL
        else:
            self.mistral_client = None

        # Init DeepSeek (via OpenAI client)
        if OPENAI_AVAILABLE and DEEPSEEK_API_KEY and DEEPSEEK_API_KEY != "your_deepseek_api_key_here":
            self.ds_client = AsyncOpenAI(api_key=DEEPSEEK_API_KEY, base_url="https://api.deepseek.com")
            self.ds_model = "deepseek-chat"
        else:
            self.ds_client = None

        if not any([self.groq_client, self.gemini_model, self.mistral_client, self.ds_client]):
            logger.warning("No LLM clients initialized for SyntheticDataAgent")

    async def generate_dataset(self, scenario: Dict[str, Any], count: int = 50) -> List[Dict]:
        """
        Generate a synthetic dataset with multi-provider fallback.
        """
        prompt = self._construct_prompt(scenario, count)
        logger.info(f"🧪 Generating {count} samples for: {scenario.get('title')}")

        # Provider list in priority order
        providers = [
            ("Groq", self._call_groq),
            ("Mistral", self._call_mistral),
            ("DeepSeek", self._call_deepseek),
            ("Gemini", self._call_gemini)
        ]

        content = None
        for name, caller in providers:
            try:
                content = await caller(prompt)
                if content:
                    logger.info(f"✅ Generated data using {name}")
                    break
            except Exception as e:
                logger.warning(f"⚠️ Provider {name} failed: {str(e)[:100]}...")

        if not content:
            return []

        try:
            content = content.replace("```json", "").replace("```", "").strip()
            data = json.loads(content)
            for record in data:
                record['_generated_at'] = datetime.now().isoformat()
                record['_scenario_id'] = scenario.get('id', 'unknown')
                record['_label'] = scenario.get('label', 'suspicious')
            return data
        except Exception as e:
            logger.error(f"Failed to parse JSON: {e}")
            return []

    async def _call_groq(self, prompt: str):
        if not self.groq_client: return None
        resp = await self.groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": "Output ONLY valid JSON array."},
                {"role": "user", "content": prompt}
            ],
            model=self.groq_model,
            temperature=0.7
        )
        return resp.choices[0].message.content

    async def _call_mistral(self, prompt: str):
        if not self.mistral_client: return None
        resp = await self.mistral_client.chat.complete_async(
            messages=[{"role": "user", "content": prompt}],
            model=self.mistral_model,
            response_format={"type": "json_object"} if "mistral-large" in self.mistral_model else None
        )
        return resp.choices[0].message.content

    async def _call_deepseek(self, prompt: str):
        if not self.ds_client: return None
        resp = await self.ds_client.chat.completions.create(
            messages=[
                {"role": "system", "content": "Output ONLY valid JSON array."},
                {"role": "user", "content": prompt}
            ],
            model=self.ds_model,
            stream=False
        )
        return resp.choices[0].message.content

    async def _call_gemini(self, prompt: str):
        if not self.gemini_model: return None
        resp = await asyncio.to_thread(self.gemini_model.generate_content, prompt)
        return resp.text

    def _construct_prompt(self, scenario: Dict, count: int) -> str:
        description = scenario.get('description', '')
        usage = scenario.get('usage', '') or scenario.get('example', '')
        fields = scenario.get('fields', 'id, amount, hs_code, country, date')

        return f"""
TASK: Generate HYPER-COMPLEX synthetic data for Predator Analytics v29-S.
SCENARIO: {scenario.get('title')}
CORE DESCRIPTION: {description}
TACTICAL USAGE/PATTERN: {usage}

REQUIRED FIELDS: {fields}

CONSTRAINTS:
1. Output exactly {count} JSON objects in a RAW array.
2. NO MARKDOWN, NO EXPLANATIONS. START with [ and END with ].
3. Language: Ukrainian/Russian where appropriate (names, addresses).
4. Logic: Data MUST reflect the specific fraud markers described in the USAGE/PATTERN.
5. Variety: Ensure realistic variance in amounts, dates, and entities.
"""

    async def generate_adversarial_examples(self, original_data: List[Dict]) -> List[Dict]:
        """
        Generate hard negatives.
        """
        if not original_data: return []
        prompt = f"Here are patterns: {json.dumps(original_data[:2])}. Generate 5 SIMILAR but 100% LEGAL objects in JSON list."

        # Simple fallback for adversarial
        content = None
        for caller in [self._call_groq, self._call_deepseek, self._call_mistral, self._call_gemini]:
            try:
                content = await caller(prompt)
                if content: break
            except: continue

        if not content: return []
        try:
            data = json.loads(content.replace("```json", "").replace("```", "").strip())
            for record in data:
                 record['_is_adversarial'] = True
                 record['_label'] = "compliant"
            return data
        except: return []
