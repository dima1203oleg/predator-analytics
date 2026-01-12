"""
Code Improver Task Agent
Generates code improvements autonomously using LLM
"""
import json
import re
import logging
from typing import Dict, Any
from orchestrator.council.ultimate_fallback import get_ultimate_fallback

logger = logging.getLogger("tasks.code_improver")

class CodeImprover:
    def __init__(self, api_key: str, model: str):
        self.fallback = get_ultimate_fallback()
        self.model = model
        self.project_root = "/app"

    async def generate_improvement(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Generate code improvement based on task using LLM"""
        task_type = task.get("type")
        description = task.get("description")
        context = task.get("context", "")

        logger.info(f"🤖 Code Improver: Generating solution for '{description}'...")

        # Extract target file from description if possible
        file_match = re.search(r'in\s+(app/[\w/]+\.py)', description)
        target_file = file_match.group(1) if file_match else "app/core/improvements.py"

        system_prompt = f"""You are an expert Python/FastAPI developer.
Generate production-ready code for the task below.

REQUIRED: Return ONLY valid JSON (no markdown, no extra text):
{{
    "file_path": "{target_file}",
    "code": "# Full Python file content here...",
    "type": "new_file",
    "description": "Brief summary"
}}

RULES:
1. "code" must be complete, runnable Python
2. Include all imports
3. Use async/await for IO operations
4. Add docstrings and type hints
"""

        user_prompt = f"""TASK: {description}
TYPE: {task_type}
CONTEXT: {context}

Generate the complete Python code."""

        try:
            response_content = await self.fallback.generate(
                prompt=user_prompt,
                system=system_prompt,
                temperature=0.3,
                max_tokens=4000
            )

            if not response_content:
                raise Exception("No response from AI providers")

            logger.debug(f"LLM Response (first 500 chars): {response_content[:500]}...")
            result = self._extract_json(response_content)

            # Validate required fields
            if not result.get("file_path"):
                result["file_path"] = target_file
            if not result.get("code"):
                raise ValueError("No code generated")
            if not result.get("type"):
                result["type"] = "new_file"
            if not result.get("description"):
                result["description"] = description

            logger.info(f"✅ Code generated for {result['file_path']}")
            return result

        except Exception as e:
            logger.error(f"Failed to generate improvement: {e}")
            return {
                "error": str(e),
                "description": f"Failed: {description}",
                "file_path": None,
                "code": None
            }

    def _extract_json(self, text: str) -> Dict[str, Any]:
        """Extract JSON object from text, handling markdown blocks and embedded code"""
        clean_text = text.strip()
        # Remove markdown code blocks wrapper
        if clean_text.startswith("```"):
            # Find the actual content between ``` markers
            lines = clean_text.split("\n")
            start_idx = 1 if lines[0].startswith("```") else 0
            end_idx = len(lines)
            for i in range(len(lines) - 1, 0, -1):
                if lines[i].strip() == "```":
                    end_idx = i
                    break
            clean_text = "\n".join(lines[start_idx:end_idx])

        # Try direct parse first
        try:
            return json.loads(clean_text)
        except json.JSONDecodeError:
            pass

        # Try to fix common issues with embedded code
        # LLM often puts actual newlines inside "code" field instead of \n
        try:
            # Find the code field and try to fix it
            if '"code":' in clean_text or "'code':" in clean_text:
                # Extract code manually using regex
                file_path_match = re.search(r'"file_path"\s*:\s*"([^"]+)"', clean_text)
                type_match = re.search(r'"type"\s*:\s*"([^"]+)"', clean_text)
                desc_match = re.search(r'"description"\s*:\s*"([^"]+)"', clean_text)

                # Find code block - it's usually between "code": " and the next field or end
                code_start = clean_text.find('"code"')
                if code_start != -1:
                    # Find the opening quote after "code":
                    quote_start = clean_text.find('"', code_start + 6)
                    if quote_start != -1:
                        # Find the end - look for ", followed by a field name or }
                        remaining = clean_text[quote_start + 1:]

                        # Try to find the ending pattern
                        patterns = ['",\n    "', '"\n}', '",\n}', '"\n    }', '"}\n']
                        end_pos = len(remaining)
                        for pattern in patterns:
                            pos = remaining.rfind(pattern)
                            if pos != -1 and pos < end_pos:
                                end_pos = pos

                        code_content = remaining[:end_pos]

                        if code_content and len(code_content) > 50:  # Sanity check
                            result = {
                                "file_path": file_path_match.group(1) if file_path_match else "app/core/generated.py",
                                "code": code_content,
                                "type": type_match.group(1) if type_match else "new_file",
                                "description": desc_match.group(1) if desc_match else "Auto-generated code"
                            }
                            logger.info(f"✅ Extracted code manually: {len(code_content)} chars")
                            return result
        except Exception as e:
            logger.warning(f"Manual extraction failed: {e}")

        # Last resort: find JSON object boundaries
        start = clean_text.find("{")
        end = clean_text.rfind("}")
        if start != -1 and end != -1 and end > start:
            try:
                return json.loads(clean_text[start:end+1])
            except json.JSONDecodeError as e:
                logger.warning(f"JSON parse failed: {e}")

        logger.error(f"Could not parse JSON from response (first 200 chars): {text[:200]}...")
        raise ValueError("Invalid JSON format in LLM response")
