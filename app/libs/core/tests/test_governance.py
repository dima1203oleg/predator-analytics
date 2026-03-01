from __future__ import annotations

import unittest

from app.libs.core.governance import OperationalPolicy, SecurityStage


class TestGovernance(unittest.TestCase):
    def test_forbidden_commands(self):
        """Test that dangerous commands are blocked."""
        bad_commands = ["rm -rf /", "mkfs ext4", "chmod 777 -R /"]
        for cmd in bad_commands:
            res = OperationalPolicy.validate_command(cmd)
            assert not res["approved"], f"Command '{cmd}' should be blocked!"

    def test_safe_commands(self):
        """Test that normal commands are allowed."""
        good_commands = ["ls -la", "cat config.py", "python main.py"]
        for cmd in good_commands:
            res = OperationalPolicy.validate_command(cmd)
            assert res["approved"], f"Command '{cmd}' should be allowed!"

    def test_production_constraints(self):
        """Test that production-only constraints work."""
        cmd = "kubectl apply -f deployment.yaml"
        # Allowed in RND
        res_rnd = OperationalPolicy.validate_command(cmd, stage=SecurityStage.RND)
        assert res_rnd["approved"]

        # Blocked in PRODUCTION
        res_prod = OperationalPolicy.validate_command(cmd, stage=SecurityStage.PRODUCTION)
        assert not res_prod["approved"], "Direct kubectl apply should be blocked in PROD!"

    def test_tech_rationalization(self):
        """Test technology white/black listing."""
        assert not OperationalPolicy.check_technology(["php"])["approved"]
        assert OperationalPolicy.check_technology(["python", "postgres"])["approved"]


if __name__ == "__main__":
    unittest.main()
