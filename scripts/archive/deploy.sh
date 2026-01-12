#!/bin/bash
# Predator Analytics - Full Deployment to NVIDIA Server

set -e

echo "🚀 PREDATOR ANALYTICS - SERVER DEPLOYMENT"
echo "=========================================="
echo ""

# Configuration
SERVER_IP="${SERVER_IP:-194.177.1.240}"
SERVER_USER="${SERVER_USER:-dima}"
SERVER_PORT="${SERVER_PORT:-6666}"
PROJECT_DIR="/opt/predator/repo"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# ==================== STEP 1: PRE-FLIGHT CHECKS ====================

log_info "Step 1/8: Pre-flight checks..."
echo ""

# Check SSH connection
log_info "Testing SSH connection to $SERVER_USER@$SERVER_IP:$SERVER_PORT..."
if ssh -o ConnectTimeout=5 -p "$SERVER_PORT" "$SERVER_USER@$SERVER_IP" "echo 'Connection OK'" &> /dev/null; then
    log_success "SSH connection OK"
else
    log_error "Cannot connect to server!"
    log_info "Check:"
    log_info "  1. Server is online"
    log_info "  2. SSH is allowed in firewall"
    log_info "  3. Credentials are correct"
    exit 1
fi

# Check git status
if git diff-index --quiet HEAD --; then
    log_success "Git: No uncommitted changes"
else
    log_warning "Git: Uncommitted changes detected"
    read -p "Commit changes before deployment? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add -A
        git commit -m "Pre-deployment commit $(date +%Y-%m-%d_%H:%M:%S)"
        log_success "Changes committed"
    fi
fi

echo ""

# ==================== STEP 2: SYNC CODE ====================

log_info "Step 2/8: Syncing code to server..."
echo ""

# Create project directory on server if not exists
ssh -p "$SERVER_PORT" "$SERVER_USER@$SERVER_IP" "sudo mkdir -p $PROJECT_DIR && sudo chown -R $SERVER_USER:$SERVER_USER /opt/predator"

# Rsync code (exclude unnecessary files)
log_info "Uploading files..."
rsync -avz --progress \
    --exclude 'node_modules' \
    --exclude '.venv*' \
    --exclude '.tox' \
    --exclude 'predator-analytics' \
    --exclude 'sample_data' \
    --exclude '*.xlsx' \
    --exclude '.git' \
    --exclude '__pycache__' \
    --exclude '*.pyc' \
    --exclude '*.log' \
    --exclude '.DS_Store' \
    --delete \
    -e "ssh -p $SERVER_PORT" \
    ./ "$SERVER_USER@$SERVER_IP:$PROJECT_DIR/"

log_success "Code synced"
echo ""

# ==================== STEP 3: ENVIRONMENT SETUP ====================

log_info "Step 3/8: Setting up environment..."
echo ""

# Create .env on server (if not exists)
ssh -p "$SERVER_PORT" "$SERVER_USER@$SERVER_IP" << 'ENVSSH'
cd /opt/predator/repo

if [ ! -f .env ]; then
    cat > .env << 'EOF'
# Predator Analytics - Server Environment

# Telegram Bot
TELEGRAM_BOT_TOKEN=
TELEGRAM_ADMIN_ID=
TELEGRAM_CHANNEL_ID=

# Redis
REDIS_URL=redis://redis:6379/1

# PostgreSQL
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=predator_db
POSTGRES_USER=predator
POSTGRES_PASSWORD=predator_secure_password_change_me

# LLM APIs
GEMINI_API_KEY=
GROQ_API_KEY=
DEEPSEEK_API_KEY=
OLLAMA_BASE_URL=http://localhost:11434

# OpenSearch
OPENSEARCH_HOST=opensearch
OPENSEARCH_PORT=9200

# MLflow
MLFLOW_TRACKING_URI=http://mlflow:5000

# Paths
DATA_DIR=/opt/predator/data
MODELS_DIR=/opt/predator/models
CACHE_DIR=/opt/predator/cache

# Power Monitor
POWER_MONITOR_HEARTBEAT_INTERVAL=30
POWER_MONITOR_REPORT_INTERVAL=1800

# Voice (optional)
# GOOGLE_APPLICATION_CREDENTIALS=/opt/predator/google-key.json
EOF
    echo "✅ .env file created (EDIT IT!)"
else
    echo "✅ .env file exists"
fi
ENVSSH

