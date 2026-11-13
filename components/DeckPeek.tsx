"use client";

import Image from "next/image";

const CARDS = [
  { src: "/images/The_fool.JPG", rot: -8, offset: -14, delay: "0s" },
  { src: "/images/The_star.jpg", rot: 0, offset: 0, delay: "-1.5s" },
  { src: "/images/The_empress.JPG", rot: 8, offset: 14, delay: "-3s" },
];

const CARD_W = 58;
const CARD_H = 93;
const FAN_W = CARD_W + 28 * 2;
const FAN_H = CARD_H + 12;

export default function DeckPeek() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "relative",
        width: FAN_W,
        height: FAN_H,
      }}
    >
      <style>{`
        @keyframes deckpeek-sway {
          0%, 100% { transform: var(--rest); }
          50% { transform: var(--peak); }
        }
      `}</style>
      {CARDS.map((c, i) => {
        const rest = `translateX(${c.offset}px) rotate(${c.rot}deg)`;
        const peak = `translateX(${c.offset}px) rotate(${c.rot + (i % 2 === 0 ? 2 : -2)}deg)`;
        return (
          <div
            key={c.src}
            style={
              {
                position: "absolute",
                left: "50%",
                top: 0,
                width: CARD_W,
                height: CARD_H,
                marginLeft: -(CARD_W / 2),
                border: "1px solid var(--ed-rust)",
                borderRadius: 3,
                overflow: "hidden",
                background: "#f5ede2",
                boxShadow: "0 6px 12px -4px rgba(58,42,28,.45)",
                zIndex: i === 1 ? 3 : 2,
                transformOrigin: "50% 100%",
                "--rest": rest,
                "--peak": peak,
                animation: `deckpeek-sway 5s ease-in-out infinite ${c.delay}`,
              } as React.CSSProperties
            }
          >
            {/* next/image serves a ~58px-wide copy instead of the full card scans
                (1.2 MB for the three); readiness plan change 10. */}
            <Image
              src={c.src}
              alt=""
              fill
              sizes={`${CARD_W}px`}
              priority
              style={{
                objectFit: "cover",
                filter: "sepia(.15) contrast(1.05)",
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
