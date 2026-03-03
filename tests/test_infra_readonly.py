import pytest
import sys
from unittest.mock import patch
from pathlib import Path

def test_import_side_effects_under_readonly_fs():
    """
    Smoke test: Ensure core modules can be imported even if the filesystem is read-only.
    This simulates securityContext.readOnlyRootFilesystem = true in Kubernetes.
    """
    
    # Mock Path.mkdir to simulate Read-only FS
    with patch.object(Path, 'mkdir') as mock_mkdir:
        mock_mkdir.side_effect = OSError(30, "Read-only file system")
        
        try:
            # Attempt to import core services that previously failed
            import app.services.azr_engine_v32
            import app.services.sovereign_memory
            import app.libs.core.merkle_ledger
            import app.services.evolution_service
            
            # If we reach here without OSError at the module level, we won!
            print("Import successful under simulated read-only FS")
        except OSError as e:
            pytest.fail(f"Module import failed with OSError on read-only FS: {e}")
        except Exception as e:
            pytest.fail(f"Module import failed with unexpected error: {e}")

def test_lazy_initialization_fails_only_on_write():
    """
    Ensure that we only try to create directories when writing, not when initializing.
    """
    from app.libs.core.storage import FileStorageProvider
    import tempfile
    
    with tempfile.TemporaryDirectory() as tmpdir:
        base_path = Path(tmpdir)
        provider = FileStorageProvider(base_path)
        
        # Mock mkdir to fail
        with patch.object(Path, 'mkdir') as mock_mkdir:
            mock_mkdir.side_effect = OSError(30, "Read-only file system")
            
            # This should NOT fail (just setting up paths)
            assert provider.base_path == base_path
            
            # This SHOULD fail (actual write attempt)
            with pytest.raises(OSError) as excinfo:
                provider.write_text("test.txt", "data")
            assert "Read-only file system" in str(excinfo.value)
