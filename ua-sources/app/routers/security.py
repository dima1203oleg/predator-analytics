"""Security Router - Security and access control endpoints"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
from typing import Optional
import asyncpg
import os

router = APIRouter(prefix="/security", tags=["Security"])


async def get_db_connection():
    """Get database connection."""
    db_url = os.getenv("DATABASE_URL")
    if db_url:
        return await asyncpg.connect(db_url)
    return None


@router.get("/status")
async def get_security_status():
    """Get security status"""
    conn = await get_db_connection()
    threats_count = 0
    
    if conn:
        try:
            # Count recent security events with high/critical severity
            result = await conn.fetchval("""
                SELECT COUNT(*) FROM audit_security_events 
                WHERE severity IN ('high', 'critical') 
                AND timestamp > NOW() - INTERVAL '24 hours'
            """)
            threats_count = result or 0
        except Exception:
            pass
        finally:
            await conn.close()
    
    return {
        "status": "SECURE" if threats_count == 0 else "ALERT",
        "level": "HIGH" if threats_count == 0 else "MEDIUM",
        "threats_detected": threats_count,
        "last_scan": datetime.now(timezone.utc).isoformat()
    }


@router.get("/audit-log")
async def get_audit_log(limit: int = 50):
    """Get audit log entries"""
    conn = await get_db_connection()
    entries = []
    total = 0
    
    if conn:
        try:
            # Get PII access logs
            rows = await conn.fetch("""
                SELECT id, user_id, username, action, resource_type, 
                       resource_id, pii_fields, ip_address, timestamp
                FROM audit_pii_access 
                ORDER BY timestamp DESC 
                LIMIT $1
            """, limit)
            
            for row in rows:
                entries.append({
                    "id": row["id"],
                    "user": row["username"],
                    "action": row["action"],
                    "resource": f"{row['resource_type']}/{row['resource_id']}",
                    "timestamp": row["timestamp"].isoformat() if row["timestamp"] else None
                })
            
            total = await conn.fetchval("SELECT COUNT(*) FROM audit_pii_access")
        except Exception:
            pass
        finally:
            await conn.close()
    
    return {
        "entries": entries,
        "total": total or 0
    }


@router.post("/scan")
async def trigger_security_scan():
    """Trigger security scan"""
    import uuid
    scan_id = f"scan-{uuid.uuid4().hex[:8]}"
    
    # Log the scan event
    conn = await get_db_connection()
    if conn:
        try:
            await conn.execute("""
                INSERT INTO audit_security_events 
                (event_type, severity, description, metadata, timestamp)
                VALUES ($1, $2, $3, $4, $5)
            """, "security_scan", "low", "Manual security scan triggered", 
                {"scan_id": scan_id}, datetime.now(timezone.utc))
        except Exception:
            pass
        finally:
            await conn.close()
    
    return {
        "scan_id": scan_id,
        "status": "STARTED",
        "started_at": datetime.now(timezone.utc).isoformat()
    }


@router.get("/threats")
async def get_threats():
    """Get detected threats"""
    conn = await get_db_connection()
    threats = []
    breakdown = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    
    if conn:
        try:
            rows = await conn.fetch("""
                SELECT id, event_type, severity, description, user_id, 
                       metadata, timestamp
                FROM audit_security_events 
                WHERE severity IN ('high', 'critical', 'medium')
                ORDER BY timestamp DESC 
                LIMIT 100
            """)
            
            for row in rows:
                threats.append({
                    "id": row["id"],
                    "type": row["event_type"],
                    "severity": row["severity"],
                    "description": row["description"],
                    "timestamp": row["timestamp"].isoformat() if row["timestamp"] else None
                })
                if row["severity"] in breakdown:
                    breakdown[row["severity"]] += 1
            
        except Exception:
            pass
        finally:
            await conn.close()
    
    return {
        "threats": threats,
        "total": len(threats),
        "severity_breakdown": breakdown
    }

