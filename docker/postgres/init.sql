-- PostgreSQL initialization script for Predator Analytics
-- Creates extensions and additional databases for the system

-- Create extensions for predator_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Create additional databases
CREATE DATABASE keycloak;
CREATE DATABASE mlflow;

-- Grant privileges to predator user
GRANT ALL PRIVILEGES ON DATABASE keycloak TO predator;
GRANT ALL PRIVILEGES ON DATABASE mlflow TO predator;
