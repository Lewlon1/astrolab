import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { LangProvider } from "@/context/LangContext";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LangProvider>
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </LangProvider>
  );
}
