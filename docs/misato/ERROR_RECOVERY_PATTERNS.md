# MISATO Error Recovery Patterns

## 1. Hermes offline

### What the UI should show
- `Offline`
- endpoint or origin name
- last contact time
- reconnect guidance

### What the operator can do
- start Hermes
- verify `MISATO_RUNTIME_ORIGIN`
- retry the connection

### How to recover
- keep the browser shell loaded
- wait for Hermes to return
- do not fake connected state

### Related tests
- `1.2` Shows offline when Hermes stopped
- `14.1` Fetch error shows endpoint

## 2. Runtime origin mismatch

### What the UI should show
- explicit mismatch warning
- current runtime origin
- current preview API base

### How to detect
- browser contract check fails
- browser shell loads but runtime endpoints do not resolve

### How to recover
- reset `MISATO_RUNTIME_ORIGIN` to `http://127.0.0.1:3010`
- keep `MISATO_API_BASE_URL` preview-only or fallback-only
- rerun the browser contract check

### Related tests
- `0.5` Browser runtime-origin contract
- `14.4` 404 shows endpoint

## 3. API fallback

### What the UI should show
- fallback state is honest
- no mock-success banners when live state is unavailable
- disabled controls where mutations are not safe

### When to use
- only when the live endpoint is unavailable and the UI can still render a truthful stale or setup-required state

### How to recover
- restore the live endpoint
- rerun the smoke/regression checks

### Related tests
- `2.12` Falls back gracefully when /schedule fails
- `8.3` Fallback state is honest

## 4. gitleaks missing

### What the UI or docs should show
- setup instructions
- no false success

### How to detect
- `gitleaks version` fails
- repo-local scan scripts exit cleanly with install guidance

### How to recover
- install gitleaks on the host
- rerun the repo-only redacted scan

### Related tests
- `10.1` gitleaks status shows
- `18.1` gitleaks installed / not installed

## 5. Obsidian vault missing

### What the UI should show
- setup required state
- exact vault configuration steps
- disabled sync controls

### How to detect
- `OBSIDIAN_VAULT_PATH` is not set
- sync endpoint is not configured

### How to recover
- configure the vault path
- rerun the sync check

### Related tests
- `11.1` Not configured state
- `11.3` Sync Now button works

## Principle
If the system cannot prove it is live, it must say so plainly and stay in a blocked, loading, setup-required, or offline state. Never use mock success to paper over missing runtime truth.
