import Link from "next/link";
import type { BlogPost } from "@/types";
import LangText from "@/components/LangText";

const PILLAR_LABEL: Record<string, { en: string; es: string }> = {
  Decode: { en: "Decode", es: "Decodifica" },
  Reframe: { en: "Reframe", es: "Reinterpreta" },
  Navigate: { en: "Navigate", es: "Navega" },
  Align: { en: "Align", es: "Alinea" },
};

function formatDate(iso: string | null, lang: "en" | "es"): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString(lang === "en" ? "en-GB" : "es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

type Props = {
  posts: BlogPost[];
};

export default function BlogPreview({ posts }: Props) {
  if (!posts || posts.length === 0) return null;

  return (
    <section
      id="blog"
      className="px-6 md:px-14 py-20 md:py-[120px]"
      style={{ borderBottom: "1px solid var(--ed-rule)" }}
    >
      <div className="max-w-[1280px] mx-auto">
        {/* Section marker */}
        <div className="flex items-center gap-4 mb-10 md:mb-14">
          <span
            className="font-dm-mono"
            style={{
              fontSize: 11,
              letterSpacing: "0.22em",
              color: "var(--ed-text-mute)",
            }}
          >
            Pp. 56
          </span>
          <span
            className="flex-1"
            style={{ height: 1, background: "var(--ed-rule)" }}
          />
          <span
            className="font-dm-mono uppercase"
            style={{
              fontSize: 11,
              letterSpacing: "0.24em",
              color: "var(--ed-rust)",
            }}
          >
            <LangText
              en="Recent Entries"
              es="Entradas Recientes"
            />
          </span>
        </div>
        <h2
          className="font-fraunces m-0 mb-12 md:mb-14"
          style={{
            fontSize: "clamp(40px, 6vw, 72px)",
            fontWeight: 300,
            color: "var(--ed-ink)",
            letterSpacing: "-0.03em",
          }}
        >
          <LangText
            en={
              <>
                From the{" "}
                <em
                  style={{ fontStyle: "italic", color: "var(--ed-rust)" }}
                >
                  journal.
                </em>
              </>
            }
            es={
              <>
                Del{" "}
                <em
                  style={{ fontStyle: "italic", color: "var(--ed-rust)" }}
                >
                  diario.
                </em>
              </>
            }
          />
        </h2>

        <div
          className="grid grid-cols-1 md:grid-cols-3"
          style={{ borderTop: "1px solid var(--ed-ink)" }}
        >
          {posts.map((post, i) => {
            const pillar = post.pillar ?? "Navigate";
            const label =
              PILLAR_LABEL[pillar] ?? { en: pillar, es: pillar };
            return (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="block group"
                style={{
                  padding: "32px 28px 32px 0",
                  borderRight:
                    i < posts.length - 1
                      ? "1px solid var(--ed-rule)"
                      : "none",
                  paddingLeft: i > 0 ? 28 : 0,
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <div
                  className="font-dm-mono uppercase mb-4"
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.22em",
                    color: "var(--ed-rust)",
                  }}
                >
                  <LangText en={label.en} es={label.es} />
                </div>
                <h4
                  className="font-fraunces m-0 mb-4 group-hover:opacity-70 transition-opacity"
                  style={{
                    fontSize: 28,
                    fontWeight: 400,
                    color: "var(--ed-ink)",
                    lineHeight: 1.15,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {post.title}
                </h4>
                {post.excerpt ? (
                  <p
                    className="font-spectral m-0 mb-5"
                    style={{
                      fontSize: 15,
                      color: "var(--ed-ink-soft)",
                      lineHeight: 1.65,
                    }}
                  >
                    {post.excerpt}
                  </p>
                ) : null}
                <div
                  className="font-dm-mono uppercase"
                  style={{
                    fontSize: 10,
                    color: "var(--ed-text-mute)",
                    letterSpacing: "0.12em",
                  }}
                >
                  <DateLine
                    iso={post.published_at}
                    readingMin={post.reading_time_min}
                  />
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/blog"
            className="font-dm-mono uppercase"
            style={{
              fontSize: 11,
              letterSpacing: "0.22em",
              color: "var(--ed-rust)",
              textDecoration: "none",
              borderBottom: "1px solid transparent",
            }}
          >
            <LangText en="Read more →" es="Leer más →" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function DateLine({
  iso,
  readingMin,
}: {
  iso: string | null;
  readingMin: number | null;
}) {
  // Render twice (once per language) inside LangText so the formatting matches the toggle.
  return (
    <LangText
      en={
        <>
          {formatDate(iso, "en").toUpperCase()}
          {readingMin ? ` · ${readingMin} MIN READ` : ""}
        </>
      }
      es={
        <>
          {formatDate(iso, "es").toUpperCase()}
          {readingMin ? ` · ${readingMin} MIN DE LECTURA` : ""}
        </>
      }
    />
  );
}
