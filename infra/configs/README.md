# Infra Configs

This folder contains example configuration files and schema manifests used by infrastructure automation.

- `qdrant/collection_multimodal.yaml` — example collection configuration for Qdrant (vectors, payload schema)
- `opensearch/documents_mapping.json` — example OpenSearch mapping for document indexes

Usage:
- These files are examples for creating/updating collections and mappings using operators, or CLI utilities.
- For Qdrant: use qdrant-client or HTTP API to create collection with these settings.
- For OpenSearch: use the API `PUT /indexname` with the mapping payload in this folder.

They are intended as ready-to-apply templates for Helm/ArgoCD runbooks or CI/CD provisioning tasks.

NOTE: The umbrella Helm chart `helm/predator-umbrella` now includes `files/documents_mapping.json` which is used by a Helm Hook job to apply the mapping during chart installs/upgrades. You can disable this automatic behavior by setting `opensearch.init.enabled=false` in your values file.

If OpenSearch or Qdrant are secured, create Kubernetes Secrets in the `predator-analytics` namespace and reference them in the Helm values as documented in the umbrella chart README.

