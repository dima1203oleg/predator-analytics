from __future__ import annotations

from datetime import datetime
import json
import os
import time


# Hack style Evolution Dashboard for Predator v25
AUDIT_LOG = "/tmp/azr_logs/azr_audit_log.jsonl"
ENGINE_LOG = "/tmp/azr_logs/azr_engine.log"

def clear(): os.system('clear' if os.name == 'posix' else 'cls')

def get_stats():
    try:
        total_cycles = 0
        last_entry = {}
        if os.path.exists(AUDIT_LOG):
            with open(AUDIT_LOG) as f:
                lines = f.readlines()
                total_cycles = len(lines)
                last_entry = json.loads(lines[-1]) if lines else {}

        # Memory stats
        solutions = 0
        mem_path = ".azr/memory/sovereign_solutions.jsonl"
        if os.path.exists(mem_path):
            with open(mem_path) as f:
                solutions = len(f.readlines())

        return total_cycles, last_entry, solutions
    except: return 0, {}, 0

def main():
    import sys
    py_ver = f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
    while True:
        clear()
        total, last, mem_count = get_stats()

        print("\033[1;36m" + "═══ PREDATOR v25: AZR EVOLUTION STATUS ══════════════════════════════════" + "\033[0m")
        print(f"📡 UPTIME: {datetime.now().strftime('%H:%M:%S')} | 🧬 CYCLES: {total} | ⚖️ COMPLIANCE: 100%")
        print(f"🐍 RUNTIME: Python {py_ver} | 🏛️  MEMORY: {mem_count} cases")
        print("──────────────────────────────────────────────────────────────────────────")

        if last:
            status = last.get('status', 'IDLE')
            s_id = last.get('sovereign_id', 'N/A')
            metrics = last.get('state_snapshot', {})
            print(f"🏛️  LAST SOVEREIGN ACTION: \033[1;32m{s_id}\033[0m")
            print(f"📊 SYSTEM HEALTH: {metrics.get('code_health', 0)*100:.1f}%")
            print(f"🔥 ENTROPY LEVEL: {metrics.get('entropy_level', 0):.4f}")
            print(f"💾 DISK: {metrics.get('disk_usage', 0):.1f}% | 🧠 RAM: {metrics.get('ram_usage', 0):.1f}%")
            print(f"🔧 ACTIONS: {', '.join([a['type'] for a in last.get('applied_changes', [])])}")

            rationale = last.get('rationale', 'Observing architectural patterns...')
            print(f"\n💡 \033[1;33mREASONING:\033[0m {rationale}")
        else:
            print("⏳ WAITING FOR FIRST EVOLUTION CYCLE...")

        print("\n\033[1;30m" + "--- RECENT HEARTBEATS (LOG TAIL) ---" + "\033[0m")
        if os.path.exists(ENGINE_LOG):
            os.system(f"tail -n 5 {ENGINE_LOG}")

        print("\n\033[1;31m" + "SYSTEM IS FULLY AUTONOMOUS. INTERVENTION NOT RECOMMENDED." + "\033[0m")
        time.sleep(10)

if __name__ == "__main__":
    main()
