#!/usr/bin/env bash
set -euo pipefail

sudo apt update
sudo apt install --no-install-recommends --yes xauth xvfb

npm install
npx playwright install --with-deps
