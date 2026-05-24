"use client";

import { useState } from "react";

type Result = {
  missionSummary: string;
  projectDetected: string;
  agentsAssigned: string[];
  councilFeedback: Array<{ agent: string; feedback: string }>;
  subtasksCreated: string[];
  risksDetected: string[];
  approvalRequired: boolean;
  logsCreated: string[];
  nextRecommendedActions: string[];
  activityFeed: string[];
};

export function MisatoCommandInput() {
  const [command, setCommand] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    setError("");
    setResult(null);
    const res = await fetch("/api/misato/command", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command })
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) return setError(data.error || "Command failed");
    setResult(data.result);
  }

  return (
    <div className="rounded-xl border border-cyan-500/30 bg-black/50 p-4">
      <p className="text-xs tracking-[0.2em] text-cyan-300">MISATO CORE COMMAND</p>
      <div className="mt-2 flex gap-2">
        <input className="flex-1 rounded border border-zinc-700 bg-zinc-900 px-3 py-2" value={command} onChange={(e) => setCommand(e.target.value)} placeholder="Type mission command…" />
        <button onClick={run} disabled={loading || !command.trim()} className="rounded bg-cyan-400 px-3 py-2 font-semibold text-black disabled:opacity-50">{loading ? "Running" : "Run"}</button>
      </div>
      {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}
      {result ? (
        <div className="mt-3 grid gap-3 text-sm">
          <div className="rounded border border-zinc-700 p-2">{result.missionSummary}</div>
          <div className="grid gap-2 md:grid-cols-2">
            <div className="rounded border border-zinc-700 p-2"><b>Project:</b> {result.projectDetected}</div>
            <div className="rounded border border-zinc-700 p-2"><b>Approval:</b> {result.approvalRequired ? "Required" : "Not required"}</div>
          </div>
          <div className="rounded border border-zinc-700 p-2"><b>Council:</b> {result.agentsAssigned.join(", ")}</div>
          <div className="rounded border border-zinc-700 p-2">
            <b>Live/Mock Activity:</b>
            <ul className="mt-1 list-disc pl-5 text-zinc-300">{result.activityFeed.map((a) => <li key={a}>{a}</li>)}</ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}
