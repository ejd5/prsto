#!/bin/bash
# PRSTO watchdog — keeps the Next.js server alive
cd /home/z/my-project/elton-os

while true; do
  # Kill any existing server
  pkill -9 -f "node .next/standalone" 2>/dev/null
  sleep 2

  # Start fresh
  PORT=3000 HOSTNAME=0.0.0.0 nohup node .next/standalone/server.js > /tmp/prsto-prod.log 2>&1 &
  SERVER_PID=$!
  echo "[$(date)] Started server PID=$SERVER_PID" >> /tmp/watchdog.log

  # Wait for it to die (or be killed)
  wait $SERVER_PID 2>/dev/null
  echo "[$(date)] Server PID=$SERVER_PID died, restarting in 3s..." >> /tmp/watchdog.log
  sleep 3
done
