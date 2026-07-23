import requests

url = "http://localhost:8000/api/v1/osint/scan/start"
payload = {
  "entity_id": "3111724753",
  "entity_type": "person",
  "name": "Кізима Дмитро Миколайович"
}
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiMDAwMDAwMC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDEiLCJyb2xlIjoidmlwIiwidGVuYW50X2lkIjoiYTAwMDAwMDAtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAxIiwiZXhwIjoxODE2MzE5NzQ5fQ.4qkw97Q-a38TluMWNzt_vJcyUs8tllNGqc44rOPO-NI"
}

try:
    response = requests.post(url, json=payload, headers=headers)
    print("Status:", response.status_code)
    print("Response:", response.text)
except Exception as e:
    print("Error:", e)
