# Security Notes

## Infrastructure Security

- **SSH Hardening**: Password authentication and challenge-response authentication are disabled in the bootstrap process. Only SSH keys are allowed.
- **RBAC**: Kubernetes resources are protected by namespace-scoped Roles. Developers can only manage resources within their own `dev-username` namespace.
- **Network Policies**:
  - `deny-all` by default.
  - `allow-dns` for external resolution.
  - `allow-api-server` for internal cluster communication.
- **Resource Quotas**: Each user is limited to 1 GPU, 8 CPUs, and 16Gi RAM to prevent resource exhaustion.
- **Container Isolation**:
  - `allowPrivilegeEscalation: false`.
  - `runAsUser: 1000`.
  - Host paths are restricted to managed directories (`/opt/dev` and `/var/run/docker.sock`).
