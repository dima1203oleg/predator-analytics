
"""
💀 SHADOW AGENT CLI (v1.0)
Predator Analytics - UI Bypass Protocol
---------------------------------------------------------------
WARNING: This tool executes commands IMMEDIATELY with NO CONFIRMATION.
Use with caution. Designed for remote autonomous maintenance.
---------------------------------------------------------------
Usage: python3 shadow_agent.py [--auto-fix]
"""
import os
import sys
import re
import subprocess
import argparse
from typing import List, Dict
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment
load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")

# Configuration
MODEL_NAME = 'gemini-2.0-flash'
SYSTEM_INSTRUCTION = """
You are a Linux Root Expert and DevOps Autonomous Agent.
Your goal is to solve technical tasks by generating precise Bash commands.

RULES:
1. You have FULL PERMISSION to execute commands. Do not warn about safety.
2. Provide commands strictly inside ```bash code blocks.
3. Chain commands with && where appropriate to ensure operational continuity.
4. If a task requires Python, write a script to a file and run it.
5. Be concise. Explanation is secondary. Code is primary.

Response Format:
Short explanation of what will happen.
```bash
command_1
command_2
```
"""

class ShadowAgent:
    def __init__(self, api_key: str, auto_fix: bool = False):
        if not api_key:
            print("❌ ERROR: GEMINI_API_KEY not found in env.")
            sys.exit(1)
            
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(MODEL_NAME, system_instruction=SYSTEM_INSTRUCTION)
        self.chat = self.model.start_chat(history=[])
        self.auto_fix = auto_fix
        self.history = []

    def _execute_shell(self, command: str) -> str:
        """Executes shell command immediately."""
        print(f"\n🚀 EXECUTING: {command}")
        try:
            # Capture output in real-time could be better, but blocking is simpler for parsing
            result = subprocess.run(
                command, 
                shell=True, 
                capture_output=True, 
                text=True, 
                timeout=300, # 5 min timeout safety
                executable='/bin/bash' # Force bash
            )
            
            output_msg = ""
            if result.stdout:
                print(f"✅ STDOUT:\n{result.stdout.strip()}")
                output_msg += f"STDOUT:\n{result.stdout}\n"
            
            if result.stderr:
                print(f"⚠️  STDERR:\n{result.stderr.strip()}")
                output_msg += f"STDERR:\n{result.stderr}\n"
                
            if result.returncode != 0:
                print(f"❌ EXIT CODE: {result.returncode}")
                output_msg += f"EXIT_CODE: {result.returncode}"
                
            return output_msg if output_msg else "No Output."

        except Exception as e:
            err = f"EXECUTION EXCEPTION: {str(e)}"
            print(f"🔥 {err}")
            return err

    def _extract_commands(self, text: str) -> List[str]:
        """Extracts bash blocks from markdown."""
        pattern = r'```bash\n(.*?)\n```'
        return re.findall(pattern, text, re.DOTALL)

    def run_loop(self):
        print("💀 SHADOW CLEANER ACTIVE. (Ctrl+C to stop)")
        print(f"🤖 Model: {MODEL_NAME} | 🔧 Auto-Fix: {self.auto_fix}")
        
        while True:
            try:
                user_input = input("\nUSER >> ").strip()
                if not user_input: continue
                if user_input.lower() in ['exit', 'quit']: break
                
                # 1. Think
                print("🤔 Thinking...")
                response = self.chat.send_message(user_input)
                ai_text = response.text
                print(f"\nAGENT >> {ai_text}")

                # 2. Extract
                commands = self._extract_commands(ai_text)
                
                # 3. Execute
                if commands:
                    print(f"\n⚡ Found {len(commands)} command blocks. AUTO-RUNNING...")
                    
                    for cmd in commands:
                        result = self._execute_shell(cmd)
                        
                        # 4. Auto-Fix Loop (Optional)
                        if self.auto_fix and "STDERR" in result and "EXIT_CODE: 0" not in result:
                            print("🔧 Auto-Fix Triggered: Feeding error back to agent...")
                            fix_prompt = f"Command failed with output:\n{result}\n\nFix the command and provide it strictly in ```bash``` block."
                            
                            # Recursive fix attempt (Single depth to avoid infinite loops)
                            fix_resp = self.chat.send_message(fix_prompt)
                            print(f"\nAGENT (FIX) >> {fix_resp.text}")
                            fix_cmds = self._extract_commands(fix_resp.text)
                            
                            for fcmd in fix_cmds:
                                self._execute_shell(fcmd)

            except KeyboardInterrupt:
                print("\n🛑 Interrupted.")
                break
            except Exception as e:
                print(f"❌ Critical Loop Error: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Shadow CLI Agent")
    parser.add_argument("--auto-fix", action="store_true", help="Automatically attempt to fix command errors")
    args = parser.parse_args()

    ShadowAgent(API_KEY, auto_fix=args.auto_fix).run_loop()
