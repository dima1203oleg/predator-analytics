# Автоматизація генерації ArgoCD токенів і додавання в GitHub Secrets

Цей документ пояснює, як звичайно автоматизувати створення токенів ArgoCD для сервісних акаунтів та зберегти їх у GitHub Secrets для CI/CD (репозиторій predator-analytics).

> Примітка з безпеки: токени — чутливі секрети. Не зберігайте їх у публічних файлах або у коммітах. Використовуйте тільки захищені GitHub Secrets та переглядайте доступи

## Передумови
- У вас встановлені та аутентифіковані CLI:
  - argocd (https://argo-cd.readthedocs.io/en/stable/)
  - gh (GitHub CLI) (https://cli.github.com/)
  - git (щоб скрипт міг визначити репозиторій автоматично)
- Акаунт ArgoCD для якого генеруєте токен повинен мати можливість `apiKey` у `argocd-cm` (настройка через kubectl)

## Скрипти у репозиторії
- `scripts/argocd_generate_token.sh` — простий скрипт, який генерує токен для вказаного ArgoCD-акаунта і виводить його у stdout.
- `scripts/argocd_generate_and_set_secret.sh` — скрипт, що автоматично:
  1. генерує токен для вказаного акаунта (через argocd cli),
  2. записує цей токен у GitHub Actions secret (через gh CLI) у вказаний репозиторій.

## Приклад використання (локально)
1) Згенеруйте токен і виведіть у консоль:

```bash
./scripts/argocd_generate_token.sh cicd --server localhost:8080 --username admin --password 'your-password' --insecure
```

2) Згенеруйте токен та відправте в GitHub Secrets:

```bash
# якщо ви в репозиторії, --repo не потрібен
./scripts/argocd_generate_and_set_secret.sh --account cicd --secret-name ARGOCD_MAC_TOKEN --server localhost:8080 --username admin --password 'your-password' --insecure
```

Ви також можете вказати вручну репозиторій і назву секрету:

```bash
./scripts/argocd_generate_and_set_secret.sh --account cicd --secret-name ARGOCD_MAC_TOKEN --repo dima1203oleg/predator-analytics --server https://argocd.example.com --username admin
```

## Масовий запуск (кілька середовищ)
Ви можете викликати скрипт кілька разів у циклі або в оболонці для різних пар (account -> secret):

```bash
./scripts/argocd_generate_and_set_secret.sh --account cicd --secret-name ARGOCD_MAC_TOKEN --repo dima1203oleg/predator-analytics --server http://localhost:8080 --username admin --password 's3cr3t' --insecure
./scripts/argocd_generate_and_set_secret.sh --account cicd-nvidia --secret-name ARGOCD_NVIDIA_TOKEN --repo dima1203oleg/predator-analytics --server https://argocd-nvidia.example.com --username admin --password 's3cr3t'
```

## Налаштування прав ArgoCD (якщо немає apiKey)
Якщо акаунт не має можливості `apiKey`, включіть її у `argocd-cm` через kubectl:

```bash
kubectl -n argocd patch configmap argocd-cm --type merge -p '{"data":{"accounts.cicd":"apiKey,login"}}'
kubectl -n argocd rollout restart deployment argocd-server
```

## Безпека та найкращі практики
- Переконайтесь що GitHub token (gh auth) має лише необхідні права (repo: secrets для запису секретів).
- Тримайте токени у GitHub Secrets, не в кодовому сховищі.
- Оновлюйте токени регулярно і відкочуйте ключі, які не використовуються.

---

Якщо хочеш, я можу:
- Додати wrapper-скрипт для одночасної генерації для всіх середовищ у репозиторії (mac/nvidia/oracle).
- Додати GitHub Actions workflow (manual) який при запуску у self-host runner з доступом до ArgoCD згенерує токени та встановить secrets (можливо небезпечно якщо runner не надійний).

Що робимо далі?