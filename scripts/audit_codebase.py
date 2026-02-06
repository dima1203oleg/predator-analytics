from __future__ import annotations

import os
import re


def analyze_codebase(root_dir):
    report = []

    # Files to check
    # 1. Backend: app/**/*.py
    # 2. Frontend: src/**/*.{ts,tsx}

    frontend_dir = os.path.join(root_dir, "apps/frontend/src")
    backend_dir = os.path.join(root_dir, "apps/backend/app")

    report.append(f"# Analysis of {root_dir}\n")

    # --- Backend Analysis ---
    report.append("## Backend (Python) Analysis\n")
    for root, _dirs, files in os.walk(backend_dir):
        for file in files:
            if file.endswith(".py"):
                path = os.path.join(root, file)
                with open(path) as f:
                    content = f.read()

                    # Check for generic exceptions
                    if "except Exception:" in content or "except Exception as e:" in content:
                        report.append(f"- [DEBUG] {file}: Uses generic Exception catch. Consider specific error types.")

                    # Check for print statements (should use logging)
                    if "print(" in content and not file.startswith("test_") and "scripts" not in root:
                        report.append(f"- [STYLE] {file}: Contains 'print()'. Should use logger.")

                    # Check for potential sync block in async
                    if "async def" in content and "time.sleep(" in content:
                        report.append(f"- [PERF] {file}: 'time.sleep' in async function. Use 'await asyncio.sleep'.")

    # --- Frontend Analysis ---
    report.append("\n## Frontend (TypeScript/React) Analysis\n")
    for root, _dirs, files in os.walk(frontend_dir):
        for file in files:
            if file.endswith((".ts", ".tsx")):
                path = os.path.join(root, file)
                with open(path) as f:
                    content = f.read()

                    # Check for 'any' types
                    any_count = len(re.findall(r": any", content))
                    if any_count > 5:
                        report.append(f"- [TYPE] {file}: High usage of 'any' ({any_count} times). Reduce for better safety.")

                    # Check for console.logs
                    if "console.log(" in content:
                         report.append(f"- [CLEANUP] {file}: Contains 'console.log()'.")

                    # Check for missing framer-motion in views
                    if "View.tsx" in file and "framer-motion" not in content:
                        report.append(f"- [UX] {file}: Missing 'framer-motion'. Add animations for better look.")

    return "\n".join(report)

if __name__ == "__main__":
    result = analyze_codebase("/Users/dima-mac/Documents/Predator_21")
    print(result)
