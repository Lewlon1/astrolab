import Link from "next/link";
import { PageHeroProps } from "@/types";

export default function PageHero({
  title,
  subtitle,
  breadcrumb,
}: PageHeroProps) {
  return (
    <section
      style={{
        position: "relative",
        paddingTop: "9rem",
        paddingBottom: "4rem",
        paddingLeft: "1.5rem",
        paddingRight: "1.5rem",
        overflow: "hidden",
        background:
          "linear-gradient(160deg, var(--cream) 0%, var(--gold-pale) 40%, var(--cream) 100%)",
      }}
    >
      <div
        style={{
          position: "relative",
          maxWidth: "900px",
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        {breadcrumb && breadcrumb.length > 0 && (
          <nav
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.75rem",
              color: "var(--text-light)",
              marginBottom: "1.5rem",
            }}
          >
            <Link
              href="/"
              style={{
                color: "inherit",
                textDecoration: "none",
              }}
            >
              Home
            </Link>
            {breadcrumb.map((item, i) => (
              <span
                key={i}
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <span>/</span>
                <Link
                  href={item.href}
                  style={{
                    color: "var(--text-muted)",
                    textDecoration: "none",
                  }}
                >
                  {item.label}
                </Link>
              </span>
            ))}
          </nav>
        )}

        <p className="section-eyebrow">The Astro Psyche Lab</p>
        <h1
          style={{
            fontFamily: "var(--font-cormorant), serif",
            fontSize: "clamp(2.5rem, 5vw, 4rem)",
            fontWeight: 300,
            color: "var(--deep-brown)",
            lineHeight: 1.1,
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            style={{
              marginTop: "1rem",
              fontSize: "1.05rem",
              color: "var(--text-muted)",
              maxWidth: "600px",
              marginLeft: "auto",
              marginRight: "auto",
              lineHeight: 1.7,
              fontWeight: 300,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}
