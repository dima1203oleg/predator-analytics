# 🦅 KLAV-Agent — Autonomous Cluster Administrator
# Основний скрипт для моніторингу та самовідновлення кластера

import os
import json
import subprocess
import time
from datetime import datetime

# Завантаження конфігурації
with open(".claw.json", "r") as f:
    config = json.load(f)

# Функція для логування
def log(message):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {message}")
    with open("logs/klav-agent.log", "a") as f:
        f.write(f"[{timestamp}] {message}\n")

# Функція для перевірки стану контейнерів
def check_containers():
    result = subprocess.run(["docker", "ps", "--format", "{{.Names}}"], capture_output=True, text=True)
    containers = result.stdout.split()
    log(f"Активні контейнери: {containers}")
    return containers

# Функція для автоматичного відновлення
def auto_heal():
    containers = check_containers()
    for container in containers:
        result = subprocess.run(["docker", "inspect", "--format", "{{.State.Status}}", container], capture_output=True, text=True)
        status = result.stdout.strip()
        if status != "running":
            log(f"Контейнер {container} не працює. Спроба відновити...")
            subprocess.run(["docker", "restart", container])
            log(f"Контейнер {container} відновлено.")

# Функція для інтеграції з Klav Code
def klav_code_analyze(code):
    # Використовуй Klav Code для аналізу коду
    result = subprocess.run(["klav-code", "analyze", code], capture_output=True, text=True)
    return result.stdout

# Функція для RAG-системи
from qdrant_client import QdrantClient
from sentence_transformers import SentenceTransformer

# Ініціалізація моделі для ембедінгів
embedding_model = SentenceTransformer("Nomik")

# Ініціалізація Qdrant
client = QdrantClient("http://localhost:6333")

def rag_search(query):
    # Створення ембедінгу для запиту
    query_embedding = embedding_model.encode(query)
    # Пошук у Qdrant
    results = client.search(
        collection_name="code_embeddings",
        query_vector=query_embedding,
        limit=5
    )
    return results

# Функція для роботи з Redpanda
from kafka import KafkaConsumer

# Ініціалізація Redpanda
consumer = KafkaConsumer(
    "ingestion_topic",
    bootstrap_servers="localhost:9092",
    auto_offset_reset="earliest",
    enable_auto_commit=True,
    group_id="klav-agent-group"
)

def process_redpanda_messages():
    for message in consumer:
        log(f"Отримано повідомлення з Redpanda: {message.value}")
        # Обробка повідомлення

# Функція для роботи з Neo4j
from neo4j import GraphDatabase

# Ініціалізація Neo4j
neo4j_driver = GraphDatabase.driver("bolt://localhost:7687", auth=("neo4j", "password"))

def neo4j_query(query):
    with neo4j_driver.session() as session:
        result = session.run(query)
        return result.data()

# Функція для роботи з MinIO
from minio import Minio

# Ініціалізація MinIO
minio_client = Minio(
    "localhost:9000",
    access_key="minioadmin",
    secret_key="minioadmin",
    secure=False
)

def list_minio_files(bucket_name):
    objects = minio_client.list_objects(bucket_name)
    return [obj.object_name for obj in objects]

# Функція для роботи з Telegram Bot
import telebot

# Ініціалізація Telegram Bot
bot = telebot.TeleBot("YOUR_TELEGRAM_BOT_TOKEN")

@bot.message_handler(commands=["status"])
def send_status(message):
    status = "KLAV-Agent працює в автономному режимі."
    bot.reply_to(message, status)

# Функція для перевірки стану всіх 8 баз даних
def check_databases():
    databases = {
        "Postgres": {"container": "postgres", "port": 5432},
        "Redis": {"container": "redis", "port": 6379},
        "Neo4j": {"container": "neo4j", "port": 7687},
        "OpenSearch": {"container": "opensearch", "port": 9200},
        "Qdrant": {"container": "qdrant", "port": 6333},
        "ClickHouse": {"container": "clickhouse", "port": 9000},
        "MinIO": {"container": "minio", "port": 9000},
        "Redpanda": {"container": "redpanda", "port": 9092}
    }
    
    for db_name, db_info in databases.items():
        result = subprocess.run(["docker", "inspect", "--format", "{{.State.Status}}", db_info["container"]], capture_output=True, text=True)
        status = result.stdout.strip()
        if status != "running":
            log(f"База даних {db_name} не працює. Спроба відновити...")
            subprocess.run(["docker", "restart", db_info["container"]])
            log(f"База даних {db_name} відновлена.")
        else:
            log(f"База даних {db_name} працює нормально.")

# Функція для перевірки готовності програми до тестування
def check_program_ready():
    # Перевірка стану всіх сервісів
    services = {
        "Core API": {"container": "core-api", "port": 8000},
        "Ingestion Worker": {"container": "ingestion-worker", "port": 8001},
        "Graph Service": {"container": "graph-service", "port": 8002},
        "API Gateway": {"container": "api-gateway", "port": 80}
    }
    
    all_ready = True
    for service_name, service_info in services.items():
        result = subprocess.run(["docker", "inspect", "--format", "{{.State.Status}}", service_info["container"]], capture_output=True, text=True)
        status = result.stdout.strip()
        if status != "running":
            log(f"Сервіс {service_name} не працює. Спроба відновити...")
            subprocess.run(["docker", "restart", service_info["container"]])
            log(f"Сервіс {service_name} відновлений.")
            all_ready = False
        else:
            log(f"Сервіс {service_name} працює нормально.")
    
    if all_ready:
        log("Програма готова до тестування.")
        return True
    else:
        log("Програма ще не готова до тестування.")
        return False

# Основний цикл
if __name__ == "__main__":
    log("KLAV-Agent запущено в автономному режимі.")
    while True:
        auto_heal()
        check_databases()
        check_program_ready()
        process_redpanda_messages()
        bot.polling(none_stop=True)
        time.sleep(60)  # Перевірка кожну хвилину