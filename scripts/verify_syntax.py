
"""
Script: verify_syntax.py (In-Memory)
Purpose: Statically verify that all Python files in the project are valid.
Uses in-memory compilation to avoid 'Operation not permitted' on __pycache__.
"""
import os
import sys

def verify_codebase(root_dir="."):
    echo_errors = []
    count = 0
    passed = 0
    
    print(f"🔍 Scanning codebase at {root_dir} (In-Memory)...")
    
    for root, dirs, files in os.walk(root_dir):
        # Skip noisy dirs
        if any(x in root for x in [".venv", ".git", "__pycache__", "node_modules", ".predator_dev", "site-packages", "libs"]):
            continue
            
        for file in files:
            if file.endswith(".py"):
                count += 1
                path = os.path.join(root, file)
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        source = f.read()
                    
                    # Compile in memory. If invalid, raises SyntaxError
                    compile(source, path, 'exec')
                    passed += 1
                except SyntaxError as e:
                    echo_errors.append(f"❌ Syntax Error in {path}: line {e.lineno} - {e.msg}")
                except Exception as e:
                    echo_errors.append(f"⚠️  Read Error {path}: {e}")

    print(f"Stats: Checked {count} files. {passed} passed. {len(echo_errors)} failed.")
    
    if echo_errors:
        for err in echo_errors:
            print(err)
        sys.exit(1)
    else:
        print("✅ ALL PYTHON FILES VALID.")
        sys.exit(0)

if __name__ == "__main__":
    verify_codebase(os.getcwd())
