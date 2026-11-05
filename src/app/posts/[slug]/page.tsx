// 📘 Day 1: [slug] is a DYNAMIC segment. /posts/anything matches this file,
// and the matched value arrives in `params`.
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { LikeButton } from "@/components/like-button";
import { formatDate, getAllPosts, getPostBySlug } from "@/lib/posts";

// 📘 generateStaticParams runs at BUILD time and tells Next.js which slugs
// exist, so each post is prerendered to static HTML (great for SEO and speed).
// This replaces getStaticPaths from the Pages Router.
export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

// 📘 Notice the page itself is NOT async and does NOT await params.
// `params` is URL data. If we awaited it here, at the top of the page, the
// whole route would have to wait for it, and Next.js 16 warns that the
// navigation can't be instant. Instead we pass the Promise down and await it
// inside <Suspense>. Everything outside the boundary becomes the instant
// "static shell". (Day 3 covers this in depth.)
export default function PostPage({ params }: PageProps<"/posts/[slug]">) {
  return (
    <Suspense fallback={<PostSkeleton />}>
      <PostContent params={params} />
    </Suspense>
  );
}

// 📘 PageProps<"/posts/[slug]"> is generated from the folder structure, so
// `params` is typed as Promise<{ slug: string }>. Pick<> reuses just that key.
async function PostContent({
  params,
}: Pick<PageProps<"/posts/[slug]">, "params">) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  // 📘 notFound() throws, stops rendering, and shows the nearest not-found.tsx.
  // TypeScript knows it never returns, so `post` is narrowed to `Post` below.
  if (!post) notFound();

  return (
    <article>
      <p className="text-sm text-foreground/50">
        {formatDate(post.publishedAt)} · {post.author}
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">{post.title}</h1>

      <div className="mt-6 space-y-4 leading-7 text-foreground/80">
        {post.content.split("\n\n").map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>

      <div className="mt-8 border-t border-foreground/10 pt-6">
        {/* 📘 A Client Component island inside a Server Component page.
            Only this button's JS is sent to the browser. */}
        <LikeButton initialLikes={post.likes} />
      </div>
    </article>
  );
}

function PostSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-hidden>
      <div className="h-4 w-48 rounded bg-foreground/10" />
      <div className="h-8 w-3/4 rounded bg-foreground/10" />
      <div className="h-24 rounded bg-foreground/10" />
    </div>
  );
}
