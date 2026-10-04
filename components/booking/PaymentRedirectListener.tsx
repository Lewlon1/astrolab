"use client";

import { useEffect } from "react";
import { getCalApi } from "@calcom/embed-react";
import { paymentLinkFor } from "@/lib/booking";
import { takeArmedPaymentUrl } from "@/lib/payments/payRedirect";

/**
 * Pay-after-booking: when a Cal booking completes for a service with a
 * payment_url, send the client to its Stripe Payment Link with the booking uid
 * as client_reference_id. The Stripe webhook then confirms the booking.
 * Mounted once in the public layout, next to BookingConversionListener.
 */
export default function PaymentRedirectListener() {
  useEffect(() => {
    let cal: Awaited<ReturnType<typeof getCalApi>> | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const onBooked = (e: CustomEvent<{ data: { uid: string | undefined } }>) => {
      const uid = e.detail.data.uid;
      const paymentUrl = takeArmedPaymentUrl();
      if (!uid || !paymentUrl) return;
      // Short delay so the booking_confirmed analytics beacon gets out first.
      timer = setTimeout(() => {
        window.location.assign(paymentLinkFor(paymentUrl, uid));
      }, 400);
    };

    (async () => {
      cal = await getCalApi();
      cal("on", { action: "bookingSuccessfulV2", callback: onBooked });
    })();

    return () => {
      if (timer) clearTimeout(timer);
      cal?.("off", { action: "bookingSuccessfulV2", callback: onBooked });
    };
  }, []);

  return null;
}
