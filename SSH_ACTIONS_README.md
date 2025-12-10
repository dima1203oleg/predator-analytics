# SSH Actions — Quick Runbook

This runbook contains copy-paste commands to prepare a server for SSH access, install a public key, generate a client `~/.ssh/config` entry, and verify the connection. Use the provided scripts in `scripts/`.

Important: substitute `SERVER_IP`, `SSH_USER` and `SSH_PORT` before running commands.

1. Generate an SSH key (if you don't have one):

```bash
ssh-keygen -t ed25519 -C "dev@example.com"
```

2. Generate a client config entry (local):

```bash
# generate and append to your ~/.ssh/config
./scripts/generate_ssh_config.sh --host-name predator-dev --server-ip SERVER_IP --user SSH_USER --port SSH_PORT >> ~/.ssh/config
chmod 600 ~/.ssh/config
```

3. Copy your public key to the server (recommended):

```bash
ssh-copy-id -i ~/.ssh/id_ed25519.pub -p SSH_PORT SSH_USER@SERVER_IP
```

If `ssh-copy-id` is not available, use:

```bash
cat ~/.ssh/id_ed25519.pub | ssh -p SSH_PORT SSH_USER@SERVER_IP 'mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys'
```

4. (Admin) Run server preparation script on the server to apply recommended `sshd` and firewall settings.

Local -> copy script to server:

```bash
scp -P SSH_PORT scripts/prepare_server.sh SSH_USER@SERVER_IP:/tmp/prepare_server.sh
ssh -p SSH_PORT SSH_USER@SERVER_IP 'sudo bash /tmp/prepare_server.sh --user SSH_USER --key-file /home/SSH_USER/id_ed25519.pub --port SSH_PORT --install-fail2ban'
```

Notes:

- The script makes a backup of `/etc/ssh/sshd_config` before changes and tests `sshd` config before restart.
- If you changed the SSH port, be sure the firewall rule is present and you have an alternate connection open while testing.

5. Verify the connection (from your client):

```bash
# via the Host alias in ~/.ssh/config
ssh predator-dev

# or directly
ssh -i ~/.ssh/id_ed25519 -p SSH_PORT SSH_USER@SERVER_IP

# check project directory
ls -la /home/SSH_USER/predator_v22
```

6. Troubleshooting tips

- If you lose access after changing `sshd_config`, restore backup from console/host or ask admin to revert. The prepare script keeps a `.bak` with timestamp.
- Use `sudo journalctl -u sshd -f` on the server to inspect sshd logs.
- Check `~/.ssh/authorized_keys` permissions: `chmod 600 ~/.ssh/authorized_keys` and `chmod 700 ~/.ssh`.

7. VS Code Remote-SSH quick steps

- Ensure `Remote - SSH` extension is installed.
- After adding host to `~/.ssh/config`, open Command Palette -> `Remote-SSH: Connect to Host...` -> choose `predator-dev`.
- When connected, `File -> Open Folder` -> `/home/SSH_USER/predator_v22`.
- To forward dev ports (backend 8000, frontend 5173): Remote Explorer -> Forward a Port, or add `LocalForward` entries to `~/.ssh/config`.

If you want, provide `SERVER_IP`, `SSH_USER`, `SSH_PORT`, or paste your public key here and I will:

- (A) generate the ready `~/.ssh/config` entry and update `SSH_SETUP.md`, or
- (B) produce exact `scp` + `ssh` commands to run (safe scripted sequence), or
- (C) produce a PR/README tailored to your team.