log_success "Environment configured"
echo ""

# ==================== STEP 4: DOCKER SETUP ====================

log_info "Step 4/8: Setting up Docker..."
echo ""

ssh -p "$SERVER_PORT" "$SERVER_USER@$SERVER_IP" << 'ENVSSH'
# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not installed!"
    echo "Install: curl -fsSL https://get.docker.com | sh"
    exit 1
fi

# Check Docker Compose
if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose not installed!"
    exit 1
fi

echo "✅ Docker ready"

# Create data directories
sudo mkdir -p /opt/predator/{data/raw,data/processed,data/indexes,cache,models,backups}
sudo chown -R dima:dima /opt/predator

echo "✅ Data directories created"
ENVSSH

log_success "Docker configured"
echo ""

# ==================== STEP 5: STOP OLD CONTAINERS ====================

log_info "Step 5/8: Stopping old containers..."
echo ""

ssh -p "$SERVER_PORT" "$SERVER_USER@$SERVER_IP" << 'ENVSSH'
cd /opt/predator/repo

if docker compose ps -q | grep -q .; then
    echo "Stopping containers..."
    docker compose down
    echo "✅ Old containers stopped"
else
    echo "✅ No running containers"
fi
ENVSSH

echo ""

# ==================== STEP 6: BUILD & START ====================

log_info "Step 6/8: Building and starting containers..."
echo ""

ssh -p "$SERVER_PORT" "$SERVER_USER@$SERVER_IP" << 'ENVSSH'
cd /opt/predator/repo

echo "Building images..."
docker compose build --no-cache

echo ""
echo "Starting services..."
docker compose up -d

echo ""
echo "Waiting for services to start (15 seconds)..."
sleep 15

echo ""
echo "Container status:"
docker compose ps
ENVSSH

log_success "Containers started"
echo ""

# ==================== STEP 7: HEALTH CHECKS ====================

log_info "Step 7/8: Running health checks..."
echo ""

ssh -p "$SERVER_PORT" "$SERVER_USER@$SERVER_IP" << 'ENVSSH'
# Function to check endpoint
check_endpoint() {
    local url=$1
    local name=$2
    local max_attempts=10
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200\|301\|302"; then
            echo "✅ $name is UP"
            return 0
        fi
        echo "⏳ $name not ready, attempt $attempt/$max_attempts..."
        sleep 3
        attempt=$((attempt + 1))
    done

    echo "❌ $name FAILED health check"
    return 1
}

# Health checks
check_endpoint "http://localhost:3000" "Frontend"
check_endpoint "http://localhost:8000/health" "Backend"

# Check orchestrator logs
echo ""
echo "Orchestrator logs (last 20 lines):"
docker logs $(docker ps -q -f name=orchestrator) 2>&1 | tail -20 || echo "Orchestrator not running yet"
ENVSSH

echo ""

# ==================== STEP 8: POST-DEPLOYMENT ====================

log_info "Step 8/8: Post-deployment setup..."
echo ""

log_success "Deployment complete!"
echo ""
echo "=========================================="
echo "📊 DEPLOYMENT SUMMARY"
echo "=========================================="
echo "Server: $SERVER_USER@$SERVER_IP:$SERVER_PORT"
echo "Project: $PROJECT_DIR"
echo ""
echo "🌐 Services:"
echo "  Frontend:  http://$SERVER_IP:3000"
echo "  Backend:   http://$SERVER_IP:8000"
echo "  MLflow:    http://$SERVER_IP:5000"
echo ""
echo "📋 Next steps:"
echo "  1. Edit .env on server:"
echo "     ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP"
echo "     nano /opt/predator/repo/.env"
echo ""
echo "  2. Add Telegram credentials:"
echo "     TELEGRAM_BOT_TOKEN=..."
echo "     TELEGRAM_ADMIN_ID=..."
echo ""
echo "  3. Add LLM API keys:"
echo "     GEMINI_API_KEY=..."
echo "     GROQ_API_KEY=..."
echo ""
echo "  4. Restart services:"
echo "     cd /opt/predator/repo && docker compose restart"
echo ""
echo "  5. Start Telegram Bot:"
echo "     docker exec -it predator_orchestrator python backend/orchestrator/agents/telegram_bot_v2.py"
echo ""
echo "  6. Monitor logs:"
echo "     docker compose logs -f orchestrator"
echo ""
echo "🎉 Ready to rock! 🚀"
echo ""
