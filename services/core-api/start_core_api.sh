#!/bin/bash
echo "🚀 Starting PREDATOR Core API..."
cd /Users/Shared/Predator_60/services/core-api
export PYTHONPATH=.:../../libs/predator-common
venv/bin/python3.12 -m uvicorn app.main:app --host 127.0.0.1 --port 8001
