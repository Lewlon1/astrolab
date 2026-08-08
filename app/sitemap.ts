import { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { BRAND } from "@/lib/constants";
import type { BlogPost, Event } from "@/types";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const [{ data: posts }, { data: events }] = await Promise.all([
    supabase
      .from("blog_posts")
      .select("slug, updated_at")
      .eq("is_published", true)
      .returns<Pick<BlogPost, "slug" | "updated_at">[]>(),
    supabase
      .from("events")
      .select("slug, updated_at")
      .eq("is_published", true)
      .returns<Pick<Event, "slug" | "updated_at">[]>(),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BRAND.site.url,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BRAND.site.url}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BRAND.site.url}/services`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BRAND.site.url}/events`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BRAND.site.url}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  const blogPages: MetadataRoute.Sitemap = (posts ?? []).map((post) => ({
    url: `${BRAND.site.url}/blog/${post.slug}`,
    lastModified: new Date(post.updated_at),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const eventPages: MetadataRoute.Sitemap = (events ?? []).map((event) => ({
    url: `${BRAND.site.url}/events/${event.slug}`,
    lastModified: new Date(event.updated_at),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticPages, ...blogPages, ...eventPages];
}
