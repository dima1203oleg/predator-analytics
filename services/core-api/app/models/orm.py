from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, Boolean, text, ForeignKey, JSON
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class MixinAudit:
    """Аудит поля (created, updated, tenant)."""
    tenant_id = Column(String(50), nullable=False, default="global-system", index=True)
    created_at = Column(DateTime(timezone=True), server_default=text("now()"), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=text("now()"), onupdate=text("now()"), nullable=False)


class User(Base, MixinAudit):
    __tablename__ = "users"
    
    id = Column(String(64), primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String(50), nullable=False) # admin, analyst, etc.
    is_active = Column(Boolean, default=True)


class Company(Base, MixinAudit):
    __tablename__ = "companies"
    
    ueid = Column(String(64), primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    name_normalized = Column(String(255), nullable=False, index=True)
    edrpou = Column(String(20), unique=True, index=True, nullable=True)
    address = Column(String, nullable=True)
    status = Column(String(50), nullable=False)
    
    # CERS scores cached
    risk_level = Column(String(20), nullable=False, default="low")
    risk_score = Column(Integer, nullable=False, default=0)

    # Relationships
    declarations = relationship("CustomsDeclaration", back_populates="company")


class Person(Base, MixinAudit):
    __tablename__ = "persons"
    
    ueid = Column(String(64), primary_key=True, index=True)
    full_name = Column(String(255), nullable=False, index=True)
    name_normalized = Column(String(255), nullable=False, index=True)
    inn = Column(String(20), unique=True, index=True, nullable=True)
    date_of_birth = Column(String(10), nullable=True)
    
    risk_level = Column(String(20), nullable=False, default="low")
    risk_score = Column(Integer, nullable=False, default=0)


class CustomsDeclaration(Base, MixinAudit):
    __tablename__ = "customs_declarations"

    id = Column(String(64), primary_key=True, index=True)
    company_ueid = Column(String(64), ForeignKey("companies.ueid"), nullable=False)
    
    declaration_number = Column(String(50), unique=True, index=True, nullable=False)
    decl_type = Column(String(20), nullable=False) # import, export
    date = Column(DateTime, nullable=False, index=True)
    
    customs_code = Column(String(20), nullable=False, index=True) # UKTZED
    description = Column(String, nullable=False)
    weight_kg = Column(Float, nullable=False)
    amount_usd = Column(Float, nullable=False)
    
    country_origin = Column(String(2), nullable=True)
    country_dispatch = Column(String(2), nullable=True)
    
    # JSON Blob для гнучкості
    raw_data = Column(JSON, nullable=True)

    company = relationship("Company", back_populates="declarations")


class AuditLog(Base):
    """WORM лог дій (HR-16)."""
    __tablename__ = "audit_log"
    
    id = Column(String(64), primary_key=True)
    # Зв'язок на юзера
    user_id = Column(String(64), ForeignKey("users.id"), nullable=False, index=True)
    action = Column(String(100), nullable=False, index=True)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(String(64), nullable=False, index=True)
    payload_before = Column(JSON, nullable=True)
    payload_after = Column(JSON, nullable=True)
    ip_address = Column(String(45), nullable=True)
    
    tenant_id = Column(String(50), nullable=False, default="global-system", index=True)
    created_at = Column(DateTime(timezone=True), server_default=text("now()"), nullable=False, index=True)
