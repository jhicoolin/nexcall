'use client';

const outcomes = [
  { icon: '📞', text: 'Fewer missed calls.' },
  { icon: '✅', text: 'Cleaner handoffs.' },
  { icon: '⚡', text: 'Faster follow-up.' },
  { icon: '👤', text: 'Human backup when it matters.' },
  { icon: '📅', text: 'Appointment requests noted.' },
  { icon: '🧾', text: 'No dead-end calls.' },
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
    <section className="py-10 border-y border-white/5" aria-label="Common outcomes">
      <div className="max-w-6xl mx-auto px-4">
        <p className="text-center text-xs font-semibold tracking-[0.2em] text-[#4B5563] uppercase mb-6">
          Designed for teams that cannot miss calls
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
          {avatars.map((a) => (
            <div
              key={a.initials}
              className="flex items-center gap-2 bg-white/5 border border-white/[0.08] rounded-full px-3 py-1.5"
              title={a.label}
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                style={{ backgroundColor: a.color }}
                aria-label={a.label}
              >
                {a.initials}
              </div>
              <span className="text-xs text-[#9CA3AF]">{a.label}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {outcomes.map((o) => (
            <div key={o.text} className="flex items-center gap-1.5 text-sm text-[#9CA3AF]">
              <span role="img" aria-hidden="true">{o.icon}</span>
              <span>{o.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
