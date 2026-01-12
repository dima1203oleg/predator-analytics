"""
UI/UX Analyzer - Uses LLM to analyze screenshots and suggest improvements
Generates actionable design recommendations
"""
import logging
import json
from typing import Dict, Any, List
from playwright.async_api import async_playwright
import httpx

logger = logging.getLogger("agents.ux_analyzer")

class UXAnalyzer:
    """
    Analyzes UI screenshots using vision-capable LLMs to:
    - Identify UX problems
    - Suggest design improvements
    - Recommend new visualizations
    - Check accessibility
    - Verify data presentation quality
    """

    def __init__(self, groq_api_key: str):
        self.groq_api_key = groq_api_key
        self.base_url = "http://frontend:80"

        self.pages_to_analyze = [
            {"path": "/", "name": "Dashboard", "expected": ["navigation", "metrics", "charts"]},
            {"path": "/search", "name": "Search", "expected": ["search input", "results", "filters"]},
            {"path": "/monitoring", "name": "Monitoring", "expected": ["charts", "metrics", "alerts"]},
            {"path": "/dataset-studio", "name": "Dataset Studio", "expected": ["upload", "data preview", "actions"]},
            {"path": "/council", "name": "Council", "expected": ["decisions", "history", "status"]},
        ]

    async def analyze_all_pages(self) -> Dict[str, Any]:
        """Analyze all pages and generate comprehensive UX report"""
        logger.info("🎨 UX Analyzer: Starting comprehensive analysis...")

        results = {
            "pages": [],
            "overall_score": 0,
            "critical_issues": [],
            "improvements": [],
            "new_features": []
        }

        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                page = await browser.new_page(viewport={"width": 1920, "height": 1080})

                for page_config in self.pages_to_analyze:
                    analysis = await self._analyze_page(page, page_config)
                    results["pages"].append(analysis)

                await browser.close()

        except Exception as e:
            logger.error(f"UX Analysis error: {e}")
            results["error"] = str(e)

        # Aggregate results
        results["overall_score"] = self._calculate_overall_score(results["pages"])
        results["critical_issues"] = self._extract_critical_issues(results["pages"])
        results["improvements"] = self._prioritize_improvements(results["pages"])
        results["new_features"] = await self._suggest_new_features(results)

        logger.info(f"✅ UX Analysis Complete. Score: {results['overall_score']}/100")
        return results

    async def _analyze_page(self, page, config: Dict) -> Dict:
        """Analyze a single page"""
        result = {
            "name": config["name"],
            "path": config["path"],
            "score": 0,
            "issues": [],
            "improvements": []
        }

        try:
            await page.goto(f"{self.base_url}{config['path']}", timeout=15000)
            await page.wait_for_load_state("networkidle", timeout=10000)

            # Take screenshot
            screenshot = await page.screenshot(full_page=True)

            # Analyze DOM structure
            dom_analysis = await self._analyze_dom(page)
            result["dom_analysis"] = dom_analysis

            # Check for expected elements
            for expected in config["expected"]:
                found = await self._check_element_exists(page, expected)
                if not found:
                    result["issues"].append(f"Missing expected element: {expected}")

            # Analyze color contrast
            contrast_issues = await self._check_color_contrast(page)
            result["contrast_issues"] = contrast_issues

            # Check responsive indicators
            result["responsive_ready"] = await self._check_responsive(page)

            # Analyze with LLM (text-based analysis since Groq doesn't support vision)
            llm_analysis = await self._llm_analyze_page(config, dom_analysis)
            result["llm_analysis"] = llm_analysis
            result["improvements"].extend(llm_analysis.get("improvements", []))

            # Calculate score
            result["score"] = self._calculate_page_score(result)

        except Exception as e:
            logger.warning(f"Page analysis error for {config['path']}: {e}")
            result["error"] = str(e)

        return result

    async def _analyze_dom(self, page) -> Dict:
        """Analyze DOM structure for UX patterns"""
        return await page.evaluate("""() => {
            const analysis = {
                headings: document.querySelectorAll('h1, h2, h3').length,
                buttons: document.querySelectorAll('button, [role="button"]').length,
                links: document.querySelectorAll('a[href]').length,
                inputs: document.querySelectorAll('input, textarea, select').length,
                images: document.querySelectorAll('img').length,
                charts: document.querySelectorAll('[class*="chart"], canvas, svg').length,
                tables: document.querySelectorAll('table').length,
                forms: document.querySelectorAll('form').length,
                modals: document.querySelectorAll('[class*="modal"], [role="dialog"]').length,
                hasNavigation: !!document.querySelector('nav, [role="navigation"]'),
                hasFooter: !!document.querySelector('footer'),
                hasSearch: !!document.querySelector('[type="search"], [class*="search"]'),
                ariaLabels: document.querySelectorAll('[aria-label]').length,
                emptyAltImages: document.querySelectorAll('img:not([alt]), img[alt=""]').length
            };
            return analysis;
        }""")

    async def _check_element_exists(self, page, element_type: str) -> bool:
        """Check if expected element type exists"""
        selectors = {
            "navigation": "nav, [role='navigation'], header",
            "metrics": "[class*='metric'], [class*='stat'], [class*='kpi']",
            "charts": "[class*='chart'], canvas, svg, [class*='graph']",
            "search input": "input[type='search'], [class*='search'] input",
            "results": "[class*='result'], [class*='list'], table",
            "filters": "[class*='filter'], select, [class*='dropdown']",
            "upload": "[type='file'], [class*='upload'], [class*='dropzone']",
            "data preview": "table, [class*='preview'], [class*='data']",
            "actions": "button, [class*='action']",
            "decisions": "[class*='decision'], [class*='card']",
            "history": "[class*='history'], [class*='log'], [class*='timeline']",
            "status": "[class*='status'], [class*='badge']",
            "alerts": "[class*='alert'], [class*='notification']"
        }

        selector = selectors.get(element_type, f"[class*='{element_type}']")
        element = await page.query_selector(selector)
        return element is not None

    async def _check_color_contrast(self, page) -> List[str]:
        """Check for potential color contrast issues"""
        issues = []
        # Basic check - would need more sophisticated analysis for real contrast
        low_contrast = await page.evaluate("""() => {
            const elements = document.querySelectorAll('*');
            let issues = [];
            for (let el of elements) {
                const style = getComputedStyle(el);
                const color = style.color;
                const bg = style.backgroundColor;
                // Very basic check for light-on-light or dark-on-dark
                if (color === bg && color !== 'rgba(0, 0, 0, 0)') {
                    issues.push(el.tagName);
                }
            }
            return issues.slice(0, 5);
        }""")
        return low_contrast

    async def _check_responsive(self, page) -> bool:
        """Check if page has responsive indicators"""
        return await page.evaluate("""() => {
            const meta = document.querySelector('meta[name="viewport"]');
            const mediaQueries = Array.from(document.styleSheets)
                .flatMap(sheet => {
                    try { return Array.from(sheet.cssRules); }
                    catch { return []; }
                })
                .filter(rule => rule.type === CSSRule.MEDIA_RULE).length;
            return !!meta || mediaQueries > 0;
        }""")

    async def _llm_analyze_page(self, config: Dict, dom_analysis: Dict) -> Dict:
        """Use LLM to analyze page and suggest improvements"""
        prompt = f"""Analyze this web page structure and suggest UX improvements:

Page: {config['name']} ({config['path']})
Expected Elements: {config['expected']}

Current DOM Analysis:
- Headings: {dom_analysis.get('headings', 0)}
- Buttons: {dom_analysis.get('buttons', 0)}
- Links: {dom_analysis.get('links', 0)}
- Forms: {dom_analysis.get('forms', 0)}
- Charts/Graphs: {dom_analysis.get('charts', 0)}
- Tables: {dom_analysis.get('tables', 0)}
- Images: {dom_analysis.get('images', 0)}
- Has Navigation: {dom_analysis.get('hasNavigation', False)}
- Has Search: {dom_analysis.get('hasSearch', False)}
- ARIA Labels: {dom_analysis.get('ariaLabels', 0)}
- Missing Alt Text: {dom_analysis.get('emptyAltImages', 0)}

Provide a JSON response with:
{{
    "score": <1-100>,
    "improvements": ["improvement 1", "improvement 2", ...],
    "missing_features": ["feature 1", "feature 2", ...],
    "chart_suggestions": ["chart type 1 for X data", ...],
    "accessibility_fixes": ["fix 1", ...]
}}"""

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.groq_api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "llama-3.3-70b-versatile",
                        "messages": [
                            {"role": "system", "content": "You are a UX expert. Respond only with valid JSON."},
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.3,
                        "response_format": {"type": "json_object"}
                    },
                    timeout=30
                )

                if response.status_code == 200:
                    data = response.json()
                    content = data["choices"][0]["message"]["content"]
                    return json.loads(content)

        except Exception as e:
            logger.warning(f"LLM analysis failed: {e}")

        return {"improvements": [], "score": 50}

    def _calculate_page_score(self, result: Dict) -> int:
        """Calculate UX score for a page"""
        score = 100

        # Deduct for issues
        score -= len(result.get("issues", [])) * 10
        score -= len(result.get("contrast_issues", [])) * 5

        # Deduct for missing accessibility
        dom = result.get("dom_analysis", {})
        if dom.get("emptyAltImages", 0) > 0:
            score -= 10
        if dom.get("ariaLabels", 0) < 5:
            score -= 5

        # Bonus for good structure
        if dom.get("hasNavigation"):
            score += 5
        if dom.get("charts", 0) > 0:
            score += 5

        # Include LLM score
        llm_score = result.get("llm_analysis", {}).get("score", 50)
        score = (score + llm_score) // 2

        return max(0, min(100, score))

    def _calculate_overall_score(self, pages: List[Dict]) -> int:
        """Calculate overall UX score"""
        if not pages:
            return 0
        scores = [p.get("score", 0) for p in pages]
        return sum(scores) // len(scores)

    def _extract_critical_issues(self, pages: List[Dict]) -> List[str]:
        """Extract critical issues from all pages"""
        critical = []
        for page in pages:
            for issue in page.get("issues", []):
                if "missing" in issue.lower() or "error" in issue.lower():
                    critical.append(f"[{page['name']}] {issue}")
        return critical

    def _prioritize_improvements(self, pages: List[Dict]) -> List[Dict]:
        """Prioritize improvements across all pages"""
        all_improvements = []
        for page in pages:
            for imp in page.get("improvements", []):
                all_improvements.append({
                    "page": page["name"],
                    "improvement": imp,
                    "priority": "high" if page.get("score", 100) < 70 else "medium"
                })
        return sorted(all_improvements, key=lambda x: x["priority"])

    async def _suggest_new_features(self, results: Dict) -> List[Dict]:
        """Suggest new features based on analysis"""
        suggestions = []

        for page in results.get("pages", []):
            llm = page.get("llm_analysis", {})

            # Chart suggestions
            for chart in llm.get("chart_suggestions", []):
                suggestions.append({
                    "page": page["name"],
                    "type": "visualization",
                    "suggestion": chart
                })

            # Missing features
            for feature in llm.get("missing_features", []):
                suggestions.append({
                    "page": page["name"],
                    "type": "feature",
                    "suggestion": feature
                })

        return suggestions
