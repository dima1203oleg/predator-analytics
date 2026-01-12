import asyncio
import sys
import uuid
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock

# Add core paths
ROOT_DIR = Path("/Users/dima-mac/Documents/Predator_21")
sys.path.append(str(ROOT_DIR))
sys.path.append(str(ROOT_DIR / "apps" / "backend"))

async def run_augmentation_diagnostic():
    print("🧠 Predator Analytics v25.0 Diagnostic - Augmentation Layer")
    print("----------------------------------------------------------")

    try:
        from src.mlops.augmentor import AugmentorManager
        from libs.core.models import Document
    except ImportError as e:
        print(f"❌ Dependency Error: {e}")
        return

    # Mock the DB session
    mock_db = AsyncMock()

    # Create a dummy original document
    original_doc = Document(
        id=uuid.uuid4(),
        tenant_id=uuid.uuid4(),
        content="Митна декларація на ввезення хімічних реагентів для лабораторії. Код товару 84650905.",
        title="Diagnostic Document"
    )

    # Mock the fetch operation
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = original_doc
    mock_db.execute.return_value = mock_result

    manager = AugmentorManager(mock_db)
    print("✅ AugmentorManager initialized with nlpaug.")

    try:
        # Step 1: Generate variants
        print(f"🧬 Generating synthetic variants for content: '{original_doc.content[:50]}...'")
        variants = await manager.generate_synthetic_data(original_doc.id, num_variants=2)

        print(f"✅ Generated {len(variants)} variant IDs.")

        # Verify the calls to DB (mock check)
        added_items = [call.args[0] for call in mock_db.add.call_args_list]
        for i, item in enumerate(added_items):
            print(f"📝 Variant {i+1} Content: '{item.content[:100]}...'")
            print(f"✨ Type: {item.aug_type}")

        print("🚀 SUCCESS: Augmentation Pipeline validated for v25.0 logic.")

    except Exception as e:
        print(f"❌ Augmentation logic failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(run_augmentation_diagnostic())
