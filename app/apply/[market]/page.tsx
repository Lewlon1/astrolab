// /apply/[market] — ads-only landing page (experiment lp_r1).
// Market, concept (?c=) and variant (cookie set by middleware) are all resolved
// here on the server, so the matching hero is in the first HTML.
import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";
import { CONCEPTS, resolveConcept } from "@/content/apply/concepts";
import { isMarket } from "@/content/apply/offer";
import { PAGE_META } from "@/content/apply/ui";
import { getVariant, isQa } from "@/lib/experiments";
import { LpProvider, LpView } from "@/components/apply/LpContext";
import VariantA from "@/components/apply/VariantA";
import VariantB from "@/components/apply/VariantB";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: PAGE_META.title },
  description: PAGE_META.description,
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

type Params = { market: string };
type SearchParams = { [key: string]: string | string[] | undefined };

export default function ApplyPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  if (!isMarket(params.market)) notFound();
  const market = params.market;
  const concept = resolveConcept(searchParams.c);
  const h = headers();
  const c = cookies();
  const variant = getVariant(h, c);
  const qa = isQa(h, c);
  const hero = CONCEPTS[concept];

  return (
    <LpProvider value={{ variant, concept, market, qa }}>
      <LpView />
      <div className="bg-cream2 text-deepBrown" data-lp-variant={variant}>
        <div className="mx-auto max-w-[720px] px-4 pb-16 pt-8 text-[16px] leading-[1.6] sm:px-6">
          {variant === "b" ? <VariantB hero={hero} market={market} /> : <VariantA hero={hero} market={market} />}
        </div>
      </div>
    </LpProvider>
  );
}
