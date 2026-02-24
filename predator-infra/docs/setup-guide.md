# Setup Guide for Developers

## Prerequisites

- VS Code installed on Mac.
- Extensions: **Remote - SSH** and **Dev Containers**.
- SSH access to the server.

## Step 1: Connect to Server via SSH

1. Open VS Code.
2. Press `F1` and select `Remote-SSH: Connect to Host...`.
3. Select the server.

## Step 2: Open Workspace

1. Once connected, open the folder `/opt/dev/predator` or `/workspaces` if already mapped.
2. VS Code will detect the `.devcontainer/devcontainer.json` file.
3. A notification will appear: "Folder contains a Dev Container configuration file. Reopen to folder to develop in a container."
4. Click **Reopen in Container**.

## Step 3: Development

- Your environment is now running inside a Kubernetes Pod on the server.
- All tools (Python 3.12, Node 20.15.0, kubectl, GPU) are pre-installed.
- GPU is available via `nvidia-smi`.

## Creating Your Own Environment

If you don't have an environment yet, run:

```bash
./scripts/create-dev-user.sh your-username
```

ArgoCD will automatically create the namespace and start your Pod.
