import { TestimonialCardProps } from "@/types";

export default function TestimonialCard({
  testimonial,
}: TestimonialCardProps) {
  return (
    <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-[14px] p-6">
      <span
        className="text-gold/20 text-6xl font-heading leading-none select-none"
        aria-hidden="true"
      >
        &ldquo;
      </span>

      <blockquote className="font-heading text-lg italic text-cream/80 -mt-4">
        {testimonial.quote}
      </blockquote>

      <div className="mt-4">
        <p className="text-gold text-sm font-medium">
          {testimonial.client_name}
        </p>
        {testimonial.service_name && (
          <p className="text-cream/40 text-xs mt-0.5">
            {testimonial.service_name}
          </p>
        )}
      </div>
    </div>
  );
}
