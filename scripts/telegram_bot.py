#!/usr/bin/env python3
"""
Standalone Telegram Bot - Повністю автономний бот
Працює без FastAPI, тільки polling
"""
import asyncio
import logging
import os
import sys
import re
import subprocess
import json
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass
import httpx

# Add project to path
sys.path.insert(0, "/Users/dima-mac/Documents/Predator_21/ua-sources")

# Налаштування логування
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)s | %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('telegram_bot.log')
    ]
)
logger = logging.getLogger(__name__)

# ============================================================
# CONFIGURATION
# ============================================================

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "7879930188:AAGH8OYUjfun382FCEPowrC0_WKjwVRpcBQ")
API_URL = f"https://api.telegram.org/bot{BOT_TOKEN}"
SSH_CONFIG_PATH = os.path.expanduser("~/.ssh/config")
PROJECT_DIR = "/Users/dima-mac/Documents/Predator_21"

# Authorized users (your Telegram user IDs)
AUTHORIZED_USERS: List[int] = []  # Empty = all users allowed


# ============================================================
# DATA CLASSES
# ============================================================

@dataclass
class NgrokInfo:
    ssh_host: str
    ssh_port: int
    http_url: str
    raw_message: str
    parsed_at: datetime


# Global state
last_ngrok: Optional[NgrokInfo] = None


# ============================================================
# NGROK PARSING
# ============================================================

def parse_ngrok_message(text: str) -> Optional[NgrokInfo]:
    """Parse ngrok URLs from message"""
    ssh_pattern = r'SSH:\s*tcp://([^:]+):(\d+)'
    http_pattern = r'HTTP:\s*(https?://[^\s]+)'
    
    ssh_match = re.search(ssh_pattern, text)
    http_match = re.search(http_pattern, text)
    
    if ssh_match:
        return NgrokInfo(
            ssh_host=ssh_match.group(1),
            ssh_port=int(ssh_match.group(2)),
            http_url=http_match.group(1) if http_match else "",
            raw_message=text,
            parsed_at=datetime.now(timezone.utc)
        )
    return None


def update_ssh_config(ngrok_info: NgrokInfo) -> Tuple[bool, str]:
    """Update SSH config with new ngrok data"""
    global last_ngrok
    
    try:
        if not os.path.exists(SSH_CONFIG_PATH):
            return False, f"❌ SSH config не знайдено: {SSH_CONFIG_PATH}"
        
        with open(SSH_CONFIG_PATH, 'r') as f:
            content = f.read()
        
        # Find dev-ngrok block
        pattern = r'(Host\s+dev-ngrok\s*\n(?:[^\n]*\n)*?)(?=Host\s|\Z)'
        match = re.search(pattern, content, re.IGNORECASE)
        
        if match:
            old_block = match.group(1)
            new_block = re.sub(r'HostName\s+\S+', f'HostName {ngrok_info.ssh_host}', old_block)
            new_block = re.sub(r'Port\s+\d+', f'Port {ngrok_info.ssh_port}', new_block)
            content = content.replace(old_block, new_block)
        else:
            # Add new block
            new_block = f"""
Host dev-ngrok
    HostName {ngrok_info.ssh_host}
    Port {ngrok_info.ssh_port}
    User root
    IdentityFile ~/.ssh/id_rsa
    StrictHostKeyChecking no
    UserKnownHostsFile /dev/null
"""
            content += new_block
        
        with open(SSH_CONFIG_PATH, 'w') as f:
            f.write(content)
        
        last_ngrok = ngrok_info
        
        return True, f"""✅ *SSH Config оновлено!*

🔗 *Нові ngrok дані:*
• Host: `{ngrok_info.ssh_host}`
• Port: `{ngrok_info.ssh_port}`
• HTTP: {ngrok_info.http_url}

📡 *Підключення:*
```bash
ssh dev-ngrok
```"""
        
    except Exception as e:
        logger.error(f"Failed to update SSH config: {e}")
        return False, f"❌ Помилка: {str(e)}"


# ============================================================
# COMMAND HANDLERS
# ============================================================

async def cmd_start(args: str) -> str:
    return """🚀 *Predator Analytics Assistant*

Вітаю! Я твій AI-помічник для управління сервером.

*Що я вмію:*
• 📊 Моніторинг сервера (CPU, RAM, Disk)
• 🐳 Docker/K8s управління
• 🔗 Автоматичне оновлення ngrok/SSH
• 📝 Перегляд логів
• 💬 Відповідаю на запитання

*Надішли ngrok повідомлення* - автоматично оновлю SSH config!

Команди: /help"""


async def cmd_help(args: str) -> str:
    return """📖 *Команди*

*Сервер:*
• /status - Загальний статус
• /disk - Використання диску
• /memory - RAM
• /cpu - CPU
• /uptime - Аптайм

*Docker/K8s:*
• /docker - Контейнери
• /pods - K8s поди
• /logs [сервіс] - Логи

*Мережа:*
• /ngrok - Поточні ngrok дані
• /ssh - SSH конфіг
• /connect - Як підключитись

*Deploy:*
• /git - Git статус
• /deploy - Deploy інфо

💡 Або просто напиши що потрібно!"""


async def cmd_status(args: str) -> str:
    global last_ngrok
    ngrok_status = f"✅ Активний ({last_ngrok.ssh_host}:{last_ngrok.ssh_port})" if last_ngrok else "⚠️ Очікую дані"
    
    return f"""📊 *Статус системи*

🖥️ Local Mac: Online
🔗 Ngrok: {ngrok_status}

Деталі: /disk /memory /cpu"""


async def cmd_disk(args: str) -> str:
    try:
        result = subprocess.run(["df", "-h", "/"], capture_output=True, text=True, timeout=5)
        return f"💾 *Disk Usage*\n```\n{result.stdout}\n```"
    except Exception as e:
        return f"❌ Помилка: {e}"


async def cmd_memory(args: str) -> str:
    try:
        result = subprocess.run(["vm_stat"], capture_output=True, text=True, timeout=5)
        lines = result.stdout.split('\n')[:10]
        return f"🧠 *Memory Stats*\n```\n{''.join(lines)}\n```"
    except Exception as e:
        return f"❌ Помилка: {e}"


