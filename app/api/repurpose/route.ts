import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { invokeModelJSON, MODELS } from "@/lib/bedrock";
import type { RepurposeResponse } from "@/types";

export async function POST(request: Request) {
  const body = await request.json();
  const { blog_post_id } = body;

  if (!blog_post_id) {
    return NextResponse.json(
      { error: "blog_post_id is required" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const { data: post, error: fetchError } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("id", blog_post_id)
    .single();

  if (fetchError || !post) {
    return NextResponse.json(
      { error: "Blog post not found" },
      { status: 404 }
    );
  }

  try {
    const systemPrompt = `You are a content repurposing assistant for The Astro Psyche Lab, an astrology + psychology brand run by Gabs in Barcelona. Her voice is warm, insightful, bilingual (English primary, some Spanish), and blends astrological knowledge with psychological depth. She's not fluffy or generic — she's specific, slightly provocative, and always ties insights back to real patterns people can recognise in themselves.

Given a blog post, generate content for each channel below. Return ONLY valid JSON with these exact keys:

{
  "instagram_carousel": {
    "slides": ["slide 1 text", "slide 2", ...],
    "notes": "Design notes for the carousel"
  },
  "instagram_caption": {
    "text": "Full caption text with line breaks...",
    "hashtags": ["relevant", "hashtags"],
    "cta": "Call to action text"
  },
  "email_newsletter": {
    "subject_line": "...",
    "preview_text": "...",
    "body": "Full email body with [name] placeholder..."
  },
  "reel_script": {
    "hook": "First 3 seconds...",
    "body": "Main content 3-20 seconds...",
    "cta": "Call to action..."
  },
  "threads_post": {
    "text": "Punchy thread-style post..."
  },
  "pinterest_pin": {
    "title": "SEO-optimised pin title...",
    "description": "SEO-rich description..."
  }
}

Guidelines per channel:
- Instagram Carousel: 7 slides — hook, misconception, 3 insights, takeaway, CTA. Keep each slide concise (under 30 words).
- Instagram Caption: Engaging, personal tone. Include relevant hashtags (10-15). Under 2200 characters.
- Email Newsletter: Warm, conversational. Use [name] placeholder. Include a clear CTA. Subject line should create curiosity.
- Reel Script: Hook must grab attention in 3 seconds. Total script under 60 seconds. Conversational, not scripted-sounding.
- Threads Post: Punchy, provocative, standalone insight. Under 500 characters. Should spark conversation.
- Pinterest Pin: SEO-optimised title and description. Include relevant keywords naturally.

Return ONLY the JSON object, no other text.`;

    const userMessage = `Repurpose this blog post:

Title: ${post.title}
Pillar: ${post.pillar || "General"}
Excerpt: ${post.excerpt || "No excerpt"}

Full content:
${post.content || "No content available"}`;

    const result = await invokeModelJSON<RepurposeResponse>(
      MODELS.SONNET,
      systemPrompt,
      userMessage,
      4096
    );

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("Repurpose API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI generation failed" },
      { status: 500 }
    );
  }
}
