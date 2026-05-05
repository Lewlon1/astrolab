import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { LangProvider } from "@/context/LangContext";
import { getEditorialDate } from "@/lib/editorialDate";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const editorialDate = getEditorialDate();

  return (
    <LangProvider>
      <div className="editorial-page min-h-screen">
        <SiteHeader editorialDate={editorialDate} />
        <main>{children}</main>
        <SiteFooter editorialDate={editorialDate} />
      </div>
    </LangProvider>
  );
}
