'use client';
import { useEffect, useRef, useState } from 'react';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&';

interface DecryptTextProps {
  text: string;
  className?: string;
  duration?: number; // ms total
  delay?: number;   // ms before starting
}

export function DecryptText({ text, className = '', duration = 1800, delay = 0 }: DecryptTextProps) {
  const [displayed, setDisplayed] = useState(text);
  const [done, setDone] = useState(false);
  const prefersReduced = useRef(false);

  useEffect(() => {
    prefersReduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced.current) { setDisplayed(text); setDone(true); return; }

    const startTime = performance.now() + delay;
    let raf: number;

    function tick(now: number) {
      if (now < startTime) { raf = requestAnimationFrame(tick); return; }
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const revealedCount = Math.floor(progress * text.length);

      setDisplayed(
        text
          .split('')
          .map((char, i) => {
            if (char === ' ') return ' ';
            if (i < revealedCount) return char;
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join('')
      );

      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setDisplayed(text);
        setDone(true);
      }
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, duration, delay]);

  return (
    <span className={className} aria-label={text} data-done={done}>
      {displayed}
    </span>
  );
}
