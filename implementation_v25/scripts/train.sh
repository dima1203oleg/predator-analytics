#!/usr/bin/env bash
# Simple helper script to run a training job with H2O LLM Studio and report to MLflow
set -euo pipefail

CONFIG=${1:-configs/llm/exp_reranker_lora.py}
echo "Starting training with config: ${CONFIG}"

# This is a minimal example: you should adapt to your environment
python -m llm_studio.train -C "${CONFIG}"

echo "Training finished — push to DVC and MLflow manually or via CI" 
