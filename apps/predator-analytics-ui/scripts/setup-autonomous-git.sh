#!/bin/bash

# 🤖 Налаштування Git для максимальної автономності

echo "🔧 Налаштування Git для автономної роботи..."

# Налаштування локального .gitconfig
if [ -f ".gitconfig" ]; then
  echo "📦 Встановлення локального git config..."
  git config --local include.path .gitconfig
fi

# Налаштування автосхвалення комітів
git config --local commit.gpgSign false
git config --local push.autoSetupRemote true
git config --local push.default current
git config --local pull.rebase true

# Налаштування merge для автоматичного вирішення конфліктів
git config --local merge.tool vscode
git config --local merge.conflictstyle diff3

# Налаштування rebase для автоматичних дій
git config --local rebase.autoStash true
git config --local rebase.autoSquash true

echo "✅ Git налаштовано для максимальної автономності"
echo "🚀 Автономні команди:"
echo "   - git auto-commit (додає, комітить і пушить)"
echo "   - git auto-sync (пул, коміт, пуш)"
echo "   - git safe-push (безпечний force push)"
