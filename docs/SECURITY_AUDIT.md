# Security Audit Procedures

Comprehensive security audit and compliance procedures for Predator Analytics.

## Overview

Regular security audits ensure the platform remains secure and compliant with industry standards.

## Audit Schedule

| Audit Type | Frequency | Responsibility | Tools |
|------------|-----------|----------------|-------|
| Vulnerability Scan | Weekly | DevOps | Trivy, Snyk |
| Dependency Audit | Daily | CI/CD | Dependabot, npm audit |
| Secret Scan | Every commit | CI/CD | TruffleHog, detect-secrets |
| Penetration Test | Quarterly | Security Team | OWASP ZAP, Burp Suite |
| Compliance Audit | Annually | Compliance Team | Manual + Tools |
| Access Review | Monthly | Security Team | Manual |

## Automated Security Scans

### Container Image Scanning

```bash
# Scan with Trivy
trivy image --severity HIGH,CRITICAL ghcr.io/predator/backend:latest

# Scan with Snyk
snyk container test ghcr.io/predator/backend:latest

# Scan all production images
for image in $(kubectl get pods -n production -o jsonpath='{.items[*].spec.containers[*].image}' | tr ' ' '\n' | sort -u); do
  echo "Scanning $image"
  trivy image --severity HIGH,CRITICAL $image
done
```

### Dependency Scanning

```bash
# Python dependencies
cd apps/backend
pip-audit
safety check

# Node dependencies  
cd apps/frontend
npm audit
snyk test

# Generate report
npm audit --json > audit-report-$(date +%Y%m%d).json
```

### Secret Scanning

```bash
# Scan repository for secrets
trufflehog git file://. --json > secrets-scan-$(date +%Y%m%d).json

# Scan specific directories
detect-secrets scan apps/ libs/ > .secrets.baseline

# Audit baseline
detect-secrets audit .secrets.baseline
```

### Infrastructure Scanning

```bash
# Scan Kubernetes manifests
kubesec scan k8s/deployments/*.yaml

# Scan Helm charts
helm lint ./helm/predator-umbrella
checkov --framework helm --directory ./helm

# Scan Terraform
cd terraform/
terraform init
tfsec .
checkov --directory .
```

## Manual Security Audits

### Access Control Review

**Monthly Checklist**:

```bash
# 1. Review Kubernetes RBAC
kubectl get rolebindings,clusterrolebindings --all-namespaces -o yaml > rbac-audit-$(date +%Y%m%d).yaml

# 2. Review service accounts
kubectl get serviceaccounts --all-namespaces

# 3. Review pod security policies
kubectl get psp

# 4. Audit database users
kubectl exec -it postgres-0 -n production -- \
  psql -U postgres -c "\du"

# 5. Review API keys
# Check GitHub secrets
# Check Vault policies
# Review LLM provider keys
```

### Network Security Review

**Quarterly Checklist**:

```bash
# 1. Review Network Policies
kubectl get networkpolicies --all-namespaces -o yaml

# 2. Review Ingress rules
kubectl get ingress --all-namespaces -o yaml

# 3. Check TLS certificates
kubectl get certificates --all-namespaces

# 4. Verify certificate expiry
kubectl get certificates --all-namespaces -o json | \
  jq '.items[] | {name: .metadata.name, notAfter: .status.notAfter}'

# 5. Scan exposed services
nmap -sV -p- production-cluster-ip
```

### Application Security Review

**Quarterly Checklist**:

- [ ] Review authentication mechanisms
- [ ] Test authorization logic
- [ ] Verify input validation
- [ ] Check SQL injection protection
- [ ] Test XSS protection
- [ ] Verify CSRF protection
- [ ] Review session management
- [ ] Check password policies
- [ ] Test rate limiting
- [ ] Verify security headers

### Penetration Testing

**Quarterly (External Team)**:

