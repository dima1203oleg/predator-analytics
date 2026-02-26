import uuid
import asyncio

from typing import Dict, Any, Optional

class CortexOrchestrator:
    def __init__(self) -> None:
        self.tasks: Dict[str, Any] = {}

    async def submit_task(self, user_id: int, text: str, source: str = "text") -> str:
        u_id = uuid.uuid4()
        task_id = str(u_id)[:8]
        self.tasks[task_id] = {
            "id": task_id,
            "user_id": user_id,
            "text": text,
            "status": "analyzing",
            "artifact": "",
            "audit": "Waiting for audit...",
            "strategy": {"voice_hint": "Починаю аналіз вашого запиту."},
            "result": ""
        }
        # Start a dummy processing loop for the task
        asyncio.create_task(self._process_dummy(task_id))
        return task_id

    async def _process_dummy(self, task_id: str) -> None:
        task = self.tasks.get(task_id)
        if not task: return
        
        await asyncio.sleep(2)
        task["status"] = "generating"
        await asyncio.sleep(2)
        task["status"] = "auditing"
        task["audit"] = "Security scan complete. No critical vulnerabilities found."
        task["artifact"] = "print('Hello from Predator v25.0')"
        await asyncio.sleep(2)
        task["status"] = "awaiting_approval"
        task["strategy"]["voice_hint"] = "Завдання підготовлено. Очікую вашого підтвердження."

    def get_task_status(self, task_id: str) -> Optional[Dict[str, Any]]:
        return self.tasks.get(task_id)

    async def execute_approval(self, task_id: str, approved: bool = True) -> bool:
        # Remove "app_" prefix if present from callback
        tid = task_id.replace("app_", "")
        if tid in self.tasks:
            task = self.tasks[tid]
            if approved:
                task["status"] = "executing"
                await asyncio.sleep(2)
                task["status"] = "completed"
                task["result"] = "Зміни успішно застосовані до кластера."
            else:
                task["status"] = "cancelled"
            return True
        return False
