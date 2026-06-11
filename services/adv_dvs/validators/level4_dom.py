import asyncio
import logging
from typing import Dict, Any, List
from playwright.async_api import async_playwright

from ..config import settings

logger = logging.getLogger(__name__)

class Level4DOMValidator:
    """
    Рівень 4: DOM Testing
    Перевіряє відображення сторінок Frontend, помилки JS, React, порожні компоненти, та мережеві запити.
    """
    
    PAGES_TO_CHECK = [
        "/login",
        "/dashboard",
        "/search",
        "/market",
        "/osint",
        "/nexus",
        "/financial",
        "/modeling",
        "/admin"
    ]

    async def validate(self) -> Dict[str, Any]:
        result = {
            "level": 4,
            "name": "DOM Testing",
            "status": "pass",
            "details": {}
        }
        
        frontend_url = getattr(settings, "frontend_url", "http://predator_frontend:3030")
        
        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                
                for page_path in self.PAGES_TO_CHECK:
                    page_result = await self._check_page(browser, f"{frontend_url}{page_path}")
                    result["details"][page_path] = page_result
                    
                    if page_result.get("status") != "pass":
                        result["status"] = "fail"
                
                await browser.close()
        except Exception as e:
            result["status"] = "fail"
            result["error"] = str(e)
            
        return result

    async def _check_page(self, browser, url: str) -> Dict[str, Any]:
        context = await browser.new_context()
        page = await context.new_page()
        
        errors = []
        warnings = []
        
        # Перехоплення помилок JS у консолі
        page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
        page.on("console", lambda msg: warnings.append(msg.text) if msg.type == "warning" else None)
        
        # Перехоплення UnhandledPromiseRejection (через pageerror)
        page.on("pageerror", lambda exc: errors.append(str(exc)))
        
        try:
            # Перехід на сторінку
            response = await page.goto(url, wait_until="networkidle", timeout=15000)
            
            status_code = response.status if response else 0
            
            if status_code >= 400 and status_code != 401: # 401 is normal for protected routes without auth
                return {"status": "fail", "error": f"HTTP {status_code}"}
                
            # Перевірка на React Error Boundary (шукаємо типовий текст або клас)
            error_boundary = await page.locator("text='Something went wrong'").count()
            if error_boundary > 0:
                errors.append("React Error Boundary triggered")
                
            # Перевірка на "білий екран" (порожній root)
            root_html = await page.locator("#root").inner_html()
            if not root_html.strip():
                errors.append("Empty #root element (White Screen of Death)")

        except Exception as e:
            errors.append(f"Navigation failed: {str(e)}")
            
        finally:
            await context.close()

        status = "pass"
        if len(errors) > 0:
            status = "fail"
        elif len(warnings) > 0:
            status = "warning"

        return {
            "status": status,
            "js_errors_count": len(errors),
            "js_warnings_count": len(warnings),
            "errors_preview": errors[:3] if errors else []
        }
