#!/bin/bash
# DEEP SCANNER
KEY="$HOME/.ssh/id_ed25519_ngrok"
USER="dima"

# Range of ngrok EU hosts
HOSTS=("0.tcp.eu.ngrok.io" "1.tcp.eu.ngrok.io" "2.tcp.eu.ngrok.io" "3.tcp.eu.ngrok.io" "4.tcp.eu.ngrok.io" "5.tcp.eu.ngrok.io" "6.tcp.eu.ngrok.io" "7.tcp.eu.ngrok.io" "8.tcp.eu.ngrok.io")
# Common ports seen in logs + verify previous ones
PORTS=("19884" "14564" "14651" "11946" "22")

echo "🕵️ Starting Deep Scan..."

for HOST in "${HOSTS[@]}"; do
    for PORT in "${PORTS[@]}"; do
        # Fast TCP check (0.5s timeout) to scan quickly
        if nc -z -w 1 $HOST $PORT 2>/dev/null; then
            echo "🟢 OPEN: $HOST:$PORT"
            
            # Try SSH Auth
            echo "   🔑 Testing SSH..."
            if ssh -q -i $KEY -p $PORT -o ConnectTimeout=3 -o StrictHostKeyChecking=no -o BatchMode=yes $USER@$HOST exit 2>/dev/null; then
                 echo "   🎉 SUCCESS! SSH Working!"
                 echo "   HOST=$HOST"
                 echo "   PORT=$PORT"
                 
                 # Save for other scripts
                 echo "export SERVER_HOST=$HOST" > .server_config
                 echo "export SERVER_PORT=$PORT" >> .server_config
                 exit 0
            else
                 RET=$?
                 echo "   ❌ SSH Check Failed (Code: $RET)"
            fi
        fi
    done
done

echo "💀 Scan Complete. No working SSH found."
exit 1
