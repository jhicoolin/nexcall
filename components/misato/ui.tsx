export function HudPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-cyan-500/25 bg-zinc-950/80 p-4">
      <p className="text-[10px] tracking-[0.2em] text-cyan-300">{title}</p>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function RiskBadge({ level }: { level: string }) {
  const color = level === "High" ? "bg-red-500/20 text-red-200 border-red-500/40" : level === "Medium" ? "bg-amber-500/20 text-amber-200 border-amber-500/40" : "bg-emerald-500/20 text-emerald-200 border-emerald-500/40";
  return <span className={`rounded border px-2 py-0.5 text-xs ${color}`}>{level}</span>;
}

export function PriorityBadge({ level }: { level: string }) {
  const color = level === "High" ? "text-red-300" : level === "Medium" ? "text-amber-300" : "text-emerald-300";
  return <span className={`text-xs font-semibold ${color}`}>{level}</span>;
}

export function StatusDot({ status }: { status: string }) {
  const c = status === "Online" ? "bg-emerald-400" : status === "Blocked" ? "bg-red-400" : "bg-amber-300";
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${c}`} />;
}
