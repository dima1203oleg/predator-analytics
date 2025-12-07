#!/usr/bin/env bash

# Auto deployment script for Predator Analytics
# Checks server connectivity; if server is reachable, sync code and trigger remote deployment.
# If server is unreachable (e.g., power outage), runs local Docker Compose.

# Ensure netcat (nc) is available for server reachability checks
if ! command -v nc >/dev/null 2>&1; then
  echo "Error: 'nc' (netcat) is not installed. Please install it (e.g., brew install netcat) and retry."
  exit 1
fi

SERVER_HOST="2.tcp.eu.ngrok.io"
SERVER_PORT=19884
SSH_KEY="$HOME/.ssh/id_ed25519_ngrok"
REMOTE_USER="dima"
REMOTE_DIR="predator_v21" # Relative to $HOME in ssh command
LOCAL_DIR="$(pwd)"

# Function to check if server is reachable via SSH
function server_up() {
  echo "Checking server connectivity ($SERVER_HOST:$SERVER_PORT)..."
  ssh -q -i $SSH_KEY -p $SERVER_PORT -o ConnectTimeout=10 -o StrictHostKeyChecking=no $REMOTE_USER@$SERVER_HOST exit
  return $?
}

# Function to sync code to remote server using rsync
function sync_to_server() {
  echo "Syncing code to remote server..."
  # Create remote dir first just in case
  ssh -i $SSH_KEY -p $SERVER_PORT -o StrictHostKeyChecking=no $REMOTE_USER@$SERVER_HOST "mkdir -p $REMOTE_DIR"
  
  rsync -avz --exclude 'node_modules' --exclude '.venv' --exclude 'venv' --exclude 'dist' --exclude '.git' \
    -e "ssh -i $SSH_KEY -p $SERVER_PORT -o StrictHostKeyChecking=no" \
    "$LOCAL_DIR/" "$REMOTE_USER@$SERVER_HOST:$REMOTE_DIR/"
}

# Function to trigger remote Docker Compose deployment
function remote_deploy() {
  echo "Triggering remote deployment..."
  ssh -i $SSH_KEY -p $SERVER_PORT -o StrictHostKeyChecking=no $REMOTE_USER@$SERVER_HOST "cd $REMOTE_DIR && docker-compose up -d --build"
}

# Function to run local Docker Compose
function local_deploy() {
  echo "Running local Docker Compose..."
  docker-compose up -d --build
}

# Main logic
if server_up; then
  echo "Server is reachable. Deploying to server."
  sync_to_server && remote_deploy
else
  echo "Server not reachable. Falling back to local deployment."
  local_deploy
fi

exit 0
