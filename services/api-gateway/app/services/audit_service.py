import logging
from typing import Dict, Any, Optional
from datetime import datetime, timezone
import asyncpg
import os

logger = logging.getLogger("service.audit")

class AuditService:
    """
    Audit logging service for compliance and security.
    Logs all PII access, data modifications, and security events.
    """
    
    def __init__(self):
        self.db_url = os.getenv("DATABASE_URL")
    
    async def log_pii_access(
        self,
        user_id: str,
        username: str,
        action: str,
        resource_type: str,
        resource_id: str,
        pii_fields: list,
        ip_address: Optional[str] = None
    ):
        """
        Log PII data access for compliance.
        
        Args:
            user_id: User ID from token
            username: Username
            action: 'view', 'export', 'modify'
            resource_type: 'document', 'dataset', 'query'
            resource_id: ID of accessed resource
            pii_fields: List of PII fields accessed
            ip_address: Client IP
        """
        conn = await asyncpg.connect(self.db_url)
        
        try:
            await conn.execute("""
                INSERT INTO audit_pii_access (
                    user_id, username, action, resource_type, resource_id,
                    pii_fields, ip_address, timestamp
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            """, user_id, username, action, resource_type, resource_id,
                pii_fields, ip_address, datetime.now(timezone.utc))
            
            logger.info(f"PII access logged: {username} {action} {resource_type}/{resource_id}")
        
        finally:
            await conn.close()
    
    async def log_security_event(
        self,
        event_type: str,
        severity: str,
        description: str,
        user_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """
        Log security events (failed auth, suspicious activity, etc.)
        
        Args:
            event_type: 'auth_failure', 'rate_limit', 'suspicious_query'
            severity: 'low', 'medium', 'high', 'critical'
            description: Human-readable description
            user_id: Optional user ID
            metadata: Additional context
        """
        conn = await asyncpg.connect(self.db_url)
        
        try:
            await conn.execute("""
                INSERT INTO audit_security_events (
                    event_type, severity, description, user_id, metadata, timestamp
                ) VALUES ($1, $2, $3, $4, $5, $6)
            """, event_type, severity, description, user_id,
                metadata or {}, datetime.now(timezone.utc))
            
            logger.warning(f"Security event: [{severity}] {event_type} - {description}")
        
        finally:
            await conn.close()
    
    async def log_data_modification(
        self,
        user_id: str,
        action: str,
        table_name: str,
        record_id: str,
        changes: Dict[str, Any]
    ):
        """
        Log data modifications for audit trail.
        """
        conn = await asyncpg.connect(self.db_url)
        
        try:
            await conn.execute("""
                INSERT INTO audit_data_changes (
                    user_id, action, table_name, record_id, changes, timestamp
                ) VALUES ($1, $2, $3, $4, $5, $6)
            """, user_id, action, table_name, record_id, changes, datetime.now(timezone.utc))
        
        finally:
            await conn.close()
    
    async def create_audit_tables(self):
        """Create audit tables if they don't exist."""
        conn = await asyncpg.connect(self.db_url)
        
        try:
            # PII access audit
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS audit_pii_access (
                    id SERIAL PRIMARY KEY,
                    user_id VARCHAR(255) NOT NULL,
                    username VARCHAR(255) NOT NULL,
                    action VARCHAR(50) NOT NULL,
                    resource_type VARCHAR(50) NOT NULL,
                    resource_id VARCHAR(255) NOT NULL,
                    pii_fields TEXT[],
                    ip_address VARCHAR(45),
                    timestamp TIMESTAMP NOT NULL,
                    INDEX idx_user_timestamp (user_id, timestamp),
                    INDEX idx_resource (resource_type, resource_id)
                )
            """)
            
            # Security events
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS audit_security_events (
                    id SERIAL PRIMARY KEY,
                    event_type VARCHAR(100) NOT NULL,
                    severity VARCHAR(20) NOT NULL,
                    description TEXT,
                    user_id VARCHAR(255),
                    metadata JSONB,
                    timestamp TIMESTAMP NOT NULL,
                    INDEX idx_severity_timestamp (severity, timestamp)
                )
            """)
            
            # Data modifications
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS audit_data_changes (
                    id SERIAL PRIMARY KEY,
                    user_id VARCHAR(255) NOT NULL,
                    action VARCHAR(50) NOT NULL,
                    table_name VARCHAR(100) NOT NULL,
                    record_id VARCHAR(255) NOT NULL,
                    changes JSONB,
                    timestamp TIMESTAMP NOT NULL,
                    INDEX idx_table_record (table_name, record_id)
                )
            """)
            
            logger.info("Audit tables created successfully")
        
        finally:
            await conn.close()
