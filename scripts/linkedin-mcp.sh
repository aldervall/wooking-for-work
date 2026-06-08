#!/bin/bash
set -e
export PATH="$HOME/.local/bin:$PATH"
LOG="/tmp/linkedin-mcp-err.log"
DISPLAY_NUM=99
USER_ID=""
DRY_RUN=false
PASSTHROUGH_ARGS=()

# Parse known flags before passing remaining args to uvx
while [[ $# -gt 0 ]]; do
  case "$1" in
    --user-id)
      if [[ -z "$2" || "$2" == --* ]]; then
        echo "Error: --user-id requires a value" >&2
        exit 1
      fi
      USER_ID="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    *)
      PASSTHROUGH_ARGS+=("$1")
      shift
      ;;
  esac
done

# Determine profile directory
if [[ -n "$USER_ID" ]]; then
  PROFILE_DIR="${HOME}/.linkedin-mcp/profiles/${USER_ID}/"
  mkdir -p "$PROFILE_DIR"

  # Check if profile directory is empty (no session saved yet)
  if [[ -z "$(ls -A "$PROFILE_DIR" 2>/dev/null)" ]]; then
    echo "Warning: Profile directory '$PROFILE_DIR' is empty." >&2
    echo "  Run 'xvfb-run uvx linkedin-scraper-mcp@latest --login' first to create a session." >&2
  fi

  PASSTHROUGH_ARGS=("--user-data-dir" "$PROFILE_DIR" "${PASSTHROUGH_ARGS[@]}")
else
  PROFILE_DIR="${HOME}/.linkedin-mcp/profile/"
fi

if $DRY_RUN; then
  echo "DISPLAY=:$DISPLAY_NUM"
  echo "Profile directory: $PROFILE_DIR"
  echo "Command: uvx linkedin-scraper-mcp@latest ${PASSTHROUGH_ARGS[*]}"
  exit 0
fi

# Start Xvfb if not already running
if ! pgrep -x Xvfb >/dev/null; then
  Xvfb :$DISPLAY_NUM -screen 0 1024x768x24 -ac &>/dev/null &
  sleep 1
fi

echo "[$(date)] Starting LinkedIn MCP on display :$DISPLAY_NUM ..." >> "$LOG"
export DISPLAY=:$DISPLAY_NUM
exec uvx linkedin-scraper-mcp@latest "${PASSTHROUGH_ARGS[@]}" 2>>"$LOG"
