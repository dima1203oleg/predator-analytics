"""
UI Behavioral Tester - Simulates human interactions
Clicks buttons, fills forms, navigates like a real user
"""
import asyncio
import logging
from typing import Dict, Any, List
from playwright.async_api import async_playwright, Page, ElementHandle
from dataclasses import dataclass

logger = logging.getLogger("agents.ui_behavioral_tester")

@dataclass
class InteractionResult:
    action: str
    selector: str
    success: bool
    response_time_ms: float
    error: str = None
    screenshot: bytes = None

class UIBehavioralTester:
    """
    Simulates real user behavior on the UI:
    - Clicks all buttons and links
    - Fills forms with test data
    - Measures response times
    - Detects broken interactions
    - Validates visual elements
    """

    def __init__(self):
        self.base_url = "http://frontend:80"
        self.test_scenarios = [
            {"name": "Dashboard Navigation", "path": "/", "actions": ["explore"]},
            {"name": "Search Flow", "path": "/search", "actions": ["search", "filter"]},
            {"name": "Dataset Studio", "path": "/dataset-studio", "actions": ["upload", "explore"]},
            {"name": "Monitoring Check", "path": "/monitoring", "actions": ["check_charts"]},
            {"name": "Council Status", "path": "/council", "actions": ["view_decisions"]},
        ]

    async def run_full_test_suite(self) -> Dict[str, Any]:
        """Run complete behavioral test suite"""
        logger.info("🤖 UI Behavioral Tester: Starting human simulation...")

        results = {
            "scenarios": [],
            "total_interactions": 0,
            "successful": 0,
            "failed": 0,
            "avg_response_time": 0,
            "broken_elements": [],
            "usability_issues": [],
            "recommendations": []
        }

        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                context = await browser.new_context(
                    viewport={"width": 1920, "height": 1080},
                    user_agent="Predator-UI-Tester/1.0"
                )
                page = await context.new_page()

                # Enable console logging from page
                page.on("console", lambda msg: logger.debug(f"Browser: {msg.text}"))
                page.on("pageerror", lambda err: results["broken_elements"].append(str(err)))

                for scenario in self.test_scenarios:
                    scenario_result = await self._run_scenario(page, scenario)
                    results["scenarios"].append(scenario_result)

                    results["total_interactions"] += scenario_result["interactions"]
                    results["successful"] += scenario_result["successful"]
                    results["failed"] += scenario_result["failed"]

                await browser.close()

        except Exception as e:
            logger.error(f"Behavioral test error: {e}")
            results["error"] = str(e)

        # Calculate metrics
        if results["total_interactions"] > 0:
            results["success_rate"] = results["successful"] / results["total_interactions"]

        # Generate recommendations
        results["recommendations"] = await self._generate_recommendations(results)

        logger.info(f"✅ Behavioral Test Complete: {results['successful']}/{results['total_interactions']} passed")
        return results

    async def _run_scenario(self, page: Page, scenario: Dict) -> Dict:
        """Run a single test scenario"""
        result = {
            "name": scenario["name"],
            "path": scenario["path"],
            "interactions": 0,
            "successful": 0,
            "failed": 0,
            "actions": []
        }

        try:
            # Navigate to page
            await page.goto(f"{self.base_url}{scenario['path']}", timeout=15000)
            await page.wait_for_load_state("networkidle", timeout=10000)

            # Discover interactive elements
            buttons = await page.query_selector_all("button, [role='button']")
            links = await page.query_selector_all("a[href]")
            inputs = await page.query_selector_all("input, textarea, select")

            logger.info(f"📍 {scenario['name']}: Found {len(buttons)} buttons, {len(links)} links, {len(inputs)} inputs")

            # Test buttons
            for button in buttons[:10]:  # Limit to prevent infinite loops
                action_result = await self._test_button(page, button)
                result["actions"].append(action_result)
                result["interactions"] += 1
                if action_result["success"]:
                    result["successful"] += 1
                else:
                    result["failed"] += 1

            # Test inputs
            for input_elem in inputs[:5]:
                action_result = await self._test_input(page, input_elem)
                result["actions"].append(action_result)
                result["interactions"] += 1
                if action_result["success"]:
                    result["successful"] += 1
                else:
                    result["failed"] += 1

            # Check for charts and data visualizations
            charts = await page.query_selector_all("[class*='chart'], [class*='graph'], canvas, svg")
            result["charts_found"] = len(charts)

            # Check for loading states
            loaders = await page.query_selector_all("[class*='loading'], [class*='spinner']")
            if len(loaders) > 0:
                result["has_loading_indicators"] = True

        except Exception as e:
            logger.warning(f"Scenario {scenario['name']} error: {e}")
            result["error"] = str(e)

        return result

    async def _test_button(self, page: Page, button: ElementHandle) -> Dict:
        """Test a button click"""
        try:
            # Get button info
            text = await button.text_content()
            is_visible = await button.is_visible()
            is_enabled = await button.is_enabled()

            if not is_visible or not is_enabled:
                return {
                    "type": "button",
                    "text": text,
                    "success": True,
                    "skipped": True,
                    "reason": "Not visible or disabled"
                }

            # Measure click response time
            start = asyncio.get_event_loop().time()

            # Click with navigation detection
            async with page.expect_navigation(timeout=3000) as nav:
                try:
                    await button.click(timeout=2000)
                except:
                    pass  # No navigation expected

            response_time = (asyncio.get_event_loop().time() - start) * 1000

            return {
                "type": "button",
                "text": text[:50] if text else "unnamed",
                "success": True,
                "response_time_ms": response_time
            }

        except Exception as e:
            return {
                "type": "button",
                "success": False,
                "error": str(e)[:100]
            }

    async def _test_input(self, page: Page, input_elem: ElementHandle) -> Dict:
        """Test an input field"""
        try:
            input_type = await input_elem.get_attribute("type") or "text"
            placeholder = await input_elem.get_attribute("placeholder") or ""
            is_visible = await input_elem.is_visible()

            if not is_visible:
                return {"type": "input", "success": True, "skipped": True}

            # Type test data based on input type
            test_data = {
                "text": "Test Query",
                "email": "test@predator.ai",
                "number": "42",
                "search": "machine learning",
                "date": "2024-01-01"
            }

            test_value = test_data.get(input_type, "test data")

            await input_elem.fill(test_value)
            actual_value = await input_elem.input_value()

            return {
                "type": "input",
                "input_type": input_type,
                "placeholder": placeholder[:30],
                "success": actual_value == test_value,
                "accepts_input": True
            }

        except Exception as e:
            return {
                "type": "input",
                "success": False,
                "error": str(e)[:100]
            }

    async def _generate_recommendations(self, results: Dict) -> List[str]:
        """Generate UX improvement recommendations"""
        recommendations = []

        if results["failed"] > 0:
            recommendations.append(f"Fix {results['failed']} broken interactive elements")

        if len(results.get("broken_elements", [])) > 0:
            recommendations.append("JavaScript errors detected - check console logs")

        # Check for missing loading indicators
        for scenario in results.get("scenarios", []):
            if not scenario.get("has_loading_indicators"):
                recommendations.append(f"Add loading indicators to {scenario['name']}")

            if scenario.get("charts_found", 0) == 0 and "monitoring" in scenario.get("path", "").lower():
                recommendations.append("Add data visualizations to Monitoring page")

        return recommendations
