"use client";

import { useLang } from "@/context/LangContext";
import BookAction from "@/components/booking/BookAction";
import { SERVICES, SERVICE_ORDER } from "@/lib/booking";

// Standalone "choose your reading" grid for /book. Renders all five services
// straight from the SERVICES config (no Supabase) — Cal popups + Stripe links.
export default function BookingGrid() {
  const { lang } = useLang();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {SERVICE_ORDER.map((key) => {
        const s = SERVICES[key];
        const isCal = s.booking.kind === "cal";
        const label = isCal
          ? lang === "en"
            ? "Book →"
            : "Reservar →"
          : lang === "en"
            ? "Order →"
            : "Pedir →";
        const kindHint = isCal
          ? lang === "en"
            ? "Live video reading"
            : "Lectura en vivo"
          : lang === "en"
            ? "Personalised PDF"
            : "PDF personalizado";

        return (
          <div
            key={key}
            style={{
              background: "white",
              border: "1px solid rgba(184, 160, 112, 0.3)",
              borderRadius: "16px",
              padding: "2rem 1.75rem",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 4px 24px rgba(0, 0, 0, 0.04)",
            }}
          >
            <span
              style={{
                alignSelf: "flex-start",
                fontSize: "0.65rem",
                fontWeight: 500,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                padding: "0.25rem 0.75rem",
                borderRadius: "50px",
                background: "var(--cream)",
                color: "var(--text-muted)",
              }}
            >
              {s.tarot}
            </span>

            <h3
              style={{
                fontFamily: "var(--font-cormorant), serif",
                fontSize: "1.5rem",
                fontWeight: 400,
                color: "var(--deep-brown)",
                marginTop: "0.75rem",
                marginBottom: "0.5rem",
              }}
            >
              {s.name}
            </h3>

            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: "0.5rem",
                marginBottom: "0.75rem",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-syne), sans-serif",
                  fontWeight: 700,
                  fontSize: "1.25rem",
                  color: "var(--coral)",
                }}
              >
                {s.price}
              </span>
              {s.durationMin && (
                <span style={{ color: "var(--text-light)", fontSize: "0.85rem" }}>
                  {s.durationMin} min
                </span>
              )}
            </div>

            <p
              style={{
                fontSize: "0.9rem",
                color: "var(--text-muted)",
                lineHeight: 1.7,
                flex: 1,
                fontWeight: 300,
              }}
            >
              {kindHint}
            </p>

            <BookAction
              target={s.booking}
              label={label}
              analyticsName="cta_book_page"
              conversionName="booking_click"
              serviceSlug={s.booking.kind === "cal" ? s.booking.slug : key}
              className="btn-primary"
              style={{
                marginTop: "1.5rem",
                textAlign: "center",
                fontSize: "0.85rem",
                padding: "0.75rem 1.5rem",
                border: "none",
                cursor: "pointer",
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
