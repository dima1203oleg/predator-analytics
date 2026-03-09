from enum import Enum

class EntityStatus(str, Enum):
    """Статуси компанії/особи."""
    ACTIVE = "active"
    TERMINATED = "terminated"
    BANKRUPT = "bankrupt"
    INACTIVE = "inactive"

class RiskLevel(str, Enum):
    """Канонічний CERS Risk Level."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class DeclarationType(str, Enum):
    """Типи митних декларацій."""
    IMPORT = "import"
    EXPORT = "export"
    TRANSIT = "transit"
    TEMPORARY = "temporary"

class EventType(str, Enum):
    """Типи подій (Neo4j relationships)."""
    FOUNDED = "founded"
    DIRECTOR = "director"
    OWNER = "owner"
    BENEFICIARY = "beneficiary"
    SOLD = "sold"
    BOUGHT = "bought"
    SIGNED_CONTRACT = "signed_contract"
