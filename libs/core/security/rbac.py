"""
RBAC (Role-Based Access Control) System
Defines Roles, Permissions and Enforcement logic.
"""
from enum import Enum
from typing import List, Dict, Union

class Role(str, Enum):
    ADMIN = "admin"           # Full access
    ANALYST = "analyst"       # Can run operations and analyses
    VIEWER = "viewer"         # Read-only
    SYSTEM = "system"         # Internal services / God mode
    BOT = "bot"               # Automated agents

class Permission(str, Enum):
    # Data Access
    READ_DATA = "read:data"
    WRITE_DATA = "write:data"
    DELETE_DATA = "delete:data"

    # Operations
    EXECUTE_MISSION = "execute:mission"
    MANAGE_AGENTS = "manage:agents"
    TRIGGER_ETL = "trigger:etl"

    # System
    MANAGE_USERS = "manage:users"
    VIEW_LOGS = "view:logs"
    SYSTEM_CONFIG = "system:config"

# Permission Matrix
ROLE_PERMISSIONS: Dict[Role, List[Permission]] = {
    Role.ADMIN: list(Permission),  # All permissions
    Role.SYSTEM: list(Permission), # All permissions

    Role.ANALYST: [
        Permission.READ_DATA,
        Permission.WRITE_DATA,
        Permission.EXECUTE_MISSION,
        Permission.MANAGE_AGENTS,
        Permission.TRIGGER_ETL,
        Permission.VIEW_LOGS
    ],

    Role.BOT: [
        Permission.READ_DATA,
        Permission.WRITE_DATA,
        Permission.EXECUTE_MISSION
    ],

    Role.VIEWER: [
        Permission.READ_DATA
    ]
}

def verify_permission(user_roles: List[Union[str, Role]], required_permission: Permission) -> bool:
    """
    Check if any of the user's roles grant the required permission.
    """
    for role_input in user_roles:
        try:
            # Handle string input
            role = Role(role_input) if isinstance(role_input, str) else role_input

            allowed_permissions = ROLE_PERMISSIONS.get(role, [])
            if required_permission in allowed_permissions:
                return True
        except (ValueError, KeyError):
            # Ignore invalid roles
            continue

    return False

def verify_role(user_roles: List[Union[str, Role]], required_role: Role) -> bool:
    """
    Check if the user has the specific role (or implies it, hierarchically).
    Simple implementation: exact match or admin.
    """
    normalized_roles = []
    for r in user_roles:
        try:
            normalized_roles.append(Role(r) if isinstance(r, str) else r)
        except ValueError:
            continue

    if Role.ADMIN in normalized_roles or Role.SYSTEM in normalized_roles:
        return True

    return required_role in normalized_roles
