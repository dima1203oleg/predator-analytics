#!/bin/bash
set -e

# Configuration
HOST="194.177.1.240"
PORT="6666"
USER="dima"
PASS="Dima@1203"
KEY_FILE="$HOME/.ssh/id_predator_v4"

echo "🔧 Setting up permanent access to Predator Server ($HOST:$PORT)..."

# 1. Generate SSH Key if not exists
if [ ! -f "$KEY_FILE" ]; then
    echo "🔑 Generating new SSH key..."
    ssh-keygen -t ed25519 -f "$KEY_FILE" -N "" -C "predator_auto"
fi

# 2. Create Expect script to install key
cat > scripts/install_key.exp << EOF
#!/usr/bin/expect -f
set timeout 30
spawn ssh-copy-id -p $PORT -i $KEY_FILE -o StrictHostKeyChecking=no $USER@$HOST
expect {
    "yes/no" { send "yes\r"; exp_continue }
    -re "(?i)password:" { send "$PASS\r" }
    eof
}
EOF
chmod +x scripts/install_key.exp

echo "📤 Installing SSH key to server..."
./scripts/install_key.exp

# 3. Configure SSH Config
CONFIG_FILE="$HOME/.ssh/config"
if ! grep -q "Host predator-v4" "$CONFIG_FILE"; then
    echo "📝 Updating ~/.ssh/config..."
    cat >> "$CONFIG_FILE" << EOF

Host predator-v4
    HostName $HOST
    Port $PORT
    User $USER
    IdentityFile $KEY_FILE
    StrictHostKeyChecking no
    UserKnownHostsFile /dev/null
EOF
else
    echo "✅ SSH config already exists."
fi

echo "✅ Access configured! Testing connection..."
ssh predator-v4 "echo '🎉 Connection Successful!'"

# 4. Deploy Bot Fixes
echo "🚀 Deploying Bot Fixes..."

# Ensure directory
ssh predator-v4 "mkdir -p /home/dima/Predator_21/backend/orchestrator/agents"

# Upload .env
scp .env predator-v4:/home/dima/Predator_21/backend/orchestrator/.env

# Upload Bot
scp backend/orchestrator/agents/telegram_bot_v4_advanced.py \
    predator-v4:/home/dima/Predator_21/backend/orchestrator/agents/

# Restart Bot
ssh predator-v4 << 'ENDSSH'
cd /home/dima/Predator_21/backend/orchestrator
if [ ! -d "venv" ]; then python3 -m venv venv; fi
source venv/bin/activate
pip install python-dotenv

pkill -f telegram_bot_v4_advanced.py || echo "Bot not running"
sleep 2
nohup python agents/telegram_bot_v4_advanced.py > telegram_bot_v4.log 2>&1 &
echo "✅ Bot restarted"
sleep 2
tail -n 20 telegram_bot_v4.log
ENDSSH

echo "✨ All Done!"