async def cmd_cpu(args: str) -> str:
    try:
        result = subprocess.run(["top", "-l", "1", "-n", "0"], capture_output=True, text=True, timeout=10)
        for line in result.stdout.split('\n'):
            if 'CPU usage' in line:
                return f"⚡ *CPU*\n{line}"
        return f"⚡ *CPU Info*\n```\n{result.stdout[:200]}\n```"
    except Exception as e:
        return f"❌ Помилка: {e}"


async def cmd_uptime(args: str) -> str:
    try:
        result = subprocess.run(["uptime"], capture_output=True, text=True, timeout=5)
        return f"⏰ *Uptime*\n{result.stdout}"
    except Exception as e:
        return f"❌ Помилка: {e}"


async def cmd_docker(args: str) -> str:
    try:
        result = subprocess.run(
            ["docker", "ps", "--format", "table {{.Names}}\t{{.Status}}"],
            capture_output=True, text=True, timeout=10
        )
        if result.returncode == 0:
            return f"🐳 *Docker Containers*\n```\n{result.stdout[:1000]}\n```"
        return "⚠️ Docker не запущено"
    except Exception as e:
        return f"❌ Docker недоступний: {e}"


async def cmd_pods(args: str) -> str:
    try:
        ns = args.strip() if args else "default"
        result = subprocess.run(
            ["kubectl", "get", "pods", "-n", ns],
            capture_output=True, text=True, timeout=10
        )
        return f"☸️ *Pods ({ns})*\n```\n{result.stdout[:1000]}\n```"
    except Exception as e:
        return f"❌ Помилка: {e}"


async def cmd_logs(args: str) -> str:
    service = args.strip() if args else "backend"
    try:
        result = subprocess.run(
            ["docker", "logs", "--tail", "15", service],
            capture_output=True, text=True, timeout=10
        )
        output = result.stdout or result.stderr
        return f"📝 *Logs ({service})*\n```\n{output[:1200]}\n```"
    except Exception as e:
        return f"❌ Помилка: {e}"


async def cmd_ngrok(args: str) -> str:
    global last_ngrok
    if last_ngrok:
        return f"""🔗 *Ngrok Info*

• Host: `{last_ngrok.ssh_host}`
• Port: `{last_ngrok.ssh_port}`
• HTTP: {last_ngrok.http_url}
• Updated: {last_ngrok.parsed_at.strftime('%H:%M:%S')} UTC"""
    return "⚠️ Ngrok дані не отримані. Надішли повідомлення з ngrok URLs."


async def cmd_ssh(args: str) -> str:
    try:
        with open(SSH_CONFIG_PATH, 'r') as f:
            content = f.read()
        
        pattern = r'(Host\s+dev-ngrok\s*\n(?:[^\n]*\n)*?)(?=Host\s|\Z)'
        match = re.search(pattern, content, re.IGNORECASE)
        
        if match:
            return f"📡 *SSH Config (dev-ngrok)*\n```\n{match.group(1)}\n```"
        return "⚠️ Блок dev-ngrok не знайдено"
    except Exception as e:
        return f"❌ Помилка: {e}"


async def cmd_connect(args: str) -> str:
    global last_ngrok
    if last_ngrok:
        return f"""📡 *Як підключитись*

*SSH:*
```bash
ssh dev-ngrok
```

Або напряму:
```bash
ssh -p {last_ngrok.ssh_port} root@{last_ngrok.ssh_host}
```

*HTTP:* {last_ngrok.http_url}"""
    return "⚠️ Ngrok дані не отримані"


async def cmd_git(args: str) -> str:
    try:
        result = subprocess.run(
            ["git", "log", "-1", "--oneline"],
            capture_output=True, text=True, timeout=10,
            cwd=PROJECT_DIR
        )
        result2 = subprocess.run(
            ["git", "status", "-s"],
            capture_output=True, text=True, timeout=10,
            cwd=PROJECT_DIR
        )
        changes = result2.stdout[:300] if result2.stdout else "Clean ✅"
        return f"""📦 *Git Status*

Last commit: `{result.stdout.strip()}`

Changes:
```
{changes}
```"""
    except Exception as e:
        return f"❌ Помилка: {e}"


async def cmd_deploy(args: str) -> str:
    return """📦 *Deploy Info*

Для деплою:
1. `git push origin main`
2. GitHub Actions запуститься
3. ArgoCD синхронізує

GitHub: github.com/dima1203oleg/predator-analytics"""


# ============================================================
#  PREDATOR ANALYTICS ADVANCED COMMANDS
# ============================================================

async def cmd_opensearch(args: str) -> str:
    """OpenSearch статус"""
    try:
        opensearch_url = os.getenv("OPENSEARCH_URL", "http://localhost:9200")
        async with httpx.AsyncClient(timeout=5) as client:
            health = await client.get(f"{opensearch_url}/_cluster/health")
            health_data = health.json()
            
            indices = await client.get(f"{opensearch_url}/_cat/indices?format=json")
            indices_data = indices.json()
            
            total_docs = sum(int(idx.get("docs.count", 0) or 0) for idx in indices_data)
            
            result = f"""🔸 *OpenSearch Status*

Cluster: {health_data.get('cluster_name', 'N/A')}
Status: {health_data.get('status', 'unknown')} 
Indices: {health_data.get('number_of_indices', 0)}
Docs: {total_docs:,}
Active Shards: {health_data.get('active_shards', 0)}

Top Indices:"""
            
            for idx in indices_data[:5]:
                result += f"\n  • {idx['index']}: {idx.get('docs.count', 0)} docs"
            
            return result
    except Exception as e:
        return f"❌ OpenSearch offline: {str(e)}"


async def cmd_qdrant(args: str) -> str:
    """Qdrant статус"""
    try:
        qdrant_url = os.getenv("QDRANT_URL", "http://localhost:6333")
        async with httpx.AsyncClient(timeout=5) as client:
            collections = await client.get(f"{qdrant_url}/collections")
            coll_data = collections.json()
            
            result = "🔹 *Qdrant Vector DB*\n\n"
            
            for coll in coll_data.get("result", {}).get("collections", []):
                coll_name = coll.get("name")
                info = await client.get(f"{qdrant_url}/collections/{coll_name}")
                info_data = info.json().get("result", {})
                
                result += f"📦 {coll_name}\n"
                result += f"  Vectors: {info_data.get('points_count', 0):,}\n"
                result += f"  Status: {info_data.get('status', 'unknown')}\n\n"
            
            return result or "⚠️ No collections"
    except Exception as e:
        return f"❌ Qdrant offline: {str(e)}"


