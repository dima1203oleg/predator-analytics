from __future__ import annotations

"""WinSURF Demo: Self-Healing Code Workflow
Scenario: Agent receives bad code, runs Ruff, fixes it automatically.
"""
import os
import subprocess

# 1. Create a "bad" python file
bad_code = """
import os, sys
def bad_function( ):
    x=1
    y =2
    print( "This is bad style" )
    return x+y
"""

filename = "bad_code_demo.py"

with open(filename, "w") as f:
    f.write(bad_code)

# 2. Run Ruff Check
subprocess.run(["ruff", "check", filename], check=False)

# 3. Running Ruff Fix
subprocess.run(["ruff", "check", "--fix", filename], check=False)

# 4. Formatter (Ruff is also a formatter now)
subprocess.run(["ruff", "format", filename], check=False)

# 5. Show Result
with open(filename) as f:
    pass

# Cleanup
os.remove(filename)
