#!/bin/bash
# Production launcher for the asales app (http://localhost:3007), supervised by launchd.
#
# Node is installed via nvm, which is NOT on launchd's PATH. A service that just
# calls `npm`/`node` would fail with "command not found", so we set PATH explicitly.
# If you upgrade Node via nvm, update the version number in the PATH line below.
export PATH="/Users/awmmm/.nvm/versions/node/v22.22.1/bin:$PATH"
export NODE_ENV=production

cd /Users/awmmm/dev/asales || exit 1

# exec so launchd supervises the actual node process (clean restarts via KeepAlive).
exec node ./node_modules/next/dist/bin/next start -p 3007
