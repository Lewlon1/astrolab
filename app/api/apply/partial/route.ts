// POST /api/apply/partial: application step 1 (email + consent). Saves a partial lead
// so the email is kept even if the visitor leaves straight after.
// Never logs the body or email.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { addPartial } from "@/lib/apply/mailerlite";
import { recordLpEvent, upsertApplyLead, type LpContext } from "@/lib/apply/events";
import { partialLimiter } from "@/lib/apply/rateLimit";
import { variantFromRequest } from "@/lib/apply/requestContext";
import { validatePartial } from "@/lib/apply/validate";
import { clientIp } from "@/lib/lab/rateLimit";
import { readJson } from "@/lib/lab/routeHelpers";
import { APPLICATION_UI } from "@/content/apply/application";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!partialLimiter.allow(clientIp(request.headers))) {
    return NextResponse.json({ error: APPLICATION_UI.errors.rateLimited }, { status: 429 });
  }
  const body = await readJson(request);
  if (body === undefined) return NextResponse.json({ error: APPLICATION_UI.errors.generic }, { status: 400 });

  const v = validatePartial(body);
  if (!v.ok) return NextResponse.json({ field: v.field, error: v.message }, { status: 400 });
  const input = v.value;

  const ctx: LpContext = {
    ...variantFromRequest(request, (body as Record<string, unknown>).variant),
    concept: input.concept,
    market: input.market,
    utm: input.utm,
  };

  const admin = createAdminClient();
  const leadId = await upsertApplyLead(admin, input.email, ctx, input.sessionKey);
  if (!leadId) return NextResponse.json({ error: APPLICATION_UI.errors.generic }, { status: 500 });

  await Promise.all([
    recordLpEvent(admin, {
      leadId,
      type: "lp_email_captured",
      ctx,
      extra: { consent_version: input.consentVersion, has_reading: Boolean(input.reading) },
    }),
    addPartial(input.email, {
      lab_card: input.reading?.card,
      sun_sign: input.reading?.sun,
      moon_sign: input.reading?.moon,
    }),
  ]);

  return NextResponse.json({ ok: true, leadId });
}
