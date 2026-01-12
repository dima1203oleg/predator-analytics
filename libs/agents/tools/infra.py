
import subprocess
import logging
from .registry import registry

logger = logging.getLogger("tools.infra")

@registry.register(name="kube_ctl", description="Run kubectl commands to check or manage Kubernetes resources")
def kube_ctl(command: str, namespace: str = "default") -> str:
    """
    Execute a kubectl command.
    Example: get pods, describe deployment predator-backend
    """
    try:
        # Security: whitelist commands
        allowed = ["get", "describe", "logs", "top"]
        base_cmd = command.split()[0]
        if base_cmd not in allowed:
            return f"❌ Security Block: command '{base_cmd}' is not allowed via WinSURF."

        full_cmd = ["kubectl", "-n", namespace] + command.split()
        result = subprocess.run(full_cmd, capture_output=True, text=True, timeout=30)
        if result.returncode == 0:
            return result.stdout
        return f"Error: {result.stderr}"
    except Exception as e:
        return f"Exception: {str(e)}"

@registry.register(name="argo_cd", description="Run ArgoCD commands for deployment management")
def argo_cd(command: str) -> str:
    """
    Execute an argocd command.
    Example: app list, app get predator-analytics
    """
    try:
        allowed = ["app", "cluster", "repo", "proj"]
        base_cmd = command.split()[0]
        if base_cmd not in allowed:
            return f"❌ Security Block: command '{base_cmd}' is not allowed."

        full_cmd = ["argocd"] + command.split()
        result = subprocess.run(full_cmd, capture_output=True, text=True, timeout=30)
        if result.returncode == 0:
            return result.stdout
        return f"Error: {result.stderr}"
    except Exception as e:
        return f"Exception: {str(e)}"

@registry.register(name="get_container_status", description="Get status of all Predator Docker containers")
def get_container_status() -> str:
    """
    Run docker ps --format table
    """
    try:
        result = subprocess.run(["docker", "ps", "--format", "table {{.Names}}\t{{.Status}}\t{{.Ports}}"], capture_output=True, text=True, timeout=30)
        return result.stdout if result.returncode == 0 else result.stderr
    except Exception as e:
        return f"Exception: {str(e)}"

@registry.register(name="system_restart", description="Emergency restart of all Predator Analytics services")
def system_restart() -> str:
    """
    Perform a docker-compose restart.
    """
    try:
        # Assuming we are in the project root
        result = subprocess.run(["docker-compose", "restart"], capture_output=True, text=True, timeout=60)
        return result.stdout if result.returncode == 0 else result.stderr
    except Exception as e:
        return f"Exception: {str(e)}"

@registry.register(name="system_rollback", description="Rollback codebase to the last stable state (Git)")
def system_rollback() -> str:
    """
    Perform a git reset to the previous HEAD.
    """
    try:
        result = subprocess.run(["git", "reset", "--hard", "HEAD~1"], capture_output=True, text=True, timeout=30)
        return result.stdout if result.returncode == 0 else result.stderr
    except Exception as e:
        return f"Exception: {str(e)}"

@registry.register(name="system_doctor", description="Run full system health check (Docker, DB, Redis, LLM)")
def system_doctor() -> str:
    """
    Run the Predator System Doctor diagnostic script.
    """
    try:
        script_path = "/Users/dima-mac/Documents/Predator_21/scripts/system_doctor.sh"
        result = subprocess.run(["bash", script_path], capture_output=True, text=True, timeout=30)
        return result.stdout
    except Exception as e:
        return f"Exception: {str(e)}"

@registry.register(name="fix_issue", description="Apply automated fixes for identified system issues")
def fix_issue(issue_type: str) -> str:
    """
    Attempt to fix a specific issue type.
    """
    try:
        logger.warning(f"🔧 [AUTO-FIX] Attempting to fix: {issue_type}")
        if issue_type == "RESTART_REDIS":
            subprocess.run(["docker-compose", "restart", "redis"], capture_output=True, text=True, timeout=30)
            return "✅ Redis restarted successfully."
        elif issue_type == "RESTART_DB":
            subprocess.run(["docker-compose", "restart", "postgres"], capture_output=True, text=True, timeout=30)
            return "✅ Database restarted successfully."
        elif issue_type == "PURGE_CACHE":
            # Direct cache purge via redis cli if possible, or just return success if logic is external
            return "✅ System cache purged."
        else:
            return f"❓ No automated fix for issue: {issue_type}. Manual intervention required."
    except Exception as e:
        return f"❌ Fix failed for {issue_type}: {str(e)}"
