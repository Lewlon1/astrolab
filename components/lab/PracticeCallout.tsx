// "Put it into practice": the one thing to try, set apart from the Lab report so it stands out.
// Server-safe (no hooks).
import { LAYER_LABELS } from "@/content/lab/reading";
import { cx } from "./classes";

type Props = {
  text: string;
  className?: string;
};

export default function PracticeCallout({ text, className }: Props) {
  return (
    <aside
      aria-label={LAYER_LABELS.test}
      className={cx("rounded-[14px] border-2 border-gold2 bg-gold2/15 px-[18px] py-5 sm:px-6", className)}
    >
      <p className="m-0 font-dm-mono text-[12px] font-medium uppercase tracking-[0.14em] text-deepBrown">
        <span aria-hidden="true" className="mr-2 text-gold2">✦</span>
        {LAYER_LABELS.test}
      </p>
      <p className="mb-0 mt-2 font-heading text-[clamp(22px,4.5vw,26px)] italic leading-[1.3] text-deepBrown">{text}</p>
    </aside>
  );
}
