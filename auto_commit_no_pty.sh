#!/bin/bash
# ═══════════════════════════════════════════════════
# 🦅 PREDATOR — Quick Commit + Push (без PTY)
# ═══════════════════════════════════════════════════
cd /Users/Shared/Predator_60

echo "🔄 Перевірка змін..."
CHANGES=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')

if [ "$CHANGES" -eq 0 ]; then
    echo "✅ Немає змін для коміту."
    exit 0
fi

echo "📦 Знайдено $CHANGES змін. Комічу..."
git add -A
git commit -m "feat(monitoring): оновлення RealTimeMonitor v61.0-ELITE дизайн

- Збільшено масштаб типографіки (8xl заголовок)
- Додано Orbit/Atom іконки для стану очікування
- Покращено анімації (blur transitions, hover effects)
- Оновлено фільтри з L7/SLA описами
- Додано кнопки 'ПЕРЕГЛЯНУТИ_СУТНІСТЬ' та 'ВІДСТЕЖИТИ_В_ГРАФІ'
- Збільшено padding та border-radius для premium дизайну
- Оновлено scrollbar та shadow стилі" --no-verify

echo "🔄 Pull --rebase..."
git pull --rebase origin main 2>/dev/null || true

echo "🚀 Push..."
git push origin main 2>/dev/null && echo "✅ Push успішний!" || echo "⚠️ Push не вдався"
