import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# 1. Канонічна Модель Декларації

class Actor(BaseModel):
    company_id: str
    company_name: str
    country_code: str = "UNKNOWN"

class Financials(BaseModel):
    total_value: float
    currency: str = "USD"

class DeclarationItem(BaseModel):
    item_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    hs_code: str
    description: str
    weight: float = 0.0
    price: float = 0.0

class CanonicalDeclaration(BaseModel):
    declaration_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    import_date: datetime = Field(default_factory=datetime.utcnow)
    actor: Actor
    financials: Financials
    items: List[DeclarationItem]
    metadata: Dict[str, Any] = {}
