#!/bin/bash
# Installs (or reinstalls) the launchd service that keeps the asales app running
# in production on http://localhost:3007. It starts at login and auto-restarts
# within a couple of seconds if it ever crashes.
#
# Reproducible from the repo: this generates the LaunchAgent for THIS machine
# (absolute paths, current user) and loads it. Safe to re-run — it's idempotent.
#
#   Setup:   npm install && npm run build && ./scripts/install-service.sh
#   Stop:    launchctl bootout gui/$(id -u)/com.asales.server
#   Redeploy after code changes:
#            npm run build && launchctl kickstart -k gui/$(id -u)/com.asales.server
#
set -euo pipefail

LABEL="com.asales.server"
PORT=3007

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
LAUNCHER="$REPO_DIR/run-server.sh"
LOG_DIR="$REPO_DIR/logs"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
UID_NUM="$(id -u)"

echo "→ Repo:     $REPO_DIR"
echo "→ Launcher: $LAUNCHER"
echo "→ Plist:    $PLIST"

# --- Preconditions -----------------------------------------------------------
if [ ! -f "$LAUNCHER" ]; then
  echo "ERROR: launcher not found at $LAUNCHER" >&2
  exit 1
fi
if [ ! -d "$REPO_DIR/.next" ]; then
  echo "ERROR: no production build found (.next missing). Run 'npm run build' first." >&2
  exit 1
fi

chmod +x "$LAUNCHER"
mkdir -p "$LOG_DIR" "$HOME/Library/LaunchAgents"

# --- Generate the LaunchAgent for this machine -------------------------------
cat > "$PLIST" <<PLISTEOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>$LABEL</string>
    <key>ProgramArguments</key>
    <array>
        <string>$LAUNCHER</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$REPO_DIR</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>ProcessType</key>
    <string>Interactive</string>
    <key>StandardOutPath</key>
    <string>$LOG_DIR/server.out.log</string>
    <key>StandardErrorPath</key>
    <string>$LOG_DIR/server.err.log</string>
</dict>
</plist>
PLISTEOF
echo "→ Wrote LaunchAgent."

# --- (Re)load idempotently ---------------------------------------------------
# Tear down any existing instance. bootout is asynchronous, so wait for the
# label to fully unload — bootstrapping too soon returns "5: Input/output error".
launchctl bootout "gui/$UID_NUM/$LABEL" 2>/dev/null || true
for _ in $(seq 1 20); do
  launchctl print "gui/$UID_NUM/$LABEL" >/dev/null 2>&1 || break
  sleep 0.25
done

# Bootstrap, retrying on the transient EIO race.
bootstrapped=false
for _ in $(seq 1 10); do
  if launchctl bootstrap "gui/$UID_NUM" "$PLIST" 2>/dev/null; then
    bootstrapped=true
    break
  fi
  sleep 0.5
done
if [ "$bootstrapped" != true ]; then
  echo "ERROR: launchctl bootstrap failed repeatedly (last: run it manually for the error):" >&2
  echo "       launchctl bootstrap gui/$UID_NUM $PLIST" >&2
  exit 1
fi
launchctl enable "gui/$UID_NUM/$LABEL"
echo "→ Service loaded."

# --- Verify it actually serves -----------------------------------------------
echo -n "→ Waiting for http://localhost:$PORT "
for _ in $(seq 1 30); do
  code="$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:$PORT/home" 2>/dev/null || true)"
  if [ -n "$code" ] && [ "$code" != "000" ]; then
    echo ""
    echo "✓ Server responding on :$PORT (HTTP $code). Service '$LABEL' is installed and supervised."
    exit 0
  fi
  echo -n "."
  sleep 1
done

echo ""
echo "✗ Server did not respond within 30s. Check $LOG_DIR/server.err.log" >&2
exit 1
