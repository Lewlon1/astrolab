import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import { LangProvider } from "@/context/LangContext";
import { AnalyticsProvider } from "@/context/AnalyticsContext";
import BookingConversionListener from "@/components/analytics/BookingConversionListener";
import { getEditorialDate } from "@/lib/editorialDate";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const editorialDate = getEditorialDate();

  return (
    <LangProvider>
      <AnalyticsProvider>
        <div className="editorial-page min-h-screen">
          <SiteHeader editorialDate={editorialDate} />
          <main>{children}</main>
          <SiteFooter editorialDate={editorialDate} />
        </div>
        <BookingConversionListener />
        <CookieConsentBanner />
      </AnalyticsProvider>
    </LangProvider>
  );
}
