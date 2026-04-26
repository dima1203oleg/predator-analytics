#!/bin/bash
# AUTO_DEPLOY_IMAC.sh - v60.5-ELITE
echo "🚀 Активація Predator Analytics Full Stack..."

# 1. Очищення MacBook
echo "🧹 Звільнення порту 3030 на MacBook..."
lsof -ti:3030 | xargs kill -9 2>/dev/null || true

# 2. Жорстке очищення та запуск на iMac
echo "🌌 Надсилання команд на iMac (192.168.0.199)..."
echo "⚠️  Введіть пароль '1204' якщо запитає."

# Спершу чистимо завислі контейнери з правильним PATH
ssh dmytrokizima@192.168.0.199 "export PATH=\$PATH:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin && docker ps -a | grep k3d-predator-full-stack | awk '{print \$1}' | xargs docker rm -f 2>/dev/null || true"

# Потім запускаємо повний бутстрап
cat deploy/scripts/deploy_imac_full_stack.sh | ssh dmytrokizima@192.168.0.199 "export PATH=\$PATH:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin && cat > ~/bootstrap.sh && chmod +x ~/bootstrap.sh && bash ~/bootstrap.sh"

# 3. Запуск UI на MacBook у новому вікні Терміналу
echo "🎨 Запуск веб-інтерфейсу на MacBook (у новому вікні)..."
osascript -e "tell application \"Terminal\" to do script \"cd /Users/Shared/Predator_60/apps/predator-analytics-ui && npm run dev\""

echo "🏁 ПРОЦЕС ПІШОВ!"
echo "🔗 UI відкриється автоматично: http://localhost:3030"
echo "🔗 iMac API: http://192.168.0.199:8000/api/v1"
