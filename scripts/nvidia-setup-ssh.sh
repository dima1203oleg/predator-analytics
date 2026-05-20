#!/bin/bash
# =============================================================================
# NVIDIA Server SSH Setup — PREDATOR Analytics v65.7-ELITE
# =============================================================================
# Виконувати НА NVIDIA сервері (194.177.1.240) як root або sudo.
# Налаштовує SSH доступ для GitHub Actions деплою.
#
# Використання:
#   sudo bash nvidia-setup-ssh.sh
# =============================================================================

set -euo pipefail

PREDATOR_USER="${PREDATOR_USER:-predator}"
SSH_PORT="${SSH_PORT:-22}"
PUB_KEY="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAICp5QGoU55q96jpAtgB31U0HEzrOs+HNhwU9xVzWJDg9 predator-nvidia-deploy"

echo "=== PREDATOR NVIDIA Server SSH Setup ==="
echo "User: $PREDATOR_USER"
echo "SSH Port: $SSH_PORT"
echo ""

# 1. Створити користувача якщо не існує
if ! id "$PREDATOR_USER" &>/dev/null; then
    echo "[1/6] Створення користувача $PREDATOR_USER..."
    useradd -m -s /bin/bash "$PREDATOR_USER"
    usermod -aG sudo "$PREDATOR_USER" || usermod -aG wheel "$PREDATOR_USER" || true
else
    echo "[1/6] Користувач $PREDATOR_USER вже існує"
fi

# 2. Налаштувати .ssh директорію
SSH_DIR="/home/$PREDATOR_USER/.ssh"
mkdir -p "$SSH_DIR"
chmod 700 "$SSH_DIR"
chown "$PREDATOR_USER:$PREDATOR_USER" "$SSH_DIR"

# 3. Додати публічний ключ
AUTH_KEYS="$SSH_DIR/authorized_keys"
if ! grep -qF "$PUB_KEY" "$AUTH_KEYS" 2>/dev/null; then
    echo "[2/6] Додавання deploy key..."
    echo "$PUB_KEY" >> "$AUTH_KEYS"
    chmod 600 "$AUTH_KEYS"
    chown "$PREDATOR_USER:$PREDATOR_USER" "$AUTH_KEYS"
else
    echo "[2/6] Deploy key вже додано"
fi

# 4. Перевірити sshd
if ! systemctl is-active --quiet sshd 2>/dev/null && ! service ssh status >/dev/null 2>&1; then
    echo "[3/6] Запуск sshd..."
    systemctl enable sshd 2>/dev/null || true
    systemctl start sshd 2>/dev/null || service ssh start || true
else
    echo "[3/6] sshd активний"
fi

# 5. Перевірити фаєрвол
if command -v ufw &>/dev/null; then
    if ! ufw status | grep -q "$SSH_PORT/tcp"; then
        echo "[4/6] Дозвіл SSH через ufw..."
        ufw allow "$SSH_PORT/tcp"
    else
        echo "[4/6] SSH вже дозволено в ufw"
    fi
elif command -v firewall-cmd &>/dev/null; then
    if ! firewall-cmd --list-services 2>/dev/null | grep -q ssh; then
        echo "[4/6] Дозвіл SSH через firewall-cmd..."
        firewall-cmd --permanent --add-service=ssh
        firewall-cmd --reload
    else
        echo "[4/6] SSH вже дозволено в firewall-cmd"
    fi
else
    echo "[4/6] Фаєрвол не виявлено (пропускаємо)"
fi

# 6. Перевірити підключення
echo "[5/6] Перевірка SSH конфігурації..."
sshd -t || echo "⚠️ Помилка в sshd_config"

# 7. Вивести підсумок
echo ""
echo "=== Налаштування завершено ==="
echo "Користувач: $PREDATOR_USER"
echo "SSH: ssh -p $SSH_PORT $PREDATOR_USER@194.177.1.240"
echo ""
echo "Перевірка з MacBook:"
echo "  ssh -i nvidia_deploy -p $SSH_PORT $PREDATOR_USER@194.177.1.240"
echo ""