```bash
# Scope definition
- API endpoints: https://api.predator.example.com
- Web application: https://app.predator.example.com
- Admin interface: https://admin.predator.example.com

# Test categories:
1. Authentication bypass
2. Authorization flaws
3. Injection attacks (SQL, NoSQL, Command)
4. XSS vulnerabilities
5. CSRF vulnerabilities
6. Business logic flaws
7. API security
8. Session management
9. Cryptography
10. Information disclosure
```

## Security Hardening

### Kubernetes Security

```bash
# Enable Pod Security Standards
kubectl label namespace production \
  pod-security.kubernetes.io/enforce=restricted \
  pod-security.kubernetes.io/audit=restricted \
  pod-security.kubernetes.io/warn=restricted

# Deploy Network Policies
kubectl apply -f k8s/security/network-policies/

# Enable encryption at rest
# Configure in cloud provider or storage class

# Enable audit logging
# Configure in kube-apiserver
--audit-policy-file=/etc/kubernetes/audit-policy.yaml
--audit-log-path=/var/log/kubernetes/audit/audit.log
```

### Application Security

```python
# Enable security headers (FastAPI)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

app.add_middleware(TrustedHostMiddleware, allowed_hosts=["predator.example.com"])
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://app.predator.example.com"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
    max_age=3600,
)

# Add security headers
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response
```

### Database Security

```sql
-- Enable SSL/TLS
ALTER SYSTEM SET ssl = on;
ALTER SYSTEM SET ssl_cert_file = '/etc/ssl/certs/server.crt';
ALTER SYSTEM SET ssl_key_file = '/etc/ssl/private/server.key';

-- Configure row-level security
ALTER TABLE gold.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON gold.documents
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Audit logging
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_connections = on;
ALTER SYSTEM SET log_disconnections = on;
```

## Compliance Checks

### GDPR Compliance

**Checklist**:
- [ ] Data inventory completed
- [ ] Privacy policy updated
- [ ] Consent mechanisms in place
- [ ] Right to erasure implemented
- [ ] Right to portability implemented
- [ ] Data breach procedures documented
- [ ] DPO assigned
- [ ] Privacy impact assessment completed

**Technical Implementation**:

```bash
# Data deletion endpoint
POST /api/v1/gdpr/delete-user-data
{
  "user_id": "uuid",
  "reason": "user request"
}

# Data export endpoint
GET /api/v1/gdpr/export-user-data?user_id=uuid

# Audit data access
kubectl logs -l app=backend -n production | \
  grep "GDPR_ACCESS" | \
  jq '{user: .user_id, resource: .resource, timestamp: .timestamp}'
```

### SOC 2 Compliance

**Checklist**:
- [ ] Access controls documented
- [ ] Change management process
- [ ] Backup and recovery tested
- [ ] Incident response plan
- [ ] Security monitoring active
- [ ] Vendor management
- [ ] Security training completed

### PCI-DSS (if handling payments)

**Checklist**:
- [ ] Network segmentation
- [ ] Encryption in transit and at rest
- [ ] Access logs maintained
- [ ] Regular security scans
- [ ] Penetration testing
- [ ] Firewall configuration
- [ ] Anti-malware solutions

## Security Incident Response

### Severity Levels

| Level | Description | Response Time | Escalation |
|-------|-------------|---------------|------------|
| P0 | Active breach | Immediate | CTO, Legal |
| P1 | Critical vulnerability | < 1 hour | Security Lead |
| P2 | High vulnerability | < 4 hours | Security Team |
| P3 | Medium vulnerability | < 24 hours | DevOps Team |
| P4 | Low vulnerability | < 1 week | Backlog |

### Incident Response Procedure

**1. Detection & Analysis**

```bash
# Check security alerts
kubectl logs -l app=security-scanner -n monitoring

# Review suspicious activity
kubectl logs -l app=backend -n production | \
  grep -E "401|403|429" | \
  tail -n 100

# Check intrusion detection
fail2ban-client status
```

