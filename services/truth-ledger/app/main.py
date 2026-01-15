from fastapi import FastAPI, HTTPException, Depends
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel
from typing import Dict, Any, Optional
import os

from app.models import Base, LedgerEntry
from app.core import LedgerManager

# Database Setup
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./ledger.db")
if DATABASE_URL.startswith("postgresql+asyncpg://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Predator Truth Ledger", version="26.0.0")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class CreateEntryRequest(BaseModel):
    entity_type: str
    entity_id: str
    action: str
    payload: Dict[str, Any]
    arbiter_signature: Optional[str] = None

class EntryResponse(BaseModel):
    id: int
    data_hash: str
    previous_hash: str
    status: str

@app.post("/entry", response_model=EntryResponse)
def append_entry(req: CreateEntryRequest, db: Session = Depends(get_db)):
    manager = LedgerManager(db)
    entry = manager.create_entry(
        entity_type=req.entity_type,
        entity_id=req.entity_id,
        action=req.action,
        payload=req.payload,
        arbiter_signature=req.arbiter_signature
    )
    return {
        "id": entry.id,
        "data_hash": entry.data_hash,
        "previous_hash": entry.previous_hash,
        "status": "committed"
    }

@app.get("/verify/{entry_id}")
def verify_entry(entry_id: int, db: Session = Depends(get_db)):
    manager = LedgerManager(db)
    entry = manager.get_entry(entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")

    # Verify hash integrity locally
    is_valid = entry.calculate_hash() == entry.data_hash

    return {
        "id": entry.id,
        "is_valid": is_valid,
        "content_hash": entry.data_hash
    }

@app.get("/audit/integrity")
def full_integrity_check(db: Session = Depends(get_db)):
    manager = LedgerManager(db)
    healthy = manager.verify_integrity()
    return {
        "status": "healthy" if healthy else "corrupted",
        "description": "Full chain hash verification"
    }

@app.get("/entry/{entry_id}")
def get_entry_details(entry_id: int, db: Session = Depends(get_db)):
    """
    Returns full details of a ledger entry, including the payload for juridical analysis.
    """
    entry = db.query(LedgerEntry).filter(LedgerEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")

    return {
        "id": entry.id,
        "timestamp": entry.created_at.isoformat() if entry.created_at else None,
        "entity_type": entry.entity_type,
        "entity_id": entry.entity_id,
        "action": entry.action,
        "payload": entry.payload,
        "hash": entry.data_hash,
        "previous_hash": entry.previous_hash,
        "arbiter_signature": entry.arbiter_signature,
        "integrity_check": entry.calculate_hash() == entry.data_hash
    }

@app.get("/entries")
def list_entries(limit: int = 10, db: Session = Depends(get_db)):
    """
    Returns the latest audit entries for the CLI/Dashboard.
    """
    entries = db.query(LedgerEntry).order_by(LedgerEntry.id.desc()).limit(limit).all()
    return [
        {
            "id": e.id,
            "timestamp": e.created_at.isoformat() if e.created_at else None,
            "entity": f"{e.entity_type}:{e.entity_id}",
            "action": e.action,
            "hash": e.data_hash[:12]
        } for e in entries
    ]
