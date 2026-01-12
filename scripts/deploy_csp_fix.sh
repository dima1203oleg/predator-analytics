#!/bin/bash
# Автоматичне виправлення: Завантаження CSP конфігу та рестарт OpenSearch Dashboards
SERVER="dima@194.177.1.240"
PORT="6666"
REMOTE_DIR="~/Documents/Predator_21" # Або де там лежить проект? Зазвичай в ~/ або ~/predator
# Перевіримо, куди scp. Користувач працює локально в /Users/dima-mac...
# А на сервері? В попередніх розмовах (summary) не вказано шлях.
# Але Docker зазвичай запускається з папки проекту.
# Припустимо ~/Documents/Predator_21 (якщо це mirror) або просто ~/predator.
# Спробую просто в ~/, а потім mv. Але docker-compose монтує з ./opensearch_dashboards_no_auth.yml
# Тому треба знайти де лежить docker-compose.yml на сервері.

# Спроба 1: Припускаємо структуру як локально, якщо synced via rsync
# Спроба 2: Просто перезапускаємо, якщо файл монтується bind-mount'ом, то треба оновити файл НА СЕРВЕРІ.
# Локальний файл я оновив. Треба його залити.

echo "🚀 Deploying CSP Fix..."

# Upload config to home first
scp -P $PORT -o StrictHostKeyChecking=no opensearch_dashboards_no_auth.yml $SERVER:~/opensearch_dashboards_no_auth.yml

# Move to correct location and restart
ssh -p $PORT -o StrictHostKeyChecking=no $SERVER "
  # Find where docker-compose is running
  # Assuming standard path or search
  PROJECT_DIR=\$(find ~ -name docker-compose.yml -printf '%h\n' | head -n 1)

  if [ -z \"\$PROJECT_DIR\" ]; then
    echo '❌ Could not find project directory on server.'
    exit 1
  fi

  echo \"📂 Found project in: \$PROJECT_DIR\"
  mv ~/opensearch_dashboards_no_auth.yml \$PROJECT_DIR/opensearch_dashboards_no_auth.yml

  echo \"🔄 Restarting OpenSearch Dashboards...\"
  cd \$PROJECT_DIR
  docker-compose restart opensearch-dashboards
"
