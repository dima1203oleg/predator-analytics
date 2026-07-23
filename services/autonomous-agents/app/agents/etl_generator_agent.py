import logging
import ast
import os
from pathlib import Path
from litellm import acompletion
import json

logger = logging.getLogger("autonomous_agents.etl_generator")

LITELLM_MODEL = os.getenv("LITELLM_MODEL", "ollama/qwen2.5-coder:7b")

class ETLGeneratorAgent:
    """Генерує код нормалізатора для зібраних сирих даних."""

    def __init__(self):
        self.model = LITELLM_MODEL
        self.target_dir = Path("/Users/Shared/Predator_60/services/ingestion-worker/app/normalizers/auto")
        self.target_dir.mkdir(parents=True, exist_ok=True)

    async def generate_normalizer(self, source_info: dict) -> dict:
        url = source_info.get("url", "unknown_source")
        schema_sample = source_info.get("schema_sample", {})
        
        # Determine a safe filename
        safe_name = url.split("://")[-1].replace("/", "_").replace(".", "_")
        if not safe_name:
            safe_name = "custom_source"
            
        file_path = self.target_dir / f"auto_normalizer_{safe_name}.py"

        prompt = f"""
You are an expert Python Data Engineer.
Write a FollowTheMoney compatible Normalizer for the following data schema.
The normalizer should take raw JSON and yield tuples of `("node", dict)` or `("edge", dict)`.

Target Schema / Sample Data:
{json.dumps(schema_sample, indent=2)}

Requirements:
1. Output class MUST be named `AutoNormalizer_{safe_name}`.
2. It MUST have a `normalize(self, entity: dict)` generator method.
3. Node dict MUST have 'label', 'id', and 'props'.
4. Edge dict MUST have 'rel_type', 'source_id', 'target_id', and 'props'.
5. Reply ONLY with valid Python code, no markdown wrappers.
6. The normalizer must map fields to standard Predator Graph objects (e.g. Company, Person, Sanction).
"""
        logger.info(f"Asking LLM to generate ETL Normalizer for {safe_name}")
        
        try:
            response = await acompletion(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1
            )
            code = response.choices[0].message.content.strip()
            
            if code.startswith("```python"):
                code = code[9:]
            if code.endswith("```"):
                code = code[:-3]
            code = code.strip()

            # Verify syntax
            ast.parse(code)
            
            # Save code
            file_path.write_text(code)
            logger.info(f"Successfully generated Normalizer: {file_path}")
            
            return {"status": "success", "file": str(file_path)}
            
        except SyntaxError as e:
            logger.error(f"Syntax error in generated normalizer: {e}")
            return {"status": "error", "reason": "Syntax Error", "details": str(e)}
        except Exception as e:
            logger.error(f"Error generating ETL normalizer: {e}")
            return {"status": "error", "reason": str(e)}