async def cmd_celery_status(args: str) -> str:
    """Celery workers статус"""
    try:
        result = subprocess.run(
            ["celery", "-A", "app.core.celery_app", "inspect", "active"],
            capture_output=True, text=True, timeout=10,
            cwd=f"{PROJECT_DIR}/ua-sources"
        )
        
        if result.returncode == 0:
            return f"🔸 *Celery Workers*\n```\n{result.stdout[:800]}\n```"
        return "⚠️ Celery offline"
    except Exception as e:
        return f"❌ Error: {str(e)}"


async def cmd_etl_jobs(args: str) -> str:
    """ETL jobs статус"""
    try:
        backend_url = os.getenv("BACKEND_URL", "http://localhost:8000")
        async with httpx.AsyncClient(timeout=5) as client:
            response = await client.get(f"{backend_url}/api/etl/jobs")
            data = response.json()
            
            result = f"""🔹 *ETL Pipeline*

Total Jobs: {data.get('total', 0)}"""
            
            for job in data.get('jobs', [])[:5]:
                result += f"\n  • {job.get('id', 'N/A')}: {job.get('status', 'unknown')}"
            
            return result
    except Exception as e:
        return f"❌ ETL service offline: {str(e)}"


async def cmd_k8s_cluster(args: str) -> str:
    """Детальний статус K8s"""
    try:
        # Nodes
        nodes_result = subprocess.run(
            ["kubectl", "get", "nodes", "-o", "json"],
            capture_output=True, text=True, timeout=10
        )
        
        result = "☸️ *Kubernetes Cluster*\n\n"
        
        if nodes_result.returncode == 0:
            nodes_json = json.loads(nodes_result.stdout)
            result += f"**Nodes:** {len(nodes_json.get('items', []))}\n"
            for node in nodes_json.get('items', []):
                name = node['metadata']['name']
                ready = node['status']['conditions'][-1]['status'] == "True"
                result += f"  • {name}: {'✅' if ready else '❌'}\n"
        
        # Pods summary
        pods_result = subprocess.run(
            ["kubectl", "get", "pods", "--all-namespaces", "-o", "json"],
            capture_output=True, text=True, timeout=10
        )
        
        if pods_result.returncode == 0:
            pods_json = json.loads(pods_result.stdout)
            running = sum(1 for p in pods_json.get('items', []) if p['status'].get('phase') == 'Running')
            total = len(pods_json.get('items', []))
            result += f"\n**Pods:** {running}/{total} Running\n"
        
        return result
    except Exception as e:
        return f"❌ K8s error: {str(e)}"


