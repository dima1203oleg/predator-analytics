#!/bin/bash

# Зупиняємо всі контейнери
docker stop $(docker ps -aq) 2>/dev/null || true

# Видаляємо всі контейнери
docker rm $(docker ps -aq) 2>/dev/null || true

# Видаляємо всі образи (ті, що не використовуються)
docker rmi $(docker images -q) 2>/dev/null || true

# Видаляємо всі волюми
docker volume rm $(docker volume ls -q) 2>/dev/null || true

# Очистка невикористовуваних мереж
docker network prune -f

# Очистка невикористовуваних образів, контейнерів, волюми (повна очистка)
docker system prune -a --volumes -f

echo "Очистка завершена!"
