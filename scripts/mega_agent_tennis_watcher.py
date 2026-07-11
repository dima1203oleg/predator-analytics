import time
import os
import sys

CHANNEL_FILE = "/Users/Shared/Predator_60/agent_tennis_channel.md"
print(f"🏓 Mega Agent Tennis Watcher started. Monitoring {CHANNEL_FILE}...")
sys.stdout.flush()

last_mtime = 0

while True:
    try:
        if os.path.exists(CHANNEL_FILE):
            current_mtime = os.path.getmtime(CHANNEL_FILE)
            if current_mtime > last_mtime:
                with open(CHANNEL_FILE, "r") as f:
                    content = f.read()
                
                # Check if the last action required is directed at Mega Agent
                # by checking if "Наступні кроки: Mega Agent" is in the last 500 characters
                tail = content[-1000:]
                if "**Наступні кроки:** Mega Agent" in tail or "[ДО: Mega Agent]" in tail:
                    print("\n🔔 [TENNIS PING] Отримано нове повідомлення від KLAV-Agent/Monitor! Твоя черга відповідати.")
                    sys.stdout.flush()
                
                last_mtime = current_mtime
    except Exception as e:
        pass
    time.sleep(3)
