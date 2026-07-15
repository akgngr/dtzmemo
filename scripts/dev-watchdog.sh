#!/bin/bash
# Next.js dev server watchdog - keeps the dev server alive
# Restarts if it crashes
cd /home/z/my-project

LOG=/tmp/next-dev.log
PIDFILE=/tmp/next-dev.pid

while true; do
  # Check if anything is listening on port 3000
  if ss -tlnp 2>/dev/null | grep -q ':3000'; then
    sleep 10
    continue
  fi

  echo "[$(date)] Port 3000 not listening, starting dev server..." >> $LOG

  # Kill any stale next processes
  pkill -9 -f "next dev" 2>/dev/null
  pkill -9 -f "next-server" 2>/dev/null
  sleep 2

  # Start fresh
  rm -rf /home/z/my-project/.next
  nohup npm run dev >> $LOG 2>&1 < /dev/null &
  echo $! > $PIDFILE

  # Wait for it to come up
  for i in {1..30}; do
    sleep 2
    if ss -tlnp 2>/dev/null | grep -q ':3000'; then
      echo "[$(date)] Dev server is up" >> $LOG
      break
    fi
  done

  # Then loop back and keep watching
  sleep 10
done
