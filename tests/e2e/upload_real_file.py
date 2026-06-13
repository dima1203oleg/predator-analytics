import os
import sys
import json
import ssl
import time
import urllib.request
import urllib.error
import urllib.parse
from uuid import uuid4

API_URL = os.getenv("API_URL", "https://194.177.1.240:8000")

def run_e2e_audit(file_path):
    if not os.path.exists(file_path):
        print(f"Помилка: Файл {file_path} не знайдено.")
        return

    print(f"--- Запуск E2E аудиту для файлу: {file_path} ---")
    
    url = f"{API_URL}/api/v1/system/e2e-audit/start"
    boundary = uuid4().hex
    
    with open(file_path, "rb") as f:
        file_content = f.read()
    
    filename = os.path.basename(file_path)
    content_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    
    # Створюємо multipart/form-data payload
    data = []
    data.append(f"--{boundary}".encode('utf-8'))
    data.append(f"Content-Disposition: form-data; name=\"file\"; filename=\"{filename}\"".encode('utf-8'))
    data.append(f"Content-Type: {content_type}".encode('utf-8'))
    data.append(b"")
    data.append(file_content)
    data.append(f"--{boundary}--".encode('utf-8'))
    data.append(b"")
    
    body = b"\r\n".join(data)
    
    headers = {
        "Content-Type": f"multipart/form-data; boundary={boundary}",
        "Content-Length": str(len(body)),
        "Authorization": "Bearer mock-token"
    }
    
    req = urllib.request.Request(url, data=body, headers=headers, method="POST")
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    
    try:
        print(f"Відправка POST запиту до {url}... (Розмір файлу: {len(file_content)} байт)")
        with urllib.request.urlopen(req, context=ctx) as response:
            status_code = response.getcode()
            response_data = response.read().decode('utf-8')
            print(f"Статус відповіді: {status_code}")
            
            if status_code in (200, 202):
                data_json = json.loads(response_data)
                audit_id = data_json.get("audit_id")
                print(f"Аудит успішно запущено. Audit ID: {audit_id}")
                
                print("Очікування завершення аудиту... Це може зайняти до 15 хвилин.")
                # Polling
                while True:
                    time.sleep(10)
                    prog_url = f"{API_URL}/api/v1/system/e2e-audit/status/{audit_id}"
                    prog_req = urllib.request.Request(prog_url, headers={"Authorization": "Bearer mock-token"})
                    try:
                        with urllib.request.urlopen(prog_req, context=ctx) as p_res:
                            p_data = json.loads(p_res.read().decode('utf-8'))
                            status = p_data.get("status")
                            print(f"[{time.strftime('%X')}] Статус аудиту: {status}")
                            if status in ["completed", "error"]:
                                print("\n--- РЕЗУЛЬТАТ АУДИТУ ---")
                                print(json.dumps(p_data, indent=2, ensure_ascii=False))
                                break
                    except urllib.error.HTTPError as pe:
                        print(f"Помилка статусу: {pe.code} {pe.reason}")
                        # Іноді може бути таймаут, просто продовжуємо
            else:
                print(f"Помилка {status_code}: {response_data}")
                
    except urllib.error.HTTPError as e:
        print(f"HTTP Error: {e.code} {e.reason}")
        print(e.read().decode('utf-8'))
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    file_path = "/Users/dima1203/Desktop/Березень_2024_rebuilt.xlsx"
    if len(sys.argv) > 1:
        file_path = sys.argv[1]
    run_e2e_audit(file_path)
