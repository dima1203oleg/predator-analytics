# Predator Umbrella Helm Chart

This umbrella chart bundles all Predator Analytics components and includes init hooks for infrastructure components like OpenSearch and Qdrant.

## Notable features
- opensearch.init.enabled (bool): Create OpenSearch index (with mapping) during Helm install/upgrade. Defaults to `true`.
- opensearch.init.indexName (string): Index name to create. Defaults to `documents`.
- qdrant.init.enabled (bool) (in the `qdrant` subchart): Create Qdrant collection during Helm install/upgrade. Defaults to `true`.
- qdrant.init.collectionName (string) (in the `qdrant` subchart): Collection name to create. Defaults to `multimodal_index`.

## Authentication
- If OpenSearch or Qdrant endpoints require authentication, configure the chart values:
	- `opensearch.auth.enabled=true`, and set `opensearch.auth.username` and `opensearch.auth.password`.
	- `qdrant.auth.enabled=true`, and set `qdrant.auth.apiKey`.

The jobs will add basic auth or API key headers when these values are provided.

## Secrets & Examples
If you prefer not to store credentials in values files (recommended), create Kubernetes Secrets and reference them using `opensearch.auth.secretName` and `qdrant.auth.secretName`.

Example secret (replace values with secure ones and do not commit secrets into the repo):

```yaml
apiVersion: v1
kind: Secret
metadata:
	name: predator-opensearch-credentials
	namespace: predator-analytics
type: Opaque
stringData:
	username: "opensearch_user"
	password: "REPLACE_WITH_SECURE_PASSWORD"
```

Example Qdrant API key secret:

```yaml
apiVersion: v1
kind: Secret
metadata:
	name: predator-qdrant-api-key
	namespace: predator-analytics
type: Opaque
stringData:
	apiKey: "REPLACE_WITH_QDRANT_API_KEY"
```

Set values:

```yaml
opensearch:
	auth:
		enabled: true
		secretName: predator-opensearch-credentials

qdrant:
	auth:
		enabled: true
		secretName: predator-qdrant-api-key
```


## How it works
- The opensearch mapping file is included in `files/documents_mapping.json` and applied via a Helm hook job `opensearch-init`.
- The Qdrant collection is created via a Helm hook job `collection-init` in the `qdrant` subchart.

To disable the automatic creation of mappings/indexes, set `opensearch.init.enabled=false` or `qdrant.init.enabled=false` in your environment values.

## Notes & Security
- These jobs operate against OpenSearch and Qdrant endpoints in the cluster; make sure any authentication or TLS settings are configured in production.
- For auth-protected clusters, ensure the job supports credentials (future improvement): mount secrets or use service accounts with necessary access.
