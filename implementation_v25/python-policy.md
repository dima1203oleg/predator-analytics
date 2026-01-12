# Predator Analytics Python Policy (v25 Law)

## 1. Version Standard
> **STRICT REQUIREMENT**: All Python services, agents, scripts, and runtime environments MUST use **Python 3.12**.

No exceptions. Legacy code using 3.10/3.11 must be upgraded immediately upon discovery.

## 2. Docker Containers
- **Base Image**: `python:3.12-slim-bookworm` is the standard base.
- **Distroless**: Only legally allowed if verifyable as Python 3.12 based. If in doubt, use `python:3.12-slim-bookworm`.
- **Prohibited**: Alpine linux for Python (due to wheel build issues), Python 3.11 and below.

## 3. DevOps & CI/CD
- **GitHub Actions**: Always set `python-version: '3.12'`.
- **Ruff Linter**: Configure `--target-version=py312`.

## 4. Development
- Developers must have Python 3.12 installed locally.
- Use `uv` or `poetry` managed environments targeting 3.12.

---
*Signed: Predator Architecture Team*
