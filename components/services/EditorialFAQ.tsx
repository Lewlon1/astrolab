"use client";

import { useState } from "react";
import LangText from "@/components/LangText";

export interface EditorialFAQItem {
  q: { en: string; es: string };
  a: { en: string; es: string };
}

export default function EditorialFAQ({ items }: { items: EditorialFAQItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div style={{ borderTop: "1px solid var(--ed-ink)" }}>
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <button
            key={i}
            onClick={() => setOpenIndex(isOpen ? null : i)}
            className="block w-full text-left"
            style={{
              padding: "24px 0",
              background: "transparent",
              border: "none",
              borderBottom: "1px solid var(--ed-rule)",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <div className="flex items-center justify-between gap-4">
              <h3
                className="font-fraunces m-0"
                style={{
                  fontSize: 20,
                  fontWeight: 400,
                  color: "var(--ed-ink)",
                  letterSpacing: "-0.01em",
                }}
              >
                <LangText en={item.q.en} es={item.q.es} />
              </h3>
              <span
                className="shrink-0"
                style={{
                  color: "var(--ed-rust)",
                  fontSize: 22,
                  fontWeight: 300,
                  transition: "transform 0.3s",
                  transform: isOpen ? "rotate(45deg)" : undefined,
                }}
              >
                +
              </span>
            </div>
            {isOpen && (
              <p
                className="font-spectral m-0"
                style={{
                  marginTop: 12,
                  fontSize: 15,
                  color: "var(--ed-ink-soft)",
                  lineHeight: 1.65,
                  paddingRight: 32,
                }}
              >
                <LangText en={item.a.en} es={item.a.es} />
              </p>
            )}
          </button>
        );
      })}
    </div>
  );
}
