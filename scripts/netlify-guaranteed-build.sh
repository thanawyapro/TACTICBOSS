#!/usr/bin/env bash
set -euo pipefail

echo "=== Tactic Boss AI Netlify Guaranteed Build V105.4 ==="
echo "Node: $(node -v)"
echo "npm: $(npm -v)"

# Netlify project-level env vars can accidentally force production install.
# Override them inside the build so Vite is always available.
export NODE_ENV=development
export NPM_CONFIG_PRODUCTION=false
export npm_config_production=false
export NPM_CONFIG_INCLUDE=dev
export npm_config_include=dev
unset NPM_CONFIG_OMIT || true
unset npm_config_omit || true

echo "NPM_CONFIG_PRODUCTION=${NPM_CONFIG_PRODUCTION}"
echo "NPM_CONFIG_INCLUDE=${NPM_CONFIG_INCLUDE}"

# Repair partial/corrupt dependency caches. This is intentionally inside the build command
# so it works even when Netlify skips/uses a broken dependency cache.
if [ ! -x "./node_modules/.bin/vite" ]; then
  echo "Vite not found in node_modules. Installing dependencies now..."
  npm ci --include=dev --legacy-peer-deps --no-audit --no-fund || npm install --include=dev --legacy-peer-deps --no-audit --no-fund
fi

if [ ! -x "./node_modules/.bin/vite" ]; then
  echo "ERROR: Vite is still missing after install. Aborting."
  exit 127
fi

echo "Vite: $(./node_modules/.bin/vite --version)"
./node_modules/.bin/vite build
