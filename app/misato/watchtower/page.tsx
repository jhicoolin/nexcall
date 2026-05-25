import { TacticalShell } from "@/components/misato/TacticalShell";
import { HudPanel } from "@/components/misato/ui";
import { getWatchtowerStatus } from "@/lib/misato/watchtower/uptimeKumaClient";

function statusColor(status: string) {
  if (status === "up") return "text-emerald-300";
  if (status === "down") return "text-red-300";
  if (status === "degraded") return "text-amber-300";
  return "text-zinc-400";
}

export default async function WatchtowerPage() {
  const payload = await getWatchtowerStatus();

  return (
    <TacticalShell title="Watchtower · Service Health">
      <div className="grid gap-4 md:grid-cols-3">
        <HudPanel title="MODE"><p className="text-lg font-bold uppercase">{payload.mode}</p></HudPanel>
        <HudPanel title="MONITORS"><p className="text-2xl font-black">{payload.monitors.length}</p></HudPanel>
        <HudPanel title="LAST CHECK"><p className="text-sm">{new Date(payload.timestamp).toLocaleString()}</p></HudPanel>
      </div>

      <HudPanel title="SERVICE HEALTH GRID">
        <div className="mt-2 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {payload.monitors.map((m) => (
            <div key={m.id} className="rounded border border-zinc-700 p-3 text-sm">
              <p className="font-semibold">{m.name}</p>
              <p className="text-xs text-zinc-400">{m.url}</p>
              <p className={`mt-2 text-xs font-semibold uppercase ${statusColor(m.status)}`}>{m.status}</p>
              <p className="text-xs mt-1">Uptime: {m.uptimePercent}%</p>
              <p className="text-xs">Response: {m.responseTimeMs} ms</p>
              <p className="text-xs">Incidents: {m.incidentCount}</p>
              <p className="text-xs text-zinc-400">Source: {m.source}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-zinc-400">Open Uptime Kuma (planned): configure UPTIME_KUMA_BASE_URL and UPTIME_KUMA_API_KEY on backend only. Never expose tokens in frontend.</p>
      </HudPanel>
    </TacticalShell>
  );
}
