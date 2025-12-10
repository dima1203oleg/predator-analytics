import re
import os
import subprocess
import sys

LOG_FILE = "telegram_bot.log"
ADD_SCRIPT = "./scripts/add-nvidia-cluster.sh"

def get_last_ssh_config(log_file):
    if not os.path.exists(log_file):
        print(f"Error: {log_file} not found")
        return None

    # Read last 1000 lines
    try:
        lines = subprocess.check_output(["tail", "-n", "1000", log_file]).decode("utf-8").splitlines()
    except Exception as e:
        print(f"Error reading log: {e}")
        return None

    # Look for SSH Config pattern from bottom up
    # Pattern: HostName <host> ... Port <port> ... User <user>
    config = {}
    
    # Reverse iterate to find the latest
    capture = False
    ssh_block = []
    
    for line in reversed(lines):
        if "SSH Config" in line:
            capture = True
            # We found the header, now process the block we collected (which is in reverse order)
            # But the block is actually *after* this line in the log.
            # So simpler approach: Join all lines, find last occurrence
            break
            
    # Regex approach on full text is safer
    full_text = "\n".join(lines)
    
    # Find last occurrence of HostName ...
    # This regex is a bit loose to catch variations
    matches = list(re.finditer(r"HostName\s+([a-zA-Z0-9.-]+)", full_text))
    if not matches:
        return None
        
    last_hostname = matches[-1].group(1)
    
    # Find Port near this HostName
    # We search in the text AFTER the last HostName match index - 50 chars (to be safe)
    start_idx = matches[-1].start()
    snippet = full_text[start_idx:]
    
    port_match = re.search(r"Port\s+(\d+)", snippet)
    user_match = re.search(r"User\s+(\w+)", snippet)
    
    port = port_match.group(1) if port_match else "22"
    user = user_match.group(1) if user_match else "root"
    
    return {
        "host": last_hostname,
        "port": port,
        "user": user
    }

def main():
    config = get_last_ssh_config(LOG_FILE)
    if not config:
        print("❌ No SSH config found in logs")
        sys.exit(1)
        
    print(f"🔍 Found SSH Config:")
    print(f"   Host: {config['host']}")
    print(f"   Port: {config['port']}")
    print(f"   User: {config['user']}")
    
    # Run the add script
    cmd = [ADD_SCRIPT, config['port'], config['host'], config['user']]
    print(f"🚀 Running: {' '.join(cmd)}")
    
    try:
        subprocess.check_call(cmd)
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to add cluster: {e}")
        sys.exit(e.returncode)

if __name__ == "__main__":
    main()
