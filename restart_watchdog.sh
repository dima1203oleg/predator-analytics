#!/bin/bash

# Kill any existing predator-watchdog-daemon process
pkill -f predator-watchdog-daemon

# Start the predator-watchdog-daemon in the background
nohup bash /Users/Shared/Predator_60/scripts/predator-watchdog-daemon.sh > /Users/Shared/Predator_60/logs/watchdog.log 2>&1 &

# Confirm process restart
echo "predator-watchdog-daemon restarted"