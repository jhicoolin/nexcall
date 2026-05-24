"use client";

import { FormEvent, useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const res = await fetch("/api/misato/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, token })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: "Login failed." }));
      setError(data.error || "Login failed.");
      return;
    }
    window.location.href = "/misato";
  }

  return (
    <main className="min-h-screen bg-[#06090f] text-white grid place-items-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-xl border border-cyan-500/30 bg-black/50 p-6 space-y-4">
        <p className="text-xs tracking-[0.2em] text-cyan-300">MISATO COMMAND CENTER</p>
        <h1 className="text-2xl font-black">Owner Login</h1>
        <input className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2" placeholder="Owner email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2" placeholder="Admin token" value={token} type="password" onChange={(e) => setToken(e.target.value)} />
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        <button className="w-full rounded bg-cyan-400 px-4 py-2 font-semibold text-black">Enter Owner Mode</button>
      </form>
    </main>
  );
}
