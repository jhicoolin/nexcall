import "server-only";

export type ModelCredentialSource =
  | "AI_GATEWAY_API_KEY"
  | "AI_CHAT_API_KEY"
  | "HERMES_OPENAI_API_KEY"
  | "OPENAI_API_KEY"
  | "CODEX_API_KEY"
  | null;

export type ModelProvider = "vercel-ai-gateway" | "openai" | "deterministic-fallback";

export type ModelResolution = {
  canonicalSource: "AI_GATEWAY_API_KEY";
  credentialSource: Exclude<ModelCredentialSource, null>;
  credentialState: "resolved" | "missing";
  provider: ModelProvider;
  model: string;
  modelVersion: string;
  baseUrl: string | null;
  ready: boolean;
  fallbackUsed: boolean;
  fallbackReason: string | null;
  precedence: string[];
  discoveredSources: string[];
  resolutionNotes: string[];
};

const CREDENTIAL_PRECEDENCE = [
  "AI_GATEWAY_API_KEY",
  "AI_CHAT_API_KEY",
  "HERMES_OPENAI_API_KEY",
  "OPENAI_API_KEY",
  "CODEX_API_KEY"
] as const;

const FALLBACK_MODEL = "deterministic-fallback";

function envValue(name: string): string | null {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : null;
}

function pickFirstConfigured(names: readonly string[]): string | null {
  for (const name of names) {
    if (envValue(name)) return name;
  }
  return null;
}

function pickBaseUrl(source: string): string {
  if (source === "AI_GATEWAY_API_KEY") {
    return envValue("AI_GATEWAY_BASE_URL") || envValue("AI_CHAT_BASE_URL") || envValue("OPENAI_BASE_URL") || "https://ai-gateway.vercel.sh/v1";
  }
  if (source === "AI_CHAT_API_KEY") {
    return envValue("AI_CHAT_BASE_URL") || envValue("AI_GATEWAY_BASE_URL") || envValue("OPENAI_BASE_URL") || "https://api.openai.com/v1";
  }
  if (source === "HERMES_OPENAI_API_KEY") {
    return envValue("HERMES_OPENAI_BASE_URL") || envValue("OPENAI_BASE_URL") || "https://api.openai.com/v1";
  }
  if (source === "CODEX_API_KEY") {
    return envValue("CODEX_BASE_URL") || envValue("OPENAI_BASE_URL") || "https://api.openai.com/v1";
  }
  return envValue("OPENAI_BASE_URL") || "https://api.openai.com/v1";
}

function pickModel(source: string): string {
  if (source === "AI_GATEWAY_API_KEY") {
    return envValue("AI_GATEWAY_MODEL") || envValue("AI_CHAT_MODEL") || envValue("OPENAI_MODEL") || "deepseek/deepseek-v4-flash";
  }
  if (source === "AI_CHAT_API_KEY") {
    return envValue("AI_CHAT_MODEL") || envValue("AI_GATEWAY_MODEL") || envValue("OPENAI_MODEL") || "gpt-4o-mini";
  }
  if (source === "HERMES_OPENAI_API_KEY") {
    return envValue("HERMES_OPENAI_MODEL") || envValue("OPENAI_MODEL") || "gpt-4o-mini";
  }
  if (source === "CODEX_API_KEY") {
    return envValue("CODEX_MODEL") || envValue("OPENAI_MODEL") || "gpt-4o-mini";
  }
  return envValue("OPENAI_MODEL") || "gpt-4o-mini";
}

export function getModelResolution(): ModelResolution {
  const discoveredSources = CREDENTIAL_PRECEDENCE.filter((name) => Boolean(envValue(name)));
  const credentialSource = pickFirstConfigured(CREDENTIAL_PRECEDENCE) as Exclude<ModelCredentialSource, null> | null;

  if (!credentialSource) {
    return {
      canonicalSource: "AI_GATEWAY_API_KEY",
      credentialSource: "AI_GATEWAY_API_KEY",
      credentialState: "missing",
      provider: "deterministic-fallback",
      model: FALLBACK_MODEL,
      modelVersion: FALLBACK_MODEL,
      baseUrl: null,
      ready: false,
      fallbackUsed: true,
      fallbackReason: `No model credential found. Checked ${CREDENTIAL_PRECEDENCE.join(", ")}.`,
      precedence: [...CREDENTIAL_PRECEDENCE],
      discoveredSources,
      resolutionNotes: ["No credential source resolved.", "Deterministic fallback remains active."]
    };
  }

  const provider: ModelProvider = credentialSource === "AI_GATEWAY_API_KEY" ? "vercel-ai-gateway" : "openai";
  const model = pickModel(credentialSource);
  const baseUrl = pickBaseUrl(credentialSource);

  return {
    canonicalSource: "AI_GATEWAY_API_KEY",
    credentialSource,
    credentialState: "resolved",
    provider,
    model,
    modelVersion: model,
    baseUrl,
    ready: true,
    fallbackUsed: false,
    fallbackReason: null,
    precedence: [...CREDENTIAL_PRECEDENCE],
    discoveredSources,
    resolutionNotes: [
      `Resolved credential source: ${credentialSource}`,
      `Provider: ${provider}`,
      `Model: ${model}`,
      `Base URL: ${baseUrl}`
    ]
  };
}

export function getFallbackModel() {
  return FALLBACK_MODEL;
}

export function getActiveModel() {
  const resolution = getModelResolution();
  return resolution.ready ? resolution.model : FALLBACK_MODEL;
}

export function getModelProvider() {
  const resolution = getModelResolution();
  return resolution.ready ? resolution.provider : "deterministic-fallback";
}

export function getModelReady(): boolean {
  return getModelResolution().ready;
}

export function getCredentialState() {
  return getModelResolution().credentialState;
}

export function getFallbackReason() {
  return getModelResolution().fallbackReason;
}
