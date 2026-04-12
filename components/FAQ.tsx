"use client";

import { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

export default function FAQ({ items }: { items: FAQItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="divide-y divide-white/5">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <button
            key={i}
            onClick={() => setOpenIndex(isOpen ? null : i)}
            className="w-full text-left py-5 group"
          >
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-heading text-lg group-hover:text-gold/80 transition-colors">
                {item.question}
              </h3>
              <span
                className={`text-cream/30 text-xl shrink-0 transition-transform ${
                  isOpen ? "rotate-45" : ""
                }`}
              >
                +
              </span>
            </div>
            {isOpen && (
              <p className="mt-3 text-sm text-cream/50 leading-relaxed pr-8">
                {item.answer}
              </p>
            )}
          </button>
        );
      })}
    </div>
  );
}
