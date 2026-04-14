export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <p>
        The Astro Psyche Lab · Barcelona ·{" "}
        <a
          href="https://instagram.com/astropsychelab"
          target="_blank"
          rel="noopener noreferrer"
        >
          @astropsychelab
        </a>{" "}
        · {year}
      </p>
    </footer>
  );
}
