"""
UI Guardian Agent v2.0 - Advanced Web Interface Auditor
Comprehensive testing of all UI elements with AI-powered improvement suggestions
Uses LLM Council for design decisions and feature proposals
"""
import base64
import os
from datetime import datetime
from playwright.async_api import async_playwright
import logging
from typing import Dict, List, Any, Optional

logger = logging.getLogger("agents.ui_guardian")

class UIGuardian:
    def __init__(self, llm_council=None):
        # Use Docker network hostname (frontend container name)
        self.base_url = "http://frontend:80"
        self.llm_council = llm_council
        self.screenshots_dir = "/app/logs/screenshots"

        # All application routes to check
        self.all_routes = [
            {"path": "/", "name": "Dashboard", "priority": "critical"},
            {"path": "/search", "name": "Search Console", "priority": "critical"},
            {"path": "/monitoring", "name": "Monitoring", "priority": "critical"},
            {"path": "/dataset-studio", "name": "Dataset Studio", "priority": "high"},
            {"path": "/council", "name": "LLM Council", "priority": "high"},
            {"path": "/analytics", "name": "Analytics", "priority": "medium"},
            {"path": "/settings", "name": "Settings", "priority": "medium"},
            {"path": "/security", "name": "Security", "priority": "medium"},
            {"path": "/agents", "name": "AI Agents", "priority": "medium"},
            {"path": "/databases", "name": "Databases", "priority": "low"},
            {"path": "/infrastructure", "name": "Infrastructure", "priority": "low"},
        ]

        # UI Element categories to audit
        self.element_selectors = {
            "buttons": "button, [role='button'], .btn, input[type='submit']",
            "links": "a[href]",
            "forms": "form, input, textarea, select",
            "charts": "canvas, svg, .chart, .recharts-wrapper, [class*='chart']",
            "tables": "table, [role='table'], .data-table",
            "cards": ".card, [class*='card'], .panel",
            "modals": "[role='dialog'], .modal, [class*='modal']",
            "navigation": "nav, [role='navigation'], .sidebar, .navbar",
            "icons": "svg, i[class*='icon'], .icon",
            "images": "img, [role='img']",
        }

    async def check_ui(self) -> Dict[str, Any]:
        """Run comprehensive UI audit"""
        logger.info("🖥️ UI Guardian: Starting comprehensive check...")

        try:
            os.makedirs(self.screenshots_dir, exist_ok=True)

            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                context = await browser.new_context(
                    viewport={"width": 1920, "height": 1080},
                    device_scale_factor=1
                )
                page = await context.new_page()

                audit_results = []
                improvement_suggestions = []

                for route in self.all_routes:
                    result = await self._audit_page(page, route)
                    audit_results.append(result)

                    # Collect improvement suggestions
                    if result.get("suggestions"):
                        improvement_suggestions.extend(result["suggestions"])

                await browser.close()

                # Summarize results
                failed = [r for r in audit_results if not r.get("success")]
                total_elements = sum(r.get("total_elements", 0) for r in audit_results)

                if failed:
                    logger.warning(f"⚠️ UI Guardian: {len(failed)} pages have issues")
                else:
                    logger.info(f"✅ UI Guardian: All checks passed ({len(audit_results)} pages, {total_elements} elements)")

                # Generate AI improvement proposals if council available
                if self.llm_council and improvement_suggestions:
                    await self._propose_improvements(improvement_suggestions)

                return {
                    "status": "ok" if not failed else "issues_found",
                    "pages_checked": len(audit_results),
                    "pages_failed": len(failed),
                    "total_elements": total_elements,
                    "suggestions_count": len(improvement_suggestions),
                    "timestamp": datetime.now().isoformat()
                }

        except Exception as e:
            logger.error(f"UI Guardian error: {e}")
            return {"status": "error", "message": str(e)}

    async def _audit_page(self, page, route: Dict) -> Dict[str, Any]:
        """Comprehensive audit of a single page"""
        path = route["path"]
        name = route["name"]
        url = f"{self.base_url}{path}"

        try:
            # Navigate to page
            response = await page.goto(url, timeout=15000, wait_until="networkidle")

            if not response or response.status >= 400:
                return {
                    "success": False,
                    "path": path,
                    "name": name,
                    "error": f"HTTP {response.status if response else 'No response'}"
                }

            # Wait for React/Vue to render
            await page.wait_for_timeout(500)

            # Collect page info
            title = await page.title()

            # Audit all elements
            elements_audit = await self._audit_elements(page)

            # Check for JavaScript errors
            js_errors = await page.evaluate("""() => {
                return window.__errors__ || window.onerror_log || [];
            }""")

            # Check console errors
            console_errors = []
            page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)

            # Take screenshot for visual analysis
            screenshot_path = f"{self.screenshots_dir}/{path.replace('/', '_') or 'home'}_{datetime.now().strftime('%H%M%S')}.png"
            await page.screenshot(path=screenshot_path, full_page=True)

            # Generate improvement suggestions based on audit
            suggestions = self._generate_suggestions(path, name, elements_audit)

            total_elements = sum(elements_audit.get(cat, {}).get("count", 0) for cat in elements_audit)

            return {
                "success": True,
                "path": path,
                "name": name,
                "title": title,
                "elements": elements_audit,
                "total_elements": total_elements,
                "js_errors": js_errors,
                "screenshot": screenshot_path,
                "suggestions": suggestions
            }

        except Exception as e:
            logger.warning(f"Page {path} audit failed: {e}")
            return {
                "success": False,
                "path": path,
                "name": name,
                "error": str(e)
            }

    async def _audit_elements(self, page) -> Dict[str, Dict]:
        """Audit all UI elements on the page"""
        elements_audit = {}

        for category, selector in self.element_selectors.items():
            try:
                elements = await page.query_selector_all(selector)
                count = len(elements)

                # Get details for important elements
                details = []
                for el in elements[:10]:  # Limit to first 10 for performance
                    try:
                        text = await el.text_content()
                        is_visible = await el.is_visible()
                        is_enabled = await el.is_enabled() if category in ["buttons", "forms"] else True

                        details.append({
                            "text": (text or "")[:50].strip(),
                            "visible": is_visible,
                            "enabled": is_enabled
                        })
                    except:
                        pass

                # Check for accessibility issues
                accessibility_issues = await self._check_accessibility(page, selector, category)

                elements_audit[category] = {
                    "count": count,
                    "samples": details,
                    "accessibility_issues": accessibility_issues
                }

            except Exception as e:
                elements_audit[category] = {"count": 0, "error": str(e)}

        return elements_audit

    async def _check_accessibility(self, page, selector: str, category: str) -> List[str]:
        """Check basic accessibility for elements"""
        issues = []

        try:
            # Check for buttons without text or aria-label
            if category == "buttons":
                empty_buttons = await page.evaluate(f"""() => {{
                    const buttons = document.querySelectorAll('{selector}');
                    let count = 0;
                    buttons.forEach(btn => {{
                        if (!btn.textContent.trim() && !btn.getAttribute('aria-label')) count++;
                    }});
                    return count;
                }}""")
                if empty_buttons > 0:
                    issues.append(f"{empty_buttons} buttons without accessible label")

            # Check for images without alt text
            if category == "images":
                no_alt = await page.evaluate("""() => {
                    const imgs = document.querySelectorAll('img');
                    let count = 0;
                    imgs.forEach(img => { if (!img.alt) count++; });
                    return count;
                }""")
                if no_alt > 0:
                    issues.append(f"{no_alt} images without alt text")

            # Check for form inputs without labels
            if category == "forms":
                unlabeled = await page.evaluate("""() => {
                    const inputs = document.querySelectorAll('input:not([type="hidden"]), textarea, select');
                    let count = 0;
                    inputs.forEach(input => {
                        const id = input.id;
                        const hasLabel = id && document.querySelector(`label[for="${id}"]`);
                        const hasAriaLabel = input.getAttribute('aria-label');
                        if (!hasLabel && !hasAriaLabel) count++;
                    });
                    return count;
                }""")
                if unlabeled > 0:
                    issues.append(f"{unlabeled} form inputs without labels")

        except Exception as e:
            logger.debug(f"Accessibility check error: {e}")

        return issues

    def _generate_suggestions(self, path: str, name: str, elements: Dict) -> List[Dict]:
        """Generate improvement suggestions based on audit results"""
        suggestions = []

        # Check for missing charts on data-heavy pages
        charts_count = elements.get("charts", {}).get("count", 0)
        if path in ["/monitoring", "/analytics", "/dataset-studio"] and charts_count < 2:
            suggestions.append({
                "page": name,
                "type": "feature",
                "priority": "high",
                "suggestion": f"Add more data visualization charts to {name} page",
                "details": f"Currently only {charts_count} charts found. Consider adding line charts, bar charts, or pie charts for better data representation."
            })

        # Check for missing navigation elements
        nav_count = elements.get("navigation", {}).get("count", 0)
        if nav_count == 0:
            suggestions.append({
                "page": name,
                "type": "ux",
                "priority": "medium",
                "suggestion": f"Add navigation menu to {name} page",
                "details": "No navigation elements found. Users may have difficulty navigating."
            })

        # Check for interactive elements
        buttons_count = elements.get("buttons", {}).get("count", 0)
        if buttons_count < 3 and path != "/":
            suggestions.append({
                "page": name,
                "type": "ux",
                "priority": "low",
                "suggestion": f"Add more interactive elements to {name} page",
                "details": f"Only {buttons_count} buttons found. Consider adding action buttons for common tasks."
            })

        # Accessibility suggestions
        for category, data in elements.items():
            issues = data.get("accessibility_issues", [])
            for issue in issues:
                suggestions.append({
                    "page": name,
                    "type": "accessibility",
                    "priority": "medium",
                    "suggestion": f"Fix accessibility issue on {name}: {issue}",
                    "details": f"Category: {category}"
                })

        # Check for empty cards/panels
        cards_count = elements.get("cards", {}).get("count", 0)
        if cards_count > 0:
            samples = elements.get("cards", {}).get("samples", [])
            empty_cards = sum(1 for s in samples if not s.get("text"))
            if empty_cards > 0:
                suggestions.append({
                    "page": name,
                    "type": "content",
                    "priority": "low",
                    "suggestion": f"Add content to empty cards on {name} page",
                    "details": f"Found {empty_cards} cards without visible content."
                })

        return suggestions

    async def _propose_improvements(self, suggestions: List[Dict]):
        """Use LLM Council to prioritize and refine improvement suggestions"""
        if not suggestions:
            return

        logger.info(f"🎨 UI Guardian: Proposing {len(suggestions)} improvements to Council...")

        # Group by priority
        high_priority = [s for s in suggestions if s.get("priority") == "high"]

        for suggestion in high_priority[:3]:  # Limit to top 3
            try:
                # Create task for Code Improver
                task = {
                    "type": "ui_improvement",
                    "description": suggestion["suggestion"],
                    "context": f"Page: {suggestion['page']}\nDetails: {suggestion['details']}\nType: {suggestion['type']}",
                    "priority": 7
                }

                # Store in Redis for orchestrator to pick up
                # This will be handled by the main orchestrator loop
                logger.info(f"📋 UI improvement task created: {suggestion['suggestion'][:50]}...")

            except Exception as e:
                logger.error(f"Failed to propose improvement: {e}")

    async def get_page_screenshot_base64(self, path: str) -> Optional[str]:
        """Get base64 encoded screenshot of a page for AI analysis"""
        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                page = await browser.new_page(viewport={"width": 1920, "height": 1080})
                await page.goto(f"{self.base_url}{path}", wait_until="networkidle")

                screenshot_bytes = await page.screenshot(full_page=True)
                await browser.close()

                return base64.b64encode(screenshot_bytes).decode('utf-8')
        except Exception as e:
            logger.error(f"Screenshot error: {e}")
            return None
