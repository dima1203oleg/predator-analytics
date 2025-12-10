CI Template Snippets for Predator v22

This folder contains reusable GitHub Actions snippets to implement the improved CI flow for images and releases.

Files:

- build-and-push-image.yml - Snippet for building and pushing images with buildx, cache, trivy scan, and returning digest
- update-helm-values.yml - Snippet for updating Helm values with digest and opening a PR
- run-e2e-tests.yml - Snippet for spinning up a kind cluster or docker-compose and running e2e tests
- trivy-scan.yml - Snippet to run Trivy and gate releases on severity

Usage:
Use the `jobs.<job>.uses` feature to include snippets if your runner supports composite actions or inline expansion.
