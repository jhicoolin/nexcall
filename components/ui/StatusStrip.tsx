'use client';
import { useEffect, useRef, useState } from 'react';

const STATUS_ITEMS = [
  { icon: '🔒', text: 'Response layer active' },
  { icon: '📞', text: 'Call answered' },
  { icon: '✅', text: 'Details captured' },
  { icon: '📅', text: 'Appointment request noted' },
  { icon: '🧾', text: 'Team summary ready' },
  { icon: '👤', text: 'Human handoff available' },
  { icon: '⚡', text: 'No dead-end calls' },
];

export function StatusStrip() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const prefersReduced = useRef(false);

  useEffect(() => {
    prefersReduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced.current) return;

    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % STATUS_ITEMS.length);
        setVisible(true);
      }, 300);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const item = STATUS_ITEMS[index];

  return (
    <div className="flex items-center justify-center gap-2 py-2 bg-[#A8FF00]/5 border-b border-[#A8FF00]/10">
      <div
        className="w-1.5 h-1.5 rounded-full bg-[#A8FF00] animate-pulse"
        aria-hidden="true"
      />
      <span
        className="text-xs font-medium text-[#A8FF00] tracking-wide transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
        aria-live="polite"
        aria-label={`System status: ${item.text}`}
      >
        <span role="img" aria-hidden="true" className="mr-1">{item.icon}</span>
        {item.text}
      </span>
    </div>
  );
}
