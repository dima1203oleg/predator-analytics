#!/bin/bash
# Create additional databases for Predator Analytics services
# Run this after postgres container is up

set -e

POSTGRES_USER="${POSTGRES_USER:-predator}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-predator_password}"
POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"

# Wait for postgres
until pg_isready -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER; do
  echo "Waiting for PostgreSQL..."
  sleep 2
done

# Create mlflow database if not exists
psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'mlflow'" | grep -q 1 || \
psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d postgres -c "CREATE DATABASE mlflow"

# Create keycloak database if not exists
psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'keycloak'" | grep -q 1 || \
psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d postgres -c "CREATE DATABASE keycloak"

echo "✅ All databases created successfully"
