import { useEffect, useState } from "react";
import { bandColor } from "@/data/safepath";

export function SafetyRing({
  score,
  size = 190,
  stroke = 16,
  label,
  animateKey,
}: {
  score: number;
  size?: number;
  stroke?: number;
  label?: string;
  animateKey?: string;
}) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    setShown(0);
    let raf = 0;
    const start = performance.now();
    const dur = 1400;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(score * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score, animateKey]);

  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color = bandColor(score);

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-muted)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * shown) / 100}
          style={{ filter: `drop-shadow(0 0 10px ${color})`, transition: "stroke 0.4s" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center">
        <div
          className="font-display text-5xl font-bold tabular-nums"
          style={{ color }}
        >
          {shown}
        </div>
        <div className="text-[0.7rem] font-semibold uppercase tracking-widest text-muted-foreground">
          {label ?? "/ 100"}
        </div>
      </div>
    </div>
  );
}
