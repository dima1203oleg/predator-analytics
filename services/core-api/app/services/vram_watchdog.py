import asyncio
from dataclasses import dataclass
import shutil

try:
    import pynvml
    HAS_NVML = True
except ImportError:
    pynvml = None
    HAS_NVML = False

from predator_common.logging import get_logger

logger = get_logger("core_api.vram_watchdog")

VRAM_TOTAL = 8.0  # GB (GTX 1080 standard)
VRAM_TRIGGER_THRESHOLD = 7.6  # GB (Перехід на CLOUD)
VRAM_RECOVERY_THRESHOLD = 6.0  # GB (Повернення на SOVEREIGN)

@dataclass
class VramStatus:
    used_gb: float
    total_gb: float
    critical: bool
    mode_recommendation: str  # 'SOVEREIGN' | 'HYBRID' | 'CLOUD'
    gpu_found: bool

class VramSentinel:
    def __init__(self):
        self._current_mode = "SOVEREIGN"
        self._nvidia_smi_path = shutil.which("nvidia-smi")
        self._nvml_initialized = False
        if HAS_NVML:
            try:
                pynvml.nvmlInit()
                self._nvml_initialized = True
                logger.info("🚀 NVML initialized successfully")
            except Exception as e:
                logger.debug(f"NVML init failed: {e}")

    async def _get_real_vram(self) -> float | None:
        """Отримати реальне використання VRAM (через NVML або nvidia-smi)."""
        # 1. Спробувати NVML (найшвидше)
        if HAS_NVML and self._nvml_initialized:
            try:
                handle = pynvml.nvmlDeviceGetHandleByIndex(0)
                info = pynvml.nvmlDeviceGetMemoryInfo(handle)
                return info.used / 1024.0 / 1024.0 / 1024.0 # в GB
            except Exception as e:
                logger.debug(f"NVML query failed: {e}")

        # 2. Фоллбек на nvidia-smi (повільніше)
        if not self._nvidia_smi_path:
            return None

        try:
            # Запит: використана пам'ять у MB
            result = await asyncio.create_subprocess_exec(
                self._nvidia_smi_path, "--query-gpu=memory.used", "--format=csv,noheader,nounits",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, _ = await result.communicate()
            if result.returncode == 0:
                mb_used = float(stdout.decode().strip())
                return mb_used / 1024.0  # Конвертація в GB
        except Exception as e:
            logger.debug(f"Не вдалося отримати дані з nvidia-smi: {e}")
        return None

    async def get_stats(self) -> VramStatus:
        """Отримати статистику VRAM (реальну або симуляцію)."""
        real_vram = await self._get_real_vram()
        gpu_found = real_vram is not None

        if real_vram is not None:
            used_gb = real_vram
        else:
            # Симуляція для середовищ без GPU (macOS/Dev)
            import time
            cycle = int(time.time() / 30) % 3
            if cycle == 0:
                used_gb = 3.5 + (time.time() % 1.0)
            elif cycle == 1:
                used_gb = 6.2 + (time.time() % 0.5)
            else:
                used_gb = 7.7 + (time.time() % 0.2)

        critical = used_gb >= VRAM_TRIGGER_THRESHOLD

        if used_gb >= VRAM_TRIGGER_THRESHOLD:
            recommendation = "CLOUD"
        elif used_gb >= 6.5:
            recommendation = "HYBRID"
        else:
            recommendation = "SOVEREIGN"

        return VramStatus(
            used_gb=round(used_gb, 2),
            total_gb=VRAM_TOTAL,
            critical=critical,
            mode_recommendation=recommendation,
            gpu_found=gpu_found
        )

    @property
    def current_mode(self) -> str:
        """Поточний рекомендований режим на основі VRAM (SOVEREIGN, HYBRID, CLOUD)."""
        return self._current_mode

    async def watchdog_loop(self):
        """Фоновий цикл моніторингу та Failover-сигналізації."""
        logger.info("📡 VRAM Sentinel Watchdog STARTED.")
        while True:
            try:
                status = await self.get_stats()

                if status.critical and self._current_mode != "CLOUD":
                    logger.warning(f"🚨 VRAM CRITICAL: {status.used_gb}GB. Автоматичний FAILOVER на CLOUD.")
                    self._current_mode = "CLOUD"
                    # Тут можна додати логіку сповіщення LiteLLM сервісу

                elif not status.critical and status.used_gb < VRAM_RECOVERY_THRESHOLD and self._current_mode == "CLOUD":
                    logger.info(f"✅ VRAM RECOVRED: {status.used_gb}GB. Повернення в режим SOVEREIGN.")
                    self._current_mode = "SOVEREIGN"

                await asyncio.sleep(5)
            except Exception as e:
                logger.error(f"Error in VRAM Watchdog loop: {e}")
                await asyncio.sleep(10)

vram_sentinel = VramSentinel()
