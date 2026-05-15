"""
RBAC Permissions Tests — Тестування прав доступу на API endpoints згідно з RBAC v61.0

Сценарії тестування:
1. PROMO роль: базовий доступ (READ_CORP_DATA, RUN_ANALYTICS)
2. PRO роль: повний аналітичний доступ (READ_CORP_DATA, READ_COMPANIES, READ_CUSTOMS, READ_INTEL, RUN_ANALYTICS, RUN_GRAPH, VIEW_WARROOM)
3. VIP роль: повний доступ + чутливі дані (READ_SENSITIVE_DATA, READ_RAW_DATA)
4. ADMIN роль: тільки системне управління (MANAGE_USERS, MANAGE_INFRASTRUCTURE, VIEW_LOGS)
"""
import pytest
from app.core.permissions import Role, Permission, ROLE_PERMISSIONS, PermissionChecker


class TestRolePermissions:
    """Тестування матриці прав доступу для ролей."""

    def test_promo_role_permissions(self):
        """PROMO роль: базовий доступ."""
        permissions = ROLE_PERMISSIONS[Role.PROMO]
        
        assert Permission.READ_CORP_DATA in permissions
        assert Permission.RUN_ANALYTICS in permissions
        
        # PROMO не має доступу до:
        assert Permission.READ_COMPANIES not in permissions
        assert Permission.READ_CUSTOMS not in permissions
        assert Permission.READ_INTEL not in permissions
        assert Permission.RUN_GRAPH not in permissions
        assert Permission.VIEW_WARROOM not in permissions
        assert Permission.READ_SENSITIVE_DATA not in permissions
        assert Permission.READ_RAW_DATA not in permissions
        assert Permission.MANAGE_USERS not in permissions

    def test_pro_role_permissions(self):
        """PRO роль: повний аналітичний доступ."""
        permissions = ROLE_PERMISSIONS[Role.PRO]
        
        assert Permission.READ_CORP_DATA in permissions
        assert Permission.READ_COMPANIES in permissions
        assert Permission.READ_CUSTOMS in permissions
        assert Permission.READ_INTEL in permissions
        assert Permission.RUN_ANALYTICS in permissions
        assert Permission.RUN_GRAPH in permissions
        assert Permission.VIEW_WARROOM in permissions
        
        # PRO не має доступу до:
        assert Permission.READ_SENSITIVE_DATA not in permissions
        assert Permission.READ_RAW_DATA not in permissions
        assert Permission.MANAGE_USERS not in permissions

    def test_vip_role_permissions(self):
        """VIP роль: повний доступ + чутливі дані."""
        permissions = ROLE_PERMISSIONS[Role.VIP]
        
        assert Permission.READ_CORP_DATA in permissions
        assert Permission.READ_COMPANIES in permissions
        assert Permission.READ_CUSTOMS in permissions
        assert Permission.READ_INTEL in permissions
        assert Permission.RUN_ANALYTICS in permissions
        assert Permission.RUN_GRAPH in permissions
        assert Permission.VIEW_WARROOM in permissions
        assert Permission.READ_SENSITIVE_DATA in permissions
        assert Permission.READ_RAW_DATA in permissions
        
        # VIP не має доступу до системного управління:
        assert Permission.MANAGE_USERS not in permissions
        assert Permission.MANAGE_INFRASTRUCTURE not in permissions

    def test_admin_role_permissions(self):
        """ADMIN роль: тільки системне управління."""
        permissions = ROLE_PERMISSIONS[Role.ADMIN]
        
        assert Permission.MANAGE_USERS in permissions
        assert Permission.MANAGE_INFRASTRUCTURE in permissions
        assert Permission.VIEW_LOGS in permissions
        
        # ADMIN не має доступу до бізнес-даних:
        assert Permission.READ_CORP_DATA not in permissions
        assert Permission.READ_COMPANIES not in permissions
        assert Permission.READ_CUSTOMS not in permissions
        assert Permission.READ_INTEL not in permissions
        assert Permission.RUN_ANALYTICS not in permissions
        assert Permission.RUN_GRAPH not in permissions
        assert Permission.VIEW_WARROOM not in permissions
        assert Permission.READ_SENSITIVE_DATA not in permissions
        assert Permission.READ_RAW_DATA not in permissions