async def cmd_full_status(args: str) -> str:
    """Повний статус Predator Analytics"""
    try:
        # Import advanced monitoring
        from app.services.telegram_advanced import get_full_system_status
        return await get_full_system_status()
    except Exception as e:
        # Fallback to basic status
        tasks = [
            cmd_opensearch(""),
            cmd_qdrant(""),
            cmd_celery_status(""),
            cmd_k8s_cluster("")
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        return "\n\n".join(str(r) for r in results if r)


async def cmd_parsing_status(args: str) -> str:
    """Статус парсингу"""
    try:
        backend_url = os.getenv("BACKEND_URL", "http://localhost:8000")
        async with httpx.AsyncClient(timeout=5) as client:
            # ETL jobs
            etl_response = await client.get(f"{backend_url}/api/etl/jobs")
            etl_data = etl_response.json()
            
            result = f"""📥 *Парсинг / ETL*

Active Jobs: {etl_data.get('total', 0)}

Використай /opensearch для індексів
Використай /etl для деталей"""
            
            return result
    except Exception as e:
        return f"⚠️ Backend offline\n\n💡 Запусти: `docker compose up -d backend`"


async def cmd_indexing_status(args: str) -> str:
    """Статус індексації"""
    result = "📊 *Індексація*\n\n"
    
    try:
        opensearch_url = os.getenv("OPENSEARCH_URL", "http://localhost:9200")
        async with httpx.AsyncClient(timeout=5) as client:
            indices = await client.get(f"{opensearch_url}/_cat/indices?format=json")
            indices_data = indices.json()
            
            total_docs = sum(int(idx.get("docs.count", 0) or 0) for idx in indices_data)
            
            result += f"**OpenSearch:**\n"
            result += f"  Indices: {len(indices_data)}\n"
            result += f"  Documents: {total_docs:,}\n\n"
    except:
        result += "  ❌ OpenSearch offline\n\n"
    
    try:
        qdrant_url = os.getenv("QDRANT_URL", "http://localhost:6333")
        async with httpx.AsyncClient(timeout=5) as client:
            collections = await client.get(f"{qdrant_url}/collections")
            coll_data = collections.json()
            
            total_vectors = 0
            for coll in coll_data.get("result", {}).get("collections", []):
                coll_name = coll.get("name")
                info = await client.get(f"{qdrant_url}/collections/{coll_name}")
                total_vectors += info.json().get("result", {}).get("points_count", 0)
            
            result += f"**Qdrant:**\n"
            result += f"  Collections: {len(coll_data.get('result', {}).get('collections', []))}\n"
            result += f"  Vectors: {total_vectors:,}\n"
    except:
        result += "  ❌ Qdrant offline\n"
    
    return result


# ============================================================
# AI PROGRAMMING AGENT
# ============================================================

async def cmd_code(args: str) -> str:
    """Виконати Python код"""
    if not args:
        return """💻 *AI Code Agent*

Використання:
```
/code print("Hello World")
```

Або багаторядковий:
```
/code
import os
print(os.getcwd())
```

⚠️ Безпечно виконується в контексті проекту"""
    
    try:
        # Create temp file
        temp_file = f"/tmp/tg_code_{datetime.now().timestamp()}.py"
        with open(temp_file, 'w') as f:
            f.write(args)
        
        # Execute
        result = subprocess.run(
            ["python3", temp_file],
            capture_output=True, text=True, timeout=30,
            cwd=PROJECT_DIR
        )
        
        os.remove(temp_file)
        
        output = result.stdout or result.stderr
        status = "✅" if result.returncode == 0 else "❌"
        
        return f"""{status} *Code Execution*

```python
{args[:200]}
```

**Output:**
```
{output[:1000]}
```"""
    except Exception as e:
        return f"❌ Error: {str(e)}"


async def cmd_bash(args: str) -> str:
    """Виконати bash команду"""
    if not args:
        return """💻 *Bash Executor*

Використання:
```
/bash ls -la
```

⚠️ Працює в контексті проекту"""
    
    try:
        result = subprocess.run(
            args, shell=True,
            capture_output=True, text=True, timeout=30,
            cwd=PROJECT_DIR
        )
        
        output = result.stdout or result.stderr
        status = "✅" if result.returncode == 0 else "❌"
        
        return f"""{status} *Bash*

```bash
{args}
```

**Output:**
```
{output[:1200]}
```"""
    except Exception as e:
        return f"❌ Error: {str(e)}"


async def cmd_test(args: str) -> str:
    """Запустити тести"""
    try:
        cmd = ["pytest", "-v"]
        if args:
            cmd.append(args)
        
        result = subprocess.run(
            cmd,
            capture_output=True, text=True, timeout=60,
            cwd=f"{PROJECT_DIR}/ua-sources"
        )
        
        output = result.stdout or result.stderr
        status = "✅ PASSED" if result.returncode == 0 else "❌ FAILED"
        
        return f"""🧪 *Tests {status}*

```
{output[-1200:]}
```"""
    except Exception as e:
        return f"❌ Error: {str(e)}"


async def cmd_create_file(args: str) -> str:
    """Створити файл через бот"""
    if not args or "\n" not in args:
        return """📝 *Create File*

Формат:
```
/create path/to/file.py
def hello():
    print("Hello")
```"""
    
    parts = args.split("\n", 1)
    path = parts[0].strip()
    content = parts[1] if len(parts) > 1 else ""
    
    try:
        full_path = os.path.join(PROJECT_DIR, path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        
        with open(full_path, 'w') as f:
            f.write(content)
        
        return f"""✅ *File Created*

Path: `{path}`
Size: {len(content)} bytes"""
    except Exception as e:
        return f"❌ Error: {str(e)}"


# ============================================================
# LLM MANAGEMENT COMMANDS
# ============================================================

async def cmd_llm_providers(args: str) -> str:
    """Список LLM провайдерів"""
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            response = await client.get(f"{os.getenv('BACKEND_URL', 'http://localhost:8000')}/api/llm/providers")
            providers = response.json()
        
        result = "🧠 **LLM Провайдери**\n\n"
        
        active = [p for p in providers if p['api_keys']]
        inactive = [p for p in providers if not p['api_keys']]
        
        if active:
            result += "**✅ Активні:**\n"
            for p in active:
                emoji = get_provider_emoji_local(p['id'])
                status = "✅" if p['enabled'] else "❌"
                free_tag = "🆓" if p['free'] else "💰"
                result += f"{emoji} {p['name']} {status} {free_tag}\n"
                result += f"  🔑 {len(p['api_keys'])} ключів\n"
                result += f"  📦 {p['model']}\n\n"
        
        if inactive[:5]:  # Show only first 5
            result += "**➕ Доступні для додавання:**\n"
            for p in inactive[:5]:
                emoji = get_provider_emoji_local(p['id'])
                free_tag = "🆓" if p['free'] else "💰"
                result += f"{emoji} {p['name']} {free_tag}\n"
        
        result += f"\nВсього: {len(active)} активних / {len(providers)} провайдерів"
        return result
        
    except Exception as e:
        return f"❌ Error: {str(e)}"


async def cmd_llm_add(args: str) -> str:
    """Додати API ключ"""
    if not args or ' ' not in args:
        return """🔑 **Додати API ключ**

Формат:
```
/llm_add groq gsk_xxxxx
/llm_add gemini AIzaxxx
```

Провайдери:
• groq, gemini, openai
• mistral, cohere, together
• xai, deepseek, huggingface

Або природно:
"Додай ключ Groq: gsk_xxx"
"""
    
    parts = args.strip().split(maxsplit=1)
    if len(parts) != 2:
        return "❌ Формат: `/llm_add <provider> <key>`"
    
    provider_id, api_key = parts
    
    try:
        logger.info(f"Adding LLM key for {provider_id}...")
        
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                f"{os.getenv('BACKEND_URL', 'http://localhost:8000')}/api/llm/providers/{provider_id}/keys",
                json={
                    "provider_id": provider_id,
                    "api_key": api_key,
                    "test": True
                }
            )
            data = response.json()
        
        emoji = get_provider_emoji_local(provider_id)
        return f"""✅ **Ключ додано!**

{emoji} Провайдер: {provider_id.title()}
🔑 Всього ключів: {data.get('total_keys', 1)}

{data.get('message', 'Success')}"""
        
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 400:
            return f"❌ **Тест ключа провалився**\n\n{e.response.json().get('detail', 'Invalid key')}"
        return f"❌ Error: {e.response.json().get('detail', str(e))}"
    except Exception as e:
        return f"❌ Error: {str(e)}"


async def cmd_llm_test(args: str) -> str:
    """Тестувати API ключ"""
    if not args or ' ' not in args:
        return """🧪 **Тестувати ключ**

Формат:
```
/llm_test groq gsk_xxxxx
```"""
    
    parts = args.strip().split(maxsplit=1)
    if len(parts) != 2:
        return "❌ Формат: `/llm_test <provider> <key>`"
    
    provider_id, api_key = parts
    
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                f"{os.getenv('BACKEND_URL', 'http://localhost:8000')}/api/llm/providers/{provider_id}/test",
                json={
                    "provider_id": provider_id,
                    "api_key": api_key
                }
            )
            result = response.json()
        
        if result['success']:
            return f"""✅ **Ключ валідний!**

⏱️ Latency: {result.get('latency_ms', 0):.0f}ms
📦 Model: {result.get('model', 'N/A')}
💬 {result.get('message', 'Test passed')}"""
        else:
            return f"❌ **Ключ невалідний**\n\n{result.get('error', 'Unknown error')}"
            
    except Exception as e:
        return f"❌ Error: {str(e)}"


