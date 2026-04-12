import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { BlogPost } from "@/types";
import BlogEditorForm from "@/components/admin/BlogEditorForm";

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .single<BlogPost>();

  if (!post) notFound();

  return <BlogEditorForm initialData={post} />;
}
