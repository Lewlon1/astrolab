import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { BlogPost } from "@/types";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";

const pillarColors: Record<string, string> = {
  Decode: "bg-cyan-50 text-cyan-700",
  Reframe: "bg-orange-50 text-orange-700",
  Navigate: "bg-green-50 text-green-700",
  Align: "bg-amber-50 text-amber-700",
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function AdminBlogPage() {
  const supabase = await createClient();

  const { data: posts } = await supabase
    .from("blog_posts")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<BlogPost[]>();

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Blog"
        action={{ label: "New post", href: "/admin/blog/new" }}
      />

      <div className="bg-white border border-[#e8e5df] rounded-xl overflow-hidden">
        {posts && posts.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e8e5df] text-left">
                <th className="px-6 py-3 text-xs font-medium text-[#6b6560] uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-xs font-medium text-[#6b6560] uppercase tracking-wider">
                  Pillar
                </th>
                <th className="px-6 py-3 text-xs font-medium text-[#6b6560] uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-xs font-medium text-[#6b6560] uppercase tracking-wider">
                  Published
                </th>
                <th className="px-6 py-3 text-xs font-medium text-[#6b6560] uppercase tracking-wider">
                  Reading time
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0ede8]">
              {posts.map((post) => (
                <tr
                  key={post.id}
                  className="group hover:bg-[#f5f3ef] transition-colors"
                >
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/blog/${post.id}`}
                      className="text-sm font-medium text-[#1a1a18] hover:underline"
                    >
                      {post.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    {post.pillar ? (
                      <span
                        className={`inline-block text-xs px-2.5 py-0.5 rounded-full font-medium ${pillarColors[post.pillar] ?? ""}`}
                      >
                        {post.pillar}
                      </span>
                    ) : (
                      <span className="text-sm text-[#b8b0a4]">&mdash;</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {post.is_published ? (
                      <span className="inline-block text-xs px-2.5 py-0.5 rounded-full font-medium bg-green-50 text-green-700">
                        Published
                      </span>
                    ) : (
                      <span className="inline-block text-xs px-2.5 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">
                        Draft
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#6b6560]">
                    {formatDate(post.published_at) ?? <span className="text-[#b8b0a4]">&mdash;</span>}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#6b6560]">
                    {post.reading_time_min ? `${post.reading_time_min} min` : <span className="text-[#b8b0a4]">&mdash;</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-[#b8b0a4]">
              No blog posts yet. Create your first post to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
