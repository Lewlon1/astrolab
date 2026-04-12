import Link from "next/link";
import { ServiceCardProps } from "@/types";

export default function ServiceCard({ service }: ServiceCardProps) {
  const isMostPopular = service.tag === "Most popular";
  const isLeadMagnet = service.tag === "Lead magnet";
  const isFree = service.price === 0;

  return (
    <div
      className={`bg-[rgba(255,255,255,0.03)] border rounded-[14px] p-6 flex flex-col ${
        isMostPopular
          ? "border-gold/30"
          : "border-[rgba(255,255,255,0.06)]"
      }`}
    >
      {service.tag && (
        <span
          className={`self-start text-xs uppercase tracking-wider px-3 py-1 rounded-full ${
            isMostPopular
              ? "bg-gold/10 text-gold"
              : "bg-white/5 text-cream/50"
          }`}
        >
          {service.tag}
        </span>
      )}

      <h3 className="font-heading text-xl mt-4">{service.name}</h3>

      <div className="flex items-baseline gap-2 mt-2">
        <span className="text-cream text-lg">{service.price_label}</span>
        {service.duration && (
          <span className="text-cream/40 text-sm">{service.duration}</span>
        )}
      </div>

      <p className="mt-3 text-sm text-cream/50 line-clamp-3 flex-1">
        {service.short_description}
      </p>

      <Link
        href={
          isLeadMagnet
            ? "#lead-capture"
            : service.calendly_url || `/services/${service.slug}`
        }
        className={`mt-6 inline-flex items-center justify-center text-sm font-medium rounded-[22px] px-5 py-2.5 transition-colors ${
          isFree
            ? "border border-cream/20 text-cream hover:border-cream/40"
            : "bg-gold text-midnight hover:bg-gold/90"
        }`}
      >
        {isFree ? "Get yours free" : "Book session"}
      </Link>
    </div>
  );
}
