#!/bin/bash
# Генерація токена ArgoCD для сервісного акаунта
# Використання: ./scripts/argocd_generate_token.sh <account> [--server <argocd-server>] [--username <user>] [--password <pass>] [--insecure]

set -e

ACCOUNT="$1"
SERVER="localhost:8080"
USERNAME="admin"
PASSWORD=""
INSECURE=""

# Парсинг додаткових аргументів
while [[ $# -gt 0 ]]; do
  case $1 in
    --server)
      SERVER="$2"
      shift 2
      ;;
    --username)
      USERNAME="$2"
      shift 2
      ;;
    --password)
      PASSWORD="$2"
      shift 2
      ;;
    --insecure)
      INSECURE="--insecure"
      shift
      ;;
    *)
      shift
      ;;
  esac
done

if [[ -z "$ACCOUNT" ]]; then
  echo "Вкажіть ім'я акаунта (наприклад, cicd) як перший аргумент!"
  exit 1
fi

if [[ -n "$PASSWORD" ]]; then
  argocd login "$SERVER" --username "$USERNAME" --password "$PASSWORD" $INSECURE
else
  argocd login "$SERVER" --username "$USERNAME" $INSECURE
fi

echo "Генеруємо токен для акаунта: $ACCOUNT ..."
TOKEN=$(argocd account generate-token --account "$ACCOUNT" $INSECURE 2>/dev/null || true)

if [[ -z "$TOKEN" ]]; then
  echo "Не вдалося згенерувати токен. Перевірте права акаунта та налаштування ArgoCD."
  exit 2
fi

echo "\n==== Ваш токен для $ACCOUNT ===="
echo "$TOKEN"
echo "==== Кінець токена ===="
