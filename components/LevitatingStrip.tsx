export default function LevitatingStrip() {
  const ink = "var(--ed-ink)";
  const rust = "var(--ed-rust)";
  const ochre = "var(--ed-ochre)";
  const paper = "var(--ed-paper-deep)";

  return (
    <div
      aria-hidden="true"
      className="relative mx-auto"
      style={{
        width: "100%",
        maxWidth: 760,
        height: 150,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
      }}
    >
      <Star size={14} delay={0} className="lev-twinkle" wrapDelay={0} />
      <Moon delay={0.6} ink={ink} rust={rust} />
      <Star size={10} delay={1.1} className="lev-twinkle" wrapDelay={0.4} />
      <CardShuffle delay={0.9} paper={paper} ink={ink} rust={rust} />
      <Star size={11} delay={0.3} className="lev-twinkle" wrapDelay={0.8} />
      <Sun delay={1.4} ink={ink} ochre={ochre} />
      <Star size={13} delay={0.8} className="lev-twinkle" wrapDelay={1.2} />
    </div>
  );
}

/* ---------- Items ---------- */

function Star({
  size,
  delay,
  className,
  wrapDelay,
}: {
  size: number;
  delay: number;
  className?: string;
  wrapDelay: number;
}) {
  return (
    <span
      className="lev-item"
      style={{
        animationDelay: `-${wrapDelay}s`,
        display: "inline-block",
        lineHeight: 1,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        className={className}
        style={{
          animationDelay: `-${delay}s`,
          color: "var(--ed-rust)",
          display: "block",
        }}
      >
        <path
          d="M12 1.5l1.6 7.4 7.4 1.6-7.4 1.6L12 22.5l-1.6-9.4-7.4-1.6 7.4-1.6z"
          fill="currentColor"
        />
      </svg>
    </span>
  );
}

function Moon({
  delay,
  ink,
  rust,
}: {
  delay: number;
  ink: string;
  rust: string;
}) {
  return (
    <span
      className="lev-item"
      style={{
        animationDelay: `-${delay}s`,
        display: "inline-block",
      }}
    >
      <svg width="42" height="42" viewBox="0 0 48 48" style={{ display: "block" }}>
        <defs>
          <radialGradient id="moonGrad" cx="35%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#F4EFE6" />
            <stop offset="100%" stopColor="#D8C7A8" />
          </radialGradient>
        </defs>
        {/* full disc */}
        <circle cx="24" cy="24" r="16" fill="url(#moonGrad)" stroke={ink} strokeWidth="0.9" />
        {/* crescent shadow */}
        <circle cx="30" cy="22" r="14" fill={ink} opacity="0.78" />
        {/* tiny crater detail */}
        <circle cx="18" cy="26" r="1.2" fill={rust} opacity="0.6" />
        <circle cx="22" cy="20" r="0.7" fill={rust} opacity="0.45" />
      </svg>
    </span>
  );
}

function Sun({
  delay,
  ink,
  ochre,
}: {
  delay: number;
  ink: string;
  ochre: string;
}) {
  return (
    <span
      className="lev-item"
      style={{
        animationDelay: `-${delay}s`,
        display: "inline-block",
      }}
    >
      <svg width="50" height="50" viewBox="0 0 60 60" style={{ display: "block" }}>
        <g className="lev-sun-rays">
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 360) / 12;
            return (
              <line
                key={i}
                x1="30"
                y1="6"
                x2="30"
                y2="13"
                stroke={ochre}
                strokeWidth="1.4"
                strokeLinecap="round"
                transform={`rotate(${angle} 30 30)`}
              />
            );
          })}
        </g>
        <circle cx="30" cy="30" r="11" fill={ochre} stroke={ink} strokeWidth="0.9" />
        {/* tiny face suggestion */}
        <circle cx="27" cy="29" r="0.9" fill={ink} opacity="0.7" />
        <circle cx="33" cy="29" r="0.9" fill={ink} opacity="0.7" />
        <path
          d="M26.5 32.5 Q30 35 33.5 32.5"
          stroke={ink}
          strokeWidth="0.9"
          fill="none"
          opacity="0.7"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

function CardShuffle({
  delay,
  paper,
  ink,
  rust,
}: {
  delay: number;
  paper: string;
  ink: string;
  rust: string;
}) {
  // Three small fanned tarot card backs.
  const cards = [
    { rot: -14, dx: -18, dy: 6, z: 1 },
    { rot: -2, dx: 0, dy: 0, z: 2 },
    { rot: 12, dx: 18, dy: 6, z: 1 },
  ];

  return (
    <span
      className="lev-item"
      style={{
        animationDelay: `-${delay}s`,
        display: "inline-block",
        position: "relative",
        width: 90,
        height: 96,
      }}
    >
      {cards.map((c, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 44,
            height: 70,
            marginLeft: -22,
            marginTop: -35,
            transform: `translate(${c.dx}px, ${c.dy}px) rotate(${c.rot}deg)`,
            background: paper,
            border: `1px solid ${ink}`,
            boxShadow: "0 4px 10px rgba(58,42,28,.28)",
            zIndex: c.z,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* card-back motif */}
          <span
            style={{
              width: 32,
              height: 58,
              border: `1px solid ${rust}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: rust,
              fontStyle: "italic",
              fontFamily: "var(--font-fraunces), Georgia, serif",
              fontSize: 18,
              lineHeight: 1,
            }}
          >
            ✦
          </span>
        </span>
      ))}
    </span>
  );
}
