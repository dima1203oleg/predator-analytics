import schedule
import time
from etl.mitre_etl import run_mitre_etl

def run_daily_mitre():
    print("🚀 Запуск MITRE/CVE sync...")
    run_mitre_etl()

schedule.every().day.at("10:00").do(run_daily_mitre)

print("⏰ MITRE Scheduler запущений...")
if __name__ == "__main__":
    while True:
        schedule.run_pending()
        time.sleep(60)
