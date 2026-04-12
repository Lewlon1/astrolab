import BlogEditorForm from "@/components/admin/BlogEditorForm";
import type { BlogPost } from "@/types";

export default async function NewBlogPostPage({
  searchParams,
}: {
  searchParams: Promise<{ title?: string }>;
}) {
  const params = await searchParams;
  const prefillTitle = params.title || "";

  if (prefillTitle) {
    const partial = { title: prefillTitle } as BlogPost;
    return <BlogEditorForm initialData={partial} />;
  }

  return <BlogEditorForm />;
}
