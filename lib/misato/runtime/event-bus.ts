import { MisatoRuntimeEvent } from "./types";

type Listener = (event: MisatoRuntimeEvent) => void;

const listeners = new Set<Listener>();
const recentEvents: MisatoRuntimeEvent[] = [];
const MAX_RECENT = 200;

export function publishEvent(event: MisatoRuntimeEvent) {
  recentEvents.push(event);
  if (recentEvents.length > MAX_RECENT) recentEvents.shift();
  listeners.forEach((listener) => listener(event));
}

export function subscribeEvents(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getRecentEvents(afterEventId?: string) {
  if (!afterEventId) return [...recentEvents];
  const idx = recentEvents.findIndex((e) => e.eventId === afterEventId);
  if (idx < 0) return [...recentEvents];
  return recentEvents.slice(idx + 1);
}
