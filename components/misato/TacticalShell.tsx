import Link from "next/link";
import { ReactNode } from "react";

const nav = [
  ["/misato", "Command Center"],
  ["/misato/daily", "Daily"],
  ["/misato/projects", "Projects"],
  ["/misato/kanban", "Kanban"],
  ["/misato/agents", "Registry"],
  ["/misato/council", "Council"],
  ["/misato/missions", "Missions"],
  ["/misato/approvals", "Approvals"],
  ["/misato/logs", "Logs"],
  ["/misato/memory", "Memory"],
  ["/misato/tools", "Tools"],
  ["/misato/watchtower", "Watchtower"],
  ["/misato/design", "Design Library"],
  ["/misato/secrets", "Secret Sentinel"],
  ["/misato/settings", "Settings"]
] as const;

export function TacticalShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[#05070d] text-zinc-100">
      <header className="sticky top-0 z-40 border-b border-cyan-500/20 bg-black/70 backdrop-blur p-3">
        <div className="mx-auto max-w-7xl">
          <p className="text-[10px] tracking-[0.2em] text-cyan-300">MISATO MISSION CONTROL</p>
          <div className="mt-1 flex items-center justify-between gap-4">
            <h1 className="text-lg font-black">{title}</h1>
            <form className="hidden md:block">
              <input className="rounded border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs" readOnly value="SAFE MODE · OWNER ONLY · V1 MOCK" />
            </form>
          </div>
          <nav className="mt-3 flex flex-wrap gap-2 text-xs">
            {nav.map(([href, label]) => (
              <Link key={href} href={href} className="rounded border border-zinc-700 px-2 py-1 hover:border-cyan-400">{label}</Link>
            ))}
          </nav>
        </div>
      </header>
      <section className="mx-auto max-w-7xl p-4 md:p-6">{children}</section>
    </main>
  );
}
