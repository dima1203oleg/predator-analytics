#!/bin/bash
echo "Testing Diagnostics API..."
curl -s -X POST http://localhost:8000/api/v1/system/diagnostics/run | jq .