async def cmd_llm_stats(args: str) -> str:
    """Статистика LLM"""
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            response = await client.get(f"{os.getenv('BACKEND_URL', 'http://localhost:8000')}/api/llm/stats")
            stats = response.json()
        
        return f"""📊 **LLM Statistics**

🔢 Всього провайдерів: {stats['total_providers']}
✅ Активних: {stats['active_providers']}
🔑 Всього ключів: {stats['total_keys']}

Використай /llm_providers для деталей"""
        
    except Exception as e:
        return f"❌ Error: {str(e)}"


def get_provider_emoji_local(provider_id: str) -> str:
    """Emoji для провайдера"""
    emojis = {
        "groq": "⚡",
        "gemini": "🧠",
        "openai": "💰",
        "anthropic": "🎨",
        "mistral": "⚖️",
        "cohere": "💡",
        "together": "🤝",
        "xai": "🎯",
        "deepseek": "🚀",
        "huggingface": "🤗",
        "openrouter": "🔀",
        "ollama": "🏠"
    }
    return emojis.get(provider_id, "🤖")



# Command mapping
COMMANDS = {
    # Basic
    "start": cmd_start,
    "help": cmd_help,
    "menu": cmd_start,
    
    # Server
    "status": cmd_status,
    "disk": cmd_disk,
    "memory": cmd_memory,
    "cpu": cmd_cpu,
    "uptime": cmd_uptime,
    
    # Docker/K8s
    "docker": cmd_docker,
    "pods": cmd_pods,
    "logs": cmd_logs,
    "cluster": cmd_k8s_cluster,
    
    # Network
    "ngrok": cmd_ngrok,
    "ssh": cmd_ssh,
    "connect": cmd_connect,
    
    # Deploy
    "git": cmd_git,
    "deploy": cmd_deploy,
    
    # Predator Analytics
    "opensearch": cmd_opensearch,
    "qdrant": cmd_qdrant,
    "celery": cmd_celery_status,
    "etl": cmd_etl_jobs,
    "parsing": cmd_parsing_status,
    "indexing": cmd_indexing_status,
    "fullstatus": cmd_full_status,
    "predator": cmd_full_status,
    
    # AI Programming
    "code": cmd_code,
    "bash": cmd_bash,
    "test": cmd_test,
    "create": cmd_create_file,
    
    # LLM Management
    "llm_providers": cmd_llm_providers,
    "llm_add": cmd_llm_add,
    "llm_test": cmd_llm_test,
    "llm_stats": cmd_llm_stats,
}

# Emoji to command mapping
EMOJI_MAP = {
    # Basic
    "📊": "status", "статус": "status",
    "🖥️": "status", "сервер": "status",
    
    # Docker/K8s
    "🐳": "docker", "docker": "docker",
    "☸️": "cluster", "k8s": "cluster", "кластер": "cluster",
    
    # Network
    "🔗": "ngrok", "ngrok": "ngrok",
    "📡": "ssh", "ssh": "ssh", "ssh config": "ssh",
    
    # Deploy
    "📦": "deploy", "deploy": "deploy", "деплой": "deploy",
    
   # Predator Analytics
    "🗄️": "opensearch", "opensearch": "opensearch",
    "🧠": "qdrant", "qdrant": "qdrant",
    "⚙️": "celery", "celery": "celery",
    "📥": "parsing", "парсинг": "parsing",
    "📊": "indexing", "індексація": "indexing",
    "🎯": "predator", "предатор": "predator",
    
    # Programming
    "💻": "code", "код": "code",
    "🔨": "bash",
    "🧪": "test", "тести": "test",
    
    # Help  
    "❓": "help", "допомога": "help",
}


# Main menu keyboard - РОЗШИРЕНЕ МЕНЮ
MAIN_MENU = {
    "keyboard": [
        [{"text": "📊 Статус"}, {"text": "🎯 Predator"}],
        [{"text": "🗄️ OpenSearch"}, {"text": "🧠 Qdrant"}],
        [{"text": "📥 Парсинг"}, {"text": "⚙️ Celery"}],
        [{"text": "🐳 Docker"}, {"text": "☸️ Кластер"}],
        [{"text": "🔗 Ngrok"}, {"text": "📡 SSH"}],
        [{"text": "💻 Програмувати"}, {"text": "🧪 Тести"}],
        [{"text": "📦 Deploy"}, {"text": "❓ Допомога"}]
    ],
    "resize_keyboard": True
}


# Updated help command with new features
async def cmd_help_updated(args: str) -> str:
    return """📖 *Команди Telegram Бота*

**🖥️ Сервер:**
• /status - Загальний статус
• /disk /memory /cpu - Ресурси
• /uptime - Аптайм

**🐳 Docker/K8s:**
• /docker - Контейнери
• /pods [namespace] - K8s поди
• /cluster - Детальний статус кластеру
• /logs [сервіс] - Логи

**🔗 Мережа:**
• /ngrok - Поточні ngrok дані
• /ssh - SSH конфіг
• /connect - Як підключитись

**📊 Predator Analytics:**
• /predator - Повний статус системи
• /opensearch - OpenSearch індекси
• /qdrant - Vector DB статус
• /celery - Workers та tasks
• /etl - ETL jobs
• /parsing - Чи парситься
• /indexing - Чи індексується

**💻 AI Програмування:**
• /code [python] - Виконати Python
• /bash [cmd] - Виконати bash
• /test [path] - Запустити тести
• /create [path] - Створити файл

**📦 Deploy:**
• /git - Git статус
• /deploy - Deploy інфо

**💡 Приклади:**
```
/code print("Hello!")
/bash ls -la
/opensearch
/predator
```

Надішли **ngrok** повідомлення - автоматично оновлю SSH!"""

# Update the help command
COMMANDS["help"] = cmd_help_updated