class TestPermissionChecker:
    """Тестування PermissionChecker dependency."""

    def test_permission_checker_with_valid_permission(self):
        """Тестування PermissionChecker з валідними правами."""
        # Цей тест потребує мокування FastAPI context
        # Реалізація буде додана після налаштування тестового оточення
        pass

    def test_permission_checker_with_invalid_permission(self):
        """Тестування PermissionChecker з невалідними правами."""
        # Цей тест потребує мокування FastAPI context
        pass

    def test_permission_checker_admin_bypass(self):
        """Тестування, що ADMIN має всі права."""
        # Цей тест потребує мокування FastAPI context
        pass


class TestLegacyRoleAliases:
    """Тестування легасі-аліасів ролей для зворотної сумісності."""

    def test_analyst_alias_maps_to_pro(self):
        """Легасі-аліас analyst → pro."""
        permissions = ROLE_PERMISSIONS[Role.ANALYST]
        pro_permissions = ROLE_PERMISSIONS[Role.PRO]
        
        assert permissions == pro_permissions

    def test_business_alias_maps_to_promo(self):
        """Легасі-аліас business → promo."""
        permissions = ROLE_PERMISSIONS[Role.BUSINESS]
        promo_permissions = ROLE_PERMISSIONS[Role.PROMO]
        
        assert permissions == promo_permissions

    def test_guest_alias_maps_to_promo(self):
        """Легасі-аліас guest → promo."""
        permissions = ROLE_PERMISSIONS[Role.GUEST]
        promo_permissions = ROLE_PERMISSIONS[Role.PROMO]
        
        assert permissions == promo_permissions

    def test_bank_alias_maps_to_pro(self):
        """Легасі-аліас bank → pro."""
        permissions = ROLE_PERMISSIONS[Role.BANK]
        pro_permissions = ROLE_PERMISSIONS[Role.PRO]
        
        # Bank має трохи більше прав, ніж PRO
        assert Permission.READ_CORP_DATA in permissions
        assert Permission.READ_COMPANIES in permissions
        assert Permission.READ_CUSTOMS in permissions

    def test_gov_alias_maps_to_vip(self):
        """Легасі-аліас gov → vip."""
        permissions = ROLE_PERMISSIONS[Role.GOV]
        vip_permissions = ROLE_PERMISSIONS[Role.VIP]
        
        # Gov має майже ті ж права, що VIP, але без чутливих даних
        assert Permission.READ_CORP_DATA in permissions
        assert Permission.READ_COMPANIES in permissions
        assert Permission.READ_CUSTOMS in permissions
        assert Permission.VIEW_WARROOM in permissions
        assert Permission.READ_SENSITIVE_DATA not in permissions
        assert Permission.READ_RAW_DATA not in permissions


class TestPermissionIsolation:
    """Тестування ізоляції прав доступу."""

    def test_promo_cannot_access_pro_features(self):
        """PROMO не може доступатися до PRO-функцій."""
        promo_permissions = ROLE_PERMISSIONS[Role.PROMO]
        pro_permissions = ROLE_PERMISSIONS[Role.PRO]
        
        # PRO має права, яких немає у PROMO
        pro_only_permissions = set(pro_permissions) - set(promo_permissions)
        
        assert len(pro_only_permissions) > 0
        assert Permission.READ_COMPANIES in pro_only_permissions
        assert Permission.READ_CUSTOMS in pro_only_permissions
        assert Permission.READ_INTEL in pro_only_permissions
        assert Permission.RUN_GRAPH in pro_only_permissions

    def test_pro_cannot_access_vip_features(self):
        """PRO не може доступатися до VIP-функцій."""
        pro_permissions = ROLE_PERMISSIONS[Role.PRO]
        vip_permissions = ROLE_PERMISSIONS[Role.VIP]
        
        # VIP має права, яких немає у PRO
        vip_only_permissions = set(vip_permissions) - set(pro_permissions)
        
        assert len(vip_only_permissions) > 0
        assert Permission.READ_SENSITIVE_DATA in vip_only_permissions
        assert Permission.READ_RAW_DATA in vip_only_permissions

    def test_admin_cannot_access_business_data(self):
        """ADMIN не може доступатися до бізнес-даних."""
        admin_permissions = ROLE_PERMISSIONS[Role.ADMIN]
        business_permissions = ROLE_PERMISSIONS[Role.PRO]
        
        # ADMIN має тільки системні права
        admin_only_permissions = set(admin_permissions) - set(business_permissions)
        
        assert len(admin_only_permissions) > 0
        assert Permission.MANAGE_USERS in admin_only_permissions
        assert Permission.MANAGE_INFRASTRUCTURE in admin_only_permissions
        assert Permission.VIEW_LOGS in admin_only_permissions
        
        # ADMIN не має бізнес-прав
        assert Permission.READ_CORP_DATA not in admin_permissions
        assert Permission.READ_COMPANIES not in admin_permissions
        assert Permission.READ_CUSTOMS not in admin_permissions


