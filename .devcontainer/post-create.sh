#!/usr/bin/env sh
set -eu

sudo apt update

# cwebp.
sudo apt install --no-install-recommends --yes webp

# TinyGo.
curl --location https://github.com/tinygo-org/tinygo/releases/download/v0.40.1/tinygo_0.40.1_amd64.deb --output /tmp/tinygo.deb
sudo dpkg --install /tmp/tinygo.deb

# wasm-opt.
curl --location https://github.com/WebAssembly/binaryen/releases/download/version_128/binaryen-version_128-x86_64-linux.tar.gz |
sudo tar --extract --gzip --directory /usr/local/bin/ --strip-components=2 --wildcards '*/bin/wasm-opt'

# watchexec.
curl --location https://github.com/watchexec/watchexec/releases/download/v2.5.0/watchexec-2.5.0-x86_64-unknown-linux-musl.deb --output /tmp/watchexec.deb
sudo dpkg --install /tmp/watchexec.deb

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
  libxrandr2

# `xvfb-run`. start as `xvfb-run npm start`.
sudo apt install --no-install-recommends --yes xauth xvfb

npm install

npm install --global playwright @playwright/test
npx playwright install --with-deps
