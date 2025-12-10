Dockerfile Templates for Predator v22

This folder contains standardized Dockerfile templates and generator scripts to help maintain consistent builds across services.

- backend-python.Dockerfile - Multi-stage builder + distroless runtime for Python 3.11
- frontend-node.Dockerfile - Two-stage builder (node:18-alpine) + nginx runtime for static SPA
- mlflow.Dockerfile - Extends base MLflow image and installs required Python libs

Usage:

- Copy the appropriate template and update `requirements.txt` or `package.json` as needed.
- For GPU/CUDA dependent images, use the `gpu` template (not included in this folder) and tune the base image to the appropriate CUDA version.

Helper scripts are provided in `implementation_v22/scripts` to generate a Dockerfile from the templates and apply basic linting.
