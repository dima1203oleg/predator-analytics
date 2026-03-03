import pytest
import os
from pathlib import Path
import tempfile
import shutil
from app.libs.core.storage import FileStorageProvider

@pytest.fixture
def temp_storage():
    tmpdir = tempfile.mkdtemp()
    yield Path(tmpdir)
    shutil.rmtree(tmpdir)

def test_file_storage_lazy_mkdir(temp_storage):
    """Test that FileStorageProvider creates directories on demand."""
    provider = FileStorageProvider(temp_storage)
    rel_path = "subdir/test.txt"
    content = "hello enterprise"
    
    # Check that subdir does not exist yet
    assert not (temp_storage / "subdir").exists()
    
    # Write operation should create it
    provider.write_text(rel_path, content)
    
    assert (temp_storage / "subdir").exists()
    assert (temp_storage / rel_path).read_text() == content

def test_file_storage_append_line(temp_storage):
    """Test JSON line appending with atomic directory creation."""
    provider = FileStorageProvider(temp_storage)
    rel_path = "logs/events.jsonl"
    data = {"event": "startup", "status": "ok"}
    
    provider.append_line(rel_path, data)
    
    content = (temp_storage / rel_path).read_text()
    assert '"event": "startup"' in content
    assert content.endswith("\n")

def test_file_storage_read_nonexistent(temp_storage):
    """Test reading from a file that doesn't exist returns None, not error."""
    provider = FileStorageProvider(temp_storage)
    assert provider.read_text("ghost.txt") is None
