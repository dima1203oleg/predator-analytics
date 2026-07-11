import sys
import jwt
from datetime import datetime, timedelta, UTC

secret_key = "REQUIRED_IN_PRODUCTION"
payload = {
    "sub": "b0000000-0000-0000-0000-000000000001",
    "role": "vip",
    "tenant_id": "a0000000-0000-0000-0000-000000000001",
    "exp": int((datetime.now(UTC) + timedelta(days=365)).timestamp())
}
token = jwt.encode(payload, secret_key, algorithm="HS256")
print(token)
