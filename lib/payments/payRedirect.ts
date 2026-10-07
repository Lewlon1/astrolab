// Which Stripe Payment Link (if any) the next completed Cal booking should go
// to. Set when a Cal button is clicked; consumed by PaymentRedirectListener.
// Module state is fine: there is one Cal popup open at a time.

let armedPaymentUrl: string | null = null;

export function armPaymentRedirect(url: string | null): void {
  armedPaymentUrl = url;
}

export function takeArmedPaymentUrl(): string | null {
  const url = armedPaymentUrl;
  armedPaymentUrl = null;
  return url;
}
