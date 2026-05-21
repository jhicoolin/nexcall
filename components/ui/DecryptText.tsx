'use client';
import { useEffect, useRef, useState } from 'react';

// Characters used during scramble — similar visual weight to Latin letters
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

interface DecryptTextProps {
  /** The full phrase to animate. Animate this as ONE unit — never split into multiple instances. */
  text: string;
  className?: string;
  /** Total animation duration in ms (default 1200) */
  duration?: number;
  /** Delay before animation starts in ms (default 0) */
  delay?: number;
  /**
   * Suffix of the text to accent with a different colour after the animation settles.
   * Must be an exact suffix of `text`. E.g. text="Never miss your next call." accentSuffix="next call."
   * Nothing happens during the animation — only applied after done.
   */
  accentSuffix?: string;
  /** Tailwind class(es) applied to accentSuffix after animation settles */
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
  const [displayed, setDisplayed] = useState(text); // start with real text (SSR-safe)
  const [done, setDone] = useState(false);
  const prefersReduced = useRef(false);

  useEffect(() => {
    prefersReduced.current =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Show final text immediately for reduced-motion users
    if (prefersReduced.current) {
      setDisplayed(text);
      setDone(true);
      return;
    }

    // Kick off with scrambled state
    setDisplayed(
      text
        .split('')
        .map((c) => (c === ' ' ? ' ' : CHARS[Math.floor(Math.random() * CHARS.length)]))
        .join('')
    );

    const startTime = performance.now() + delay;
    let raf: number;

    function tick(now: number) {
      if (now < startTime) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Reveal characters left-to-right proportionally
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

  // After animation settles: optionally accent a suffix with a different colour
  if (done && accentSuffix && text.endsWith(accentSuffix)) {
    const prefix = text.slice(0, text.length - accentSuffix.length);
    return (
      <span className={className} aria-label={text}>
        {prefix}
        <span className={accentClassName}>{accentSuffix}</span>
      </span>
    );
  }

  return (
    // aria-label provides the stable text to screen readers so they don't read scrambled chars
    <span className={className} aria-label={text} data-done={done}>
      {displayed}
    </span>
  );
}
