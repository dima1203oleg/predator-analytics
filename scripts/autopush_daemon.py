import logging
import os
import subprocess
import time

# --- CONFIGURATION ---
REPO_PATH = "/Users/dima-mac/Documents/Predator_21"
CHECK_INTERVAL = 30  # Poll every 30 seconds
EXCLUDE_DIRS = {".git", "node_modules", "__pycache__", "dist", ".next", ".gemini"}

# Logger setup
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
    handlers=[
        logging.FileHandler(os.path.join(REPO_PATH, "scripts/autopush.log")),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("AutoPushDaemon")

def sync_to_github():
    try:
        # Check for changes
        status = subprocess.run(["git", "status", "--porcelain"], cwd=REPO_PATH, capture_output=True, text=True)
        if not status.stdout.strip():
            return

        logger.info("🚀 Changes detected. Initiating Autocommit & Autopush...")

        # Git operations
        subprocess.run(["git", "add", "."], cwd=REPO_PATH, check=True)

        commit_msg = f"🔄 Autocommit: Changes detected at {time.strftime('%Y-%m-%d %H:%M:%S')}"
        subprocess.run(["git", "commit", "-m", commit_msg], cwd=REPO_PATH, check=True)

        # Push (ensure branch is main)
        subprocess.run(["git", "push", "origin", "main"], cwd=REPO_PATH, check=True)

        logger.info("✅ Successfully pushed to GitHub.")
    except Exception as e:
        logger.error(f"⚠️ Git sync error: {e}")

if __name__ == "__main__":
    logger.info("🛰️ PREDATOR Autopush Daemon (Polling Mode) STARTED")
    logger.info(f"Watching: {REPO_PATH} every {CHECK_INTERVAL}s")

    # Initial sync
    sync_to_github()

    while True:
        try:
            sync_to_github()
            time.sleep(CHECK_INTERVAL)
        except KeyboardInterrupt:
            break
        except Exception as e:
            logger.error(f"Daemon error: {e}")
            time.sleep(10)

    logger.info("🛰️ Autopush Daemon STOPPED")
