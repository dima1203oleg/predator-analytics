"""Mock Data Generator - For demo/testing"""
import random
from datetime import datetime, timedelta


def generate_mock_company():
    """Generate mock company"""
    return {
        "edrpou": f"{random.randint(10000000, 99999999)}",
        "name": f"ТОВ Компанія {random.randint(1, 1000)}",
        "status": random.choice(["active", "suspended"]),
    }


def generate_mock_tender():
    """Generate mock tender"""
    return {
        "id": f"UA-{datetime.now().year}-{random.randint(1000, 9999)}",
        "title": f"Закупівля {random.choice(['обладнання', 'послуг', 'товарів'])}",
        "amount": random.randint(100000, 10000000),
        "status": random.choice(["active", "complete"]),
    }


def generate_mock_metrics():
    """Generate mock system metrics"""
    return {
        "cpu": random.randint(10, 80),
        "memory": random.randint(30, 70),
        "gpu": random.randint(0, 100),
    }
