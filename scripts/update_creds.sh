#!/bin/bash
# Update Telegram Credentials and Restart Bot

TOKEN="8562512293:AAEbO8iKWf4ZX_7STXSDDU8h-xpSQzTTrtE"
ADMIN_ID="8562512293" # Warning: This matches Bot ID. Ensure this is correct.

cd ~/predator-analytics || exit

# Backup
cp .env .env.bak

# Update Token
if grep -q "TELEGRAM_BOT_TOKEN=" .env; then
  sed -i "s|^TELEGRAM_BOT_TOKEN=.*|TELEGRAM_BOT_TOKEN=$TOKEN|" .env
else
  echo "TELEGRAM_BOT_TOKEN=$TOKEN" >> .env
fi

# Update Admin ID
if grep -q "TELEGRAM_ADMIN_ID=" .env; then
  sed -i "s|^TELEGRAM_ADMIN_ID=.*|TELEGRAM_ADMIN_ID=$ADMIN_ID|" .env
else
  echo "TELEGRAM_ADMIN_ID=$ADMIN_ID" >> .env
fi

echo "✅ Credentials updated in .env"

# Restart
echo "🔄 Restarting Telegram Controller..."
docker compose up -d --force-recreate telegram_controller

# Check logs
echo "📜 Recent logs:"
timeout 5s docker compose logs -f telegram_controller
