#!/usr/bin/env bash
set -euo pipefail

echo "=== Tactic Boss AI Netlify Guaranteed Build V105.5 Web Clean ==="
echo "Node: $(node -v)"
echo "npm: $(npm -v)"

# Web deploy package only: Capacitor/mobile CLI is intentionally not installed on Netlify.
# Vite and all build-time web tools are production dependencies, so production installs are safe.
unset NPM_CONFIG_INCLUDE || true
unset npm_config_include || true
export NPM_CONFIG_AUDIT=false
export NPM_CONFIG_FUND=false

if [ ! -x "./node_modules/.bin/vite" ]; then
  echo "Vite not found. Installing production web dependencies..."
  rm -rf node_modules
  npm ci --omit=dev --legacy-peer-deps --no-audit --no-fund
fi

if [ ! -x "./node_modules/.bin/vite" ]; then
  echo "ERROR: Vite is still missing after production install."
  echo "Check that the V105.5 package.json was uploaded at repository root."
  exit 127
fi

echo "Vite: $(./node_modules/.bin/vite --version)"
./node_modules/.bin/vite build
