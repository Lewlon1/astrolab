// "Work with Gabs" on the profile: the primary session highlighted, the others
// smaller beside it, then the membership placeholder. Server-safe (no hooks).
import { lensText } from "@/content/lab/lens";
import { OFFERS_UI } from "@/content/lab/offers";
import { BOOKING_URL } from "@/content/lab/ui";
import type { LabOffer } from "@/lib/lab/offers";
import BookingCta from "./BookingCta";
import { EYEBROW, cx } from "./classes";

type Props = { offers: readonly LabOffer[]; card: string };

const H2 = "m-0 font-fraunces text-[26px] font-medium leading-tight !text-deepBrown";

export default function OfferLadder({ offers, card }: Props) {
  const primary = offers.find((o) => o.role === "primary");
  const others = offers.filter((o) => o.role !== "primary");

  return (
    <section className="mt-14" aria-labelledby="lab-offers">
      <h2 id="lab-offers" className={H2}>
        {OFFERS_UI.title}
      </h2>
      <p className="mb-0 mt-2 max-w-[60ch]">{lensText(OFFERS_UI.intro, { card })}</p>

      {offers.length === 0 ? (
        // Services could not be loaded: one generic booking link.
        <div className="mt-6">
          <BookingCta href={BOOKING_URL} label={OFFERS_UI.book("a session", null)} placement="offers" />
        </div>
      ) : (
        <div className="mt-6 grid gap-4">
          {primary && (
            <article className="rounded-[14px] border-[1.5px] border-deepBrown bg-sagePale p-6">
              <p className={cx(EYEBROW, "text-coral2")}>{OFFERS_UI.startHere}</p>
              <h3 className="mb-0 mt-2 font-fraunces text-[22px] font-medium !text-deepBrown">
                {primary.name}
                {primary.priceLabel && <span className="ml-2 text-[18px] text-midBrown">{primary.priceLabel}</span>}
              </h3>
              <p className="mb-5 mt-2">{lensText(primary.pitch, { card })}</p>
              <BookingCta
                href={primary.href}
                label={OFFERS_UI.book(primary.name, primary.priceLabel)}
                service={primary.slug}
                placement="offers"
              />
            </article>
          )}
          {others.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {others.map((o) => (
                <article key={o.slug} className="flex flex-col rounded-[14px] border-[1.5px] border-cardBorder p-5">
                  <h3 className="m-0 font-fraunces text-[19px] font-medium !text-deepBrown">
                    {o.name}
                    {o.priceLabel && <span className="ml-2 text-[16px] text-midBrown">{o.priceLabel}</span>}
                  </h3>
                  <p className="mb-4 mt-2 flex-1 text-[15px]">{lensText(o.pitch, { card })}</p>
                  <BookingCta
                    href={o.href}
                    label={OFFERS_UI.book(o.name, o.priceLabel)}
                    service={o.slug}
                    placement="offers"
                    variant="secondary"
                  />
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="mb-0 mt-6 text-[14px] text-midBrown">{OFFERS_UI.membershipSoon}</p>
    </section>
  );
}
