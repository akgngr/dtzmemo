#!/bin/bash
# Next.js PRODUCTION watchdog (v2)
# Runs bun directly (no npm/tee wrappers) and keeps it alive forever.
cd /home/z/my-project

LOG=/tmp/next-prod.log
GUARD_LOG=/tmp/watchdog-prod.log

while true; do
  if ss -tlnp 2>/dev/null | grep -q ':3000'; then
    sleep 5
    continue
  fi

  echo "[$(date)] Port 3000 down, restarting bun..." >> $GUARD_LOG

  # Kill anything stale
  pkill -9 -f "bun .next" 2>/dev/null
  pkill -9 -f "next-server" 2>/dev/null
  pkill -9 -f "next dev" 2>/dev/null
  sleep 2

  # Ensure build exists
  if [ ! -f /home/z/my-project/.next/standalone/server.js ]; then
    echo "[$(date)] No build, running npm run build..." >> $GUARD_LOG
    cd /home/z/my-project && npm run build >> $LOG 2>&1
  fi

  # Start bun DIRECTLY (no npm wrapper, no tee pipe — those were crashing)
  cd /home/z/my-project
  setsid env NODE_ENV=production bun .next/standalone/server.js >> $LOG 2>&1 < /dev/null &
  BUN_PID=$!
  echo "[$(date)] Started bun PID $BUN_PID" >> $GUARD_LOG

  # Wait up to 30s for it to come up
  for i in {1..15}; do
    sleep 2
    if ss -tlnp 2>/dev/null | grep -q ':3000'; then
      echo "[$(date)] bun is up" >> $GUARD_LOG
      break
    fi
  done

  sleep 5
done
