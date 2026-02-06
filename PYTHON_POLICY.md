# 🐍 PREDATOR PYTHON ARCHITECTURE POLICY (2026.1)

## 1. Unified Versioning

The official and only supported Python version for Predator Analytics is **Python 3.12.x**.

## 2. Standardization Rules

- **Runtime**: All local and production environments must target 3.12 features (e.g., improved generic types, f-string improvements).
- **Tooling**:
  - Linter: **Ruff** (configured for py312)
  - Formatter: **Ruff Format**
  - Type Checking: **Pyrefly** (targeting standard 3.12 types)
- **Virtual Environments**: Always named `.venv` at the root of each service.

## 3. Migration Roadmap

- [x] Update `.python-version` to 3.12
- [x] Configure `ruff.toml` for `target-version = "py312"`
- [x] Configure `pyrefly.toml` for `python_version = "3.12"`
- [ ] Migrate all production containers to `python:3.12-slim-bookworm`

## 4. NO EXCEPTIONS POLICY

There are NO exceptions to this rule. Systems with Python versions other than 3.12 must be upgraded. All temporary workspaces and virtual environments using 3.9, 3.10, or 3.11 must be destroyed and recreated with 3.12.

**Staged scripts using older versions are flagged as NON-CONSTITUTIONAL and must be updated immediately.**

---

### STRICT ADHERENCE REQUIRED BY ALL AGENTS (AZR, CORTEX, ANTIGRAVITY)
