import Link from "next/link";
import { PageHeroProps } from "@/types";

export default function PageHero({
  title,
  subtitle,
  breadcrumb,
}: PageHeroProps) {
  return (
    <section className="relative pt-32 pb-16 px-6 overflow-hidden">
      {/* Radial gradient background effects */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-deep/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-sage/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-4xl mx-auto text-center">
        {breadcrumb && breadcrumb.length > 0 && (
          <nav className="flex justify-center items-center gap-2 text-sm text-cream/40 mb-6">
            <Link href="/" className="hover:text-cream/60 transition-colors">
              Home
            </Link>
            {breadcrumb.map((item, i) => (
              <span key={i} className="flex items-center gap-2">
                <span>/</span>
                <Link
                  href={item.href}
                  className="hover:text-cream/60 transition-colors"
                >
                  {item.label}
                </Link>
              </span>
            ))}
          </nav>
        )}

        <p className="text-gold text-xs uppercase tracking-[0.2em] font-medium mb-4">
          The Astro Psyche Lab
        </p>
        <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-light">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-4 text-lg text-cream/50 max-w-2xl mx-auto">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}
