# Predator Voice Service - Safe configuration

We have switched from gRPC to REST API for voice synthesis to ensure stability on macOS.
The daemon is managed by a watchdog script.

## Crucial Files:
- `app/services/voice_service.py`: Contains the REST implementation (DO NOT REVERT TO GRPC WITHOUT TESTING)
- `libs_local_v2/`: Contains isolated dependencies for the voice service.
- `scripts/voice_watchdog.sh`: Ensures the daemon is always running.
- `scripts/speak_daemon.py`: The actual daemon process.

## How to restart manually:
```bash
./scripts/voice_watchdog.sh
```

## Troubleshooting
If voice stops working:
1. Check `daemon_watchdog.log`
2. Ensure you have internet connection (needed for Google Cloud API)
3. Check `speak_buffer.txt` - if it has text but no audio, the daemon might be stuck (watchdog cleans this up automatically after 30s).
