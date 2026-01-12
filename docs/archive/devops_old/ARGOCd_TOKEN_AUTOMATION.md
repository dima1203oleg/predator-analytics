# Автоматизація генерації ArgoCD токенів і додавання в GitHub Secrets

Цей документ пояснює, як звичайно автоматизувати створення токенів ArgoCD для сервісних акаунтів та зберегти їх у GitHub Secrets для CI/CD (репозиторій predator-analytics).

> Примітка з безпеки: токени — чутливі секрети. Не зберігайте їх у публічних файлах або у коммітах. Використовуйте тільки захищені GitHub Secrets та переглядайте доступи

## Передумови
  - argocd (https://argo-cd.readthedocs.io/en/stable/)
  - gh (GitHub CLI) (https://cli.github.com/)
  - git (щоб скрипт міг визначити репозиторій автоматично)

## Скрипти у репозиторії
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


Якщо хочеш, я можу:



## Автоматичне через GitHub Actions

У репозиторії додано ручний workflow `.github/workflows/generate-argocd-tokens.yml`, який дозволяє згенерувати токени та автоматично зберегти їх у GitHub Secrets.

Перед запуском на GitHub переконайтесь, що у `Settings → Secrets and variables → Actions` додані наступні секрети (кожен для свого середовища):


Після додавання секретів запустіть workflow в Actions → Generate and store ArgoCD tokens (manual). Рекомендується запускати його на self-hosted runner з мережею, яка має доступ до відповідних ArgoCD інстансів.

Примітка з безпеки: runner має бути довіреним та мати мінімально потрібні права; збереження PAT у репозиторії — це привілейована дія, тому обмежуйте його до мінімуму прав.

Як швидко додати секрети локально (gh CLI)

Якщо ви знаходитеся у локальній середовищі з доступом до GitHub CLI (`gh`) й хочете самостійно встановити секрети для Nvidia та Oracle — можете виконати одну з команд нижче (замінивши значення):

```bash
gh secret set ARGOCD_NVIDIA_URL --repo dima1203oleg/predator-analytics --body 'https://argocd-nvidia.example.com'
gh secret set ARGOCD_NVIDIA_USERNAME --repo dima1203oleg/predator-analytics --body 'admin'
gh secret set ARGOCD_NVIDIA_PASSWORD --repo dima1203oleg/predator-analytics --body 'p@ssw0rd'

gh secret set ARGOCD_ORACLE_URL --repo dima1203oleg/predator-analytics --body 'https://argocd-oracle.example.com'
gh secret set ARGOCD_ORACLE_USERNAME --repo dima1203oleg/predator-analytics --body 'admin'
gh secret set ARGOCD_ORACLE_PASSWORD --repo dima1203oleg/predator-analytics --body 'p@ssw0rd'
```

Більш зручно — використати інтерактивний скрипт, що додається у `scripts/`:

```bash
# виклик без аргументів виведе prompt для всіх значень, або
./scripts/set_argocd_secrets.sh --repo dima1203oleg/predator-analytics

# або в non-interactive режимі через env vars
REPO=dima1203oleg/predator-analytics \
ARGOCD_NVIDIA_URL='https://argocd-nvidia.example.com' \
ARGOCD_NVIDIA_USERNAME='admin' \
ARGOCD_NVIDIA_PASSWORD='p@ssw0rd' \
ARGOCD_ORACLE_URL='https://argocd-oracle.example.com' \
ARGOCD_ORACLE_USERNAME='admin' \
ARGOCD_ORACLE_PASSWORD='p@ssw0rd' \
./scripts/set_argocd_secrets.sh --non-interactive
```

Після додавання секретів ви зможете запустити `Generate and store ArgoCD tokens` workflow (Actions → Generate and store ArgoCD tokens) або запустити `scripts/argocd_generate_and_set_secret.sh` локально.

Що робимо далі?
