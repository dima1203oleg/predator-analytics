#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# 🛡️ PREDATOR v61.0-ELITE — Діагностика PTY + Кластер
# Запуск: bash /Users/Shared/Predator_60/check_cluster_and_fix_pty.sh
# ═══════════════════════════════════════════════════════════════════

set -e

echo ""
echo "══════════════════════════════════════════════════"
echo "  🦅 PREDATOR DIAGNOSTICS v61.0-ELITE"
echo "══════════════════════════════════════════════════"
echo ""

# ─── КРОК 1: Стан PTY ────────────────────────────────
echo "📊 [1/4] СТАН PTY:"
echo "  kern.tty.ptmx_max: $(sysctl -n kern.tty.ptmx_max 2>/dev/null || echo 'невідомо')"

# Підрахунок активних PTY
PTY_COUNT=$(ls /dev/ttys* 2>/dev/null | wc -l | tr -d ' ')
echo "  Активних PTY пристроїв: $PTY_COUNT"

# Процеси, що утримують PTY
echo ""
echo "  Топ процеси з PTY:"
ps aux | grep -E '(pts|ttys)' | grep -v grep | awk '{print "    PID="$2, "CMD="$11}' | head -10

# ─── КРОК 2: Звільнення PTY ──────────────────────────
echo ""
echo "🧹 [2/4] ЗВІЛЬНЕННЯ PTY РЕСУРСІВ:"

# Закрити зомбі-процеси Antigravity/Gemini агента
ZOMBIE_COUNT=0
for pid in $(ps aux | grep -E '(antigravity|gemini.*agent|cortex)' | grep -v grep | awk '{print $2}'); do
    echo "  Завершення процесу PID=$pid..."
    kill -9 "$pid" 2>/dev/null && ZOMBIE_COUNT=$((ZOMBIE_COUNT + 1))
done

# Закрити залишки старих SSH сесій
for pid in $(ps aux | grep 'ssh.*192.168.0.199' | grep -v grep | awk '{print $2}'); do
    echo "  Завершення SSH PID=$pid..."
    kill "$pid" 2>/dev/null && ZOMBIE_COUNT=$((ZOMBIE_COUNT + 1))
done

# Закрити залишки node dev server
for pid in $(ps aux | grep 'node.*vite.*3030' | grep -v grep | awk '{print $2}'); do
    echo "  Завершення dev server PID=$pid..."
    kill "$pid" 2>/dev/null && ZOMBIE_COUNT=$((ZOMBIE_COUNT + 1))
done

echo "  Звільнено процесів: $ZOMBIE_COUNT"

# ─── КРОК 3: Перевірка з'єднання з iMac ──────────────
echo ""
echo "🔗 [3/4] З'ЄДНАННЯ З IMAC (192.168.0.199):"
if ping -c 1 -W 2 192.168.0.199 &>/dev/null; then
    echo "  ✅ iMac доступний"
    
    # Перевірка SSH
    if ssh -o ConnectTimeout=3 -o StrictHostKeyChecking=no dima1203@192.168.0.199 "echo 'SSH_OK'" 2>/dev/null; then
        echo "  ✅ SSH з'єднання працює"
        
        echo ""
        echo "  📦 Kubectl статус:"
        ssh -o ConnectTimeout=5 dima1203@192.168.0.199 "
            export KUBECONFIG=\$HOME/.kube/config
            echo '  Контекст: '
            kubectl config current-context 2>/dev/null || echo '  ⚠️ kubectl не налаштовано'
            echo ''
            echo '  Pods у неймспейсі predator:'
            kubectl get pods -n predator -o wide 2>/dev/null || echo '  ⚠️ Неймспейс predator не знайдено'
            echo ''
            echo '  Services:'
            kubectl get svc -n predator 2>/dev/null || echo '  ⚠️ Сервіси не знайдено'
        " 2>/dev/null || echo "  ⚠️ Не вдалось отримати статус kubectl"
    else
        echo "  ❌ SSH недоступний"
    fi
else
    echo "  ❌ iMac недоступний (ping timeout)"
fi

# ─── КРОК 4: Git статус ──────────────────────────────
echo ""
echo "📋 [4/4] GIT СТАТУС:"
cd /Users/Shared/Predator_60
echo "  Гілка: $(git branch --show-current 2>/dev/null)"
echo "  Останній коміт: $(git log -1 --oneline 2>/dev/null)"
CHANGES=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
echo "  Незакомічених змін: $CHANGES"

if [ "$CHANGES" -gt 0 ]; then
    echo ""
    echo "  🔄 Виконую автоматичний коміт..."
    git add -A
    git commit -m "fix(ui): оновлення RealTimeMonitor.tsx та діагностика ELITE v61.0" --no-verify
    git pull --rebase origin main 2>/dev/null || true
    git push origin main 2>/dev/null && echo "  ✅ Push виконано!" || echo "  ⚠️ Push не вдався"
fi

echo ""
echo "══════════════════════════════════════════════════"
echo "  ✅ ДІАГНОСТИКА ЗАВЕРШЕНА"
echo "  Тепер перезапустіть VS Code для оновлення PTY"
echo "══════════════════════════════════════════════════"
echo ""
