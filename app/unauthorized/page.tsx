export default function UnauthorizedPage() {
  return (
    <main className="min-h-screen bg-[#06090f] text-white grid place-items-center p-6">
      <div className="max-w-xl rounded-xl border border-red-500/40 bg-red-950/20 p-8">
        <p className="text-xs tracking-[0.2em] text-red-300">ACCESS DENIED</p>
        <h1 className="mt-2 text-3xl font-black">Unauthorized Operator</h1>
        <p className="mt-3 text-zinc-300">This dashboard is owner-only. Your account is not on the allowlist.</p>
      </div>
    </main>
  );
}
