
#!/bin/bash
# 💀 PREDATOR SHADOW OPERATOR - GOD MODE LAUNCHER
# Fixes PEP 668 and provides raw CLI access.

VENV_DIR=".shadow_env_fixed"

# 1. Environment Guard
if [ ! -d "$VENV_DIR" ]; then
    echo "📦 Initializing Shadow Environment (Hardened)..."
    python3 -m venv "$VENV_DIR" --without-pip
    source "$VENV_DIR/bin/activate"
    curl -sS https://bootstrap.pypa.io/get-pip.py | python3
else
    source "$VENV_DIR/bin/activate"
fi

# 3. Dependency Check (Silent)
pip install google-generativeai python-dotenv > /dev/null 2>&1

# 4. Executor Launch
echo "🚀 SHADOW OPERATOR ACTIVE (Bypassing UI...)"
python3 shadow_runner.py "$@"
