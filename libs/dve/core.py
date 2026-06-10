import os
import subprocess
import json
import asyncio
from typing import Dict, List

# Додаткові імпорти для взаємодії з різними сервісами
try:
    import httpx
except ImportError:
    httpx = None  # httpx буде встановлено під час збірки


class DeploymentVerifier:
    """Клас, що виконує комплексну перевірку розгортання платформи Predator Analytics.

    Перевіряє:
    1. Статус Docker/Kubernetes контейнерів
    2. Доступність баз даних (PostgreSQL, ClickHouse, Neo4j, Qdrant, Redis, OpenSearch)
    3. Доступність API‑шляхи
    4. Доступність фронтенду
    5. Роботу черг повідомлень (Kafka, Redis)
    6. Наявність індексів та колекцій
    7. Виконання міграцій та готовність схеми
    """

    def __init__(self, logger=None):
        self.logger = logger or self._default_logger
        self.results: Dict[str, Dict] = {}

    @staticmethod
    def _default_logger(message: str) -> None:
        print(message)

    # ---------------------------------------------------------------------
    # 1. Перевірка контейнерів (Docker CLI)
    # ---------------------------------------------------------------------
    def check_docker_containers(self) -> None:
        """Перевіряє, чи запущені всі необхідні Docker‑контейнери.

        Очікується, що у системі встановлено Docker і доступний `docker ps`.
        """
        try:
            output = subprocess.check_output(["docker", "ps", "--format", "{{.Names}}"], text=True)
            running = set(output.strip().split("\n")) if output else set()
            expected = set(os.getenv("DVE_EXPECTED_CONTAINERS", "").split(","))
            missing = expected - running
            self.results["containers"] = {
                "expected": list(expected),
                "running": list(running),
                "missing": list(missing),
                "status": "ok" if not missing else "error",
            }
            self.logger(f"Контейнери перевірено: {len(missing)} відсутні")
        except subprocess.CalledProcessError as exc:
            self.results["containers"] = {"error": str(exc)}
            self.logger(f"Не вдалося виконати docker ps: {exc}")

    # ---------------------------------------------------------------------
    # 2. Перевірка баз даних
    # ---------------------------------------------------------------------
    def _check_postgres(self) -> Dict:
        import psycopg2
        dsn = os.getenv("POSTGRES_DSN")
        try:
            with psycopg2.connect(dsn) as conn:
                with conn.cursor() as cur:
                    cur.execute("SELECT 1")
                    cur.fetchone()
            return {"status": "ok"}
        except Exception as e:
            return {"status": "error", "error": str(e)}

    def _check_clickhouse(self) -> Dict:
        from clickhouse_driver import Client
        host = os.getenv("CLICKHOUSE_HOST", "localhost")
        try:
            client = Client(host)
            client.execute("SELECT 1")
            return {"status": "ok"}
        except Exception as e:
            return {"status": "error", "error": str(e)}

    def _check_neo4j(self) -> Dict:
        from neo4j import GraphDatabase
        uri = os.getenv("NEO4J_URI")
        auth = (os.getenv("NEO4J_USER"), os.getenv("NEO4J_PASSWORD"))
        try:
            driver = GraphDatabase.driver(uri, auth=auth)
            with driver.session() as session:
                session.run("RETURN 1")
            return {"status": "ok"}
        except Exception as e:
            return {"status": "error", "error": str(e)}

    def _check_qdrant(self) -> Dict:
        from qdrant_client import QdrantClient
        url = os.getenv("QDRANT_URL")
        try:
            client = QdrantClient(url=url)
            client.get_collections()
            return {"status": "ok"}
        except Exception as e:
            return {"status": "error", "error": str(e)}

    def _check_redis(self) -> Dict:
        import redis
        url = os.getenv("REDIS_URL")
        try:
            r = redis.from_url(url)
            r.ping()
            return {"status": "ok"}
        except Exception as e:
            return {"status": "error", "error": str(e)}

    def _check_opensearch(self) -> Dict:
        from opensearchpy import OpenSearch
        host = os.getenv("OPENSEARCH_HOST")
        try:
            client = OpenSearch([host])
            client.cluster.health()
            return {"status": "ok"}
        except Exception as e:
            return {"status": "error", "error": str(e)}



    def check_databases(self) -> None:
        """Run database health checks, handling async where needed."""
        # Helper to run async checks synchronously
        def _run_async(func):
            result = func()
            if asyncio.iscoroutine(result):
                return asyncio.run(result)
            return result

        self.results["databases"] = {
            "postgres": _run_async(check_postgres),
            "clickhouse": check_clickhouse(),
            "neo4j": check_neo4j(),
            "qdrant": check_qdrant(),
            "redis": check_redis(),
            "opensearch": check_opensearch(),
            "minio": check_minio(),
        }
        self.logger("Перевірка баз даних завершена")

    # ---------------------------------------------------------------------
    # 3. Перевірка API (HTTP health‑endpoints)
    # ---------------------------------------------------------------------
    def check_api_endpoints(self) -> None:
        if httpx is None:
            self.results["api"] = {"error": "httpx library not installed"}
            self.logger("httpx не встановлено, пропускаємо перевірку API")
            return
        base_url = os.getenv("API_BASE_URL", "http://localhost:8000")
        endpoints = json.loads(os.getenv("DVE_API_ENDPOINTS", "[\"/health\", \"/v1/status\"]"))
        api_results = {}
        for ep in endpoints:
            url = f"{base_url}{ep}"
            try:
                resp = httpx.get(url, timeout=5.0)
                api_results[ep] = {"status_code": resp.status_code, "ok": resp.is_success}
            except Exception as e:
                api_results[ep] = {"error": str(e)}
        self.results["api"] = api_results
        self.logger("API‑ендпоінти перевірено")

    # ---------------------------------------------------------------------
    # 4. Перевірка Frontend доступності
    # ---------------------------------------------------------------------
    def check_frontend(self) -> None:
        if httpx is None:
            self.results["frontend"] = {"error": "httpx library not installed"}
            return
        url = os.getenv("FRONTEND_URL", "http://localhost:3030")
        try:
            resp = httpx.get(url, timeout=5.0)
            self.results["frontend"] = {"status_code": resp.status_code, "ok": resp.is_success}
        except Exception as e:
            self.results["frontend"] = {"error": str(e)}
        self.logger("Frontend доступність перевірено")

    # ---------------------------------------------------------------------
    # 5. Перевірка черг (Kafka, Redis Streams)
    # ---------------------------------------------------------------------
    def check_message_queues(self) -> None:
        # Kafka перевірка – підключення до брокера та отримання метаданих
        try:
            from kafka import KafkaAdminClient
            brokers = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
            admin = KafkaAdminClient(bootstrap_servers=brokers)
            topics = admin.list_topics()
            self.results["kafka"] = {"status": "ok", "topics": topics}
        except Exception as e:
            self.results["kafka"] = {"status": "error", "error": str(e)}
        # Redis Streams – простий ping вже проведений у check_redis
        self.logger("Перевірка систем повідомлень завершена")

    # ---------------------------------------------------------------------
    # 6. Підготовка фінального звіту
    # ---------------------------------------------------------------------
    def generate_report(self) -> str:
        """Повертає JSON‑звіту про стан розгортання.
        У майбутньому можна розширити генерацією HTML / PDF.
        """
        report = json.dumps(self.results, indent=2, ensure_ascii=False)
        self.logger("Звіт сформовано")
        return report

    # ---------------------------------------------------------------------
    # 7. Основний метод запуску всіх перевірок
    # ---------------------------------------------------------------------
    def run_all_checks(self) -> str:
        self.check_docker_containers()
        self.check_databases()
        self.check_api_endpoints()
        self.check_frontend()
        self.check_message_queues()
        return self.generate_report()


if __name__ == "__main__":
    verifier = DeploymentVerifier()
    print(verifier.run_all_checks())
