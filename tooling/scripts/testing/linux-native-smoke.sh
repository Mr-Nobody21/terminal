#!/usr/bin/env bash
set -euo pipefail
# Xvfb supplies a display; Openbox supplies actual native fullscreen transitions.
openbox >"${TMPDIR:-/tmp}/planner-openbox.log" 2>&1 &
planner_window_manager_pid=$!
trap 'kill "$planner_window_manager_pid" 2>/dev/null || true' EXIT
npm run test:desktop
