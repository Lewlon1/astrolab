import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { LangProvider } from "@/context/LangContext";
import { AnalyticsProvider } from "@/context/AnalyticsContext";
import CalendlyConversionListener from "@/components/analytics/CalendlyConversionListener";
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
        <CalendlyConversionListener />
      </AnalyticsProvider>
    </LangProvider>
  );
}
