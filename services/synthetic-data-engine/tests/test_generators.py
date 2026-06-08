import pandas as pd
from services.synthetic_data_engine.app.generators.zero_shot import ZeroShotDomainGenerator
from services.synthetic_data_engine.app.trainers.quality_evaluator import SyntheticQualityEvaluator


def test_zero_shot_generator():
    gen = ZeroShotDomainGenerator(domain="customs")
    df = gen.sample(10)

    assert len(df) == 10
    assert "declaration_id" in df.columns
    assert "total_value_usd" in df.columns

def test_quality_evaluator():
    real = pd.DataFrame({
        'A': [1, 2, 3, 4, 5],
        'B': [1.1, 2.2, 3.3, 4.4, 5.5]
    })

    synth = pd.DataFrame({
        'A': [1.1, 2.1, 3.1, 4.1, 5.1],
        'B': [1.2, 2.3, 3.4, 4.5, 5.6]
    })

    result = SyntheticQualityEvaluator.evaluate(real, synth)

    assert "overall_score" in result
    assert "statistical_similarity" in result
    assert result["overall_score"] > 0
