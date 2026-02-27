#!/bin/bash
# ============================================================
# Predator Analytics v45.0 - System Hardening & Initializer
# Focus: Database, Storage, Extensions, Context
# ============================================================

set -e

echo "🚀 Initializing Predator Analytics Infrastructure..."

# 1. Wait for Postgres
echo "🐘 Waiting for PostgreSQL..."
until docker exec predator_postgres pg_isready -U predator; do
  echo "Still waiting for Postgres..."
  sleep 2
done

# 2. Run Database Initialization (Tables & Extensions)
echo "🛠️ Creating Tables and PostgreSQL Extensions..."
docker exec predator_backend python -c "
import asyncio
from libs.core.database import init_db
asyncio.run(init_db())
"

# 3. Initialize Qdrant
echo "📉 Initializing Qdrant Collections..."
docker exec predator_backend python -c "
import asyncio
from app.services.qdrant_service import QdrantService
q = QdrantService()
asyncio.run(q.create_collection())
"

# 4. Initialize MinIO Buckets
echo "📦 Initializing MinIO Buckets..."
docker exec predator_backend python -c "
import asyncio
from app.services.minio_service import MinIOService
m = MinIOService()
m._ensure_buckets()
"

echo "✅ System Infrastructure Ready."
