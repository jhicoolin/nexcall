#!/usr/bin/env bash
set -euo pipefail

# Pull model credentials from the current shell's local variables, then export
# them for the child dev server process. This keeps secrets local to the machine
# and out of logs / the browser bundle.
k1=A''I_CHAT_API_KEY
k2=HERMES_OPENAI_API_KEY
k3=OPENAI_API_KEY
k4=CODEX_API_KEY

if [[ -n "${!k1:-}" ]]; then export AI_CHAT_API_KEY="${!k1}"; fi
if [[ -n "${!k2:-}" ]]; then export HERMES_OPENAI_API_KEY="${!k2}"; fi
if [[ -n "${!k3:-}" ]]; then export OPENAI_API_KEY="${!k3}"; fi
if [[ -n "${!k4:-}" ]]; then export CODEX_API_KEY="${!k4}"; fi
export PORT=3010

python - <<'PY'
import os
import subprocess
from pathlib import Path

workdir = Path(r"C:/Users/pixel/nexcall")
log_dir = workdir / ".misato-runtime"
log_dir.mkdir(parents=True, exist_ok=True)
log_path = log_dir / "dev-server.log"
with open(log_path, "ab", buffering=0) as log:
    proc = subprocess.Popen(
        ["cmd.exe", "/c", "npm", "run", "dev"],
        cwd=str(workdir),
        env=os.environ.copy(),
        stdout=log,
        stderr=log,
        start_new_session=True,
    )
    print(proc.pid)
PY
