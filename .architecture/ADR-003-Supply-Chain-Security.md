# ADR-003: Supply Chain Security (SBOM + Attestation)

**Статус:** ПРИЙНЯТО
**Дата:** 2026-02-04
**Контекст:** Predator v45 | Neural Analytics Constitutional Compliance

## Рішення

**Обов'язкова генерація SBOM та attestation** для всіх артефактів:

```yaml
security_pipeline:
  sbom:
    tools: [CycloneDX, Syft, Trivy]
    format: CycloneDX JSON
    frequency: every_build

  attestation:
    tools: [Cosign, in-toto]
    level: SLSA-2 (minimum)
    signing: mandatory

  sca:
    tools: [DependencyTrack, Renovate]
    policy: "No critical CVE"
    auto_update: security_patches_only
```

## Обґрунтування

Для системи класу Predator v45 | Neural Analytics:
- SBOM — це не nice-to-have, а must-have
- Supply-chain атаки — реальна загроза
- Sovereign-grade вимагає повної прозорості залежностей

## Наслідки

✅ **Обов'язково:**
- SBOM для кожного Docker image
- Cosign підпис для всіх артефактів
- DependencyTrack моніторинг CVE

❌ **Заборонено:**
- Деплой без SBOM
- Артефакти без підпису
- Критичні CVE в production

## Compliance Check

```bash
# Перевірка наявності SBOM
cosign verify-attestation --type cyclonedx <image>

# Перевірка підпису
cosign verify --key cosign.pub <image>

# Перевірка CVE
trivy image --severity CRITICAL,HIGH <image>
```

## Інтеграція з Pipeline

```yaml
# Tekton Pipeline Step
- name: generate-sbom
  image: anchore/syft:latest
  script: |
    syft <image> -o cyclonedx-json > sbom.json

- name: sign-artifact
  image: gcr.io/projectsigstore/cosign:latest
  script: |
    cosign sign --key k8s://tekton-chains/signing-secrets <image>
```

---

**Підпис:** Constitutional Council
**Версія ADR:** 1.0
