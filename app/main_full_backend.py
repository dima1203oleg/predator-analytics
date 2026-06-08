from fastapi import FastAPI
import uvicorn

# 🇺🇦 Основний бекенд з усіма реєстрами та сервісами
# В цьому файлі ми створюємо FastAPI‑додаток, підключаємо усі роутери
# та ініціалізуємо `RegistryFetcher` для отримання даних з публічних реєстрів.
from app.api.v1.canonical_router import api_v1_router  # основний роутер API
from app.services.registry_fetcher import RegistryFetcher

app = FastAPI(
    title="Predator Analytics – Full Backend",
    description="FastAPI бекенд з інтеграцією всіх реєстрів (ЄДРПОУ, інші) та інжекцією сервісів",
    version="61.0.0-ELITE",
)

# Підключаємо API‑версію v1
app.include_router(api_v1_router, prefix="/api/v1")

# Глобальний екземпляр fetcher, що буде використаний у сервісах
registry_fetcher = RegistryFetcher()

@app.on_event("startup")
async def startup_event():
    # Тепер можна підготувати кеш або попередньо завантажити дані, якщо треба
    # Наразі нічого не робимо, але функція залишена для майбутнього розширення.
    pass

@app.on_event("shutdown")
async def shutdown_event():
    # Закриваємо HTTP‑клієнт fetcher‑а, щоб звільнити ресурси.
    await registry_fetcher.close()

if __name__ == "__main__":
    # Запуск сервера на порту 8000 (можна змінити через ENV)
    uvicorn.run("app.main_full_backend:app", host="0.0.0.0", port=8000, reload=True)
