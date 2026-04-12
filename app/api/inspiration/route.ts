import { NextRequest, NextResponse } from "next/server";
import { braveSearchMultiple } from "@/lib/brave-search";
import { invokeModelJSON, MODELS } from "@/lib/bedrock";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const nicheFilter = body.niche || "all";
    const userContext = body.userContext || "";

    // STEP 1: Search for trending content across niches
    const searchQueries = [
      "trending astrology content Instagram 2026",
      "viral astrology TikTok trends this week",
      "psychology wellness trending Instagram Reels",
      "astrology birth chart trending topics",
      "attachment theory astrology crossover trending",
      "spiritual wellness Barcelona community trends",
    ];

    // Map niche filter values to query keywords
    const nicheKeywordMap: Record<string, string> = {
      all: "",
      astrology: "astrology",
      psychology: "psychology",
      wellness: "wellness",
      crossover: "crossover",
    };

    // Normalise the niche filter
    const nicheKey =
      nicheFilter === "All niches"
        ? "all"
        : nicheFilter === "Astro x Psych"
          ? "crossover"
          : nicheFilter.toLowerCase();

    const keyword = nicheKeywordMap[nicheKey] || "";

    // Filter queries by niche if specified
    const filteredQueries =
      nicheKey === "all"
        ? searchQueries
        : searchQueries.filter((q) =>
            q.toLowerCase().includes(keyword)
          );

    const searchResults = await braveSearchMultiple(
      filteredQueries.length > 0 ? filteredQueries : searchQueries
    );

    // Format search results as context for the AI
    const searchContext = searchResults
      .slice(0, 20)
      .map(
        (r) =>
          `- ${r.title}: ${r.description} (${r.url})${r.age ? ` [${r.age}]` : ""}`
      )
      .join("\n");

    // STEP 2: Analyse with Bedrock Sonnet
    const systemPrompt = `You are a trend analyst for The Astro Psyche Lab, an astrology + psychology brand run by Gabs in Barcelona.

You've been given real search results showing what's currently trending. Analyse them and identify the 5 most relevant trends for Gabs' brand.

For each trend, provide:
1. topic: Short topic name
2. platform: Where it's trending (Instagram Reels, TikTok, Carousels, Pinterest, Threads, All platforms)
3. heat: One of "Surging", "Growing", "Emerging", "Sustained", "Pre-trend"
4. reach: Estimated reach description (e.g. "High engagement this week", "2M+ views", "Growing search volume")
5. niche: Category (Astrology, Psychology, Wellness, Astro x Psych)
6. why_working: 2-3 sentences analysing WHY this resonates psychologically — not just what it is, but what human need it meets
7. top_creators: Array of 2-3 creator handles doing this well (from the search results or your knowledge)
8. gabs_angle: How The Astro Psyche Lab should approach this differently — considering: her psychology background, bilingual English/Spanish audience, Barcelona base, and existing services (Cosmic Quick Hit €25, Stellar Insights €65, Star-Crossed €95 synastry, Cosmic Alliance €180 with astrocartography, Cosmic Check-In €45/mo recurring, free Love & Career Code lead magnet)
9. content_ideas: Array of 4 objects, each with:
   - type: "Blog post" | "Carousel" | "Reel" | "Email" | "Workshop" | "Lead magnet" | "Pinterest series"
   - title: Specific, compelling title
   - pillar: "Decode" | "Reframe" | "Navigate" | "Align"
   - effort: "Low" | "Medium" | "High"

Prioritise crossover trends (astrology × psychology) — these are Gabs' competitive advantage.

Return ONLY a valid JSON array of 5 trend objects. No markdown, no preamble.`;

    const userPrompt = `Here are current search results about trending content in astrology, psychology, and wellness niches:

${searchContext}

${userContext ? `\nAdditionally, Gabs has noticed these trends herself:\n${userContext}\n` : ""}

Analyse these and identify the 5 most relevant and actionable trends for The Astro Psyche Lab.`;

    const trends = await invokeModelJSON(
      MODELS.SONNET,
      systemPrompt,
      userPrompt,
      4096
    );

    return NextResponse.json({
      trends,
      searchResultCount: searchResults.length,
    });
  } catch (error) {
    console.error("Inspiration generation error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate inspiration",
      },
      { status: 500 }
    );
  }
}
