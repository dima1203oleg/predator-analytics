"""Тести для Security Layer (Secrets та Policy Enforcement)."""

import pytest

from mcp.security.policy_enforcer import (
    PolicySeverity,
    PolicyViolation,
    SecurityPolicyEnforcer,
)
from mcp.security.secrets_manager import Secret, SecretsManager, SecretType


class TestSecretsManager:
    """Тести SecretsManager."""

    @pytest.fixture
    def secrets_manager(self):
        """Фікстура SecretsManager."""
        return SecretsManager()

    def test_init(self, secrets_manager):
        """Тест ініціалізації."""
        assert len(secrets_manager.secrets) == 0
        assert not secrets_manager.vault_connected

    @pytest.mark.asyncio
    async def test_store_secret(self, secrets_manager):
        """Тест збереження секрету."""
        secret = Secret(
            name="test_api_key",
            type=SecretType.API_KEY,
            value="sk_test_12345",
        )

        await secrets_manager.store_secret(secret)

        assert "test_api_key" in secrets_manager.secrets

    @pytest.mark.asyncio
    async def test_get_secret(self, secrets_manager):
        """Тест отримання секрету."""
        secret = Secret(
            name="db_password",
            type=SecretType.DATABASE_PASSWORD,
            value="secure_password_123",
        )

        await secrets_manager.store_secret(secret)
        value = await secrets_manager.get_secret("db_password")

        assert value == "secure_password_123"

    @pytest.mark.asyncio
    async def test_get_nonexistent_secret(self, secrets_manager):
        """Тест отримання неіснуючого секрету."""
        with pytest.raises(Exception):
            await secrets_manager.get_secret("nonexistent")

    @pytest.mark.asyncio
    async def test_rotate_secret(self, secrets_manager):
        """Тест ротації секрету."""
        secret = Secret(
            name="api_key",
            type=SecretType.API_KEY,
            value="old_key",
        )

        await secrets_manager.store_secret(secret)
        await secrets_manager.rotate_secret("api_key", "new_key")

        value = await secrets_manager.get_secret("api_key")
        assert value == "new_key"

    @pytest.mark.asyncio
    async def test_delete_secret(self, secrets_manager):
        """Тест видалення секрету."""
        secret = Secret(
            name="temp_secret",
            type=SecretType.ENCRYPTION_KEY,
            value="temp_value",
        )

        await secrets_manager.store_secret(secret)
        await secrets_manager.delete_secret("temp_secret")

        assert "temp_secret" not in secrets_manager.secrets

    def test_list_secrets(self, secrets_manager):
        """Тест отримання списку секретів."""
        secret1 = Secret(
            name="secret1",
            type=SecretType.API_KEY,
            value="value1",
        )
        secret2 = Secret(
            name="secret2",
            type=SecretType.DATABASE_PASSWORD,
            value="value2",
        )

        secrets_manager.secrets["secret1"] = secret1
        secrets_manager.secrets["secret2"] = secret2

        names = secrets_manager.list_secrets()

        assert len(names) == 2
        assert "secret1" in names
        assert "secret2" in names

    def test_get_statistics(self, secrets_manager):
        """Тест отримання статистики."""
        secret1 = Secret(
            name="secret1",
            type=SecretType.API_KEY,
            value="value1",
        )
        secret2 = Secret(
            name="secret2",
            type=SecretType.DATABASE_PASSWORD,
            value="value2",
        )

        secrets_manager.secrets["secret1"] = secret1
        secrets_manager.secrets["secret2"] = secret2

        stats = secrets_manager.get_statistics()

        assert stats["total_secrets"] == 2
        assert "by_type" in stats
        assert stats["vault_connected"] is False

    @pytest.mark.asyncio
    async def test_connect_to_vault(self, secrets_manager):
        """Тест підключення до Vault."""
        await secrets_manager.connect_to_vault("http://vault:8200", "token_123")

        assert secrets_manager.vault_connected


class TestSecurityPolicyEnforcer:
    """Тести SecurityPolicyEnforcer."""

    @pytest.fixture
    def enforcer(self):
        """Фікстура SecurityPolicyEnforcer."""
        return SecurityPolicyEnforcer()

    def test_init(self, enforcer):
        """Тест ініціалізації."""
        assert len(enforcer.policies) >= 4  # Стандартні політики
        assert len(enforcer.violations) == 0

    def test_has_default_policies(self, enforcer):
        """Тест наявності стандартних політик."""
        assert "no_dangerous_functions" in enforcer.policies
        assert "require_type_hints" in enforcer.policies
        assert "require_documentation" in enforcer.policies
        assert "no_hardcoded_secrets" in enforcer.policies

    @pytest.mark.asyncio
    async def test_check_dangerous_functions(self, enforcer):
        """Тест перевірки небезпечних функцій."""
        code = "result = eval('1 + 1')"
        violations = await enforcer.check_file("test.py", code)

        assert len(violations) > 0
        assert any("eval" in v.violation for v in violations)

    @pytest.mark.asyncio
    async def test_check_hardcoded_secrets(self, enforcer):
        """Тест перевірки hardcoded секретів."""
        code = "API_KEY = 'sk_prod_12345'"
        violations = await enforcer.check_file("config.py", code)

        assert len(violations) > 0

    @pytest.mark.asyncio
    async def test_check_clean_code(self, enforcer):
        """Тест перевірки чистого коду."""
        code = """
def hello(name: str) -> str:
    '''Привіт функція.'''
    return f'Hello, {name}!'
"""
        violations = await enforcer.check_file("hello.py", code)

        # Чистий код - деякі лиш warnings але не criticals
        critical_violations = [
            v for v in violations if v.severity == PolicySeverity.CRITICAL
        ]
        assert len(critical_violations) == 0

    def test_enable_disable_policy(self, enforcer):
        """Тест включення/відключення політики."""
        policy_id = "pol_001"

        enforcer.disable_policy(policy_id)
        assert not enforcer.get_policy(policy_id).enabled

        enforcer.enable_policy(policy_id)
        assert enforcer.get_policy(policy_id).enabled

    def test_get_statistics(self, enforcer):
        """Тест отримання статистики."""
        stats = enforcer.get_statistics()

        assert "total_violations" in stats
        assert "total_policies" in stats
        assert "enabled_policies" in stats
        assert "by_severity" in stats
        assert stats["total_policies"] >= 4

    def test_clear_violations(self, enforcer):
        """Тест очищення порушень."""
        violation = PolicyViolation(
            policy_id="pol_001",
            policy_name="No Dangerous Functions",
            violation="Found eval()",
            severity=PolicySeverity.CRITICAL,
        )

        enforcer.violations.append(violation)
        assert len(enforcer.violations) == 1

        enforcer.clear_violations()
        assert len(enforcer.violations) == 0
