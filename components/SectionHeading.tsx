import { SectionHeadingProps } from "@/types";

export default function SectionHeading({
  label,
  title,
  description,
  align = "left",
}: SectionHeadingProps) {
  return (
    <div className={align === "center" ? "text-center" : ""}>
      <p className="text-gold text-xs uppercase tracking-[0.2em] font-medium mb-3">
        {label}
      </p>
      <h2 className="font-heading text-3xl md:text-4xl font-light">{title}</h2>
      {description && (
        <p
          className={`mt-3 text-cream/50 max-w-xl${
            align === "center" ? " mx-auto" : ""
          }`}
        >
          {description}
        </p>
      )}
    </div>
  );
}
