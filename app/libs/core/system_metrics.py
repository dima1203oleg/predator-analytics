"""📊 SYSTEM METRICS UTILITY - Cross-platform metrics with fallbacks.
================================================================
Provides system metrics (CPU, Memory, Disk) using psutil if available,
otherwise falls back to native OS commands (optimized for macOS/Linux).
"""

from dataclasses import dataclass
import logging
import platform
import subprocess

logger = logging.getLogger("system_metrics")


@dataclass
class SystemSnapshot:
    cpu_percent: float
    memory_percent: float
    disk_percent: float


def get_cpu_usage() -> float:
    """Get CPU usage percentage."""
    try:
        import psutil

        return psutil.cpu_percent(interval=0.1)
    except (ImportError, Exception):
        try:
            if platform.system() == "Darwin":  # macOS
                # Fallback: use sysctl for load average (less accurate but no permissions needed)
                # sysctl -n vm.loadavg -> "{ 2.34 1.89 1.55 }"
                try:
                    out = subprocess.check_output(["sysctl", "-n", "vm.loadavg"]).decode().strip()
                    # Parse "{ 1.23 4.56 7.89 }"
                    load_1min = float(out.strip("{} ").split()[0])
                    # Normalize by core count? For now just raw load or capped.
                    # Getting core count without psutil:
                    cores = int(
                        subprocess.check_output(["sysctl", "-n", "hw.ncpu"]).decode().strip()
                    )
                    usage = (load_1min / cores) * 100.0
                    return min(100.0, usage)
                except Exception:
                    # Last resort fallback if sysctl fails
                    return 0.0
            else:  # Linux fallback
                # /proc/loadavg / 10 is a very rough estimate, or use 'top'
                cmd = "top -bn1 | grep 'Cpu(s)' | sed 's/.*, *\\([0-9.]*\\)%* id.*/\\1/' | awk '{print 100 - $1}'"
                res = subprocess.check_output(cmd, shell=True).decode().strip()
                return float(res)
        except Exception as e:
            logger.debug(f"CPU fallback failed: {e}")
            return 0.0


def get_memory_usage() -> float:
    """Get Memory usage percentage."""
    try:
        import psutil

        return psutil.virtual_memory().percent
    except (ImportError, Exception):
        try:
            if platform.system() == "Darwin":  # macOS
                # vm_stat
                vm = subprocess.check_output("vm_stat", shell=True).decode()
                lines = vm.split("\n")
                pages_free = 0
                pages_active = 0
                pages_inactive = 0
                pages_wired = 0
                for line in lines:
                    if "Pages free" in line:
                        pages_free = int(line.split()[-1].strip("."))
                    if "Pages active" in line:
                        pages_active = int(line.split()[-1].strip("."))
                    if "Pages inactive" in line:
                        pages_inactive = int(line.split()[-1].strip("."))
                    if "Pages wired" in line:
                        pages_wired = int(line.split()[-1].strip("."))

                used = pages_active + pages_wired
                total = used + pages_free + pages_inactive
                return (used / total) * 100 if total > 0 else 0.0
            # Linux
            cmd = "free | grep Mem | awk '{print $3/$2 * 100.0}'"
            res = subprocess.check_output(cmd, shell=True).decode().strip()
            return float(res)
        except Exception as e:
            logger.debug(f"Memory fallback failed: {e}")
            return 0.0


def get_disk_usage(path: str = "/") -> float:
    """Get Disk usage percentage."""
    try:
        import psutil

        return psutil.disk_usage(path).percent
    except (ImportError, Exception):
        try:
            # df -h / | tail -1 | awk '{print $5}' -> "45%"
            cmd = f"df -k '{path}' | tail -1 | awk '{{print $5}}' | tr -d '%'"
            res = subprocess.check_output(cmd, shell=True).decode().strip()
            return float(res)
        except Exception as e:
            logger.debug(f"Disk fallback failed: {e}")
            return 0.0


def get_system_snapshot() -> SystemSnapshot:
    """Collect all core metrics."""
    return SystemSnapshot(
        cpu_percent=get_cpu_usage(),
        memory_percent=get_memory_usage(),
        disk_percent=get_disk_usage(),
    )
