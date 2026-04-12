"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { BRAND } from "@/lib/constants";
import type { Service } from "@/types";

declare global {
  interface Window {
    Calendly?: {
      initInlineWidget(opts: {
        url: string;
        parentElement: HTMLElement;
      }): void;
    };
  }
}

export default function CalendlyBooking({
  services,
}: {
  services: Service[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const activeService = services[activeIndex];
  const activeUrl = activeService?.calendly_url;

  useEffect(() => {
    if (!scriptLoaded || !activeUrl || !containerRef.current) return;

    // Clear previous widget
    containerRef.current.innerHTML = "";

    window.Calendly?.initInlineWidget({
      url: activeUrl,
      parentElement: containerRef.current,
    });
  }, [activeUrl, scriptLoaded]);

  return (
    <>
      <Script
        src="https://assets.calendly.com/assets/external/widget.js"
        strategy="lazyOnload"
        onLoad={() => setScriptLoaded(true)}
      />

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {services.map((service, i) => (
          <button
            key={service.id}
            onClick={() => setActiveIndex(i)}
            className={`text-sm px-4 py-2 rounded-full border transition-colors ${
              i === activeIndex
                ? "bg-gold text-midnight border-gold"
                : "border-cream/20 text-cream/60 hover:border-cream/40"
            }`}
          >
            {service.name}
            {service.price_label && (
              <span className="ml-1.5 opacity-60">· {service.price_label}</span>
            )}
          </button>
        ))}
      </div>

      {/* Calendly embed or fallback */}
      {activeUrl ? (
        <div
          ref={containerRef}
          style={{ minWidth: "320px", minHeight: "700px" }}
        />
      ) : (
        <div className="text-center py-24 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-[14px]">
          <p className="text-cream/50 mb-4">
            Online booking isn&apos;t available for this service yet.
          </p>
          <a
            href={`mailto:${BRAND.site.email}`}
            className="inline-flex items-center justify-center text-sm font-medium rounded-[22px] px-6 py-2.5 bg-gold text-midnight hover:bg-gold/90 transition-colors"
          >
            Contact me to book
          </a>
        </div>
      )}
    </>
  );
}
