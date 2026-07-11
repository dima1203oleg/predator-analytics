from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
import asyncio
import json
import psutil
import math
import time
from app.core.permissions import Permission
from app.dependencies import PermissionChecker

from predator_common.logging import get_logger

logger = get_logger("core_api.telemetry")

router = APIRouter(prefix="/telemetry", tags=["telemetry"])

# Спробуємо завантажити pynvml для NVIDIA GPU
try:
    import pynvml
    pynvml.nvmlInit()
    HAS_NVIDIA = True
except Exception:
    HAS_NVIDIA = False
    logger.warning("pynvml не знайдено або NVIDIA драйвер недоступний. Використовуватиметься симуляція для GPU (MacBook Fallback).")

@router.get("/stream")
async def stream_telemetry(
    request: Request,
    _ = Depends(PermissionChecker([Permission.READ_CORP_DATA]))
):
    """
    SSE стрім для апаратних метрик (CPU, RAM, GPU, VRAM).
    Оновлюється кожні 500мс для кінематографічного ефекту 'живого ядра'.
    """
    async def telemetry_generator():
        while True:
            if await request.is_disconnected():
                logger.info("Telemetry SSE client disconnected")
                break
                
            try:
                # Отримуємо базові метрики системи
                cpu_usage = psutil.cpu_percent(interval=None)
                ram = psutil.virtual_memory()
                ram_usage = ram.percent
                
                gpu_metrics = []
                
                if HAS_NVIDIA:
                    try:
                        device_count = pynvml.nvmlDeviceGetCount()
                        for i in range(device_count):
                            handle = pynvml.nvmlDeviceGetHandleByIndex(i)
                            utilization = pynvml.nvmlDeviceGetUtilizationRates(handle)
                            mem_info = pynvml.nvmlDeviceGetMemoryInfo(handle)
                            temp = pynvml.nvmlDeviceGetTemperature(handle, pynvml.NVML_TEMPERATURE_GPU)
                            
                            gpu_metrics.append({
                                "id": i,
                                "name": pynvml.nvmlDeviceGetName(handle),
                                "utilization": utilization.gpu,
                                "vram_used": mem_info.used,
                                "vram_total": mem_info.total,
                                "temperature": temp
                            })
                    except Exception as e:
                        logger.error(f"Помилка зчитування NVML: {e}")
                
                # Fallback симуляція для розробки (на MacBook)
                if not gpu_metrics:
                    # Симулюємо GPU на основі CPU та математики для "живого" вигляду
                    current_time = time.time()
                    base_gpu = (math.sin(current_time) + 1) * 15 # 0..30
                    simulated_gpu = min(100, max(0, cpu_usage * 0.8 + base_gpu))
                    
                    gpu_metrics.append({
                        "id": 0,
                        "name": "Simulated Tensor Core",
                        "utilization": round(simulated_gpu, 1),
                        "vram_used": 6000000000 + int(math.cos(current_time) * 1000000000),
                        "vram_total": 24000000000,
                        "temperature": int(40 + simulated_gpu * 0.4)
                    })
                
                event_data = {
                    "cpu_percent": cpu_usage,
                    "ram_percent": ram_usage,
                    "gpus": gpu_metrics,
                    "timestamp": time.time()
                }
                
                yield f"event: telemetry\ndata: {json.dumps(event_data)}\n\n"
                
            except Exception as e:
                logger.error(f"Помилка в telemetry_generator: {e}")
                
            await asyncio.sleep(0.5) # Оновлення кожні 500мс згідно плану

    return StreamingResponse(
        telemetry_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
