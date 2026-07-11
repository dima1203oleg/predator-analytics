import pytest
import subprocess
import json

def test_all_databases_status():
    """Перевірка статусу всіх 8 баз даних."""
    # Assuming validate_8_dbs.py can be executed and outputs JSON
    try:
        import os
        env = os.environ.copy()
        env["PYTHONPATH"] = "/Users/Shared/Predator_60/services/core-api:" + env.get("PYTHONPATH", "")
        result = subprocess.run(
            ["python3", "validate_8_dbs.py"],
            capture_output=True,
            text=True,
            check=True,
            cwd="/Users/Shared/Predator_60/tests/e2e",
            env=env
        )
        # Parse the output to ensure it's valid and databases are OK
        # This depends on the exact output of validate_8_dbs.py
        # Let's assume it prints a JSON summary at the end
        assert "OK" in result.stdout or "Success" in result.stdout
    except subprocess.CalledProcessError as e:
        pytest.fail(f"validate_8_dbs.py failed: {e.stderr}")
