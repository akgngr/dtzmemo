# Application Access Info

## Main Application URL
**https://dtzb1.space-z.ai/**

This is the primary link to access the running Next.js application.

## How the app is served
- Next.js dev server runs on `localhost:3000` inside the container
- Caddy (running as root) reverse-proxies external traffic to `localhost:3000`
- The external domain `dtzb1.space-z.ai` maps to the container's Caddy on port 81
- Result: visiting `https://dtzb1.space-z.ai/` shows the live app

## Keeping the app alive
A watchdog script runs at `/home/z/my-project/scripts/dev-watchdog.sh` and restarts the dev server automatically if it crashes.

To start the watchdog manually if needed:
```bash
setsid /home/z/my-project/scripts/dev-watchdog.sh > /tmp/watchdog.log 2>&1 < /dev/null &
```

## Quick verification commands
```bash
# Check if dev server is alive
ss -tlnp 2>/dev/null | grep 3000

# Verify external URL is responding
curl -s -o /dev/null -w "HTTP %{http_code}\n" --max-time 10 "https://dtzb1.space-z.ai/"
```
