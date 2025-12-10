# Policy Engine — Predator Analytics (v22)

This is a minimal stub for the Policy Engine — a small service that takes `signal + context` and returns `allow/deny + plan` decisions.

Usage (development):

- Start the service: `uvicorn policy:app --reload --port 8100`
- POST /decide with JSON payload {"signal": {..}, "context": {..} }

This code is a starting point: implement policy rules, audit logs, RBAC, and make it highly available.
