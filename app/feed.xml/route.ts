import { createClient } from "@/lib/supabase/server";
import { BRAND } from "@/lib/constants";
import type { BlogPost } from "@/types";

export async function GET() {
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .returns<BlogPost[]>();

  const items = (posts ?? [])
    .map(
      (post) => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${BRAND.site.url}/blog/${post.slug}</link>
      <guid isPermaLink="true">${BRAND.site.url}/blog/${post.slug}</guid>
      <description><![CDATA[${post.excerpt || ""}]]></description>
      <pubDate>${new Date(post.published_at!).toUTCString()}</pubDate>
      ${post.pillar ? `<category>${post.pillar}</category>` : ""}
    </item>`
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${BRAND.site.name}</title>
    <link>${BRAND.site.url}</link>
    <description>${BRAND.site.tagline}</description>
    <language>en-gb</language>
    <atom:link href="${BRAND.site.url}/feed.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}
