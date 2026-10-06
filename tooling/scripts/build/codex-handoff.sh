#!/usr/bin/env bash
set -euo pipefail

# Cloud Architecture Planner MVP -> Codex bootstrap/handoff
#
# Usage:
#   ./codex_handoff.sh [project-dir]
#   ./codex_handoff.sh [project-dir] --run
#
# Default project-dir: the repository containing this script
#
# This script:
#   1. creates a Vite React TypeScript project if needed,
#   2. installs the MVP browser-only dependencies,
#   3. copies the Codex handoff package into the repo,
#   4. initializes git when needed,
#   5. optionally starts `codex exec` with the handoff prompt.
#
# It does NOT create cloud resources, accounts, databases, or deployments.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
PROJECT_DIR="${1:-$SCRIPT_DIR}"
RUN_CODEX="false"

if [[ "${2:-}" == "--run" || "${1:-}" == "--run" ]]; then
  RUN_CODEX="true"
  if [[ "${1:-}" == "--run" ]]; then
    PROJECT_DIR="$SCRIPT_DIR"
  fi
fi

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

require_command() {
  if ! command_exists "$1"; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

if ! command_exists node && [[ -x "$SCRIPT_DIR/.runtime/bin/node" ]]; then
  export PATH="$SCRIPT_DIR/.runtime/bin:$PATH"
fi
require_command node
require_command npm
require_command git
if [[ "$RUN_CODEX" == "true" ]]; then
  require_command codex
fi
node -e 'if (Number(process.versions.node.split(".")[0]) < 22) { console.error("Node.js 22 or later is required"); process.exit(1); }'

echo "==> Target: ${PROJECT_DIR}"

if [[ ! -e "$PROJECT_DIR" ]]; then
  echo "==> Creating Vite React TypeScript project"
  npm create vite@latest "$PROJECT_DIR" -- --template react-ts
fi

cd "$PROJECT_DIR"

if [[ ! -f package.json ]]; then
  echo "Error: ${PROJECT_DIR} exists but does not contain package.json" >&2
  exit 1
fi

echo "==> Installing locked application dependencies"
if [[ -f package-lock.json ]]; then
  npm ci
else
  npm install
fi

echo "==> Preserving existing instructions"
for context_file in IMPLEMENTATION_PLAN.md AGENTS.md CODEX_HANDOFF.md planning/IMPLEMENTATION_PLAN.md planning/CODEX_HANDOFF.md docs/ADR-001-local-first.md docs/CANONICAL_MODEL.md docs/PLUGIN_AND_SKILL_MATRIX.md docs/architecture/decisions/ADR-001-local-first.md docs/architecture/canonical-model.md docs/development/plugin-and-skill-matrix.md; do
  if [[ -f "$SCRIPT_DIR/$context_file" && ! -e "$context_file" ]]; then
    mkdir -p "$(dirname "$context_file")"
    cp "$SCRIPT_DIR/$context_file" "$context_file"
  fi
done

if [[ ! -d .git ]]; then
  echo "==> Initializing git"
  git init
fi

echo
echo "Bootstrap complete."
echo
echo "Next steps:"
echo "  cd \"$PROJECT_DIR\""
echo "  cat CODEX_HANDOFF.md"
echo
echo "To hand off non-interactively:"
echo "  codex exec \"\$(cat CODEX_HANDOFF.md)\""
echo
echo "Or rerun this script with --run."

if [[ "$RUN_CODEX" == "true" ]]; then
  if ! command_exists codex; then
    echo "Codex CLI is not installed or not on PATH." >&2
    echo "Project bootstrap is complete; install/login to Codex, then run:" >&2
    echo "  cd \"$PROJECT_DIR\" && codex exec \"\$(cat CODEX_HANDOFF.md)\"" >&2
    exit 2
  fi

  echo "==> Starting Codex handoff"
  codex exec "Read AGENTS.md and status/STATUS.md. Review the current implemented MVP before making any changes. $(cat CODEX_HANDOFF.md)"
fi
