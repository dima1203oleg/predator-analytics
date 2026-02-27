---
description: System-wide Python Architecture Policy
---
# ⚜️ ETERNAL GLOBAL DIRECTIVE: PYTHON ARCHITECTURE (v45.0)

**STATUS: MANDATORY | IMMUTABLE | GLOBAL**

This project is strictly and eternally locked to **Python 3.12**.

## Rules (Non-Negotiable)
1. **Docker Images**: All service Dockerfiles MUST use `python:3.12-slim`. No exceptions for 3.11, 3.13, or 3.14.
2. **Local Development**: The root `.python-version` file is the source of truth.
3. **Linting & Types**:
   - Ruff `target-version` must be `py312`.
   - Mypy `python_version` must be `3.12`.
4. **CI/CD**: All build pipelines are hard-coded to 3.12.
5. **Future Agents**: Any AI agent modifying this project MUST check this policy first.

## Eternal Enforcement
This policy is embedded into the `/full_auto` and `/turbo_mode` workflows.
To verify the system-wide version, run:
```bash
grep -r "3.12" . --include="Dockerfile*" --include="pyproject.toml"
```
