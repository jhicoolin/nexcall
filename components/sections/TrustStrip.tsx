'use client';

const outcomes = [
  { icon: '📅', text: 'Appointment requests and call details stay organized.' },
  { icon: '🌙', text: 'After-hours inquiries still get a helpful response.' },
  { icon: '🧾', text: 'Your team receives clean notes for follow-up.' },
  { icon: '👤', text: 'Human backup stays part of the process.' },
];

// Avatar initials for diverse human representation (no fake names/photos)
const avatars = [
  { initials: 'MJ', color: '#1d4ed8', label: 'Business owner' },
  { initials: 'SK', color: '#7c3aed', label: 'Medical office manager' },
  { initials: 'TR', color: '#065f46', label: 'Legal practice coordinator' },
  { initials: 'AL', color: '#b45309', label: 'Real estate team lead' },
  { initials: 'CP', color: '#9d174d', label: 'Home services dispatcher' },
];

export function TrustStrip() {
  return (
    <section className="border-y border-[#d7d0c2] bg-[rgba(255,251,245,0.88)] py-12" aria-label="Common outcomes">
      <div className="max-w-6xl mx-auto px-4">
        <p className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.2em] text-[#6b7280]">
          Built for the calls your team cannot always catch
        </p>
        <h2 className="mx-auto mb-6 max-w-3xl text-center text-3xl font-black text-[#172033] sm:text-4xl">
          Warm, organized call coverage for real service businesses.
        </h2>
        <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
          {avatars.map((a) => (
            <div
              key={a.initials}
              className="flex items-center gap-2 rounded-full border border-[#d7d0c2] bg-white px-3 py-2 shadow-sm"
              title={a.label}
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                style={{ backgroundColor: a.color }}
                aria-label={a.label}
              >
                {a.initials}
              </div>
              <span className="text-xs text-[#4b5a67]">{a.label}</span>
            </div>
          ))}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {outcomes.map((o) => (
            <div key={o.text} className="flex items-start gap-3 rounded-2xl border border-[#e7dece] bg-[#fffdf8] px-4 py-4 text-sm text-[#4b5a67] shadow-sm">
              <span role="img" aria-hidden="true">{o.icon}</span>
              <span>{o.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
