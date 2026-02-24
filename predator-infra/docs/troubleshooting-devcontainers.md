# Dev Containers Troubleshooting Guide

## Проблема: "No data provider registered"

### Причини:
1. Dev Containers extension встановлено локально, а не на сервері
2. docker.sock недоступний
3. Відсутній devcontainer CLI
4. Користувач не в групі docker
5. Пошкоджений VS Code Server

### Діагностика:
```bash
cd /opt/dev/infra
./scripts/diagnose-devcontainer.sh
```

### Автоматичне виправлення:
```bash
./scripts/fix-devcontainer-provider.sh
```

### Ручне виправлення:

1. **Перевстановіть розширення на сервері:**
   - Підключіться через Remote SSH
   - Відкрийте панель Extensions (Cmd+Shift+X)
   - Знайдіть "Dev Containers" і переконайтеся, що воно "Installed on SSH: predator-server"

2. **Перевірте права на docker.sock:**
   ```bash
   ls -la /var/run/docker.sock
   sudo usermod -aG docker $USER
   newgrp docker
   ```

3. **Встановіть devcontainer CLI:**
   ```bash
   sudo npm install -g @devcontainers/cli
   ```

4. **Очистіть VS Code Server (якщо зовсім все погано):**
   ```bash
   rm -rf ~/.vscode-server
   # Перепідключіться через Remote SSH (сервер перевстановиться автоматично)
   ```

5. **Перезапустіть Docker:**
   ```bash
   sudo systemctl restart docker
   ```

### Перевірка після виправлення:
1. Підключіться через Remote SSH
2. Відкрийте папку `/opt/dev/infra`
3. VS Code має запропонувати "Reopen in Container"
4. ПІСЛЯ ЦЬОГО контейнер з'явиться в Remote Explorer у розділі "Dev Containers"
