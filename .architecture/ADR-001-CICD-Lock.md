# ADR-001: CI/CD Constitutional Lock

**Статус:** ПРИЙНЯТО
**Дата:** 2026-02-04
**Контекст:** Predator v30 Constitutional Compliance

## Рішення

Фіксуємо **єдиний CI/CD контур**:
- **Source of Truth:** GitLab CE
- **GitOps Engine:** ArgoCD
- **Pipeline Runtime:** Tekton

## Обґрунтування

Паралельне існування Jenkins, Gitea, FluxCD створює:
- Недетерміновані деплої
- Конфлікти автономної еволюції
- Ризики безпеки через розмиту відповідальність

## Наслідки

✅ **Дозволено:**
- GitLab CE для всіх core-кластерів
- ArgoCD як єдиний GitOps-контролер
- Tekton для CI pipelines

❌ **Заборонено:**
- Jenkins в production
- FluxCD паралельно з ArgoCD
- Gitea як primary source

⚠️ **Виключення:**
- Gitea (read-only mirror) для edge-режиму
- Jenkins (legacy, isolated) для міграційних сценаріїв

## Compliance Check

```bash
# Перевірка відповідності
kubectl get applications -A | grep -v argocd && echo "VIOLATION" || echo "COMPLIANT"
```

---

**Підпис:** Constitutional Council
**Версія ADR:** 1.0
