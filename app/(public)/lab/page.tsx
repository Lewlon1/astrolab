import type { Metadata } from "next";
import LabDraw from "@/components/lab/LabDraw";
import { LAB_META } from "@/content/lab/ui";
import { parseLabSrc } from "@/lib/lab/validate";

export const metadata: Metadata = {
  // absolute: skip the root "%s | The Astro Psyche Lab" template.
  title: { absolute: LAB_META.title },
  description: LAB_META.description,
  openGraph: {
    title: LAB_META.title,
    description: LAB_META.description,
    url: "/lab",
    // TODO(lab): design and add public/og/lab.png (1200x630) before launch.
    images: [{ url: "/og/lab.png", width: 1200, height: 630, alt: LAB_META.title }],
  },
};

type SearchParams = { [key: string]: string | string[] | undefined };

export default function LabPage({ searchParams }: { searchParams: SearchParams }) {
  const src = parseLabSrc(searchParams.src);
  const authError = searchParams.auth === "error";

  return (
    <div className="bg-cream2 text-deepBrown">
      <div className="mx-auto max-w-[720px] px-4 pb-16 pt-10 text-[16px] leading-[1.6] sm:px-6">
        <LabDraw src={src} authError={authError} />
      </div>
    </div>
  );
}
