import os
import time
import requests
import docker
from dotenv import load_dotenv

load_dotenv()

BACKEND_URL = os.getenv("BACKEND_URL", "http://backend:8000/api/health")
ROLLBACK_FLAG = os.getenv("ROLLBACK_FLAG", "/tmp/rollback_flag")
UPDATE_AGENTS_FLAG = os.getenv("UPDATE_AGENTS_FLAG", "/tmp/update_agents")

def check_backend():
    try:
        response = requests.get(BACKEND_URL, timeout=5)
        return response.status_code == 200 and response.json().get("status") == "ok"
    except:
        return False

def restart_backend():
    client = docker.from_env()
    try:
        container = client.containers.get("predator-backend")
        container.restart()
        print("✅ Backend перезапущено")
    except Exception as e:
        print(f"❌ Не вдалося перезапустити backend: {e}")

def rollback():
    client = docker.from_env()
    try:
        print("🔙 Виконую rollback до попередньої версії...")
        client.containers.get("predator-backend").stop()
        client.containers.get("predator-backend").remove()
        client.images.pull("predator_backend:latest")
        client.containers.run(
            "predator_backend:latest",
            name="predator-backend",
            detach=True,
            network="predator-network",
            environment={
                "APP_ENV": "production",
                "DATABASE_URL": os.getenv("DATABASE_URL"),
                "REDIS_URL": os.getenv("REDIS_URL"),
            },
        )
        print("✅ Rollback виконано")
    except Exception as e:
        print(f"❌ Не вдалося виконати rollback: {e}")

def update_agents():
    client = docker.from_env()
    try:
        print("🔄 Оновлення автономних агентів...")
        client.containers.get("predator-autonomous-agents").stop()
        client.containers.get("predator-autonomous-agents").remove()
        client.images.pull("predator_autonomous_agents:latest")
        client.containers.run(
            "predator_autonomous_agents:latest",
            name="predator-autonomous-agents",
            detach=True,
            network="predator-network",
            volumes=["/var/run/docker.sock:/var/run/docker.sock"],
        )
        print("✅ Автономні агенти оновлено")
    except Exception as e:
        print(f"❌ Не вдалося оновити агентів: {e}")

def main():
    while True:
        if not check_backend():
            print("❌ Backend не відповідає. Спроба перезапуску...")
            restart_backend()
            time.sleep(10)
            if not check_backend():
                print("⚠️ Backend не вдалося відновити. Виконую rollback...")
                rollback()

        if os.path.exists(ROLLBACK_FLAG):
            rollback()
            os.remove(ROLLBACK_FLAG)

        if os.path.exists(UPDATE_AGENTS_FLAG):
            update_agents()
            os.remove(UPDATE_AGENTS_FLAG)

        time.sleep(60)

if __name__ == "__main__":
    main()