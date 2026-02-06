#!/bin/bash
# 🏛️ AZR SOVEREIGN SERVICE INSTALLER
# Installs AZR as a persistent LaunchAgent on macOS
# =================================================

set -e

PLIST_NAME="com.predator.azr.plist"
PLIST_PATH="$HOME/Library/LaunchAgents/$PLIST_NAME"
PROJECT_ROOT="/Users/dima-mac/Documents/Predator_21"
PYTHON_EXEC="/usr/local/bin/python3.12" # Assuming this path, otherwise will find it
SCRIPT_PATH="$PROJECT_ROOT/scripts/start_azr_unified.py"
LOG_PATH="$HOME/Library/Logs/predator_azr.log"
ERR_PATH="$HOME/Library/Logs/predator_azr_error.log"

# Find python
if command -v python3.12 &> /dev/null; then
    PYTHON_EXEC=$(command -v python3.12)
elif command -v python3 &> /dev/null; then
    PYTHON_EXEC=$(command -v python3)
else
    echo "❌ Python 3 not found!"
    exit 1
fi

echo "🔍 Found Python at: $PYTHON_EXEC"
echo "📂 Project Root: $PROJECT_ROOT"

# Ensure log dir exists (User Library Logs should always exist)
# mkdir -p "$PROJECT_ROOT/logs"

# Create Plist
cat > "$PLIST_PATH" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.predator.azr</string>
    <key>ProgramArguments</key>
    <array>
        <string>$PYTHON_EXEC</string>
        <string>$SCRIPT_PATH</string>
        <string>--hours</string>
        <string>24000</string> <!-- Run effectively forever -->
        <string>--aggressive</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$PROJECT_ROOT</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PYTHONPATH</key>
        <string>$PROJECT_ROOT</string>
        <key>SOVEREIGN_AUTO_APPROVE</key>
        <string>true</string>
    </dict>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <dict>
        <key>SuccessfulExit</key>
        <false/>
        <key>Crashed</key>
        <true/>
    </dict>
    <key>StandardOutPath</key>
    <string>$LOG_PATH</string>
    <key>StandardErrorPath</key>
    <string>$ERR_PATH</string>
</dict>
</plist>
EOF

echo "✅ Created LaunchAgent at: $PLIST_PATH"

# Load Service
# Unload if exists
launchctl unload "$PLIST_PATH" 2>/dev/null || true

# Load
launchctl load "$PLIST_PATH"

echo "🚀 AZR Service Installed & Started!"
echo "   It will now survive reboots and crashes."
echo "   Check logs at: tail -f $LOG_PATH"
