
import asyncio
import sys
import os
from unittest.mock import MagicMock, patch

# Add app to path
sys.path.append(os.path.join(os.path.dirname(__file__), "../"))

async def test_strategy_session():
    print("🧪 Testing Strategy Session Logic...")

    # Mock dependencies
    with patch('app.api.routers.council.get_council') as mock_get_council, \
         patch('app.api.routers.council.REGISTRY') as mock_registry:

        # Setup Mock Council
        mock_council_instance = MagicMock()
        mock_get_council.return_value = mock_council_instance

        # Setup Mock Consensus Result
        mock_result = MagicMock()
        mock_result.final_answer = "Strategic Plan: 1. Optimize Resource. 2. Halt non-critical pods."
        mock_result.confidence = 0.95
        mock_result.contributing_models = ["gemini", "gpt4"]
        mock_result.dissenting_opinions = []
        mock_result.metadata = {"duration": 1.2}
        mock_result.peer_reviews = [] # Strategy session has no peer reviews usually in this test case

        # Async mock for deliberate
        future = asyncio.Future()
        future.set_result(mock_result)
        mock_council_instance.deliberate.return_value = future

        # Setup Mock Metrics
        # Mocking get_sample_value
        def get_sample_value_side_effect(name, labels=None):
            if name == 'opensearch_docs_total': return 15000
            if name == 'qdrant_vectors_total': return 42000
            return 0

        mock_registry.get_sample_value.side_effect = get_sample_value_side_effect

        # Import the function to test
        # We need to import it ensuring imports inside it work (like prometheus)
        # Since we patched REGISTRY at the module level of 'app.api.routers.council', it should be fine?
        # Actually, we need to patch it where it is imported.

        from app.api.routers.council import council_strategy_session

        # Mock BackgroundTasks
        background_tasks = MagicMock()

        try:
            response = await council_strategy_session(background_tasks)

            print(f"✅ Response Received: ID={response.request_id}")
            print(f"📄 Final Answer Snippet: {response.final_answer[:50]}...")
            print(f"📊 Confidence: {response.confidence}")

            # Verify Context Injection
            # Check what deliberate was called with
            call_args = mock_council_instance.deliberate.call_args
            kwargs = call_args.kwargs
            context_sent = kwargs.get('context', '')

            print("\n🔍 Context Verification:")
            if "Knowledge Base: 15000 docs" in context_sent:
                print("✅ Context includes Opensearch stats")
            else:
                print(f"❌ Missing Opensearch stats in context: {context_sent}")

            if "42000 vectors" in context_sent:
                print("✅ Context includes Qdrant stats")
            else:
                print("❌ Missing Qdrant stats in context")

            # Verify Response Structure matches frontend expectation
            print("\n🔍 Structure Verification:")
            pr_summary = response.peer_review_summary
            if isinstance(pr_summary, dict) and "average_scores" in pr_summary:
                print("✅ PeerReviewSummary has correct structure (including empty dicts)")
            else:
                print(f"❌ PeerReviewSummary structure invalid: {pr_summary}")

        except Exception as e:
            print(f"❌ Test Failed: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_strategy_session())
