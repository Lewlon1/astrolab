"use client";

import { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

export default function FAQ({ items }: { items: FAQItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div
      style={{
        borderTop: "1px solid rgba(184, 160, 112, 0.3)",
      }}
    >
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <button
            key={i}
            onClick={() => setOpenIndex(isOpen ? null : i)}
            style={{
              width: "100%",
              textAlign: "left",
              padding: "1.25rem 0",
              background: "transparent",
              border: "none",
              borderBottom: "1px solid rgba(184, 160, 112, 0.3)",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem",
              }}
            >
              <h3
                style={{
                  fontFamily: "var(--font-cormorant), serif",
                  fontSize: "1.15rem",
                  fontWeight: 400,
                  color: "var(--deep-brown)",
                  margin: 0,
                }}
              >
                {item.question}
              </h3>
              <span
                style={{
                  color: "var(--gold)",
                  fontSize: "1.3rem",
                  flexShrink: 0,
                  transition: "transform 0.3s",
                  transform: isOpen ? "rotate(45deg)" : undefined,
                  fontWeight: 300,
                }}
              >
                +
              </span>
            </div>
            {isOpen && (
              <p
                style={{
                  marginTop: "0.75rem",
                  fontSize: "0.9rem",
                  color: "var(--text-muted)",
                  lineHeight: 1.7,
                  paddingRight: "2rem",
                  fontWeight: 300,
                }}
              >
                {item.answer}
              </p>
            )}
          </button>
        );
      })}
    </div>
  );
}
