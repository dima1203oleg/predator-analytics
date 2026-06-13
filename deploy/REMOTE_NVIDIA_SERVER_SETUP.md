# 🖥️ Налаштування NVIDIA як Remote Dev-Server (v55.1)

Цей гайд описує, як перетворити офісний/домашній NVIDIA на потужний вузол для запуску k3d/Docker, звільнивши ресурси MacBook для написання коду.

---

## 🎯 Ціль
- MacBook підключається до NVIDIA по SSH за ключами (без пароля).
- NVIDIA виконує важку роботу (Docker, k3d, ArgoCD).
- MacBook виконує роль "Control Machine" та IDE.

---

## 🔧 1. Підготовка сервера (NVIDIA)

### Увімкнення SSH:
```bash
sudo systemsetup -setremotelogin on
```
*Або: System Settings → General → Sharing → Remote Login ON.*

### Фіксація IP (Critical):
Обов'язково зарезервуйте статичний IP для NVIDIA у налаштуваннях роутера (DHCP Reservation) або вручну в налаштуваннях macOS. Наприклад: `192.168.1.45`.

---

## 🔑 2. Налаштування клієнта (MacBook)

### Генерація ключів (якщо відсутні):
```bash
ssh-keygen -t ed25519 -C "predator-dev-macbook"
# Натисніть Enter для всіх запитів (без пароля для ключа)
```

### Передача ключа на NVIDIA:
```bash
# Замініть username та NVIDIA_IP на ваші дані
ssh-copy-id username@192.168.1.45
```

---

## 🔒 3. Hardening (Безпека NVIDIA)

Після перевірки входу по ключах, рекомендується вимкнути вхід по паролю:

1. Відкрийте конфіг: `sudo nano /etc/ssh/sshd_config`
2. Змініть/додайте:
   ```text
   PasswordAuthentication no
   PubkeyAuthentication yes
   ```
3. Перезапустіть SSH:
   ```bash
   sudo launchctl stop com.openssh.sshd
   sudo launchctl start com.openssh.sshd
   ```

---

## 🚀 4. Зручність (SSH Config)

На MacBook додайте у `~/.ssh/config`:

```text
Host predator-server
  HostName 192.168.1.45
  User dima
  IdentityFile ~/.ssh/id_ed25519
```

Тепер доступ до кластера здійснюється однією командою:
```bash
ssh predator-server
```

---

## 🛰️ 6. Remote Kubeconfig Bridge (Direct K8s Access)

🎯 **Ціль**: З MacBook `kubectl get pods` працює напряму з кластером на NVIDIA без SSH.

### 🧩 КРОК 1. Забрати kubeconfig з NVIDIA
На MacBook:
```bash
scp predator-server:~/.kube/config ~/.kube/config-NVIDIA
```

### 🧩 КРОК 2. Виправити Server IP
Відкрийте файл:
```bash
nano ~/.kube/config-NVIDIA
```
Знайдіть `server: https://127.0.0.1:6443` і замініть на IP NVIDIA:
```yaml
server: https://NVIDIA_IP:6443 # наприклад 192.168.1.45
```
*(Можна використати sed: `sed -i '' 's/127.0.0.1/192.168.1.45/g' ~/.kube/config-NVIDIA`)*

### 🧩 КРОК 3. Об'єднати конфіги
Щоб мати доступ до локальних кластерів і паралельно до NVIDIA:
```bash
export KUBECONFIG=~/.kube/config:~/.kube/config-NVIDIA
kubectl config view --flatten > ~/.kube/config-merged
mv ~/.kube/config-merged ~/.kube/config
```

### 🧪 КРОК 4. Перевірка
```bash
kubectl config get-contexts
kubectl config use-context k3d-mycluster # або інший контекст NVIDIA
kubectl get nodes
```

> **⚠️ SSL ПОМИЛКА?** k3d часто генерує сертифікати лише під `localhost`. Якщо є помилка із сертифікатами: додайте `insecure-skip-tls-verify: true` у *cluster section* вашого `~/.kube/config`.

---

## 🌐 7. Ingress + predator.local (Magic Networking)

🎯 **Ціль**: На MacBook відкриваєте `http://predator.local` → і це працює з сервісом на NVIDIA.

### 🧩 КРОК 1. Nginx Ingress Controller (На NVIDIA/Cluster)
```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml
```

### 🧩 КРОК 2. Дізнатись NodePort
```bash
kubectl get svc -n ingress-nginx
# Знайдіть NodePort для 80 порту (наприклад 30080)
```

### 🧩 КРОК 3. /etc/hosts на MacBook
Відкрийте `sudo nano /etc/hosts` і додайте запис:
```text
192.168.1.45 predator.local
```

### 🧩 КРОК 4. Ingress Ресурс
Запустіть маніфест у вашому кластері:
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: predator-ingress
spec:
  rules:
  - host: predator.local
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: predator-frontend
            port:
              number: 3030
```

🔥 **PRO варіант (без порту):**
Використати існуючий k3d load balancer, щоб відкривати одразу `http://predator.local` замість `http://predator.local:30080`. Або використайте port-forward: `kubectl port-forward svc/ingress-nginx-controller -n ingress-nginx 8080:80`.

---

## ⚡ 7. Hot Reload через Skaffold / Tilt

Це "святий Грааль" розробки:
- Код змінюється на MacBook.
- **Skaffold** автоматично синхронізує зміни у под на NVIDIA.
- Докер-образ не перезбирається щоразу (завдяки `sync` механізмам).
- Результат миттєво видно на `http://192.168.1.45:3030`.

---
**Порада**: Перейдіть до налаштування `skaffold.yaml` для фронтенду, щоб почати розробку без затримок.
