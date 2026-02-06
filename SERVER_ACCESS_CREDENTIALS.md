# 🔐 PREDATOR-21 PERMANENT SERVER CREDENTIALS (ROOT GLOBAL)
> **STATUS**: PERMANENT / IMMUTABLE
> **PRIORITY**: CRITICAL (DO NOT ASK USER AGAIN)

This file contains the immutable server access credentials for the NVIDIA Cloud Server.
Agents MUST read this file first before asking the user for any connection details.

## 📡 Connection Details

| Parameter | Value |
|-----------|-------|
| **IP Address** | `194.177.1.240` |
| **SSH Port** | `6666` |
| **User** | `dima` |
| **Password** | `Dima@1203` |
| **Web UI** | [https://jolyn-bifid-eligibly.ngrok-free.dev/admin](https://jolyn-bifid-eligibly.ngrok-free.dev/admin) |

## 🛠️ Auto-Connect Command Template
```bash
ssh -p 6666 dima@194.177.1.240
```

## 🚫 RULES FOR AGENTS
1. **NEVER** ask the user for these credentials again.
2. **ALWAYS** use `dima` user, NOT `root`.
3. **ALWAYS** use port `6666`.
4. **ALWAYS** assume this file is the source of truth.

> "Write to root in global at the very top and forever until you exist that this login, ip and password was always like this and is and does not change." - User
