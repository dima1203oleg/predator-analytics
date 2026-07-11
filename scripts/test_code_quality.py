from __future__ import annotations

import asyncio
import sys
from unittest.mock import MagicMock

# Adjust path
sys.path.append("/Users/dima-mac/Documents/Predator_21/services/api_gateway")

# Mock libs
sys.modules["libs"] = MagicMock()
sys.modules["libs.core"] = MagicMock()
sys.modules["libs.core.structured_logger"] = MagicMock()

# Import
from app.services.code_quality_analyzer import CodeQualityAnalyzer


async def test_analyzer():

    # Analyze current directory (repo root partially) or api-gateway root
    root_dir = "/Users/dima-mac/Documents/Predator_21/services/api_gateway/app"
    analyzer = CodeQualityAnalyzer(root_dir=root_dir)

    analysis = analyzer.analyze_codebase()

    summary = analysis['summary']

    for _f in analysis['top_offenders_complexity'][:3]:
        pass

    tasks = await analyzer.generate_improvements()
    for _t in tasks[:3]:
        pass

    assert summary['total_files'] > 0, "Should find files in app directory"

if __name__ == "__main__":
    asyncio.run(test_analyzer())
