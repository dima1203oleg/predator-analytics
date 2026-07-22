import logging
from typing import Dict, Any
import textwrap
import os
from urllib.parse import urlparse
from app.services.ai_service import AIService

logger = logging.getLogger(__name__)

class ConnectorGenerator:
    """
    Етап 4-7: Connector Generator & Smart Schema Engine
    Генерує базовий код для нового джерела.
    """
    async def generate(self, profile: Dict[str, Any]) -> str:
        """
        Генерує код конектора на основі профілю.
        """
        source_type = profile.get("type", "unknown")
        url = profile.get("url", "")
        
        logger.info(f"Generator: Створення конектора для типу {source_type}")
        
        # AI Code Generation
        prompt = f"""
        You are an expert Python data engineer. Write a fully functional Python class for a data connector.
        The connector should be an async httpx client that fetches data from a source.
        Source Type: {source_type}
        URL: {url}
        Auth Type: {profile.get('auth_type', 'none')}
        Pagination: {profile.get('pagination', 'none')}
        
        Requirements:
        1. Class name must end with 'Connector'.
        2. Must have a fetch_data() async method.
        3. Only output valid Python code (no markdown outside the python block).
        4. Include logging.
        """
        
        try:
            logger.info("Generator: Запит до AI для генерації коду...")
            ai_response = await AIService.get_reasoning(prompt=prompt, context={"role": "Data Engineer"})
            
            # Витягування python коду з відповіді
            if "```python" in ai_response:
                code = ai_response.split("```python")[1].split("```")[0].strip()
            else:
                code = ai_response.replace("```", "").strip()
            
            # Збереження коду у файл
            domain = urlparse(url).netloc.replace(".", "_") or "unknown_source"
            file_name = f"{domain}_connector.py"
            save_path = os.path.join(os.path.dirname(__file__), "auto_connectors", file_name)
            
            with open(save_path, "w", encoding="utf-8") as f:
                f.write(code)
                
            logger.info(f"Generator: Конектор успішно згенеровано та збережено: {save_path}")
            return code
            
        except Exception as e:
            logger.error(f"Generator: Помилка генерації коду: {e}")
            return f"# Помилка генерації: {e}"
