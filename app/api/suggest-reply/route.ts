import { NextResponse } from "next/server";
import { invokeModel, MODELS } from "@/lib/bedrock";

export async function POST(request: Request) {
  const body = await request.json();
  const { comment, postContext } = body;

  if (!comment || !postContext) {
    return NextResponse.json(
      { error: "Both comment and postContext are required" },
      { status: 400 }
    );
  }

  try {
    const systemPrompt = `You are helping Gabs from The Astro Psyche Lab reply to Instagram comments. Her voice is warm, knowledgeable, encouraging, and specific. She uses astrology terms naturally. She often ends with a question or a soft CTA (like 'Link in bio' or 'DM me'). Keep replies under 150 words. Never use generic responses — always reference something specific from their comment.`;

    const userMessage = `Someone left this comment on my Instagram post:\n\nPost context: ${postContext}\n\nComment: ${comment}\n\nSuggest a reply in my voice.`;

    const reply = await invokeModel(
      MODELS.HAIKU,
      systemPrompt,
      userMessage,
      500
    );

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("Suggest reply API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI generation failed" },
      { status: 500 }
    );
  }
}
