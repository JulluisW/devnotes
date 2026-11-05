// 📘 Day 1: A NESTED layout. It wraps /posts AND /posts/[slug].
// Render order: RootLayout → PostsLayout → page.
// When you go from one post to another, this layout stays mounted,
// so the Scratchpad keeps its text. Only {children} is swapped.
import Link from "next/link";
import { Scratchpad } from "@/components/scratchpad";
import { getAllPosts } from "@/lib/posts";

export default function PostsLayout({ children }: LayoutProps<"/posts">) {
  const posts = getAllPosts();

  return (
    <div className="grid gap-10 md:grid-cols-[1fr_220px]">
      <div className="min-w-0">{children}</div>

      <aside className="space-y-8 md:sticky md:top-6 md:self-start">
        <nav aria-label="All posts">
          <p className="text-xs font-medium uppercase tracking-wide text-foreground/50">
            All posts
          </p>
          <ul className="mt-2 space-y-2 text-sm">
            {posts.map((post) => (
              <li key={post.slug}>
                <Link
                  href={`/posts/${post.slug}`}
                  className="text-foreground/70 hover:text-foreground hover:underline"
                >
                  {post.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <Scratchpad />
      </aside>
    </div>
  );
}
