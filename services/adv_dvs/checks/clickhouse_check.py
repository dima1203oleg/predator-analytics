"""ADV DVS: ClickHouse Check."""
import os
from predator_common.logging import get_logger

logger = get_logger("adv_dvs.checks.clickhouse")

async def check_clickhouse() -> dict:
    """
    Перевіряє з'єднання з ClickHouse та його готовність до аналітичних навантажень.
    Згідно з HR-17, ClickHouse є єдиним джерелом для важкої аналітики.
    """
    try:
        import clickhouse_connect
    except ImportError:
        logger.warning("clickhouse_connect is not installed, falling back to simple HTTP check")
        return await _fallback_http_check()

    host = os.getenv("CLICKHOUSE_HOST", "clickhouse")
    port = int(os.getenv("CLICKHOUSE_PORT", "8123"))
    username = os.getenv("CLICKHOUSE_USER", "default")
    password = os.getenv("CLICKHOUSE_PASSWORD", "")
    
    logger.info("Перевірка підключення до ClickHouse (Analytical Ready)")
    try:
        client = clickhouse_connect.get_client(
            host=host, 
            port=port, 
            username=username, 
            password=password,
            connect_timeout=5
        )
        
        # Перевірка виконання базового аналітичного запиту
        res = client.query("SELECT 1 AS ok")
        if res.result_rows and res.result_rows[0][0] == 1:
            return {"status": "passed", "component": "clickhouse", "message": "Підключення успішне. Аналітичний рушій готовий."}
        else:
            return {"status": "fail", "component": "clickhouse", "message": "Підключення є, але тестовий запит не дав результату."}
            
    except Exception as e:
        logger.error(f"Помилка ClickHouse: {e}")
        return await _fallback_http_check()

async def _fallback_http_check() -> dict:
    try:
        import aiohttp
    except ImportError:
        return {"status": "fail", "component": "clickhouse", "message": "aiohttp is not installed"}
        
    url = os.getenv("CLICKHOUSE_HTTP_URL", "http://clickhouse:8123")
    logger.info("Перевірка підключення до ClickHouse (Fallback HTTP)")
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{url}/ping", timeout=5.0) as resp:
                if resp.status == 200:
                    return {"status": "passed", "component": "clickhouse", "message": "Підключення успішне (HTTP Fallback)."}
                else:
                    return {"status": "fail", "component": "clickhouse", "message": f"HTTP {resp.status}"}
    except Exception as e:
        logger.error(f"Помилка ClickHouse HTTP: {e}")
        return {"status": "fail", "component": "clickhouse", "message": str(e)}
