import type { DiscordIntentEvent } from "./types";
export function routeDiscordMessage(event: DiscordIntentEvent) { return { action: "mock-handoff", event, executed: false }; }
