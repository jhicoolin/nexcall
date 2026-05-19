"use client";

import { FormEvent, useState } from "react";

export default function AdminLoginPage() {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const response = await fetch("/api/admin/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token })
    });

    if (!response.ok) {
      setError("That admin token did not work.");
      return;
    }

    window.location.href = "/admin";
  }

  return (
    <main className="min-h-screen bg-[#f8f4ec] px-6 py-16 text-[#101827]">
      <form
        onSubmit={submit}
        className="mx-auto flex max-w-md flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-xl"
      >
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-blue-700">NexCall Admin</p>
        <h1 className="text-3xl font-black">Command center login</h1>
        <input
          value={token}
          onChange={(event) => setToken(event.target.value)}
          type="password"
          placeholder="Admin token"
          className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
        />
        <button className="rounded-xl bg-blue-700 px-4 py-3 font-bold text-white hover:bg-blue-800">
          Enter Dashboard
        </button>
        {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}
      </form>
    </main>
  );
}
