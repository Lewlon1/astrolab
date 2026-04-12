interface BraveSearchResult {
  title: string;
  url: string;
  description: string;
  age?: string;
}

interface BraveSearchResponse {
  web?: {
    results: BraveSearchResult[];
  };
}

export async function braveSearch(
  query: string,
  count: number = 10
): Promise<BraveSearchResult[]> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;
  if (!apiKey) {
    throw new Error("BRAVE_SEARCH_API_KEY not set");
  }

  const params = new URLSearchParams({
    q: query,
    count: count.toString(),
    text_decorations: "false",
    search_lang: "en",
  });

  const response = await fetch(
    `https://api.search.brave.com/res/v1/web/search?${params}`,
    {
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": apiKey,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Brave Search API error: ${response.status} ${response.statusText}`
    );
  }

  const data: BraveSearchResponse = await response.json();
  return data.web?.results ?? [];
}

// Run multiple searches in parallel and deduplicate results
export async function braveSearchMultiple(
  queries: string[]
): Promise<BraveSearchResult[]> {
  const results = await Promise.all(
    queries.map((q) => braveSearch(q, 5).catch(() => []))
  );

  const all = results.flat();

  // Deduplicate by URL
  const seen = new Set<string>();
  return all.filter((r) => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });
}
