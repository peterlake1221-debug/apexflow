import React, { useEffect, useRef, useState } from 'react';

interface AnimatedNumberProps {
  value: number;
  durationMs?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  formatLocale?: boolean;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  durationMs = 450,
  decimals = 0,
  prefix = '',
  suffix = '',
  formatLocale = false,
}) => {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);

  useEffect(() => {
    const startVal = fromRef.current;
    const endVal = value;
    if (startVal === endVal) {
      setDisplay(endVal);
      return;
    }

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      fromRef.current = endVal;
      setDisplay(endVal);
      return;
    }

    let rafId = 0;
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startVal + (endVal - startVal) * eased;
      setDisplay(current);
      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        fromRef.current = endVal;
        setDisplay(endVal);
      }
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [value, durationMs]);

  const rounded =
    decimals > 0
      ? display.toFixed(decimals)
      : formatLocale
        ? Math.round(display).toLocaleString()
        : String(Math.round(display));

  return (
    <span>
      {prefix}
      {rounded}
      {suffix}
    </span>
  );
};
