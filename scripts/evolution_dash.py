from __future__ import annotations

import json
import os
import time

# Hack style Evolution Dashboard for Predator v45 | Neural AnalyticsAUDIT_LOG = "/tmp/azr_logs/azr_audit_log.jsonl"
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
    while True:
        clear()
        _total, last, _mem_count = get_stats()


        if last:
            last.get('status', 'IDLE')
            last.get('sovereign_id', 'N/A')
            last.get('state_snapshot', {})

            last.get('rationale', 'Observing architectural patterns...')
        else:
            pass

        if os.path.exists(ENGINE_LOG):
            os.system(f"tail -n 5 {ENGINE_LOG}")

        time.sleep(10)

if __name__ == "__main__":
    main()