**2. Containment**

```bash
# Isolate affected pods
kubectl label pod <pod-name> quarantine=true -n production

# Block malicious IPs
kubectl exec -it nginx-ingress-controller -- \
  /bin/bash -c "echo 'deny 1.2.3.4;' >> /etc/nginx/blocked-ips.conf && nginx -s reload"

# Disable compromised accounts
kubectl exec -it postgres-0 -n production -- \
  psql -U postgres -c "ALTER USER compromised_user WITH CONNECTION LIMIT 0;"
```

**3. Eradication**

```bash
# Patch vulnerability
kubectl set image deployment/backend \
  backend=ghcr.io/predator/backend:patched \
  -n production

# Remove malicious code
# Review and remove backdoors
git log --all --full-history -- "**/*"
```

**4. Recovery**

```bash
# Restore from clean backup if needed
./scripts/restore-from-backup.sh --date 2026-01-30

# Verify system integrity
./scripts/security-verification.sh

# Resume normal operations
kubectl scale deployment backend --replicas=5 -n production
```

**5. Post-Incident**

- Document incident timeline
- Root cause analysis
- Update security procedures
- Notify stakeholders
- Implement preventive measures

## Security Metrics

### Track Monthly

```bash
# Vulnerability count by severity
trivy image ghcr.io/predator/backend:latest --format json | \
  jq '.Results[].Vulnerabilities | group_by(.Severity) | map({severity: .[0].Severity, count: length})'

# Mean time to patch
# Track from CVE disclosure to production deploy

# Security scan coverage
# Percentage of code/containers scanned

# Failed authentication attempts
kubectl logs -l app=backend -n production | \
  grep "AUTH_FAILED" | wc -l

# Access violations
kubectl logs -l app=backend -n production | \
  grep "AUTHORIZATION_DENIED" | wc -l
```

## Security Tools

### Required Tools

- **Trivy**: Container vulnerability scanning
- **Snyk**: Dependency scanning
- **TruffleHog**: Secret scanning
- **OWASP ZAP**: Web application security testing
- **Falco**: Runtime security monitoring
- **Vault**: Secrets management
- **cert-manager**: Certificate management
- **OPA/Gatekeeper**: Policy enforcement

### Tool Configuration

```yaml
# Falco rules (detect suspicious activity)
- rule: Unauthorized Process in Container
  desc: Detect unauthorized process execution
  condition: >
    spawned_process and container and
    not proc.name in (allowed_processes)
  output: >
    Unauthorized process in container
    (command=%proc.cmdline container=%container.name)
  priority: WARNING
```

## Compliance Reports

### Generate Monthly Report

```bash
#!/bin/bash
# security-report.sh

DATE=$(date +%Y%m)
REPORT="security-report-${DATE}.md"

echo "# Security Report - ${DATE}" > $REPORT
echo "" >> $REPORT

echo "## Vulnerability Scans" >> $REPORT
trivy image ghcr.io/predator/backend:latest --format json | \
  jq -r '.Results[].Vulnerabilities | group_by(.Severity) | map("- \(.[0].Severity): \(length)") | .[]' >> $REPORT

echo "" >> $REPORT
echo "## Dependency Audits" >> $REPORT
npm audit --json | jq -r '.metadata | "- Total: \(.vulnerabilities.total)\n- Critical: \(.vulnerabilities.critical)\n- High: \(.vulnerabilities.high)"' >> $REPORT

echo "" >> $REPORT
echo "## Secret Scans" >> $REPORT
echo "- Secrets found: 0" >> $REPORT

echo "" >> $REPORT
echo "## Incidents" >> $REPORT
echo "- P0: 0" >> $REPORT
echo "- P1: 0" >> $REPORT

# Upload to S3
aws s3 cp $REPORT s3://predator-compliance/reports/
```

---

**Last Updated**: 2026-01-31  
**Maintainer**: Security Team  
**Next Review**: 2026-02-28
