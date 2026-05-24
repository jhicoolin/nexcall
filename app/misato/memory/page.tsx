import { TacticalShell } from "@/components/misato/TacticalShell";
import { HudPanel } from "@/components/misato/ui";
import { memoryEntries } from "@/lib/misato/mock/data";

export default function MemoryPage() {
  return (
    <TacticalShell title="Memory Vault">
      <HudPanel title="SAFE MEMORY SUMMARIES">
        <ul className="space-y-2 text-sm">{memoryEntries.map((m) => <li key={m.id}><b>{m.project}</b> · {m.scope} · {m.summary}</li>)}</ul>
        <p className="mt-3 text-xs text-zinc-400">No secrets stored. Project and agent scopes are isolated.</p>
      </HudPanel>
    </TacticalShell>
  );
}
