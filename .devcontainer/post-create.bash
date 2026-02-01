#!/usr/bin/env bash
set -euo pipefail

sudo apt update

# headed.
sudo apt install \
  --no-install-recommends \
  --yes \
  fluxbox novnc websockify x11vnc xvfb

# headless.
sudo apt install xauth xvfb

npm install
npx playwright install --with-deps
