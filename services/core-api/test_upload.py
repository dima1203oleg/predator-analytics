import requests

TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsInRlbmFudF9pZCI6InJvb3QiLCJyb2xlIjoiYWRtaW4iLCJzY29wZXMiOiJyZWFkOmNvcnBfZGF0YSB3cml0ZTpjb3JwX2RhdGEiLCJwZXJtaXNzaW9ucyI6WyJyZWFkOmNvcnBfZGF0YSJdLCJleHAiOjE3ODM2MDQ1NjN9.Hq7aV2y9s-1uT7jQG4o2h9oZ6N1Vv5p6N4o7t0Xw"

import jwt
import time
payload = {
    "sub": "admin",
    "tenant_id": "root",
    "role": "admin",
    "scopes": "read:corp_data write:corp_data",
    "permissions": ["read:corp_data", "write:corp_data"],
    "exp": int(time.time()) + 3600
}
token = jwt.encode(payload, "R8IUEmwSJQ7dkeVSxhNOhqUN55GTdhYypY0q21hKN5YSdYVMKFim2AUdTuaaLvCkTy1MaV5baMtXZhgVabMTgw", algorithm="HS256")

print("Sending request to https://194.177.1.240:8000...")
try:
    with open("/Users/dima1203/Desktop/Березень_2024_repacked.xlsx", "rb") as f:
        res = requests.post(
            "https://194.177.1.240:8000/api/v1/ingestion/upload",
            headers={"Authorization": f"Bearer {token}"},
            files={"file": ("Березень_2024.xlsx", f, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
            data={"dataset_name": "TestDataset"},
            verify=False
        )
    print("STATUS:", res.status_code)
    print("TEXT:", res.text)
except Exception as e:
    print(e)