# ============================================================
# AI NATURAL LANGUAGE PROCESSING
# ============================================================

async def understand_intent(text: str) -> Dict[str, Any]:
    """Розуміє намір користувача через AI"""
    text_lower = text.lower()
    
    # Ключові слова для різних категорій
    intents = {
        "system_status": ["статус", "стан", "як", "працює", "система", "все", "працюють", "сервіси"],
        "opensearch": ["індекс", "opensearch", "документ", "пошук", "індексація", "індексується"],
        "qdrant": ["qdrant", "вектор", "vector", "embedding", "семантичний"],
        "parsing": ["парс", "етл", "etl", "дані", "збір", "парситься"],
        "celery": ["celery", "worker", "task", "черга", "завдання"],
        "k8s": ["kubernetes", "k8s", "кластер", "pod", "контейнер", "deploy"],
        "docker": ["docker", "контейнер"],
        "ngrok": ["ngrok", "тунель", "підключ", "ssh", "доступ"],
        "programming": ["код", "програм", "скрипт", "виконай", "запусти", "python", "bash"],
        "help": ["допомога", "команд", "що вміє", "можеш"],
        "greeting": ["привіт", "вітаю", "здоров", "добри"],
    }
    
    # Знаходимо найкращий збіг
    best_match = None
    best_score = 0
    
    for intent_name, keywords in intents.items():
        score = sum(1 for kw in keywords if kw in text_lower)
        if score > best_score:
            best_score = score
            best_match = intent_name
    
    if best_match and best_score > 0:
        return {"intent": best_match, "confidence": best_score, "text": text}
    
    # Якщо не знайшли - загальний запит
    return {"intent": "general", "confidence": 0, "text": text}


async def process_natural_language(text: str, chat_id: int) -> str:
    """Обробляє природну мову через AI"""
    
    text_lower = text.lower()
    
    # Special: LLM key adding - природна мова
    if "додай ключ" in text_lower or "add key" in text_lower:
        # Parse: "Додай ключ Groq: gsk_xxx" or "Додай ключ groq gsk_xxx"
        import re
        
        # Try format: "додай ключ <provider>: <key>"
        match = re.search(r'додай ключ\s+(\w+)[:\s]+([a-zA-Z0-9_\-]+)', text_lower)
        if not match:
            # Try English
            match = re.search(r'add key\s+(\w+)[:\s]+([a-zA-Z0-9_\-]+)', text_lower)
        
        if match:
            provider = match.group(1).lower()
            # Get actuall key from original text (preserve case)
            key_start = text.find(match.group(2))
            key = text[key_start:key_start+100].split()[0]  # Get first token
            
            return await cmd_llm_add(f"{provider} {key}")
        else:
            return """🔑 Додати ключ

Формат:
"Додай ключ groq: gsk_xxxxx"
або
"Додай ключ gemini AIzaxxxxx"

Провайдери: groq, gemini, xai, deepseek, mistral, cohere"""
    
    # Розуміємо намір
    intent_data = await understand_intent(text)
    intent = intent_data["intent"]
    
    # Обробляємо згідно наміру
    if intent == "greeting":
        return """👋 Привіт! Я Predator Analytics Bot.

🎯 Можу допомогти з:
• Моніторингом системи
• Перевіркою індексації
• Програмуванням
• SSH/ngrok налаштуваннями

Питай що завгодно або /help для команд!"""
    
    elif intent == "system_status":
        return await cmd_full_status("")
    
    elif intent == "opensearch":
        return await cmd_opensearch("")
    
    elif intent == "qdrant":
        return await cmd_qdrant("")
    
    elif intent == "parsing":
        return await cmd_parsing_status("")
    
    elif intent == "celery":
        return await cmd_celery_status("")
    
    elif intent == "k8s":
        return await cmd_k8s_cluster("")
    
    elif intent == "docker":
        return await cmd_docker("")
    
    elif intent == "ngrok":
        return await cmd_ngrok("")
    
    elif intent == "programming":
        return """💻 **AI Code Agent**

Я можу:
• `/code [python]` - виконати Python
• `/bash [cmd]` - запустити bash
• `/test` - запустити тести

Приклад:
```
/code print("Hello!")
```

Що хочеш виконати?"""
    
    elif intent == "help":
        return await cmd_help_updated("")
    
    # Загальний AI відповідь
    else:
        # Спочатку пробуємо з нашою knowledge base (работає без API!)
        knowledge_response = get_knowledge_based_response(text)
        if knowledge_response:
            return knowledge_response
        
        # Потім пробуємо LLM якщо доступний
        try:
            # Визначаємо складність запиту для вибору між council та звичайним LLM
            from app.services.llm import llm_service
            
            # Ключові слова що вказують на складне питання
            complex_indicators = [
                "порівняй", "проаналізуй", "поясни детально", "розкажи про",
                "як працює", "архітектура", "система", "plan", "strategy",
                "порада", "рекомендація", "що краще", "опиши", "розкажи"
            ]
            
            is_complex = any(indicator in text.lower() for indicator in complex_indicators)
            is_complex = is_complex or len(text.split()) > 15  # Довге питання = складне
            
            system_prompt = """Ти - AI асистент Predator Analytics Bot.
Допомагай користувачу з питаннями про:
- Моніторинг системи (OpenSearch, Qdrant, Celery, K8s)
- Програмування через Telegram
- Управління сервером
- SSH/ngrok налаштування
- Архітектуру Predator Analytics

Відповідай коротко та по суті українською мовою.
Якщо потрібна команда - вкажи яку."""
            
            if is_complex:
                # Використовуємо LLM Council для глибокого аналізу
                logger.info(f"Using LLM Council for complex query: {text[:50]}...")
                
                response = await llm_service.generate_with_routing(
                    prompt=text,
                    system=system_prompt,
                    mode="council",  # 🔥 Council mode!
                    max_tokens=1500
                )
                
                if response.success:
                    # Додаємо мітку що це council відповідь
                    prefix = "🧠 **Council AI** (5 моделей)\n\n"
                    return f"{prefix}{response.content[:1500]}\n\n_⏱️ {response.latency_ms:.0f}ms | {response.model}_"
            else:
                # Звичайний fast режим для простих питань
                response = await llm_service.generate_with_routing(
                    prompt=text,
                    system=system_prompt,
                    mode="fast"
                )
                
                if response.success:
                    return f"🤖 {response.content[:1000]}"
            
        except Exception as e:
            logger.error(f"AI processing error: {e}")
        
        # Final fallback - показуємо допомогу
        return """💡 Можу допомогти!

Для кращих відповідей налаштуй LLM API ключі.

Або використай команди:
• `/predator` - Повний статус
• `/opensearch` - OpenSearch
• `/qdrant` - Qdrant
• `/parsing` - Парсинг
• `/code` - Виконати код

Або уточни: "статус системи", "покажи компоненти" тощо."""


