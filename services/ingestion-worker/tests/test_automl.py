import pytest
from app.pipelines.automl_pipeline import AutoMLPipeline

@pytest.mark.asyncio
async def test_check_data_drift_below_threshold():
    pipeline = AutoMLPipeline()
    result = await pipeline.check_data_drift_and_retrain(1000)
    assert result["status"] == "skipped"
    assert result["reason"] == "insufficient_data"

@pytest.mark.asyncio
async def test_check_data_drift_above_threshold():
    pipeline = AutoMLPipeline()
    result = await pipeline.check_data_drift_and_retrain(60000)
    
    # Assuming the mock _evaluate_model returns > 0.90
    assert result["status"] == "deployed"
    assert "version" in result
    assert result["metrics"]["precision"] == 0.92
