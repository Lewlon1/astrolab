import Link from "next/link";
import { BRAND } from "@/lib/constants";

const QUICK_LINKS = [
  { label: "Services", href: "/services" },
  { label: "Events", href: "/events" },
  { label: "Blog", href: "/blog" },
  { label: "About", href: "/about" },
  { label: "Book now", href: "/book" },
];

export default function SiteFooter() {
  return (
    <footer className="bg-[#0d1d30] border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-12">
          {/* About */}
          <div>
            <p className="font-heading text-lg text-cream">
              {BRAND.site.name}
            </p>
            <p className="mt-3 text-sm text-cream/50 leading-relaxed">
              {BRAND.site.tagline}. Birth chart readings, synastry, and cosmic
              workshops that blend astrology with psychological depth.
            </p>
            <p className="mt-3 text-xs text-cream/30">{BRAND.site.location}</p>
          </div>

          {/* Quick links */}
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gold font-medium mb-4">
              Quick links
            </p>
            <ul className="space-y-2.5">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-cream/50 hover:text-cream transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gold font-medium mb-4">
              Connect
            </p>
            <ul className="space-y-2.5">
              <li>
                <a
                  href={`mailto:${BRAND.site.email}`}
                  className="text-sm text-cream/50 hover:text-cream transition-colors"
                >
                  {BRAND.site.email}
                </a>
              </li>
              <li>
                <a
                  href={BRAND.site.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-cream/50 hover:text-cream transition-colors"
                >
                  @astropsychelab
                </a>
              </li>
            </ul>

            {/* Email capture */}
            <div className="mt-8">
              <p className="text-sm text-cream/80 font-medium mb-3">
                Get your free Love &amp; Career Code
              </p>
              <form className="flex gap-2">
                <input
                  type="email"
                  placeholder="Your email"
                  required
                  className="flex-1 bg-white/5 border border-white/10 rounded-[22px] px-4 py-2 text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:border-gold/40 transition-colors"
                />
                <button
                  type="submit"
                  className="bg-gold text-midnight text-sm font-medium px-5 py-2 rounded-[22px] hover:bg-gold/90 transition-colors flex-shrink-0"
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 mt-12 pt-6 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-cream/30 text-xs">
            &copy; 2026 {BRAND.site.name} &middot; Barcelona
          </p>
          <p className="text-cream/20 text-xs">Astrology meets psychology</p>
        </div>
      </div>
    </footer>
  );
}
