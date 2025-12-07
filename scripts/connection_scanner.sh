#!/bin/bash
# Connection Scanner to find working SSH endpoint

HOSTS=("5.tcp.eu.ngrok.io" "0.tcp.eu.ngrok.io")
PORTS=("14651" "14564" "11946" "22")
USERS=("dima" "root" "superuser")
KEY="$HOME/.ssh/id_ed25519_ngrok"

echo "Scanning for open SSH ports..."

for HOST in "${HOSTS[@]}"; do
  for PORT in "${PORTS[@]}"; do
    echo -n "Trying $HOST:$PORT ... "
    # Check TCP reachability first with timeout
    if nc -z -w 3 $HOST $PORT 2>/dev/null; then
        echo "OPEN! 🟢"
        
        # Try SSH login (or check auth)
        for USER in "${USERS[@]}"; do
            echo -n "  Fluxing user $USER... "
            if ssh -q -i $KEY -p $PORT -o ConnectTimeout=5 -o StrictHostKeyChecking=no -o BatchMode=yes $USER@$HOST exit 2>/dev/null; then
                echo "SUCCESS! 🚀"
                echo "FOUND WORKING CREDENTIALS:"
                echo "Host: $HOST"
                echo "Port: $PORT"
                echo "User: $USER"
                
                # Update auto_deploy.sh automatically
                sed -i '' "s/SERVER_HOST=\".*\"/SERVER_HOST=\"$HOST\"/" auto_deploy.sh
                sed -i '' "s/SERVER_PORT=.*/SERVER_PORT=$PORT/" auto_deploy.sh
                sed -i '' "s/REMOTE_USER=\".*\"/REMOTE_USER=\"$USER\"/" auto_deploy.sh
                
                echo "Updated auto_deploy.sh. Starting deploy..."
                ./auto_deploy.sh
                exit 0
            else
                RET=$?
                if [ $RET -ne 255 ]; then
                    # 255 is connection error, other codes might mean auth failure (which means port is open ssh)
                    echo "Auth Failed (Port Open)"
                else
                     echo "Failed"
                fi
            fi
        done
    else
        echo "Closed"
    fi
  done
done

echo "Scan complete. No working connection found."
exit 1
