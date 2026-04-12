import { createClient } from "@/lib/supabase/server";
import type { BlogPost, ContentQueueItem } from "@/types";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import RepurposeClient from "@/components/admin/RepurposeClient";

export default async function RepurposePage() {
  const supabase = await createClient();

  const { data: posts } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .returns<BlogPost[]>();

  const { data: queueItems } = await supabase
    .from("content_queue")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<ContentQueueItem[]>();

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Content Repurposer"
        description="Generate multi-channel content from published blog posts"
      />
      <RepurposeClient
        blogPosts={posts ?? []}
        existingQueue={queueItems ?? []}
      />
    </div>
  );
}