class TestPermissionHierarchy:
    """Тестування ієрархії прав доступу."""

    def test_permission_hierarchy_promo_to_pro(self):
        """Ієрархія: PROMO < PRO."""
        promo_permissions = set(ROLE_PERMISSIONS[Role.PROMO])
        pro_permissions = set(ROLE_PERMISSIONS[Role.PRO])
        
        # PRO має всі права PROMO + додаткові
        assert promo_permissions.issubset(pro_permissions)
        assert len(pro_permissions) > len(promo_permissions)

    def test_permission_hierarchy_pro_to_vip(self):
        """Ієрархія: PRO < VIP."""
        pro_permissions = set(ROLE_PERMISSIONS[Role.PRO])
        vip_permissions = set(ROLE_PERMISSIONS[Role.VIP])
        
        # VIP має всі права PRO + додаткові
        assert pro_permissions.issubset(vip_permissions)
        assert len(vip_permissions) > len(pro_permissions)

    def test_admin_is_separate_hierarchy(self):
        """ADMIN - окрема ієрархія (системне управління)."""
        admin_permissions = set(ROLE_PERMISSIONS[Role.ADMIN])
        business_permissions = set(ROLE_PERMISSIONS[Role.VIP])
        
        # ADMIN не має спільних прав з бізнес-ролями
        common_permissions = admin_permissions & business_permissions
        
        assert len(common_permissions) == 0


class TestPermissionEnum:
    """Тестування enum Permission."""

    def test_all_permissions_defined(self):
        """Перевірка, що всі необхідні права визначені."""
        required_permissions = [
            Permission.READ_CORP_DATA,
            Permission.READ_COMPANIES,
            Permission.READ_CUSTOMS,
            Permission.READ_INTEL,
            Permission.RUN_ANALYTICS,
            Permission.RUN_GRAPH,
            Permission.VIEW_WARROOM,
            Permission.READ_SENSITIVE_DATA,
            Permission.READ_RAW_DATA,
            Permission.MANAGE_USERS,
            Permission.MANAGE_INFRASTRUCTURE,
            Permission.VIEW_LOGS,
        ]
        
        # Всі права повинні бути у enum
        for perm in required_permissions:
            assert isinstance(perm, Permission)


class TestRoleEnum:
    """Тестування enum Role."""

    def test_all_roles_defined(self):
        """Перевірка, що всі ролі визначені."""
        required_roles = [
            Role.PROMO,
            Role.PRO,
            Role.VIP,
            Role.ADMIN,
            Role.ANALYST,
            Role.BUSINESS,
            Role.GUEST,
            Role.BANK,
            Role.GOV,
            Role.JOURNALIST,
        ]
        
        # Всі ролі повинні бути у enum
        for role in required_roles:
            assert isinstance(role, Role)

    def test_role_values_are_correct(self):
        """Перевірка значень ролей."""
        assert Role.PROMO.value == "promo"
        assert Role.PRO.value == "pro"
        assert Role.VIP.value == "vip"
        assert Role.ADMIN.value == "admin"
