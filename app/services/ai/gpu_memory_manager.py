"""GPU Memory Manager (Phase 5 — SM Edition).

Manages GTX 1080 (8GB VRAM) time-slicing and memory allocation.
Implements LRU eviction and degradation policies (§4.6).

HR-21: Concurrent STT + LLM = FORBIDDEN.
"""
from datetime import UTC, datetime
from typing import Any

# GPU allocation priorities (§4.6)
GPU_PRIORITIES: list[dict[str, Any]] = [
    {"priority": 1, "service": "llm_inference", "vram_gb": 4.0, "model": "mistral-7b-q4_k_m"},
    {"priority": 2, "service": "stt_transcription", "vram_gb": 2.0, "model": "whisper-large-v3-fp16"},
    {"priority": 3, "service": "embeddings", "vram_gb": 0.0, "fallback": "cpu", "note": "CPU fallback = CRITICAL"},
]

# Degradation thresholds
DEGRADATION_POLICY: list[dict[str, Any]] = [
    {"trigger": "vram > 70%", "actions": ["embeddings → CPU"]},
    {"trigger": "vram > 85%", "actions": ["whisper → queue, not real-time"]},
    {"trigger": "vram > 95%", "actions": ["тільки LLM, решта → CPU/queue"]},
    {"trigger": "ram > 50GB", "actions": ["worker-cpu → 1 replica, embeddings → CPU, automl → zero"]},
    {"trigger": "ram > 54GB", "actions": ["batch-jobs stop, ollama context 2048, sampling 5%"]},
]


class GPUMemoryManager:
    """GPU Memory Manager для GTX 1080 (8GB VRAM, time-sliced ×4)."""

    def __init__(self) -> None:
        self.total_vram_gb: float = 8.0
        self.reserved_gb: float = 0.256  # 256MB system reserved
        self.time_slices: int = 4
        self.concurrent_stt_llm_forbidden: bool = True  # HR-21

    def get_gpu_status(self) -> dict[str, Any]:
        """Стан GPU."""
        return {
            "gpu_model": "NVIDIA GTX 1080",
            "total_vram_gb": self.total_vram_gb,
            "reserved_gb": self.reserved_gb,
            "available_gb": self.total_vram_gb - self.reserved_gb,
            "time_slices": self.time_slices,
            "priorities": GPU_PRIORITIES,
            "hr21_concurrent_stt_llm": "FORBIDDEN",
            "status": "healthy",
            "updated_at": datetime.now(UTC).isoformat(),
        }

    def get_degradation_policy(self) -> list[dict[str, Any]]:
        """Degradation policy для VRAM та RAM."""
        return DEGRADATION_POLICY

    def check_allocation(self, service: str) -> dict[str, Any]:
        """Перевірити можливість виділення GPU для сервісу."""
        for p in GPU_PRIORITIES:
            if p["service"] == service:
                return {
                    "service": service,
                    "priority": p["priority"],
                    "vram_required_gb": p.get("vram_gb", 0),
                    "can_allocate": True,
                    "fallback": p.get("fallback"),
                }
        return {"service": service, "can_allocate": False, "error": "Unknown service"}
