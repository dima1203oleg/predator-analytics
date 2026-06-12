#!/bin/bash
set -e

echo "🚀 [ADV-DVS] Installing system dependencies..."
sudo apt-get update
sudo apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-ukr \
    libtesseract-dev

echo "🚀 [ADV-DVS] Installing Python dependencies..."
# Ensure we are using the venv if it exists
if [ -d "/home/dima/Predator_60/venv" ]; then
    source /home/dima/Predator_60/venv/bin/activate
fi

pip install scrapy==2.11.1 pymupdf==1.24.1 pytesseract==0.3.10

echo "✅ Dependencies installed successfully!"
