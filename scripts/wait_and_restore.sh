#!/bin/bash
SERVER="predator-server"

echo "📡 SEARCHING FOR SERVER SIGNAL..."
echo "================================="

# Loop until SSH is available
while true; do
    # Try to connect silently with short timeout
    if ssh -q -o ConnectTimeout=3 -o BatchMode=yes "$SERVER" "echo 1" >/dev/null 2>&1; then
        echo " "
        echo "✅ SIGNAL ACQUIRED! SERVER IS RESPONSIVE."
        break
    else
        # Print a dot on the same line to show activity
        printf "."
        sleep 5
    fi
done

echo " "
echo "🚑 INITIATING EMERGENCY RECOVERY PROTOCOL..."

# Run the redeploy script we created earlier
if [ -f ~/Documents/Predator_21/scripts/emergency_redeploy.sh ]; then
    bash ~/Documents/Predator_21/scripts/emergency_redeploy.sh
else
    echo "⚠️ Script emergency_redeploy.sh not found. Running basic restart..."
    ssh "$SERVER" "docker restart predator-fixed-frontend ngrok"
fi
