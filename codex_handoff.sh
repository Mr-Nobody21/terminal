#!/usr/bin/env bash
set -euo pipefail
# Compatibility entry point; implementation lives with build tooling.
PLANNER_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec bash "$PLANNER_ROOT/tooling/scripts/build/codex-handoff.sh" "$@"
