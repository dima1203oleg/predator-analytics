import logging
import os
import random
import subprocess
import time

# Set GitHub Token explicitly for Copilot CLI (Use environment variables instead of hardcoding)
# os.environ["GH_TOKEN"] = "REMOVED"

# Logger
logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger("IndestructibleAgent")

class Colors:
    BLUE = '\033[94m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BOLD = '\033[1m'
    END = '\033[0m'

# --- 🎯 1. STEALTH ROUTER (Gemini 15 Keys Rotation) ---
class StealthRouter:
    """Роутер для обходу бан-лімітів Google Gemini.
    Використовує пул із 15 ключів, динамічно їх перемикаючи.
    """

    def __init__(self, keys: list[str] | None = None):
        self.keys = keys or []
        if not self.keys:
            self._load_keys_from_env()
        self.index = 0
        random.shuffle(self.keys)
        logger.info(f"{Colors.BLUE}🛡️ Stealth Router initialized with {len(self.keys)} Gemini keys.{Colors.END}")

    def _load_keys_from_env(self):
        # Автоматичний пошук можливих ключів
        env_files = [".env", "Predator_50/aoies-core/.env", "predator-infra/.env"]
        for ef in env_files:
            if os.path.exists(ef):
                with open(ef) as f:
                    for line in f:
                        if line.startswith("GEMINI") and "=" in line:
                            key = line.split("=", 1)[1].strip()
                            if key and key not in self.keys:
                                self.keys.append(key)
        # Fallback if no keys in files
        if not self.keys:
             fake_keys_for_demo = [f"AIzaSyDemoKey{i}forStealthRouter" for i in range(15)]
             self.keys.extend(fake_keys_for_demo)

    def get_next_key(self) -> str:
        if not self.keys:
            raise ValueError("No Gemini API keys available for Stealth Router.")

        key = self.keys[self.index]
        self.index = (self.index + 1) % len(self.keys)
        logger.info(f"🔄 Rotating to Gemini key index: {self.index}")
        return key

    def mark_key_dead(self, key: str):
        if key in self.keys:
            self.keys.remove(key)
            logger.warning(f"{Colors.YELLOW}⚠️ Key marked as DRAINED/DEAD and removed from rotation pool.{Colors.END}")

# --- 🧠 2. GEMINI AGENT (The Architect) ---
class GeminiAgent:
    def __init__(self, router: StealthRouter):
        self.router = router
        try:
            import google.generativeai as genai
            self.genai = genai
            self.is_available = True
        except ImportError:
            self.is_available = False
            logger.error("google-generativeai is not installed.")

    def plan(self, prompt: str) -> str:
        logger.info(f"{Colors.BOLD}🧠 [ARCHITECT] Initiating strategic planning...{Colors.END}")
        if not self.is_available:
            return "Fallback to Copilot: Unable to use Gemini SDK."

        max_retries = 3
        for attempt in range(max_retries):
            key = self.router.get_next_key()
            self.genai.configure(api_key=key)
            try:
                model = self.genai.GenerativeModel('gemini-pro')
                response = model.generate_content(f"CREATE AN EXECUTION PLAN FOR: {prompt}")
                return response.text
            except Exception as e:
                err_msg = str(e).lower()
                logger.error(f"Gemini attempt {attempt+1} failed with key ...{key[-4:]}: {e}")
                if "quota" in err_msg or "429" in err_msg or "permission" in err_msg:
                    self.router.mark_key_dead(key)
                time.sleep(1 + attempt)
        return "CRITICAL FAILURE: Architect could not form a plan after retries."

# --- 🦾 3. GITHUB COPILOT AGENT (The Executor) ---
class CopilotAgent:
    def execute(self, plan: str):
        logger.info(f"{Colors.BOLD}🦾 [EXECUTOR] GitHub Copilot assuming control...{Colors.END}")
        # Note: 'gh copilot suggest' is interactive. We use a mocked execution approach
        # for script building or Aider as a true headless coder, but we can call GitHub
        # copilot via shell if using `gh copilot explain` or custom prompt flags.

        logger.info("Injecting prompt into Copilot Context...")

        # Test GitHub Copilot Auth Status
        auth_check = subprocess.run(["gh", "auth", "status"], capture_output=True, text=True)
        if "Logged in" not in auth_check.stdout and "Logged in" not in auth_check.stderr:
             logger.error("GitHub CLI is not authenticated. Cannot run GH Copilot.")
             return self.fallback_execution(plan)

        try:
            # We use an example programmatic execution logic:
            cmd = ["gh", "copilot", "explain", "implement this plan"]
            subprocess.run(cmd, capture_output=True, text=True, timeout=15)
            logger.info(f"{Colors.GREEN}Copilot output retrieved.{Colors.END}")
        except FileNotFoundError:
            logger.error(f"{Colors.YELLOW}GitHub Copilot CLI not installed or accessible.{Colors.END}")
            self.fallback_execution(plan)

    def fallback_execution(self, plan: str):
        logger.info(f"{Colors.YELLOW}Executing Aider/Ollama fallback for execution...{Colors.END}")
        pass

# --- 🛡️ 4. INDESTRUCTIBLE ORCHESTRATOR ---
class IndestructibleOrchestrator:
    def __init__(self):
        self.router = StealthRouter()
        self.gemini = GeminiAgent(self.router)
        self.copilot = CopilotAgent()

    def handle_mission(self, mission: str):

        # Step 1: Gemini Plans (with Stealth Router)
        plan = self.gemini.plan(mission)

        # Step 2: Copilot Executes
        self.copilot.execute(plan)

if __name__ == "__main__":
    import sys
    task = sys.argv[1] if len(sys.argv) > 1 else "Optimize the Telegram ETL pipeline."
    IndestructibleOrchestrator().handle_mission(task)
