// Minimal Cal.com API v2 client: confirm / decline bookings that require
// confirmation. Docs: https://cal.com/docs/api-reference/v2/bookings/confirm-a-booking

import type { CalApi } from "@/lib/payments/types";

const CAL_API = "https://api.cal.com/v2";
const CAL_API_VERSION = "2024-08-13";

export function calApi(
  apiKey: string | undefined = process.env.CAL_API_KEY,
  fetchImpl: typeof fetch = fetch
): CalApi {
  async function post(path: string, body: unknown) {
    if (!apiKey) throw new Error("CAL_API_KEY is not set");
    const res = await fetchImpl(`${CAL_API}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "cal-api-version": CAL_API_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Cal ${path} failed (${res.status}): ${text.slice(0, 300)}`);
    }
  }

  return {
    confirm: (uid) => post(`/bookings/${encodeURIComponent(uid)}/confirm`, {}),
    decline: (uid, reason) =>
      post(`/bookings/${encodeURIComponent(uid)}/decline`, reason ? { reason } : {}),
  };
}
