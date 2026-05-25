export function buildObsidianContext(input: { mission: string; summary: string }) { return { mission: input.mission, summary: input.summary, safe: true }; }
