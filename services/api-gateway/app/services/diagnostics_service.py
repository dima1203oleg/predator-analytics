
import asyncio
import logging
import aiohttp
import time
import os
import psutil
from typing import Dict, Any

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("Diagnostics")

class DiagnosticsService:
    """
    Core service for running system health checks and diagnostics.
    Follows WEB_INTERFACE_TESTING_SPEC.md.
    """

    def __init__(self):
        self.results = {
            "infrastructure": {},
            "ai_brain": {},
            "data_ingestion": {},
            "overall_status": "PENDING"
        }
        # Load API keys from secure storage only
        from app.core.llm_keys_storage import llm_keys_storage
        self.keys_storage = llm_keys_storage
        
        # System configuration
        self.redis_url = os.getenv("REDIS_URL", "redis://127.0.0.1:6379/1")




    async def _check_infrastructure(self):
        """Checks CPU, RAM, Disk, Redis."""
        logger.info("Checking Infrastructure...")
        infra = {}

        # System Resources
        try:
            infra['cpu'] = {"status": "OK", "usage": f"{psutil.cpu_percent(interval=1)}%"}
            infra['ram'] = {"status": "OK", "usage": f"{psutil.virtual_memory().percent}%"}
            infra['disk'] = {"status": "OK", "usage": f"{psutil.disk_usage('/').percent}%"}
        except Exception as e:
            infra['system'] = {"status": "ERROR", "error": str(e)}

        # Redis
        try:
            import redis.asyncio as redis
            r = redis.from_url(self.redis_url, socket_timeout=5, socket_connect_timeout=5)
            await r.ping()
            await r.close()
            infra['redis'] = {"status": "OK"}
        except Exception as e:
            infra['redis'] = {"status": "ERROR", "error": str(e)}

        self.results['infrastructure'] = infra

    async def _check_ai_brain(self):
        """Checks availability of AI models."""
        logger.info("Checking AI Brain...")
        ai_status = {}

        # Test Groq (Llama 3.3) - Primary
        groq_keys = self.keys_storage.list_keys('groq')
        if groq_keys:
            ai_status['groq'] = await self._test_llm_api(
                name="Groq (Llama 3.3)",
                url="https://api.groq.com/openai/v1/chat/completions",
                key=groq_keys[0],
                model=self.keys_storage.get_model('groq')
            )
        else:
            ai_status['groq'] = {"status": "ERROR", "error": "No GROQ_API_KEYS configured"}

        # Test Gemini (Fallback)
        gemini_keys = self.keys_storage.list_keys('gemini')
        if gemini_keys:
            ai_status['gemini'] = await self._test_gemini_api(key=gemini_keys[0])
        else:
            ai_status['gemini'] = {"status": "ERROR", "error": "No GEMINI_API_KEYS configured"}

        # Test Mistral
        mistral_keys = self.keys_storage.list_keys('mistral')
        if mistral_keys:
            ai_status['mistral'] = await self._test_llm_api(
                name="Mistral",
                url="https://api.mistral.ai/v1/chat/completions",
                key=mistral_keys[0],
                model=self.keys_storage.get_model('mistral')
            )
        else:
            ai_status['mistral'] = {"status": "ERROR", "error": "No MISTRAL_API_KEYS configured"}

        self.results['ai_brain'] = ai_status

    async def _check_data_ingestion(self):
        """Checks Data Pipeline (MinIO -> ETL -> DB)."""
        logger.info("Checking Data Ingestion...")
        data_status = {}

        # 1. MinIO Check
        try:
            from app.services.minio_service import MinIOService
            minio = MinIOService()
            buckets = minio.client.list_buckets()
            data_status['minio'] = {"status": "OK", "buckets": len(buckets)}
        except Exception as e:
            data_status['minio'] = {"status": "ERROR", "error": str(e)}

        # 2. Database (PostgreSQL) Check
        try:
            from app.services.document_service import document_service
            # Just count documents to verify DB connection
            docs = await document_service.list_documents(limit=1)
            data_status['postgresql'] = {"status": "OK", "docs_count": docs.get('total', 'N/A')}
        except Exception as e:
            data_status['postgresql'] = {"status": "ERROR", "error": str(e)}

        # 3. Vector DB (Qdrant)
        try:
            from app.services.qdrant_service import QdrantService
            qdrant = QdrantService()
            info = qdrant.client.count("documents_vectors")
            data_status['qdrant'] = {"status": "OK", "points": info.count}
        except Exception as e:
            data_status['qdrant'] = {"status": "ERROR", "error": str(e)}

        self.results['data_ingestion'] = data_status

    async def _check_voice_interface(self):
        """Checks Voice Services (STT/TTS)."""
        logger.info("Checking Voice Interface...")
        voice_status = {}

        # Check if TTS service is reachable (Mock check for now as explicit TTS service might be external)
        # We check AvatarService which depends on it
        try:
            from app.services.avatar_service import AvatarService
            # Just instantiation check
            _ = AvatarService()
            voice_status['avatar_core'] = {"status": "OK"}
        except Exception as e:
            voice_status['avatar_core'] = {"status": "ERROR", "error": str(e)}

        self.results['voice_interface'] = voice_status

    async def run_full_diagnostics(self) -> Dict[str, Any]:
        """Runs all diagnostic suites sequentially."""
        logger.info("🚀 Starting Full System Diagnostics...")

        # 1. Infrastructure Checks
        await self._check_infrastructure()

        # 2. AI Brain Checks
        await self._check_ai_brain()

        # 3. Data Ingestion Checks
        await self._check_data_ingestion()

        # 4. Voice Interface Checks
        await self._check_voice_interface()

        self._calculate_overall_status()
        return self.results
    async def _test_llm_api(self, name, url, key, model):
        """Generic OpenAI-compatible API test."""
        start = time.time()
        payload = {
            "model": model,
            "messages": [{"role": "user", "content": "ping"}],
            "max_tokens": 5
        }
        headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
        timeout = aiohttp.ClientTimeout(total=5)

        try:
            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.post(url, json=payload, headers=headers) as resp:
                    latency = round((time.time() - start) * 1000, 2)
                    if resp.status == 200:
                        return {"status": "OK", "latency_ms": latency}
                    else:
                        return {"status": "ERROR", "code": resp.status, "latency_ms": latency}
        except Exception as e:
            return {"status": "ERROR", "error": str(e)}

    async def _test_gemini_api(self, key):
        """Gemini specific test."""
        start = time.time()
        # Trying Flash model first
        url_base = "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent"
        models_to_try = ["gemini-1.5-flash", "gemini-2.0-flash-exp", "gemini-pro"]
        payload = {"contents": [{"parts": [{"text": "ping"}]}]}
        timeout = aiohttp.ClientTimeout(total=5)

        try:
            async with aiohttp.ClientSession(timeout=timeout) as session:
                for model in models_to_try:
                    try:
                        url = url_base.format(model)
                        async with session.post(f"{url}?key={key}", json=payload) as resp:
                            if resp.status == 200:
                                latency = round((time.time() - start) * 1000, 2)
                                return {"status": "OK", "latency_ms": latency, "model": model}
                    except Exception:
                        continue

                return {"status": "ERROR", "code": "All models failed (404/Other)"}
        except Exception as e:
            return {"status": "ERROR", "error": str(e)}

    def _calculate_overall_status(self):
        """Simplistic status aggregation."""
        failures = 0
        for section in self.results.values():
            if isinstance(section, dict):
                for k, v in section.items():
                    if isinstance(v, dict) and v.get("status") == "ERROR":
                        failures += 1

        if failures == 0:
            self.results["overall_status"] = "HEALTHY ✅"
        elif failures < 3:
             self.results["overall_status"] = "DEGRADED ⚠️"
        else:
             self.results["overall_status"] = "CRITICAL ❌"

    def generate_report(self) -> str:
        """Generates a Markdown report from results."""
        r = self.results
        report = "# 🏥 System Diagnostic Report\n"
        report += f"**Overall Status**: {r['overall_status']}\n\n"

        report += "## 🖥️ Infrastructure\n"
        infra = r.get('infrastructure', {})
        report += f"- **CPU**: {infra.get('cpu', {}).get('usage', 'N/A')} ({infra.get('cpu', {}).get('status')})\n"
        report += f"- **RAM**: {infra.get('ram', {}).get('usage', 'N/A')} ({infra.get('ram', {}).get('status')})\n"
        report += f"- **Redis**: {infra.get('redis', {}).get('status')}\n\n"

        report += "## 🧠 AI Brain\n"
        ai = r.get('ai_brain', {})
        for name, data in ai.items():
             status_icon = "✅" if data.get("status") == "OK" else "❌"
             latency = f"{data.get('latency_ms')}ms" if data.get('latency_ms') else "N/A"
             report += f"- **{name.upper()}**: {status_icon} (Latency: {latency})\n"
             if data.get("status") == "ERROR":
                 report += f"  - Error: {data.get('code') or data.get('error')}\n"

        return report

# Standalone execution
if __name__ == "__main__":
    service = DiagnosticsService()
    results = asyncio.run(service.run_full_diagnostics())
    print("\n" + service.generate_report())
