import re

def fix_file(path, func):
    with open(path, 'r') as f:
        content = f.read()
    new_content = func(content)
    if new_content != content:
        with open(path, 'w') as f:
            f.write(new_content)
        print(f"Fixed {path}")

# security.py
def fix_security(c):
    c = re.sub(r'except PyJWTError:\n\s+raise credentials_exception', 'except PyJWTError as e:\n        raise credentials_exception from e', c)
    c = re.sub(r'except Exception as e:\n\s+logger\.error\(f"Error parsing token payload: \{e\}"\)\n\s+raise credentials_exception', 'except Exception as e:\n        logger.error(f"Error parsing token payload: {e}")\n        raise credentials_exception from e', c)
    return c
fix_file('/Users/dima-mac/Documents/Predator_21/services/core-api/app/core/security.py', fix_security)

# main.py
def fix_main(c):
    c = c.replace('from contextlib import asynccontextmanager\nfrom typing import Any', 'from contextlib import asynccontextmanager\nfrom typing import Any')
    if 'from typing import Any' not in c:
        c = c.replace('from contextlib import asynccontextmanager', 'from contextlib import asynccontextmanager\nfrom typing import Any')
    # Move cors middleware import
    c = c.replace('from app.core.cors import add_cors_middleware\n\ncors_origins = add_cors_middleware(app)', 'cors_origins = add_cors_middleware(app)')
    if 'add_cors_middleware' not in c.split('from app.api.v2.router import api_v2_router')[0]:
        c = c.replace('from app.api.v2.router import api_v2_router', 'from app.api.v2.router import api_v2_router\nfrom app.core.cors import add_cors_middleware')
    return c
fix_file('/Users/dima-mac/Documents/Predator_21/services/core-api/app/main.py', fix_main)

# auth.py
def fix_auth(c):
    c = c.replace('token_type: str = "bearer"', 'token_type: str = "bearer"  # noqa: S105, S106')
    c = c.replace('token_type="bearer",', 'token_type="bearer",  # noqa: S105, S106')
    c = c.replace('token_type="bearer"', 'token_type="bearer"  # noqa: S105, S106')
    return c
fix_file('/Users/dima-mac/Documents/Predator_21/services/core-api/app/routers/auth.py', fix_auth)

# warroom.py
def fix_warroom(c):
    return re.sub(r'except Exception as e:\n\s+raise HTTPException\(status_code=500, detail=f"Attack plan generation failed: \{e!s\}"\)', 'except Exception as e:\n        raise HTTPException(status_code=500, detail=f"Attack plan generation failed: {e!s}") from e', c)
fix_file('/Users/dima-mac/Documents/Predator_21/services/core-api/app/routers/warroom.py', fix_warroom)

# risk.py
def fix_risk(c):
    if 'timezone' not in c:
        c = c.replace('from datetime import datetime', 'from datetime import datetime, timezone')
    c = c.replace('datetime.utcnow()', 'datetime.now(timezone.utc)')
    return c
fix_file('/Users/dima-mac/Documents/Predator_21/services/core-api/app/routers/risk.py', fix_risk)

# aml_scoring.py
def fix_aml(c):
    if 'ClassVar' not in c:
        c = c.replace('from typing import Any', 'from typing import Any, ClassVar')
    c = c.replace('RISK_WEIGHTS = {', 'RISK_WEIGHTS: ClassVar[dict[RiskCategory, int]] = {')
    if 'timezone' not in c:
        c = c.replace('from datetime import datetime', 'from datetime import datetime, timezone')
    c = c.replace('datetime.now().year', 'datetime.now(timezone.utc).year')
    return c
fix_file('/Users/dima-mac/Documents/Predator_21/services/core-api/app/services/aml_scoring.py', fix_aml)

# maritime_aviation.py
def fix_maritime(c):
    if 'timezone' not in c:
        c = c.replace('from datetime import datetime', 'from datetime import datetime, timezone')
    c = c.replace('datetime.strptime(eta_str, "%Y-%m-%dT%H:%M:%S")', 'datetime.strptime(eta_str, "%Y-%m-%dT%H:%M:%S").replace(tzinfo=timezone.utc)')
    c = c.replace('datetime(2026, 3, 1, 10, 0)', 'datetime(2026, 3, 1, 10, 0, tzinfo=timezone.utc)')
    c = c.replace('datetime(2026, 3, 3, 14, 0)', 'datetime(2026, 3, 3, 14, 0, tzinfo=timezone.utc)')
    c = c.replace('datetime(2026, 2, 25, 8, 0)', 'datetime(2026, 2, 25, 8, 0, tzinfo=timezone.utc)')
    c = c.replace('datetime(2026, 2, 27, 16, 0)', 'datetime(2026, 2, 27, 16, 0, tzinfo=timezone.utc)')
    return c
fix_file('/Users/dima-mac/Documents/Predator_21/services/core-api/app/services/maritime_aviation.py', fix_maritime)

# ukraine_registries.py
def fix_ukraine(c):
    if 'timezone' not in c:
        c = c.replace('from datetime import date', 'from datetime import date, datetime, timezone')
    c = c.replace('date.today()', 'datetime.now(timezone.utc).date()')
    return c
fix_file('/Users/dima-mac/Documents/Predator_21/services/core-api/app/services/ukraine_registries.py', fix_ukraine)

print("done")