def get_knowledge_based_response(text: str) -> Optional[str]:
    """
    Knowledge base - вбудовані знання про систему
    Працює БЕЗ LLM API!
    """
    text_lower = text.lower()
    
    # Питання про веб інтерфейс / frontend
    if any(kw in text_lower for kw in ["веб", "інтерфейс", "frontend", "фронтенд", "ui", "дизайн"]):
        return """🎨 **Веб інтерфейс Predator Analytics**

**Технології:**
• React 18 + TypeScript
• Vite (build tool)
• TailwindCSS (styling)
• Recharts (візуалізації)

**Компоненти:**
• Dashboard - головна панель
• Search Console - пошук
• Analytics View - аналітика
• Settings - налаштування

**Фічі:**
• Реал-тайм оновлення
• Dark mode
• Responsive design
• AI-assisted search

**Файли:**
`/frontend/src/`
  - components/ - React компоненти
  - views/ - сторінки
  - context/ - state management
  - index.css - стилі

Потрібно більше деталей? Питай про конкретний компонент!"""
    
    # Архітектура системи
    if any(kw in text_lower for kw in ["архітектур", "компонент", "структур", "система"]):
        return """🏗️ **Архітектура Predator Analytics**

**Шари:**

1️⃣ **Frontend**
   - React/TypeScript + Vite
   - TailwindCSS
   - Real-time dashboard

2️⃣ **Backend API**
   - FastAPI (Python)
   - Async/await
   - Multi-provider LLM

3️⃣ **Databases**
   - PostgreSQL - основна БД
   - OpenSearch - full-text пошук
   - Qdrant - vector DB
   - Redis - кеш

4️⃣ **ETL Pipeline**
   - Celery workers
   - Scheduled crawlers
   - Data normalization

5️⃣ **ML/AI**
   - LLM Council (5 моделей)
   - Embeddings service
   - Semantic search

6️⃣ **Infrastructure**
   - Docker Compose (local)
   - K8s/K3s (prod)
   - ArgoCD (GitOps)
   - Grafana (monitoring)

Детально: `/predator` або питай про конкретний шар!"""
    
    # Backend
    if any(kw in text_lower for kw in ["backend", "api", "fastapi", "бекенд"]):
        return """⚙️ **Backend API**

**Stack:**
• FastAPI (Python 3.11+)
• Async/await архітектура
• Pydantic для валідації
• SQLAlchemy ORM

**Endpoints:**
• `/api/search` - пошук
• `/api/analytics` - аналітика
• `/api/etl` - ETL jobs
• `/api/telegram` - бот webhook

**Services:**
• LLM Service - multi-provider
• AI Engine - семантичний пошук
• Crawler Service - парсинг
• Embedding Service - вектори

**Файли:** `/ua-sources/app/`

Що саме цікавить?"""
    
    # Databases
    if any(kw in text_lower for kw in ["база", "database", "opensearch", "qdrant", "postgres"]):
        return """🗄️ **Databases**

**PostgreSQL**
• Основна БД
• Companies, tenders, analytics
• SQLAlchemy ORM

**OpenSearch**
• Full-text search
• ~15,000+ документів
• Hybrid search (BM25 + vectors)

**Qdrant**
• Vector database
• Semantic embeddings
• 384-dim vectors

**Redis**
• Кешування
• Session storage
• Celery broker

Команди:
• `/opensearch` - статус індексів
• `/qdrant` - vector колекції"""
    
    # ETL / Parsing
    if any(kw in text_lower for kw in ["etl", "парсинг", "crawler", "збір даних"]):
        return """📥 **ETL Pipeline**

**Джерела даних:**
• EDR (ЄДР) - реєстр компаній
• Prozorro - тендери
• NBU - курси валют
• YouControl - аналітика

**Процес:**
1. Crawlers збирають дані
2. Normalization + cleaning
3. OpenSearch indexing
4. Qdrant embeddings
5. PostgreSQL storage

**Celery Workers:**
• ETL tasks
• Scheduled crawling
• Monitoring

**Файли:**
`/ua-sources/app/tasks/etl_workers.py`

Статус: `/parsing` або `/etl`"""
    
    # AI/ML
    if any(kw in text_lower for kw in ["ai", "ml", "llm", "council", "модел"]):
        return """🧠 **AI/ML System**

**LLM Council** (5 моделей):
1. Groq (Llama 3 70B)
2. Google Gemini 1.5 Pro
3. Cohere Command R+
4. Together.ai (Llama 3)
5. Mistral Large

**Процес:**
• Stage 1: Opinions (паралельно)
• Stage 2: Peer review
• Stage 3: Synthesis

**Інші AI:**
• Embedding service (384-dim)
• Semantic search
• Reranking models

**Режими:**
• Fast (1 модель, ~500ms)
• Council (5 моделей, ~10s)

Автоматично обирається по складності питання!"""
    
    # Infrastructure
    if any(kw in text_lower for kw in ["deploy", "k8s", "kubernetes", "docker", "інфра"]):
        return """🚀 **Infrastructure**

**Local (Development):**
• Docker Compose
• 8 сервісів
• Hot reload

**Production:**
• Kubernetes (K3s)
• ArgoCD (GitOps)
• Helm charts

**Monitoring:**
• Grafana dashboards
• Prometheus metrics
• Health checks

**CI/CD:**
• GitHub Actions
• Auto-deploy on push
• Multi-environment

**Ngrok:**
• Tunneling для dev
• Auto SSH config update

Команди:
• `/cluster` - K8s статус
• `/docker` - контейнери"""
    
    # Telegram bot
    if any(kw in text_lower for kw in ["бот", "telegram", "телеграм"]):
        return """🤖 **Telegram Bot**

**Можливості:**
• 📊 Моніторинг (OpenSearch, Qdrant, Celery)
• 💻 Програмування (Python, Bash)
• 🔗 Auto ngrok/SSH update
• 🧠 AI Council для складних питань
• 📝 Природна мова (українська)

**Режими:**
• Fast - прості запити
• Council - складні аналізи

**Команди:**
• Системні: /status, /disk, /memory
• Predator: /opensearch, /qdrant, /etl
• AI: /code, /bash, /test
• Меню: /start, /help

**Файли:**
`/scripts/telegram_bot.py`

Я і є цей бот! 😊"""
    
    # Проекти / загальне
    if any(kw in text_lower for kw in ["predator", "проект", "що це", "опис"]):
        return """🎯 **Predator Analytics**

**Що це:**
Платформа для аналітики українських бізнес-даних з AI.

**Основні фічі:**
• Семантичний пошук компаній
• Аналіз тендерів (Prozorro)
• AI-асистований аналіз
• Real-time моніторинг

**Tech Stack:**
• Frontend: React + TypeScript
• Backend: FastAPI (Python)
• DB: PostgreSQL + OpenSearch + Qdrant
• AI: LLM Council (5 моделей)
• Infra: Docker + K8s

**Джерела даних:**
• ЄДР, Prozorro, НБУ, YouControl

**GitHub:**
github.com/dima1203oleg/predator-analytics

Детально: `/predator` або питай конкретно!"""
    
    return None  # Якщо не знайдено в knowledge base


