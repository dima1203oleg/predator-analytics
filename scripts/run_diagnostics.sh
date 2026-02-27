
#!/bin/bash
# PREDATOR V45.1 - SYSTEM DIAGNOSTICS (Self-Healing v4 - Bootstrap)

echo "🩺 Initiating System Diagnostics..."

VENV_DIR=".predator_dev"

# 1. Setup Venv without system pip
echo "⚙️  Creating env ($VENV_DIR)..."
if [ -d "$VENV_DIR" ]; then
    rm -rf "$VENV_DIR"
fi
python3 -m venv --without-pip "$VENV_DIR"
source "$VENV_DIR/bin/activate"

# 2. Bootstrap Pip (Bypass broken ensurepip)
echo "📥 Bootstrapping pip..."
curl -sS https://bootstrap.pypa.io/get-pip.py -o get-pip.py
python get-pip.py > /dev/null 2>&1
rm get-pip.py

# 3. Install
echo "📦 Installing Dependencies..."
pip install -r requirements.txt > /dev/null 2>&1

# 4. Tests
echo "🧪 Running Tests..."
export PYTHONPATH=$PYTHONPATH:.
python -m pytest tests/unit tests/e2e -v

echo " "
echo "✅ DIAGNOSTICS COMPLETE"
