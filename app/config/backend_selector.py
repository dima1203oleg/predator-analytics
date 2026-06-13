# app/config/backend_selector.py
"""Модуль для автоматичного вибору бекенд‑сервера.
Пріоритет: `kellegen` (30 ГБ RAM) > `NVIDIA` (8 ГБ RAM).
Модуль перевіряє доступність сервера за TCP‑з’єднанням на порту 8000
(можна змінити через `HEALTH_PORT`). Якщо сервер недоступний – повертає
резервний.
"""
import asyncio
import os
import socket

# Читання параметрів середовища (можна задати у .env)
NVIDIA_HOST = os.getenv("NVIDIA_HOST", "NVIDIA.local")
KELLEGEN_HOST = os.getenv("KELLEGEN_HOST", "kellegen.local")
BACKEND_PORT = int(os.getenv("BACKEND_PORT", "8000"))
HEALTH_PORT = int(os.getenv("HEALTH_PORT", BACKEND_PORT))

# Пріоритетний порядок
PRIORITY = [KELLEGEN_HOST, NVIDIA_HOST]

async def _check_host(host: str) -> bool:
    """Спробувати відкрити TCP‑з’єднання з *host*.
    Повертає ``True`` якщо успішно, інакше ``False``.
    """
    loop = asyncio.get_event_loop()
    try:
        await loop.run_in_executor(
            None,
            lambda: socket.create_connection((host, HEALTH_PORT), timeout=0.5),
        )
        return True
    except OSError:
        return False

async def get_backend_url() -> str:
    """Повернути URL активного бекенду.
    Перевіряє сервери у порядку ``PRIORITY``.
    Якщо жоден недоступний – піднімає ``RuntimeError``.
    """
    for host in PRIORITY:
        if await _check_host(host):
            return f"http://{host}:{BACKEND_PORT}"
    raise RuntimeError("Не вдалося знайти доступний бекенд-сервер")

def get_backend_url_sync() -> str:
    """Синхронна обгортка для швидкого використання у синхронних частинах.
    """
    return asyncio.get_event_loop().run_until_complete(get_backend_url())
