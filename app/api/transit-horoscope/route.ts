import { NextRequest, NextResponse } from "next/server";
import { invokeModelJSON, MODELS } from "@/lib/bedrock";
import { buildHoroscopePrompt } from "@/lib/transits/buildHoroscopePrompt";
import { SIGNS } from "@/lib/transits/types";
import type {
  TransitHoroscopeRequest,
  TransitHoroscopeResponse,
  HoroscopeRead,
  Sign,
  Placement,
} from "@/lib/transits/types";

const VALID_LANGUAGES = new Set(["en", "es", "both"]);
const SIGN_SET = new Set<Sign>(SIGNS);
const PLACEMENT_SET = new Set<Placement>(["sun", "rising"]);

interface RawBundle {
  reads?: unknown;
}

function validateBundle(raw: RawBundle): {
  ok: boolean;
  reads?: HoroscopeRead[];
  reason?: string;
} {
  if (!raw || !Array.isArray(raw.reads)) {
    return { ok: false, reason: "missing reads array" };
  }
  if (raw.reads.length !== 24) {
    return { ok: false, reason: `expected 24 reads, got ${raw.reads.length}` };
  }

  const seen = new Set<string>();
  const cleaned: HoroscopeRead[] = [];

  for (const entry of raw.reads) {
    if (!entry || typeof entry !== "object") {
      return { ok: false, reason: "non-object read entry" };
    }
    const e = entry as Record<string, unknown>;
    const sign = e.sign;
    const placement = e.placement;
    const content = e.content;

    if (typeof sign !== "string" || !SIGN_SET.has(sign as Sign)) {
      return { ok: false, reason: `invalid sign: ${String(sign)}` };
    }
    if (typeof placement !== "string" || !PLACEMENT_SET.has(placement as Placement)) {
      return { ok: false, reason: `invalid placement: ${String(placement)}` };
    }
    if (typeof content !== "string" || content.trim().length < 20) {
      return { ok: false, reason: `read for ${sign} ${placement} too short` };
    }

    const key = `${sign}-${placement}`;
    if (seen.has(key)) {
      return { ok: false, reason: `duplicate ${key}` };
    }
    seen.add(key);
    cleaned.push({
      sign: sign as Sign,
      placement: placement as Placement,
      content: content.trim(),
    });
  }

  if (seen.size !== 24) {
    return { ok: false, reason: "missing sign/placement pairs" };
  }

  return { ok: true, reads: cleaned };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<TransitHoroscopeRequest>;
    const { transit, language } = body;

    if (!transit || !transit.id || !transit.title) {
      return NextResponse.json({ error: "transit is required" }, { status: 400 });
    }
    if (!language || !VALID_LANGUAGES.has(language)) {
      return NextResponse.json({ error: "invalid language" }, { status: 400 });
    }

    // First attempt
    const first = buildHoroscopePrompt({ transit, language });
    let raw: RawBundle;
    try {
      raw = await invokeModelJSON<RawBundle>(
        MODELS.SONNET,
        first.system,
        first.user,
        4000
      );
    } catch (e) {
      console.warn("transit-horoscope: first attempt parse failed, retrying", e);
      const strict = buildHoroscopePrompt({ transit, language, strict: true });
      raw = await invokeModelJSON<RawBundle>(
        MODELS.SONNET,
        strict.system,
        strict.user,
        4000
      );
    }

    let validation = validateBundle(raw);
    if (!validation.ok) {
      // Retry once with stricter prompt if shape was off.
      console.warn(
        "transit-horoscope: validation failed, retrying once:",
        validation.reason
      );
      const strict = buildHoroscopePrompt({ transit, language, strict: true });
      const retry = await invokeModelJSON<RawBundle>(
        MODELS.SONNET,
        strict.system,
        strict.user,
        4000
      );
      validation = validateBundle(retry);
      if (!validation.ok) {
        return NextResponse.json(
          { error: `Bundle validation failed: ${validation.reason}` },
          { status: 500 }
        );
      }
    }

    const response: TransitHoroscopeResponse = { reads: validation.reads! };
    return NextResponse.json(response);
  } catch (err) {
    console.error("transit-horoscope error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Bedrock generation failed" },
      { status: 500 }
    );
  }
}
