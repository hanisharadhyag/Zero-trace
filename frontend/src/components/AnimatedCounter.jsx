import { useEffect, useRef, useState } from "react";

/**
 * AnimatedCounter — Counts from 0 to target on mount
 * Props: value (number), duration (ms), prefix, suffix, style
 */
export default function AnimatedCounter({
  value = 0,
  duration = 1200,
  prefix = "",
  suffix = "",
  style = {},
}) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef(null);
  const startRef = useRef(null);
  const isFloat = !Number.isInteger(value);

  useEffect(() => {
    const target = parseFloat(value) || 0;
    startRef.current = null;

    const step = (timestamp) => {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * target;

      setDisplay(isFloat ? parseFloat(current.toFixed(1)) : Math.round(current));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration, isFloat]);

  return (
    <span style={style}>
      {prefix}{display}{suffix}
    </span>
  );
}
