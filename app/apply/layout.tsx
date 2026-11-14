// Ads-only landing pages: no site navigation (one goal per page), but the same
// analytics, consent banner and cookie settings as the public site.
import Link from "next/link";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import CookieSettingsButton from "@/components/CookieSettingsButton";
import { LangProvider } from "@/context/LangContext";
import { AnalyticsProvider } from "@/context/AnalyticsContext";
import { BRAND } from "@/content/apply/ui";

export default function ApplyLayout({ children }: { children: React.ReactNode }) {
  return (
    <LangProvider>
      <AnalyticsProvider>
        <div className="editorial-page min-h-screen bg-cream2">
          <header className="bg-cream2">
            <div className="mx-auto flex max-w-[720px] items-center px-4 pt-5 sm:px-6">
              <Link href="/" aria-label={BRAND.homeLabel} className="font-dm-mono text-[12px] font-medium uppercase tracking-[0.16em] text-deepBrown no-underline">
                {BRAND.name}
              </Link>
            </div>
          </header>
          <main>{children}</main>
          <footer className="mx-auto flex bg-cream2 max-w-[720px] flex-wrap items-center gap-4 border-t border-cardBorder px-4 py-6 font-dm-mono text-[11px] uppercase tracking-[0.12em] text-midBrown sm:px-6">
            <Link href="/privacy" className="text-midBrown underline underline-offset-[3px]">
              Privacy
            </Link>
            <CookieSettingsButton />
          </footer>
        </div>
        <CookieConsentBanner />
      </AnalyticsProvider>
    </LangProvider>
  );
}
