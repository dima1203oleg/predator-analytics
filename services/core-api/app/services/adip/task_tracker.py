import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

class TaskTracker:
    def __init__(self):
        self.tasks: Dict[str, Any] = {}

    def get_all_tasks(self) -> List[Any]:
        # Sort by timestamp desc (newest first)
        sorted_tasks = sorted(self.tasks.values(), key=lambda x: x.get('timestamp', ''), reverse=True)
        return sorted_tasks

    def start_task(self, name: str, agent: str, priority: str = "MEDIUM") -> str:
        task_id = str(uuid.uuid4())
        self.tasks[task_id] = {
            "id": task_id,
            "name": name,
            "status": "RUNNING",
            "priority": priority,
            "agent": agent,
            "progress": 0,
            "logs": [f"[{datetime.now().strftime('%H:%M:%S')}] Завдання ініційовано."],
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        return task_id

    def update_task(self, task_id: str, progress: int, log: Optional[str] = None, status: str = "RUNNING"):
        if task_id in self.tasks:
            self.tasks[task_id]["progress"] = progress
            self.tasks[task_id]["status"] = status
            if log:
                # Insert at index 0 so newest is first in UI? The UI renders them as they are, let's just append
                self.tasks[task_id]["logs"].append(f"[{datetime.now().strftime('%H:%M:%S')}] {log}")
            self.tasks[task_id]["timestamp"] = datetime.now(timezone.utc).isoformat()

    def complete_task(self, task_id: str, log: str = "Завдання завершено."):
        self.update_task(task_id, 100, log, "COMPLETED")

    def fail_task(self, task_id: str, log: str = "Помилка виконання завданя."):
        self.update_task(task_id, 100, log, "FAILED")

task_tracker = TaskTracker()
