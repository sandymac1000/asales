#!/bin/bash
# Production launcher for the asales app (http://localhost:3007), supervised by launchd.
#
# Portable by design:
#   - finds its own directory, so it works wherever the repo is cloned
#   - loads Node from nvm, because launchd runs with a minimal PATH that does
#     not include nvm's node (a naive service fails with "node: not found")
#   - uses nvm's `default` alias, so it keeps working across Node upgrades
#     without editing this file
#
# Installed/loaded by scripts/install-service.sh.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  # shellcheck source=/dev/null
  . "$NVM_DIR/nvm.sh"
  nvm use default >/dev/null 2>&1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "run-server.sh: could not find Node (looked via nvm at $NVM_DIR)" >&2
  exit 127
fi

export NODE_ENV=production
cd "$SCRIPT_DIR" || exit 1

# exec so launchd supervises the actual node process (clean KeepAlive restarts).
exec node ./node_modules/next/dist/bin/next start -p 3007
