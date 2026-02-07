#!/usr/bin/env sh
set -eu

sudo apt update

# cwebp.
sudo apt install --no-install-recommends --yes webp

# Aseprite.
sudo apt install \
  --no-install-recommends \
  --yes \
  libfontconfig1 \
  libgl1 \
  libx11-6 \
  libxcb1 \
  libxcursor1 \
  libxext6 \
  libxrandr2 \

# `xvfb-run`.
sudo apt install --no-install-recommends --yes xauth xvfb

npm install

npm install --global playwright @playwright/test
npx playwright install --with-deps
