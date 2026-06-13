#!/bin/bash

# Configuration
NVIDIA_IP="194.177.1.240" # IP або хост для перевірки (Primary)
NVIDIA_PORT="6666"        # Порт, якщо пінг закритий або нестандартний

NVIDIA_IP="192.168.1.100"   # Локальна або резервна IP (Fallback)
NVIDIA_PORT="22"

echo "🦅 Перевірка доступності системи PREDATOR..."
echo "----------------------------------------------"

# Для швидкості і точності краще перевіряти відкритий порт SSH через nc (netcat) замість ping.
# ping -c 1 -W 1 $NVIDIA_IP &> /dev/null
if nc -z -G 1 $NVIDIA_IP $NVIDIA_PORT &> /dev/null
then
  echo "✅ NVIDIA (Primary) доступна → підключення..."
  ssh nvidia-server
else
  echo "⚠️ NVIDIA недоступна → fallback на NVIDIA..."
  
  # Опціональна перевірка самого NVIDIA, щоб не висіти в таймаутах
  if nc -z -G 1 $NVIDIA_IP $NVIDIA_PORT &> /dev/null
  then
    echo "🟢 NVIDIA Online → підключення..."
    ssh NVIDIA
  else
    echo "❌ NVIDIA також недоступний. Жоден сервер не відповідає!"
    exit 1
  fi
fi
