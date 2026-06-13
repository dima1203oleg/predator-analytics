import socket
import sys

def check_port(host, port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(2.0)
        try:
            s.connect((host, port))
            return True
        except BaseException:
            return False

if __name__ == "__main__":
    host = "194.177.1.240"
    # Postgres, Redis, Core API, Nginx, Neo4j, OpenSearch, Kafka
    ports = {
        "Nginx/Frontend (80)": 80,
        "Nginx/HTTPS (443)": 443,
        "UI Server (3030)": 3030,
        "Core API (8000)": 8000,
        "PostgreSQL (5432)": 5432,
        "Redis (6379)": 6379,
        "Neo4j Bolt (7687)": 7687,
        "Neo4j HTTP (7474)": 7474,
        "Kafka (9092)": 9092,
        "MinIO API (9000)": 9000,
        "MinIO Console (9001)": 9001,
        "OpenSearch (9200)": 9200,
        "Grafana (3001)": 3001,
    }

    print(f"Checking ports on {host}...")
    success = 0
    for name, port in ports.items():
        is_open = check_port(host, port)
        if is_open:
            print(f"✅ {name} (Port {port}) is OPEN")
            success += 1
        else:
            print(f"❌ {name} (Port {port}) is CLOSED or TIMED OUT")

    if success > 0:
        sys.exit(0)
    else:
        sys.exit(1)
