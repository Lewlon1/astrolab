import { getEditorialDate, type EditorialDate } from "@/lib/editorialDate";
import { BRAND } from "@/lib/constants";
import CookieSettingsButton from "@/components/CookieSettingsButton";

type Props = {
  editorialDate?: EditorialDate;
};

export default function SiteFooter({ editorialDate }: Props) {
  const ed = editorialDate ?? getEditorialDate();

  return (
    <footer
      className="px-6 md:px-14 text-center font-dm-mono uppercase"
      style={{
        background: "var(--ed-paper)",
        color: "var(--ed-text-mute)",
        padding: "32px 56px",
        fontSize: 10,
        letterSpacing: "0.22em",
        borderTop: "1px solid var(--ed-ink)",
      }}
    >
      <a
        href={BRAND.site.instagram}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 hover:opacity-70 transition-opacity"
        style={{
          color: "var(--ed-ink-soft)",
          textDecoration: "none",
          marginBottom: 14,
        }}
      >
        <svg
          width={14}
          height={14}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
        @astropsychelab
      </a>
      <div>
        © {ed.year} The Astro Psyche Lab · Barcelona · Made in Spanglish · Issue{" "}
        {ed.issueNum}
      </div>
      <div style={{ marginTop: 10 }}>
        <CookieSettingsButton />
      </div>
    </footer>
  );
}
