import logging
from playwright.async_api import async_playwright

logger = logging.getLogger(__name__)

class DOMChecker:
    async def run(self):
        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                page = await browser.new_page()
                # Assuming the frontend runs on port 3030 as per requirements
                await page.goto("http://localhost:3030", timeout=10000)
                
                # Simple DOM node counter to simulate DOM processing
                nodes = await page.evaluate("""
                    () => Array.from(document.querySelectorAll('*')).length
                """)
                
                # Close browser
                await browser.close()
                
                return {
                    "dom_size": nodes,
                    "status": "HYDRATED" if nodes > 10 else "EMPTY"
                }
        except Exception as e:
            logger.error(f"DOM check failed: {e}")
            return {"status": "FAIL", "error": str(e)}
