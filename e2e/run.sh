#!/usr/bin/env bash
# Build the web bundle, serve it, and drive the app in a real browser.
#
# This is the check that the app still WORKS, as opposed to still compiling:
# every screen is rendered and driven the way somebody would drive it. It runs
# against stubbed Supabase responses (e2e/stubs.mjs), so it needs no account,
# no network and no live data, and it is deterministic.
#
#   ./e2e/run.sh              everything
#   ./e2e/run.sh build-flow   one suite, by file name
#
# E2E_CHROMIUM points at a browser binary if Playwright cannot find its own
# (this container ships one at /opt/pw-browsers and blocks the download).
set -euo pipefail
cd "$(dirname "$0")/.."

PORT=${E2E_PORT:-8099}
export E2E_BASE=${E2E_BASE:-http://127.0.0.1:$PORT}

if [ -z "${E2E_CHROMIUM:-}" ]; then
  found=$(ls -d "${PLAYWRIGHT_BROWSERS_PATH:-/opt/pw-browsers}"/chromium-*/chrome-linux/chrome 2>/dev/null | head -1 || true)
  [ -n "$found" ] && export E2E_CHROMIUM="$found"
fi

echo "Bundling for web…"
EXPO_OFFLINE=1 CI=1 npx expo export --platform web >/dev/null

echo "Serving dist/ on :$PORT…"
python3 e2e/serve.py "$PORT" dist >/dev/null 2>&1 &
SERVER=$!
trap 'kill $SERVER 2>/dev/null || true' EXIT
for _ in $(seq 1 40); do
  curl -sf "http://127.0.0.1:$PORT/" >/dev/null && break
  sleep 0.25
done

suites=("${@:-page-types build-flow accessibility}")
status=0
for s in ${suites[@]}; do
  echo
  echo "── $s ───────────────────────────────────────────────"
  node "e2e/$s.mjs" || status=1
done
exit $status
