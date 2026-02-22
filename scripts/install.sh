#!/bin/bash
# Install Deepr Session to /Applications after a fresh build.
# Usage:
#   bash scripts/install.sh          — installs already-packed app
#   bash scripts/install.sh --build  — rebuilds everything first, then installs

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

APP_NAME="Deepr Session"
APP_BUNDLE="dist-electron/mac-arm64/${APP_NAME}.app"
INSTALL_PATH="/Applications/${APP_NAME}.app"

if [[ "${1:-}" == "--build" ]]; then
  echo "▶ Building renderer..."
  npm run build:renderer

  echo "▶ Building main process..."
  npm run build:main

  echo "▶ Packaging app..."
  npx electron-builder --mac dir
fi

if [ ! -d "$APP_BUNDLE" ]; then
  echo "✗ App bundle not found at $APP_BUNDLE"
  echo "  Run:  npm run pack  (or pass --build flag)"
  exit 1
fi

echo "▶ Installing to /Applications..."
rm -rf "$INSTALL_PATH"
cp -r "$APP_BUNDLE" "$INSTALL_PATH"

echo "✓ Deepr Session installed. Launch it from /Applications or Spotlight."
