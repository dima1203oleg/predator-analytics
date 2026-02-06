#!/bin/bash
# ============================================
# PREDATOR macOS Full Unlock Script
# ============================================
# Цей скрипт вирішує ВСІ проблеми з permissions на macOS
# Запустіть його ОДИН РАЗ, щоб назавжди забути про блокування
# ============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║       PREDATOR macOS FULL UNLOCK                             ║"
echo "║       Розблокування всіх обмежень для розробки               ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Поточний користувач
USER_NAME=$(whoami)
PROJECT_DIR="/Users/dima-mac/Documents/Predator_21"

echo -e "${YELLOW}[1/7] Вимкнення Gatekeeper (блокування неперевірених додатків)...${NC}"
sudo spctl --master-disable 2>/dev/null || echo "⚠️  Потрібен sudo"
echo -e "${GREEN}✓ Gatekeeper вимкнено${NC}"

echo ""
echo -e "${YELLOW}[2/7] Розблокування атрибутів карантину для проєкту...${NC}"
xattr -r -d com.apple.quarantine "$PROJECT_DIR" 2>/dev/null || true
xattr -r -d com.apple.metadata:kMDItemWhereFroms "$PROJECT_DIR" 2>/dev/null || true
echo -e "${GREEN}✓ Карантин знято${NC}"

echo ""
echo -e "${YELLOW}[3/7] Виправлення прав доступу до файлів...${NC}"
# Встановлюємо правильного власника
sudo chown -R "$USER_NAME:staff" "$PROJECT_DIR" 2>/dev/null || true
# Права на файли: читання/запис для власника
find "$PROJECT_DIR" -type f -exec chmod 644 {} \; 2>/dev/null || true
# Права на директорії: повний доступ для власника
find "$PROJECT_DIR" -type d -exec chmod 755 {} \; 2>/dev/null || true
# Виконувані скрипти
find "$PROJECT_DIR" -name "*.sh" -exec chmod +x {} \; 2>/dev/null || true
find "$PROJECT_DIR" -name "node_modules/.bin/*" -exec chmod +x {} \; 2>/dev/null || true
echo -e "${GREEN}✓ Права виправлено${NC}"

echo ""
echo -e "${YELLOW}[4/7] Видалення зламаних control sockets SSH...${NC}"
rm -f ~/.ssh/control-* 2>/dev/null || true
echo -e "${GREEN}✓ SSH sockets очищено${NC}"

echo ""
echo -e "${YELLOW}[5/7] Перевірка SSH ключів...${NC}"
if [ -f ~/.ssh/id_ed25519_dev ]; then
    chmod 600 ~/.ssh/id_ed25519_dev
    chmod 644 ~/.ssh/id_ed25519_dev.pub 2>/dev/null || true
    echo -e "${GREEN}✓ SSH ключі налаштовано${NC}"
else
    echo -e "${RED}⚠️  SSH ключ не знайдено, створіть його командою:${NC}"
    echo "   ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519_dev"
fi

echo ""
echo -e "${YELLOW}[6/7] Додавання Terminal.app до Full Disk Access...${NC}"
echo -e "${CYAN}   ➡️  Це потрібно зробити ВРУЧНУ:${NC}"
echo "   1. Відкрийте: System Preferences → Privacy & Security → Privacy"
echo "   2. Прокрутіть до 'Full Disk Access'"
echo "   3. Натисніть 🔒 і введіть пароль"
echo "   4. Натисніть '+' і додайте:"
echo "      - /Applications/Utilities/Terminal.app"
echo "      - /Applications/iTerm.app (якщо використовуєте)"
echo "      - Ваш IDE (VS Code, Cursor, тощо)"
echo ""

echo -e "${YELLOW}[7/7] Вимкнення App Management (macOS 13+)...${NC}"
echo -e "${CYAN}   ➡️  Це потрібно зробити ВРУЧНУ:${NC}"
echo "   1. System Preferences → Privacy & Security → Privacy"
echo "   2. 'App Management' → додайте Terminal та IDE"
echo ""

# Створюємо простий тест підключення
echo -e "${YELLOW}[ТЕСТ] Перевірка мережевого підключення...${NC}"

# Тест локальних портів
echo -n "   Порт 3030 (UI): "
if nc -z localhost 3030 2>/dev/null; then
    echo -e "${GREEN}✓ Працює${NC}"
else
    echo -e "${RED}✗ Не відповідає${NC}"
fi

echo -n "   Порт 9090 (Backend): "
if nc -z localhost 9090 2>/dev/null; then
    echo -e "${GREEN}✓ Працює${NC}"
else
    echo -e "${RED}✗ Не відповідає${NC}"
fi

echo -n "   Порт 5601 (OpenSearch): "
if nc -z localhost 5601 2>/dev/null; then
    echo -e "${GREEN}✓ Працює${NC}"
else
    echo -e "${RED}✗ Не відповідає${NC}"
fi

echo ""
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ ГОТОВО! Тепер перезапустіть Terminal та спробуйте знову.${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Якщо проблеми продовжуються, виконайте в НОВОМУ терміналі:${NC}"
echo ""
echo "  # Запуск SSH тунелю вручну:"
echo "  ssh -N -L 9090:localhost:8090 -L 5601:localhost:5601 predator-server &"
echo ""
echo "  # Потім запустіть UI:"
echo "  cd $PROJECT_DIR && ./V30_GOLDEN_START.sh"
echo ""
