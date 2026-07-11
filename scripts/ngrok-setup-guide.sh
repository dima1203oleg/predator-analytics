#!/bin/bash
# 🔗 NGROK Setup Guide for NVIDIA Server Access
# Since we can't connect directly due to firewall, we have several options

echo "🔗 NGROK NVIDIA Server Access Solutions"
echo "════════════════════════════════════════════════════════"
echo ""

# Check if ngrok is available
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok is not installed"
    echo "Install with: brew install ngrok/ngrok/ngrok"
    exit 1
fi

echo "✅ ngrok is available: $(ngrok version)"
echo ""

# === OPTION 1: Bastion Host Approach ===
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "OPTION 1: Use Bastion/Jump Host with ngrok (MOST FLEXIBLE)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "If you have a server that CAN reach 194.177.1.240:"
echo ""
echo "Step 1: On the accessible server, start ngrok tunnel:"
echo "  ssh bastion-host"
echo "  ngrok tcp 194.177.1.240:6666"
echo ""
echo "Step 2: Copy the public URL (e.g., tcp://XX.ngrok.io:12345)"
echo ""
echo "Step 3: On your Mac, connect to the public URL:"
echo "  ssh -p 12345 dima@XX.ngrok.io"
echo ""

# === OPTION 2: Direct ngrok Authtoken ===
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "OPTION 2: Use ngrok Agent from NVIDIA Server (RECOMMENDED)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "If you CAN SSH to 194.177.1.240 via other means:"
echo ""
echo "Step 1: SSH into NVIDIA server (via different method)"
echo "  # e.g., AWS Systems Manager, Cloud Console, etc."
echo ""
echo "Step 2: On the NVIDIA server, start ngrok agent:"
echo "  ngrok authtoken <YOUR_NGROK_TOKEN>"
echo "  ngrok tcp localhost:6666"
echo ""
echo "Step 3: Share the public URL back to Mac"
echo ""
echo "Step 4: Connect locally:"
echo "  ssh -p <PORT> dima@<PUBLIC_HOST>"
echo ""

# === OPTION 3: Local Mock Setup ===
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "OPTION 3: Create Local Mock Environment (FOR TESTING)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Run Docker containers locally to simulate NVIDIA server:"
echo ""
echo "  docker-compose up -d"
echo ""
echo "Then connect to localhost services instead of 194.177.1.240"
echo ""

# === OPTION 4: VPN Alternative ===
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "OPTION 4: Request VPN Access (CORPORATE BEST PRACTICE)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Contact admin with:"
echo "  - Your IP: 185.130.54.65"
echo "  - Required access: SSH to 194.177.1.240:6666"
echo "  - User: dima"
echo ""
echo "Once connected to VPN:"
echo "  ssh predator-server whoami"
echo ""

echo "════════════════════════════════════════════════════════"
echo ""
echo "📝 NEXT STEPS:"
echo ""
echo "1. Determine which option applies to your situation"
echo "2. Check what access methods you currently have"
echo "3. Execute the appropriate option"
echo ""
echo "🔐 Current ngrok Config:"
ngrok config check
echo ""