# ============================================================
# MESSAGE PROCESSING
# ============================================================

async def process_message(text: str, chat_id: int, user_id: int) -> str:
    """Process incoming message"""
    text_lower = text.lower().strip()
    
    # Check for ngrok update
    if "ngrok" in text_lower and ("ssh:" in text_lower or "http:" in text_lower):
        ngrok_info = parse_ngrok_message(text)
        if ngrok_info:
            success, message = update_ssh_config(ngrok_info)
            return message
        return "⚠️ Не вдалося розпарсити ngrok дані"
    
    # Check for commands
    if text.startswith("/"):
        parts = text[1:].split(maxsplit=1)
        cmd = parts[0].lower()
        args = parts[1] if len(parts) > 1 else ""
        
        handler = COMMANDS.get(cmd)
        if handler:
            return await handler(args)
        return "❌ Невідома команда. /help"
    
    # Check for emoji/text commands
    for key, cmd in EMOJI_MAP.items():
        if text_lower.startswith(key) or key in text_lower:
            handler = COMMANDS.get(cmd)
            if handler:
                return await handler("")
    
    # 🆕 ПРИРОДНА МОВА - AI обробка
    return await process_natural_language(text, chat_id)


# ============================================================
# TELEGRAM API
# ============================================================

async def send_message(chat_id: int, text: str, reply_markup: Optional[Dict] = None) -> bool:
    """Send message to chat"""
    try:
        async with httpx.AsyncClient() as client:
            data = {
                "chat_id": chat_id,
                "text": text,
                "parse_mode": "Markdown"
            }
            if reply_markup:
                data["reply_markup"] = json.dumps(reply_markup)
            
            response = await client.post(f"{API_URL}/sendMessage", json=data)
            return response.status_code == 200
    except Exception as e:
        logger.error(f"Failed to send message: {e}")
        return False


async def delete_webhook() -> bool:
    """Delete webhook for polling mode"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(f"{API_URL}/deleteWebhook")
            return response.json().get("ok", False)
    except Exception as e:
        logger.error(f"Failed to delete webhook: {e}")
        return False


async def get_updates(offset: int = 0, timeout: int = 30) -> List[Dict]:
    """Get updates from Telegram"""
    try:
        async with httpx.AsyncClient(timeout=timeout + 10) as client:
            response = await client.get(
                f"{API_URL}/getUpdates",
                params={"offset": offset, "timeout": timeout}
            )
            result = response.json()
            return result.get("result", [])
    except Exception as e:
        logger.error(f"Failed to get updates: {e}")
        return []



# ============================================================
# MAIN LOOP
# ============================================================

async def run_bot():
    """Main bot loop"""
    print("""
╔══════════════════════════════════════════════════════════════╗
║        🤖 Predator Analytics Telegram Bot                    ║
╠══════════════════════════════════════════════════════════════╣
║  ✅ Автоматичний парсинг ngrok URLs                          ║
║  ✅ Оновлення SSH config                                     ║
║  ✅ Моніторинг сервера                                       ║
║  ✅ Docker/K8s управління                                    ║
╚══════════════════════════════════════════════════════════════╝
    """)
    
    logger.info(f"🚀 Starting bot with token: {BOT_TOKEN[:15]}...")
    
    # Delete existing webhook
    await delete_webhook()
    logger.info("✅ Webhook deleted, starting polling...")
    
    offset = 0
    
    while True:
        try:
            updates = await get_updates(offset=offset, timeout=30)
            
            for update in updates:
                offset = update["update_id"] + 1
                
                if "message" not in update:
                    continue
                
                message = update["message"]
                chat_id = message["chat"]["id"]
                user_id = message["from"]["id"]
                text = message.get("text", "")
                
                if not text:
                    continue
                
                username = message["from"].get("username", "Unknown")
                logger.info(f"📩 [{username}] {text[:50]}...")
                
                # Process message
                response = await process_message(text, chat_id, user_id)
                
                # Send reply with menu for /start
                show_menu = text.lower() in ["/start", "/menu"]
                await send_message(
                    chat_id=chat_id,
                    text=response,
                    reply_markup=MAIN_MENU if show_menu else None
                )
                logger.info(f"✅ Replied to {username}")
                
        except asyncio.CancelledError:
            logger.info("🛑 Bot stopped")
            break
        except Exception as e:
            logger.error(f"❌ Error: {e}")
            await asyncio.sleep(5)


if __name__ == "__main__":
    try:
        asyncio.run(run_bot())
    except KeyboardInterrupt:
        print("\n👋 Bot stopped by user")
