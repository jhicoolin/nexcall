# MISATO Model Routing Handoff

Agent: Hermes
Scope: Runtime truth for model routing and credential state
Date: 2026-06-03

## Runtime truth summary
- Canonical runtime is healthy at `http://127.0.0.1:3010`.
- Desktop shell is reachable at `http://127.0.0.1:1420`.
- `/api/misato/status` now reports `runtimeMode: "local"`, `runtimeStatus: "connected"`, and `localSoloMode: true`.

## Resolution applied in this pass
- The runtime resolver now recognizes `AI_GATEWAY_API_KEY` as the canonical credential source.
- `AI_CHAT_API_KEY`, `HERMES_OPENAI_API_KEY`, `OPENAI_API_KEY`, and `CODEX_API_KEY` remain supported aliases.
- Default routing for `AI_GATEWAY_API_KEY` is now:
  - provider: `vercel-ai-gateway`
  - model: `deepseek/deepseek-v4-flash`
  - base URL: `https://ai-gateway.vercel.sh/v1`
- `app/api/misato/status` now publishes `lastVerifiedAt` and the full resolved model record.
- `lib/misato/runtime/command-machine.ts` now reports fallback honestly when the provider call fails after credentials resolve, and only populates `modelUsed` when `responseSource: "hermes-ai"`.

## Current credential state
- Shell environment shows `AI_GATEWAY_API_KEY` is set.
- Shell environment does not currently show `AI_GATEWAY_MODEL` or `AI_GATEWAY_BASE_URL`.
- No evidence found in runtime state that credentials are stored in a secure OS credential store yet.

## Current active model/provider
- `/api/misato/status` reports:
  - `activeModel: "deepseek/deepseek-v4-flash"`
  - `fallbackModel: "deterministic-fallback"`
  - `modelProvider: "vercel-ai-gateway"`
  - `modelReady: true`
  - `credentialState: "resolved"`
  - `credentialSource: "AI_GATEWAY_API_KEY"`
  - `fallbackReason: null`
- `POST /api/misato/command` with `hi` currently returns:
  - `modelUsed: null`
  - `responseSource: "deterministic-fallback"`
  - `fallbackUsed: true`
  - `fallbackReason: "AI provider call fell back to deterministic classifier."`

## What was routed and why
- The runtime now routes the request to the correct live provider path.
- Direct provider verification reached Vercel AI Gateway at `https://ai-gateway.vercel.sh/v1/chat/completions`.
- The provider returned `403` with the message that a valid credit card is required on file to service requests.
- That makes the current block environment-bound, not a code-routing bug.

## Fallback used
- Yes: command execution is still using deterministic fallback because the provider rejects the request in this environment.
- The fallback is now explicit and visible in the command response.
- Fallback must not be treated as a real model.

## Anything still blocked or environment-bound
- Real model responses remain blocked until the Vercel AI Gateway account is eligible to serve requests.
- The specific observed blocker is billing/credit-card gating on the gateway account.
- If the gateway account is fixed or the base URL is redirected to a working provider, rerun `/api/misato/command` to confirm `responseSource: "hermes-ai"`.

## Next handoff to Claude
- Keep the UI aligned with the status endpoint truth:
  - credentials resolved
  - provider resolved
  - command execution still falling back because the live provider is blocked
- Keep `AI_GATEWAY_API_KEY` server-side only.
- Do not reintroduce mock/live ambiguity.
