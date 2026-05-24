#!/bin/bash
set -e
export PATH="$HOME/.local/bin:$PATH"
LOG="/tmp/linkedin-mcp-err.log"
DISPLAY_NUM=99

# Start Xvfb if not already running
if ! pgrep -x Xvfb >/dev/null; then
  Xvfb :$DISPLAY_NUM -screen 0 1024x768x24 -ac &>/dev/null &
  sleep 1
fi

echo "[$(date)] Starting LinkedIn MCP on display :$DISPLAY_NUM ..." >> "$LOG"
export DISPLAY=:$DISPLAY_NUM
exec uvx linkedin-scraper-mcp@latest "$@" 2>>"$LOG"
