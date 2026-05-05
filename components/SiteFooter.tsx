import { getEditorialDate, type EditorialDate } from "@/lib/editorialDate";

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
      © {ed.year} The Astro Psyche Lab · Barcelona · Made in Spanglish · Issue{" "}
      {ed.issueNum}
    </footer>
  );
}
