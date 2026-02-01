#!/usr/bin/env sh
set -eu

sudo apt update
sudo apt install --no-install-recommends --yes xauth xvfb

npm install
npx playwright install --with-deps
