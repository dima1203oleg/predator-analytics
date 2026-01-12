# 🔐 Security Hardening Checklist — Predator v25.0

> **Версія:** 25.0
> **Оновлено:** 10.01.2026
> **Аудит:** Required before production deployment

---

## Зміст

1. [Infrastructure Security](#1-infrastructure-security)
2. [Network Security](#2-network-security)
3. [Application Security](#3-application-security)
4. [Data Security](#4-data-security)
5. [Authentication & Authorization](#5-authentication--authorization)
6. [Container Security](#6-container-security)
7. [Secrets Management](#7-secrets-management)
8. [Monitoring & Logging](#8-monitoring--logging)
9. [Compliance](#9-compliance)

---

## 1. Infrastructure Security

### Kubernetes Cluster

- [ ] **RBAC enabled** — Role-Based Access Control active
- [ ] **Pod Security Standards** — `restricted` policy applied
- [ ] **Network Policies** — Default deny all ingress/egress
- [ ] **API Server** — Private endpoint only
- [ ] **etcd encryption** — Secrets encrypted at rest
- [ ] **Audit logging** — All API calls logged
- [ ] **Node auto-upgrade** — Security patches applied automatically

```yaml
# Pod Security Standard
apiVersion: v1
kind: Namespace
metadata:
  name: predator
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/warn: restricted
```

### Nodes

- [ ] **Minimal OS** — Container-optimized OS (COS, Bottlerocket)
- [ ] **No SSH access** — Use kubectl exec instead
- [ ] **Auto-repair enabled** — Unhealthy nodes replaced
- [ ] **Shielded VMs** — Secure boot, vTPM

---

## 2. Network Security

### External Access

- [ ] **WAF enabled** — ModSecurity/Cloud WAF
- [ ] **DDoS protection** — Cloud-native protection active
- [ ] **Rate limiting** — API rate limits configured
- [ ] **TLS 1.3 only** — Older versions disabled
- [ ] **HSTS enabled** — Strict-Transport-Security header

```nginx
# nginx.conf
ssl_protocols TLSv1.3;
ssl_prefer_server_ciphers off;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;

add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Content-Security-Policy "default-src 'self'" always;
```

### Internal Network

- [ ] **Service mesh** — mTLS between services (Istio/Linkerd)
- [ ] **Network policies** — Namespace isolation
- [ ] **Private subnets** — No public IPs on backend services
- [ ] **VPC peering** — Secure cross-network communication

```yaml
# Network Policy - Default Deny
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: predator
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
```

---

## 3. Application Security

### Code Security

- [ ] **SAST scanning** — Bandit, SonarQube in CI
- [ ] **DAST scanning** — OWASP ZAP in staging
- [ ] **Dependency scanning** — Snyk/Dependabot enabled
- [ ] **Secret scanning** — TruffleHog, GitLeaks
- [ ] **License compliance** — FOSSA/WhiteSource

### API Security

- [ ] **Input validation** — Pydantic schemas for all endpoints
- [ ] **Output encoding** — HTML/JSON encoding
- [ ] **CORS configured** — Restrictive origins
- [ ] **Rate limiting** — Per-user and per-IP limits
- [ ] **Request size limits** — Max payload size enforced

```python
# FastAPI Security Headers
from fastapi import FastAPI
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["predator.ai", "*.predator.ai"]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://predator.ai"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)
```

### Error Handling

- [ ] **No stack traces** — Generic errors in production
- [ ] **Error monitoring** — Sentry configured
- [ ] **Graceful degradation** — Fallbacks for failures

---

## 4. Data Security

### Encryption

- [ ] **At-rest encryption** — AES-256 for databases
- [ ] **In-transit encryption** — TLS 1.3 everywhere
- [ ] **PQC prepared** — Hybrid X25519+Kyber for key exchange
- [ ] **Field-level encryption** — PII encrypted separately

```python
# Field-level encryption
from cryptography.fernet import Fernet

class EncryptedField:
    def __init__(self, key: bytes):
        self.cipher = Fernet(key)

    def encrypt(self, value: str) -> bytes:
        return self.cipher.encrypt(value.encode())

    def decrypt(self, token: bytes) -> str:
        return self.cipher.decrypt(token).decode()
```

### Data Classification

| Classification | Examples | Controls |
|----------------|----------|----------|
| **Public** | Marketing content | None |
| **Internal** | System metrics | Auth required |
| **Confidential** | User data | Encryption + audit |
| **Restricted** | API keys, passwords | Vault + MFA |

### Backup Security

- [ ] **Encrypted backups** — AES-256 encrypted
- [ ] **Off-site storage** — Different region
- [ ] **Tested restoration** — Monthly tests
- [ ] **Retention policy** — Defined and enforced

---

## 5. Authentication & Authorization

### Authentication

- [ ] **MFA enabled** — Required for all users
- [ ] **Strong passwords** — Min 12 chars, complexity
- [ ] **Account lockout** — 5 failed attempts = 15 min lock
- [ ] **Session timeout** — 30 min idle timeout
- [ ] **JWT short-lived** — 15 min access tokens

```python
# JWT Configuration
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = 15
JWT_REFRESH_TOKEN_EXPIRE_DAYS = 7
JWT_ALGORITHM = "RS256"  # RSA for rotation

# Password Policy
PASSWORD_MIN_LENGTH = 12
PASSWORD_REQUIRE_UPPERCASE = True
PASSWORD_REQUIRE_LOWERCASE = True
PASSWORD_REQUIRE_DIGIT = True
PASSWORD_REQUIRE_SPECIAL = True
```

### Authorization

- [ ] **RBAC implemented** — Role-based access
- [ ] **Least privilege** — Minimal permissions default
- [ ] **Regular review** — Quarterly access reviews
- [ ] **Service accounts** — Separate from users

```yaml
# RBAC Roles
roles:
  - name: explorer
    permissions:
      - read:threats
      - read:reports
      - execute:search

  - name: operator
    permissions:
      - read:*
      - write:agents
      - execute:missions

  - name: commander
    permissions:
      - read:*
      - write:*
      - admin:users
```

---

## 6. Container Security

### Image Security

- [ ] **Base image hardening** — Distroless/Alpine
- [ ] **Non-root user** — No root in containers
- [ ] **Vulnerability scanning** — Trivy/Clair
- [ ] **Signed images** — Cosign/Notary
- [ ] **Private registry** — No public pulls

```dockerfile
# Hardened Dockerfile
FROM python:3.12-slim AS builder

# Build stage
WORKDIR /build
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# Production stage
FROM gcr.io/distroless/python3-debian12

# Non-root user
USER 65532:65532

COPY --from=builder /root/.local /home/nonroot/.local
COPY --chown=65532:65532 ./app /app

WORKDIR /app
ENV PATH=/home/nonroot/.local/bin:$PATH

CMD ["python", "main.py"]
```

### Runtime Security

- [ ] **Read-only root filesystem** — No writes to container
- [ ] **No privilege escalation** — allowPrivilegeEscalation: false
- [ ] **Drop all capabilities** — Only add what's needed
- [ ] **Seccomp profile** — RuntimeDefault or custom

```yaml
# Pod Security Context
securityContext:
  runAsNonRoot: true
  runAsUser: 65532
  fsGroup: 65532
  seccompProfile:
    type: RuntimeDefault

containers:
- name: api
  securityContext:
    allowPrivilegeEscalation: false
    readOnlyRootFilesystem: true
    capabilities:
      drop:
        - ALL
```

---

## 7. Secrets Management

### Vault Integration

- [ ] **HashiCorp Vault** — Centralized secrets
- [ ] **Dynamic secrets** — Auto-rotating DB credentials
- [ ] **Audit logging** — All access logged
- [ ] **AppRole auth** — Service authentication

```bash
# Vault setup
vault secrets enable -path=predator kv-v2
vault policy write predator-api - <<EOF
path "predator/data/*" {
  capabilities = ["read"]
}
EOF
```

### Kubernetes Secrets

- [ ] **Encrypted etcd** — Secrets encrypted at rest
- [ ] **External Secrets Operator** — Sync from Vault
- [ ] **No secrets in Git** — Use sealed-secrets if needed
- [ ] **Secret rotation** — Automated via Vault

```yaml
# External Secret
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: predator-secrets
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: vault-backend
    kind: SecretStore
  target:
    name: predator-secrets
  data:
  - secretKey: database-password
    remoteRef:
      key: predator/data/postgres
      property: password
```

---

## 8. Monitoring & Logging

### Security Monitoring

- [ ] **SIEM integration** — Logs to central SIEM
- [ ] **Anomaly detection** — ML-based detection
- [ ] **Alert thresholds** — Defined and tested
- [ ] **Incident playbooks** — Documented responses

### Audit Logging

- [ ] **Immutable logs** — Write-once storage
- [ ] **Log retention** — 1 year minimum
- [ ] **Log encryption** — At rest and in transit
- [ ] **Tamper detection** — Hash chains

```python
# Audit Log Entry
{
    "timestamp": "2026-01-10T02:45:00Z",
    "event_type": "user.login",
    "actor": {
        "user_id": "user-123",
        "ip_address": "203.0.113.50",
        "user_agent": "Mozilla/5.0..."
    },
    "action": "login_success",
    "resource": {
        "type": "session",
        "id": "session-456"
    },
    "metadata": {
        "mfa_used": true,
        "location": "Kyiv, UA"
    }
}
```

---

## 9. Compliance

### Standards

- [ ] **SOC 2 Type II** — Controls documented
- [ ] **ISO 27001** — ISMS implemented
- [ ] **GDPR** — Data protection compliant
- [ ] **PCI DSS** — If handling payments

### Documentation

- [ ] **Security policies** — Written and approved
- [ ] **Risk assessment** — Annual review
- [ ] **Incident response plan** — Tested quarterly
- [ ] **Business continuity** — DR plan tested

### Penetration Testing

- [ ] **Annual pentest** — Third-party testing
- [ ] **Bug bounty** — Program active (optional)
- [ ] **Red team exercises** — Internal testing

---

## 📋 Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Security Lead | | | |
| DevOps Lead | | | |
| CTO | | | |

---

*© 2026 Predator Analytics. Усі права захищено.*
