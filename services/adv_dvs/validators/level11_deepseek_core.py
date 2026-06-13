import sys
import asyncio
from services.adv_dvs.models import ValidationResult

sys.path.append("/Users/Shared/Predator_60/libs/predator-common")
from predator_common.ai.deepseek_core import DeepSeekCore

async def run_check(context: dict) -> ValidationResult:
    """
    [Level 11] DeepSeek R1 Cognitive Core Integration Validation
    
    Verifies that the DeepSeekCore adapter can successfully communicate 
    with the LiteLLM proxy and make a valid autonomous decision.
    """
    try:
        brain = DeepSeekCore(model_name="cognitive_core")
        
        # Test 1: Strategy Optimizer
        task_desc = {
            "task_type": "classification",
            "data_source": "test_table",
            "target_column": "risk_score",
            "user_strategy": "quick_baseline"
        }
        
        decision = await brain.strategy_optimizer(task_desc)
        
        if not decision or not decision.decision:
            return ValidationResult(
                name="DeepSeek R1 Core Response",
                status="FAILED",
                error_message="DeepSeekCore returned an empty or invalid decision for strategy optimization."
            )
            
        return ValidationResult(
            name="DeepSeek R1 Core Connection",
            status="PASSED",
            details=f"Successfully received strategy from AI: {decision.decision} (Confidence: {decision.confidence})"
        )

    except Exception as e:
        return ValidationResult(
            name="DeepSeek R1 Core Connection",
            status="FAILED",
            error_message=f"DeepSeekCore integration test failed: {e!s}"
        )

if __name__ == "__main__":
    res = asyncio.run(run_check({}))
    print(f"[{res.status}] {res.name}: {res.details or res.error_message}")
