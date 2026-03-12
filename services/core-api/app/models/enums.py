from enum import StrEnum


class EntityStatus(StrEnum):
    """Статуси компанії/особи."""

    ACTIVE = "active"
    TERMINATED = "terminated"
    BANKRUPT = "bankrupt"
    INACTIVE = "inactive"

class RiskLevel(StrEnum):
    """Канонічний CERS Risk Level."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class DeclarationType(StrEnum):
    """Типи митних декларацій."""

    IMPORT = "import"
    EXPORT = "export"
    TRANSIT = "transit"
    TEMPORARY = "temporary"

class EventType(StrEnum):
    """Типи подій (Neo4j relationships)."""

    FOUNDED = "founded"
    DIRECTOR = "director"
    OWNER = "owner"
    BENEFICIARY = "beneficiary"
    SOLD = "sold"
    BOUGHT = "bought"
    SIGNED_CONTRACT = "signed_contract"
