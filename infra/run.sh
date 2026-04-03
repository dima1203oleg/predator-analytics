#!/bin/bash

CMD="$@"

NVIDIA_IP="194.177.1.240"
NVIDIA_PORT="6666"

# Перевіряємо відкритість порту SSH
if nc -z -G 1 $NVIDIA_IP $NVIDIA_PORT &> /dev/null
then
  # Відправляємо команду на Primary Server
  ssh nvidia-server "$CMD"
else
  # Fallback на iMac
  ssh imac "$CMD"
fi
