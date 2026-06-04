"use client";

import { FormEvent, useState } from "react";

export default function CommandAccessPage() {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (pending) {
      return;
    }

    setPending(true);
    setError("");

    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
      });

      if (!response.ok) {
        setError("That access token did not work.");
        return;
      }

      window.location.href = "/admin";
    } catch {
      setError("Access is temporarily unavailable. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="system-shell min-h-screen px-6 py-16 text-[#f8fbff]">
      <form
        onSubmit={submit}
        className="metal-panel mx-auto flex max-w-md flex-col gap-4 rounded-[28px] p-8 shadow-[0_32px_90px_rgba(0,0,0,0.42)]"
      >
        <p className="system-label">Private access</p>
        <h1 className="text-3xl font-black">Command center</h1>
        <p className="text-sm leading-6 text-[#93a09f]">
          Authorized operators only. This page does not expose dashboard content until a valid
          session is established.
        </p>
        <input
          value={token}
          onChange={(event) => setToken(event.target.value)}
          type="password"
          autoComplete="current-password"
          placeholder="Access token"
          className="rounded-2xl border border-[rgba(177,248,94,0.18)] bg-[rgba(255,255,255,0.04)] px-4 py-3 text-base text-[#f8fbff] outline-none transition focus:border-[#b1f85e]"
        />
        <button
          disabled={pending}
          className="system-button-primary rounded-2xl px-4 py-3 font-black transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? "Checking..." : "Enter"}
        </button>
        {error ? <p className="text-sm font-semibold text-[#fda4af]">{error}</p> : null}
      </form>
    </main>
  );
}
