// Shared Tailwind class strings for the Lab Draw (sunset palette, site fonts).
// Fraunces = display, Cormorant Garamond = italic serif, Caveat = handwritten,
// Spectral = body (inherited from .editorial-page), DM Mono = small uppercase labels.

export const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");

export const EYEBROW = "font-dm-mono text-[12px] font-medium uppercase tracking-[0.14em] text-midBrown m-0";

export const LEDE = "font-heading italic text-[clamp(20px,4vw,24px)] leading-[1.35] text-coral2 m-0 max-w-[34ch]";

export const HAND_NOTE = "font-caveat text-[22px] leading-[1.2] text-coral2 m-0";

export const LABEL = "font-dm-mono text-[12px] font-medium uppercase tracking-[0.1em]";

export const LABEL_ASIDE = "font-caveat normal-case tracking-normal text-[18px] font-medium ml-1";

export const FOCUS = "focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2";

export const INPUT_LIGHT = cx(
  "w-full min-w-0 rounded-[10px] border-[1.5px] border-cardBorder bg-sagePale px-[14px] py-3 text-[16px] text-deepBrown",
  "font-spectral placeholder:text-sage2 aria-[invalid=true]:border-coral2",
  FOCUS,
  "focus-visible:outline-coral2",
);

export const INPUT_DARK = cx(
  "w-full min-w-0 rounded-[10px] border-[1.5px] border-cream2/25 bg-cream2/[0.08] px-[14px] py-3 text-[16px] text-cream2",
  "font-spectral placeholder:text-sageLight [color-scheme:dark] aria-[invalid=true]:border-goldLight",
  FOCUS,
  "focus-visible:outline-goldLight",
);

export const BTN = cx(
  "inline-flex items-center justify-center rounded-full border-[1.5px] px-[22px] py-[14px]",
  "font-dm-mono text-[13px] font-medium uppercase tracking-[0.08em] leading-none cursor-pointer",
  "disabled:cursor-wait disabled:opacity-70",
  FOCUS,
);

export const BTN_LIGHT = cx(
  BTN,
  "border-deepBrown bg-deepBrown text-cream2 hover:border-coral2 hover:bg-coral2 focus-visible:outline-coral2",
);

export const BTN_DARK = cx(
  BTN,
  "border-gold2 bg-gold2 text-deepBrown hover:border-cream2 hover:bg-cream2 focus-visible:outline-goldLight",
);

/** Error text: dark ink with a coloured rule, so contrast holds on cream. */
export const ERROR_LIGHT = "border-l-2 border-coral2 pl-3 text-[14px] font-medium text-deepBrown";
export const ERROR_DARK = "border-l-2 border-goldLight pl-3 text-[14px] font-medium text-cream2";
