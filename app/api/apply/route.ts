// POST /api/apply: the full application. Saves the answers on the lead, logs
// lp_application_submitted, moves the subscriber to "Apply — complete", and returns
// the Cal.com booking params (metadata carries lead_id, variant, concept, UTMs).
// Never logs the body, email or answers.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { calParams, calUrl, APPLY_CAL_LINK } from "@/lib/apply/cal";
import { moveToComplete } from "@/lib/apply/mailerlite";
import { recordLpEvent, saveApplication, type LpContext } from "@/lib/apply/events";
import { applyLimiter } from "@/lib/apply/rateLimit";
import { variantFromRequest } from "@/lib/apply/requestContext";
import { parseUtm, validateApplication } from "@/lib/apply/validate";
import { clientIp } from "@/lib/lab/rateLimit";
import { readJson } from "@/lib/lab/routeHelpers";
import { resolveConcept } from "@/content/apply/concepts";
import { isMarket } from "@/content/apply/offer";
import { APPLICATION_UI } from "@/content/apply/application";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!applyLimiter.allow(clientIp(request.headers))) {
    return NextResponse.json({ error: APPLICATION_UI.errors.rateLimited }, { status: 429 });
  }
  const body = await readJson(request);
  if (body === undefined) return NextResponse.json({ error: APPLICATION_UI.errors.generic }, { status: 400 });

  const v = validateApplication(body);
  if (!v.ok) return NextResponse.json({ field: v.field, error: v.message }, { status: 400 });
  const { leadId, email, answers } = v.value;

  const raw = body as Record<string, unknown>;
  if (!isMarket(raw.market)) return NextResponse.json({ error: APPLICATION_UI.errors.generic }, { status: 400 });
  const ctx: LpContext = {
    ...variantFromRequest(request, raw.variant),
    concept: resolveConcept(raw.concept),
    market: raw.market,
    utm: parseUtm(raw.utm),
  };

  const admin = createAdminClient();
  const saved = await saveApplication(admin, leadId, email, answers);
  if (!saved) return NextResponse.json({ error: APPLICATION_UI.errors.generic }, { status: 500 });

  const name = answers.first_name ?? null;
  await Promise.all([
    // Only non-free-text answers go in the event, so the analytics never hold personal prose.
    recordLpEvent(admin, {
      leadId,
      type: "lp_application_submitted",
      ctx,
      extra: { budget_ready: answers.budget_ready ?? null, focus: answers.focus ?? null },
    }),
    moveToComplete(email, { name }),
  ]);

  const prefill = { leadId, name, email, lp_variant: ctx.lp_variant, concept: ctx.concept, market: ctx.market, utm: ctx.utm };
  return NextResponse.json({ ok: true, cal: { link: APPLY_CAL_LINK, params: calParams(prefill), url: calUrl(prefill) } });
}
