#!/bin/bash
# Double-click this file to run PitchPage on your Mac.
# It installs the app's dependencies the first time, then starts it.
cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo
  echo "  Node.js is not installed yet."
  echo "  1. Go to https://nodejs.org"
  echo "  2. Download the LTS version and install it"
  echo "  3. Close this window and double-click this file again"
  echo
  read -n 1 -s -r -p "Press any key to close"
  exit 1
fi

echo "  Using Node: $(node -v)"
if [ ! -d node_modules ]; then
  echo "  First run - installing the app. This takes a few minutes."
  npm install || { echo "  Install failed. Send the errors above to Claude."; read -n 1 -s -r; exit 1; }
fi

echo
echo "  Starting PitchPage. Your browser should open by itself."
echo "  If not, go to http://localhost:8081"
echo "  Leave this window open while you use the app."
echo
npm run web
