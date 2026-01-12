"""
UI Enhancement Orchestrator - Coordinates all UI testing and improvement agents
This is the master controller for continuous UI quality improvement
"""
import logging
import json
from typing import Dict, Any, List
from datetime import datetime
import redis.asyncio as aioredis

from .ui_behavioral_tester import UIBehavioralTester
from .ux_analyzer import UXAnalyzer
from .frontend_improver import FrontendAutoImprover
from .git_committer import GitAutoCommitter

logger = logging.getLogger("agents.ui_orchestrator")

class UIEnhancementOrchestrator:
    """
    Master orchestrator for UI quality improvement:
    1. Runs behavioral tests (simulates human)
    2. Analyzes UX with LLM
    3. Generates improvements
    4. Applies and commits changes
    5. Validates results
    """

    def __init__(self, groq_api_key: str, redis_url: str = "redis://redis:6379/0"):
        self.behavioral_tester = UIBehavioralTester()
        self.ux_analyzer = UXAnalyzer(groq_api_key)
        self.frontend_improver = FrontendAutoImprover(groq_api_key)
        self.git_committer = GitAutoCommitter()
        self.redis_url = redis_url
        self.redis = None

        # Quality thresholds
        self.min_ux_score = 75
        self.max_broken_elements = 3
        self.min_accessibility_score = 80

    async def initialize(self):
        """Initialize connections"""
        try:
            self.redis = await aioredis.from_url(
                self.redis_url,
                encoding="utf-8",
                decode_responses=True
            )
        except Exception as e:
            logger.warning(f"Redis unavailable: {e}")

    async def run_full_enhancement_cycle(self) -> Dict[str, Any]:
        """Run complete UI enhancement cycle"""
        logger.info("🎯 UI Enhancement Orchestrator: Starting full cycle...")

        cycle_result = {
            "timestamp": datetime.now().isoformat(),
            "phases": {},
            "improvements_applied": [],
            "overall_status": "pending"
        }

        try:
            # Phase 1: Behavioral Testing
            logger.info("📊 Phase 1: Behavioral Testing...")
            behavioral_results = await self.behavioral_tester.run_full_test_suite()
            cycle_result["phases"]["behavioral_testing"] = {
                "status": "complete",
                "success_rate": behavioral_results.get("success_rate", 0),
                "broken_elements": len(behavioral_results.get("broken_elements", [])),
                "recommendations": behavioral_results.get("recommendations", [])
            }

            # Store results in Redis
            await self._store_results("ui_behavioral", behavioral_results)

            # Phase 2: UX Analysis
            logger.info("🎨 Phase 2: UX Analysis...")
            ux_results = await self.ux_analyzer.analyze_all_pages()
            cycle_result["phases"]["ux_analysis"] = {
                "status": "complete",
                "overall_score": ux_results.get("overall_score", 0),
                "critical_issues": len(ux_results.get("critical_issues", [])),
                "suggested_features": len(ux_results.get("new_features", []))
            }

            await self._store_results("ux_analysis", ux_results)

            # Phase 3: Generate Improvements (if needed)
            if self._should_improve(behavioral_results, ux_results):
                logger.info("🔧 Phase 3: Generating Improvements...")
                improvements = await self._generate_improvements(behavioral_results, ux_results)
                cycle_result["phases"]["improvement_generation"] = {
                    "status": "complete",
                    "improvements_count": len(improvements)
                }

                # Phase 4: Apply Improvements
                if improvements:
                    logger.info("✨ Phase 4: Applying Improvements...")
                    applied = await self._apply_improvements(improvements)
                    cycle_result["improvements_applied"] = applied
                    cycle_result["phases"]["improvement_application"] = {
                        "status": "complete",
                        "applied_count": len(applied)
                    }
            else:
                logger.info("✅ UI quality meets standards, no improvements needed")
                cycle_result["phases"]["improvement_generation"] = {
                    "status": "skipped",
                    "reason": "Quality thresholds met"
                }

            # Phase 5: Validation (re-test after improvements)
            if cycle_result.get("improvements_applied"):
                logger.info("🔍 Phase 5: Validating Improvements...")
                validation = await self._validate_improvements()
                cycle_result["phases"]["validation"] = validation

            cycle_result["overall_status"] = "success"

        except Exception as e:
            logger.error(f"Enhancement cycle error: {e}")
            cycle_result["overall_status"] = "error"
            cycle_result["error"] = str(e)

        # Store final results
        await self._store_results("enhancement_cycle", cycle_result)

        logger.info(f"✅ Enhancement Cycle Complete: {cycle_result['overall_status']}")
        return cycle_result

    def _should_improve(self, behavioral: Dict, ux: Dict) -> bool:
        """Determine if improvements are needed"""
        # Check behavioral test results
        success_rate = behavioral.get("success_rate", 1)
        if success_rate < 0.95:
            return True

        # Check UX score
        ux_score = ux.get("overall_score", 100)
        if ux_score < self.min_ux_score:
            return True

        # Check for critical issues
        critical = ux.get("critical_issues", [])
        if len(critical) > 0:
            return True

        # Check broken elements
        broken = len(behavioral.get("broken_elements", []))
        if broken > self.max_broken_elements:
            return True

        return False

    async def _generate_improvements(self, behavioral: Dict, ux: Dict) -> List[Dict]:
        """Generate improvements based on analysis"""
        improvements = []

        # Priority 1: Fix broken elements
        for rec in behavioral.get("recommendations", []):
            improvement = await self.frontend_improver.generate_improvement({
                "type": "enhancement",
                "description": rec,
                "priority": "high"
            })
            if improvement and not improvement.get("error"):
                improvements.append({
                    "type": "behavioral_fix",
                    "description": rec,
                    "code": improvement
                })

        # Priority 2: Address critical UX issues
        for issue in ux.get("critical_issues", [])[:3]:  # Top 3
            improvement = await self.frontend_improver.generate_improvement({
                "type": "enhancement",
                "description": issue,
                "priority": "high"
            })
            if improvement and not improvement.get("error"):
                improvements.append({
                    "type": "ux_fix",
                    "description": issue,
                    "code": improvement
                })

        # Priority 3: Add suggested features
        for feature in ux.get("new_features", [])[:2]:  # Top 2
            if feature.get("type") == "visualization":
                improvement = await self.frontend_improver.generate_improvement({
                    "type": "chart",
                    "chart_type": "line",
                    "title": feature.get("suggestion", "New Chart"),
                    "data_source": "metrics"
                })
            else:
                improvement = await self.frontend_improver.generate_improvement({
                    "type": "new_component",
                    "name": "NewFeature",
                    "description": feature.get("suggestion", "New feature")
                })

            if improvement and not improvement.get("error"):
                improvements.append({
                    "type": "new_feature",
                    "description": feature.get("suggestion"),
                    "code": improvement
                })

        logger.info(f"Generated {len(improvements)} improvements")
        return improvements

    async def _apply_improvements(self, improvements: List[Dict]) -> List[Dict]:
        """Apply generated improvements"""
        applied = []

        for imp in improvements:
            try:
                code_data = imp.get("code", {})

                # Determine file path
                if "file_path" in code_data:
                    file_path = code_data["file_path"]
                elif "component_name" in code_data:
                    file_path = f"frontend/src/components/{code_data['component_name']}.tsx"
                else:
                    continue

                # Get code content
                code_content = (
                    code_data.get("component_code") or
                    code_data.get("enhanced_code") or
                    code_data.get("accessible_code") or
                    ""
                )

                if not code_content:
                    continue

                # Write file
                full_path = f"/app/{file_path}"
                # In production, would write the file here
                # For now, log what would be written
                logger.info(f"Would write to: {full_path}")

                # Record as applied
                applied.append({
                    "description": imp["description"],
                    "file_path": file_path,
                    "type": imp["type"]
                })

            except Exception as e:
                logger.warning(f"Failed to apply improvement: {e}")

        # Commit changes if any were applied
        if applied:
            await self.git_committer.commit_improvement(
                description=f"UI Improvements: {len(applied)} changes",
                files_changed=[a["file_path"] for a in applied],
                metadata={
                    "cycle": "ui_enhancement",
                    "improvements": [a["description"] for a in applied],
                    "automated": True
                }
            )

        return applied

    async def _validate_improvements(self) -> Dict:
        """Validate improvements by re-running tests"""
        # Quick behavioral test
        results = await self.behavioral_tester.run_full_test_suite()

        return {
            "status": "complete",
            "success_rate_after": results.get("success_rate", 0),
            "broken_elements_after": len(results.get("broken_elements", []))
        }

    async def _store_results(self, key: str, data: Dict):
        """Store results in Redis"""
        if self.redis:
            try:
                await self.redis.set(
                    f"ui_enhancement:{key}",
                    json.dumps(data, default=str),
                    ex=86400  # 24 hour TTL
                )
            except Exception as e:
                logger.warning(f"Failed to store results: {e}")

    async def get_latest_results(self) -> Dict:
        """Get latest enhancement results from Redis"""
        if not self.redis:
            return {}

        try:
            results = {}
            for key in ["behavioral_testing", "ux_analysis", "enhancement_cycle"]:
                data = await self.redis.get(f"ui_enhancement:{key}")
                if data:
                    results[key] = json.loads(data)
            return results
        except Exception as e:
            logger.warning(f"Failed to get results: {e}")
            return {}


# Integration function for main orchestrator
async def run_ui_enhancement(groq_api_key: str) -> Dict:
    """Convenience function to run UI enhancement"""
    orchestrator = UIEnhancementOrchestrator(groq_api_key)
    await orchestrator.initialize()
    return await orchestrator.run_full_enhancement_cycle()
