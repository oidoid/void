#!/usr/bin/env bash
set -euo pipefail

export DISPLAY=:99
unset WAYLAND_DISPLAY
export XDG_SESSION_TYPE=x11

# virtual display.
Xvfb $DISPLAY -screen 0 1280x720x24 -nolisten tcp &
sleep 1

# minimal window manager.
fluxbox >/tmp/fluxbox.log 2>&1 &

# connect to display.
x11vnc -display $DISPLAY -forever -shared -nopw -rfbport 5900 >/tmp/x11vnc.log 2>&1 &

# noVNC web UI on 7900 -> proxies to VNC 5900.
websockify --web=/usr/share/novnc/ 7900 localhost:5900 >/tmp/novnc.log 2>&1 &

echo 'http://localhost:7900/vnc.html'
