export function getObsidianSyncPlan() { return { enabled: false, reason: "Vault writes disabled until owner approval", mode: "mirror-only" as const }; }
