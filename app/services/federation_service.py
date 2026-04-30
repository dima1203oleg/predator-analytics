from __future__ import annotations

import time


class FederationService:
    def __init__(self):
        # In-memory storage for MVP
        self.edge_nodes: dict[str, dict] = {}
        self.task_queue: dict[str, list[dict]] = {}
        # Stores results temporarily
        self.task_results: dict[str, dict] = {}

    def register_node(self, node_data: dict) -> dict:
        node_id = node_data["node_id"]
        self.edge_nodes[node_id] = {
            "info": node_data,
            "last_seen": time.time(),
            "status": "online",
            "tasks_completed": 0,
        }
        return {"status": "registered", "master_node": "Predator-Core-Prime"}

    def heartbeat(self, node_id: str, load: float) -> list[dict] | None:
        if node_id not in self.edge_nodes:
            return None  # Indicate need for re-registration

        self.edge_nodes[node_id]["last_seen"] = time.time()
        self.edge_nodes[node_id]["status"] = "online"
        self.edge_nodes[node_id]["load"] = load

        # Pop tasks
        tasks = []
        if self.task_queue.get(node_id):
            tasks = self.task_queue[node_id]
            self.task_queue[node_id] = []

        return tasks

    def dispatch_task(self, type: str, payload: dict, target_node_id: str | None = None) -> str:
        task_id = f"task-{int(time.time())}"
        task_data = {
            "task_id": task_id,
            "type": type,
            "payload": payload,
            "created_at": time.time(),
        }

        target = target_node_id
        if not target:
            # Find first active node
            for nid, data in self.edge_nodes.items():
                if data.get("status") == "online":
                    target = nid
                    break

        if target:
            if target not in self.task_queue:
                self.task_queue[target] = []
            self.task_queue[target].append(task_data)
            return task_id
        raise Exception("No active edge nodes available")

    def submit_result(self, task_id: str, node_id: str, result: dict, status: str):
        self.task_results[task_id] = {
            "node_id": node_id,
            "result": result,
            "status": status,
            "completed_at": time.time(),
        }
        if node_id in self.edge_nodes:
            self.edge_nodes[node_id]["tasks_completed"] += 1

    def get_active_nodes(self) -> list[dict]:
        now = time.time()
        results = []
        for data in self.edge_nodes.values():
            is_alive = (now - data["last_seen"]) < 30
            data["status"] = "online" if is_alive else "offline"
            results.append(data)
        return results


# Singleton instance
_federation_service = FederationService()


def get_federation_service():
    return _federation_service
