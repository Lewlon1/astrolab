// Original sun and star motifs, ported from the prototype's sunSVG / starSVG.
// Output is computed from fixed inputs only (no randomness), so server and client markup match.

type MotifProps = {
  color: string;
  className?: string;
};

type SunProps = MotifProps & { rays: number };

/** Rays alternate long and short around a filled disc, on a 100x100 viewBox. */
export function SunMotif({ color, rays, className }: SunProps) {
  const lines = Array.from({ length: rays }, (_, i) => {
    const a = (i / rays) * Math.PI * 2;
    const long = i % 2 === 0;
    const r1 = 21;
    const r2 = long ? 46 : 36;
    return {
      x1: (50 + r1 * Math.cos(a)).toFixed(2),
      y1: (50 + r1 * Math.sin(a)).toFixed(2),
      x2: (50 + r2 * Math.cos(a)).toFixed(2),
      y2: (50 + r2 * Math.sin(a)).toFixed(2),
      w: long ? 2.4 : 1.6,
    };
  });
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false" className={className}>
      <circle cx="50" cy="50" r="15" fill={color} />
      {lines.map((l, i) => (
        <line
          key={i}
          x1={l.x1}
          y1={l.y1}
          x2={l.x2}
          y2={l.y2}
          stroke={color}
          strokeWidth={l.w}
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

/** Four-pointed star with curved flanks. */
export function StarMotif({ color, className }: MotifProps) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false" className={className}>
      <path
        d="M50 6 C54 38 62 46 94 50 C62 54 54 62 50 94 C46 62 38 54 6 50 C38 46 46 38 50 6Z"
        fill={color}
      />
    </svg>
  );
}

/** Sunset palette hex values used inside the SVGs (Tailwind classes can't reach SVG attributes). */
export const MOTIF_COLORS = {
  gold2: "#E8A838",
  warmRust: "#D4704A",
} as const;
