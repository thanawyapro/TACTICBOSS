#!/usr/bin/env bash
set -euo pipefail

echo "Node: $(node -v)"
echo "npm: $(npm -v)"

echo "Installing all build dependencies, including devDependencies..."
npm install --include=dev --legacy-peer-deps --no-audit --no-fund

if [ ! -x ./node_modules/.bin/vite ]; then
  echo "ERROR: vite binary was not installed. Showing package info for debugging:"
  npm ls vite || true
  ls -la node_modules/.bin || true
  exit 127
fi

echo "Vite: $(./node_modules/.bin/vite --version)"
echo "Building Tactic Boss AI..."
./node_modules/.bin/vite build
