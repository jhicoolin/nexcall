# CODEX Dirty Worktree Triage

## Branch
- `misato-codex-live-ui-qa`

## Triage Goal
Confirm whether uncommitted local changes are masking backend reliability/security results.

## Findings (2026-05-25)
- Worktree state at audit start: clean (`git status` showed no modified tracked files).
- Runtime artifacts present under `.misato-runtime/` are expected local state artifacts.
- No evidence that hidden dirty backend code was causing current endpoint/auth failures in this branch.

## Risk Notes
- Local runtime artifacts can create confusion across branches if an old runtime process remains active.
- Cross-branch testing should always restart the runtime process after switching branches.

## Recommendation
- Keep `.misato-runtime/` ignored and treat it as ephemeral local runtime state.
- Before acceptance tests, run:
  1. `git status --short --branch`
  2. restart local runtime
  3. re-run endpoint smoke checks
