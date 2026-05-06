import { NextRequest, NextResponse } from "next/server";
import { invokeModel, MODELS } from "@/lib/bedrock";
import { buildDraftPrompt } from "@/lib/transits/buildDraftPrompt";
import type {
  TransitDraftRequest,
  TransitDraftResponse,
} from "@/lib/transits/types";

const VALID_PILLARS = new Set(["decode", "reframe", "relate", "convert"]);
const VALID_FORMATS = new Set(["reel", "carousel", "caption", "story"]);
const VALID_LANGUAGES = new Set(["en", "es", "both"]);

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<TransitDraftRequest>;
    const { transit, pillar, format, language, angle } = body;

    if (!transit || !transit.id || !transit.title) {
      return NextResponse.json({ error: "transit is required" }, { status: 400 });
    }
    if (!pillar || !VALID_PILLARS.has(pillar)) {
      return NextResponse.json({ error: "invalid pillar" }, { status: 400 });
    }
    if (!format || !VALID_FORMATS.has(format)) {
      return NextResponse.json({ error: "invalid format" }, { status: 400 });
    }
    if (!language || !VALID_LANGUAGES.has(language)) {
      return NextResponse.json({ error: "invalid language" }, { status: 400 });
    }

    const { system, user } = buildDraftPrompt({
      transit,
      pillar,
      format,
      language,
      angle: typeof angle === "string" ? angle : undefined,
    });

    const content = await invokeModel(MODELS.SONNET, system, user, 1500);

    const response: TransitDraftResponse = { content };
    return NextResponse.json(response);
  } catch (err) {
    console.error("transit-draft error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Bedrock generation failed" },
      { status: 500 }
    );
  }
}
