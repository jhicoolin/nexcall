'use client';
import { useEffect, useRef, useState } from 'react';

// Scramble chars — selected for similar visual weight to reduce perceived width jitter
const CHARS = 'ABCDEFGHIJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz023456789';

interface DecryptTextProps {
  /**
   * The full phrase to animate as ONE unit.
   * Never split this across multiple DecryptText instances — use accentSuffix instead.
   */
  text: string;
  className?: string;
  /** Total animation duration in ms (default 1200) */
  duration?: number;
  /** Delay before animation starts in ms (default 0) */
  delay?: number;
  /**
   * Exact trailing suffix to accent with a different colour after animation settles.
   * Must be an exact suffix of `text`.
   * E.g. text="Never miss your next call." accentSuffix="next call."
   */
  accentSuffix?: string;
  /** Tailwind class(es) applied to accentSuffix once animation is done */
  accentClassName?: string;
}

export function DecryptText({
  text,
  className = '',
  duration = 1200,
  delay = 0,
  accentSuffix,
  accentClassName = 'text-[#A8FF00]',
}: DecryptTextProps) {
  const [scrambled, setScrambled] = useState('');
  const [phase, setPhase] = useState<'idle' | 'animating' | 'done'>('idle');
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      setPhase('done');
      return;
    }

    // Kick off immediately with scrambled chars
    setScrambled(
      text
        .split('')
        .map((c) => (c === ' ' ? ' ' : CHARS[Math.floor(Math.random() * CHARS.length)]))
        .join('')
    );
    setPhase('animating');

    const startTime = performance.now() + delay;

    function tick(now: number) {
      if (now < startTime) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const revealed = Math.floor(progress * text.length);

      setScrambled(
        text
          .split('')
          .map((c, i) => {
            if (c === ' ') return ' ';
            if (i < revealed) return c;
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join('')
      );

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setPhase('done');
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [text, duration, delay]);

  function renderFinal() {
    if (accentSuffix && text.endsWith(accentSuffix)) {
      const prefix = text.slice(0, text.length - accentSuffix.length);
      return (
        <>
          {prefix}
          <span className={accentClassName}>{accentSuffix}</span>
        </>
      );
    }
    return <>{text}</>;
  }

  /*
   * LAYOUT-STABLE APPROACH — zero layout shift:
   *
   * 1. aria-label on the outer span gives screen readers the stable final phrase.
   * 2. An invisible child span renders the FINAL text → permanently reserves the
   *    correct block dimensions so the parent never resizes during animation.
   * 3. An absolute overlay renders scrambled or final text — it does NOT
   *    participate in document flow, so it never causes reflow or layout shift.
   *
   * SSR (phase='idle'): overlay shows real text → visible from first paint.
   * Hydration: JS scrambles then reveals left-to-right → smooth decrypt effect.
   * JS absent: invisible span is hidden by CSS, overlay (phase=idle) shows real text.
   * Reduced motion: skip straight to 'done' → instant final render.
   */
  return (
    <span
      className={`relative block ${className}`}
      aria-label={text}
    >
      {/* Invisible anchor — always present, permanently locks layout to final text dimensions */}
      <span aria-hidden="true" className="invisible select-none">
        {text}
      </span>
      {/* Animated overlay — absolute, never affects layout */}
      <span aria-hidden="true" className="absolute inset-0 select-none">
        {phase === 'done'
          ? renderFinal()
          : phase === 'animating'
          ? scrambled
          : text}
      </span>
    </span>
  );
}
