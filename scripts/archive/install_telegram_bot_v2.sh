#!/bin/bash
# Predator Telegram Bot V2.0 - Quick Install Script

set -e  # Exit on error

echo "🚀 Installing Predator Telegram Bot V2.0..."
echo ""

# Check if we're in the right directory
if [ ! -f "backend/orchestrator/agents/telegram_bot_production.py" ]; then
    echo "❌ Error: Run this script from the Predator_21 root directory"
    exit 1
fi
# Setup virtual environment
if [ ! -d ".venv_bot" ]; then
    echo "📦 Creating virtual environment .venv_bot..."
    python3 -m venv .venv_bot
fi
source .venv_bot/bin/activate


# 1. Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -q --upgrade pip
pip install -q -r backend/orchestrator/requirements_telegram_v2.txt

echo "✅ Core dependencies installed"

# 2. Check for optional dependencies
echo ""
echo "🔍 Checking optional dependencies..."

# Check for Google Cloud
if python3 -c "import google.cloud.speech" 2>/dev/null; then
    echo "✅ Google Cloud Speech API available"
    VOICE_AVAILABLE=true
else
    echo "⚠️  Google Cloud Speech API not available (voice features disabled)"
    echo "   Install with: pip install google-cloud-speech google-cloud-texttospeech"
    VOICE_AVAILABLE=false
fi

# Check for matplotlib
if python3 -c "import matplotlib" 2>/dev/null; then
    echo "✅ Matplotlib available (charts enabled)"
else
    echo "⚠️  Matplotlib not available (charts disabled)"
    echo "   Install with: pip install matplotlib numpy"
fi

# Check for Docker
if python3 -c "import docker" 2>/dev/null; then
    echo "✅ Docker SDK available (container control enabled)"
else
    echo "⚠️  Docker SDK not available"
    echo "   Install with: pip install docker"
fi

# 3. Check environment variables
echo ""
echo "🔍 Checking environment configuration..."

if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
    echo "⚠️  TELEGRAM_BOT_TOKEN not set"
    echo "   Add to .env: TELEGRAM_BOT_TOKEN=your_token"
    ENV_OK=false
else
    echo "✅ TELEGRAM_BOT_TOKEN configured"
    ENV_OK=true
fi

if [ -z "$TELEGRAM_ADMIN_ID" ]; then
    echo "⚠️  TELEGRAM_ADMIN_ID not set"
    echo "   Add to .env: TELEGRAM_ADMIN_ID=123456789"
    ENV_OK=false
else
    echo "✅ TELEGRAM_ADMIN_ID configured"
fi

if [ -z "$REDIS_URL" ]; then
    echo "⚠️  REDIS_URL not set (using default: redis://redis:6379/1)"
    export REDIS_URL="redis://redis:6379/1"
else
    echo "✅ REDIS_URL configured"
fi

# 4. Check Google Cloud credentials for Voice
if [ -n "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
    if [ -f "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
        echo "✅ Google Cloud credentials found (voice enabled)"
    else
        echo "⚠️  GOOGLE_APPLICATION_CREDENTIALS path invalid: $GOOGLE_APPLICATION_CREDENTIALS"
    fi
else
    echo "ℹ️  GOOGLE_APPLICATION_CREDENTIALS not set (voice features disabled)"
    echo "   For voice support, create Google Cloud project and set credentials path"
fi

# 5. Create example .env if not exists
if [ ! -f ".env" ]; then
    echo ""
    echo "📝 Creating .env file from example..."
    cp .env.telegram.example .env
    echo "✅ Please edit .env and add your tokens"
else
    echo "ℹ️  .env file already exists"
fi

# 6. Test bot connection
echo ""
echo "🔍 Testing bot configuration..."

if [ "$ENV_OK" = true ]; then
    echo "✅ All required environment variables are set"
    echo ""
    echo "🚀 Ready to launch!"
    echo ""
    echo "Start the bot with:"
    echo "  .venv_bot/bin/python backend/orchestrator/agents/telegram_bot_production.py"
    echo ""
    echo "Or via Docker:"
    echo "  docker-compose up telegram_bot"
else
    echo ""
    echo "⚠️  Configuration incomplete"
    echo "Please set required environment variables in .env and run again"
    exit 1
fi

echo ""
echo "📚 Documentation:"
echo "  - Full guide: docs/TELEGRAM_BOT_V2_README.md"
echo "  - Summary: docs/TELEGRAM_BOT_V2_SUMMARY.md"
echo ""
echo "✅ Installation complete!"
