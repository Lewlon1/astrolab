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
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem",
          marginBottom: "2rem",
        }}
      >
        {services.map((service, i) => {
          const isActive = i === activeIndex;
          return (
            <button
              key={service.id}
              onClick={() => setActiveIndex(i)}
              style={{
                fontSize: "0.85rem",
                padding: "0.5rem 1.1rem",
                borderRadius: "50px",
                border: "1px solid",
                background: isActive ? "var(--deep-brown)" : "transparent",
                color: isActive ? "white" : "var(--text-muted)",
                borderColor: isActive
                  ? "var(--deep-brown)"
                  : "rgba(184,160,112,0.4)",
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.2s",
              }}
            >
              {service.name}
              {service.price_label && (
                <span style={{ marginLeft: "0.4rem", opacity: 0.7 }}>
                  · {service.price_label}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Calendly embed or fallback */}
      {activeUrl ? (
        <div
          ref={containerRef}
          style={{ minWidth: "320px", minHeight: "700px" }}
        />
      ) : (
        <div
          style={{
            textAlign: "center",
            padding: "4rem 2rem",
            background: "white",
            border: "1px solid rgba(184,160,112,0.3)",
            borderRadius: "16px",
          }}
        >
          <p
            style={{
              color: "var(--text-muted)",
              marginBottom: "1rem",
              fontWeight: 300,
            }}
          >
            Online booking isn&apos;t available for this service yet.
          </p>
          <a href={`mailto:${BRAND.site.email}`} className="btn-primary">
            Contact me to book
          </a>
        </div>
      )}
    </>
  );
}
