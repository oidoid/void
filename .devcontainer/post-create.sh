#!/usr/bin/env bash
set -euo pipefail

sudo apt update

# Shader Minifier, cwebp.
sudo apt install --no-install-recommends --yes mono-runtime webp

# Bun; see .bun-version. exact canary builds are published to npm but not
# GitHub releases, so this skips the installer script.
# to-do: switch to https://bun.com/install once a stable release has `bun lint`.
curl \
  --fail \
  --location \
  --silent \
  --show-error \
  "https://registry.npmjs.org/@oven/bun-linux-x64/-/bun-linux-x64-$(cat .bun-version).tgz" |
sudo tar --extract --gzip --directory /usr/local/bin/ --strip-components=2 package/bin/bun
sudo ln --force --symbolic /usr/local/bin/bun /usr/local/bin/bunx

# Shader Minifier.
curl \
  --location https://github.com/laurentlb/shader-minifier/releases/download/1.6.0/shader_minifier.exe \
  --output /tmp/shader_minifier.exe
sudo install --mode=0755 /tmp/shader_minifier.exe /usr/local/bin/shader_minifier.exe

# TinyGo.
curl \
  --location https://github.com/tinygo-org/tinygo/releases/download/v0.44.0/tinygo_0.44.0_amd64.deb \
  --output /tmp/tinygo.deb
sudo dpkg --install /tmp/tinygo.deb

# wasm-opt.
curl \
  --location https://github.com/WebAssembly/binaryen/releases/download/version_133/binaryen-version_133-x86_64-linux.tar.gz |
sudo tar --extract --gzip --directory /usr/local/bin/ --strip-components=2 --wildcards '*/bin/wasm-opt'

# watchexec.
curl \
  --location https://github.com/watchexec/watchexec/releases/download/v2.8.0/watchexec-2.8.0-x86_64-unknown-linux-musl.deb \
  --output /tmp/watchexec.deb
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

# `xvfb-run`. start as `xvfb-run make`.
sudo apt install --no-install-recommends --yes xauth xvfb

make install
