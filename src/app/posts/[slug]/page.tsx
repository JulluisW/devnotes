// 📘 Day 1: [slug] is a DYNAMIC segment. /posts/anything matches this file,
// and the matched value arrives in `params`.
import { Suspense } from 'react';
import { notFound, permanentRedirect } from 'next/navigation';
import { AuthorCard } from '@/components/author-card';
import { LikeButton } from '@/components/like-button';
import { RelatedPosts } from '@/components/related-posts';
import { AuthorCardSkeleton, PostSkeleton } from '@/components/skeletons';
import Link from 'next/link';
import { getPostBySlug, getPublishedPosts, getRenamedPostSlug } from '@/data/posts';
import { formatDate } from '@/lib/format';

// 📘 generateStaticParams runs at BUILD time and tells Next.js which slugs
// exist, so each post is prerendered to static HTML (great for SEO and speed).
// This replaces getStaticPaths from the Pages Router.
// 📘 Day 2: it can be async. Drafts aren't returned by the DAL, so they're never prerendered.
export async function generateStaticParams() {
  const posts = await getPublishedPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

// 📘 Day 4: THE STATUS CODE IS SENT WITH THE FIRST BYTE.
// Before today, a never-seen slug like /posts/nope got the App Shell immediately
// (header + skeleton, status 200 already sent), and only THEN did notFound() run.
// Too late to change the status, so Next.js could only add <meta name="robots"
// content="noindex">. That's a "soft 404": the browser and Google see 200 OK.
//
// ensureStatic = 'navigation' says: this page must be 100% static (prerendered or
// cached, no request-time data). For a slug that wasn't prerendered, Next.js now
// WAITS for the complete page before sending anything, instead of streaming the
// App Shell first. So notFound() and permanentRedirect() run before the first
// byte, and the response gets a real 404 / 308.
// Bonus: the build now FAILS if someone adds uncached data to this page later.
export const ensureStatic = 'navigation';

// 📘 Notice the page itself is NOT async and does NOT await params.
// `params` is URL data. If we awaited it here, at the top of the page, the
// whole route would have to wait for it, and Next.js 16 warns that the
// navigation can't be instant. Instead we pass the Promise down and await it
// inside <Suspense>. Everything outside the boundary becomes the instant
// "static shell". (Day 3 covers this in depth.)
export default function PostPage({ params }: PageProps<'/posts/[slug]'>) {
  return (
    <Suspense fallback={<PostSkeleton />}>
      <PostContent params={params} />
    </Suspense>
  );
}

// 📘 PageProps<"/posts/[slug]"> is generated from the folder structure, so
// `params` is typed as Promise<{ slug: string }>. Pick<> reuses just that key.
async function PostContent({ params }: Pick<PageProps<'/posts/[slug]'>, 'params'>) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    // 📘 Day 4: EXPECTED errors are not exceptions. A missing post is a normal
    // outcome, so we handle it with intent instead of letting something crash:
    //   - the slug was renamed → permanentRedirect() = 308, old links keep their SEO value
    //   - it never existed     → notFound() = 404 + the nearest not-found.tsx
    // Both work by THROWING a special error that Next.js catches. Never call them
    // inside a try/catch, or your catch swallows the redirect (Day 4 homework #3).
    const currentSlug = await getRenamedPostSlug(slug);
    if (currentSlug) permanentRedirect(`/posts/${currentSlug}`);

    // 📘 notFound() throws, stops rendering, and shows the nearest not-found.tsx
    // (now ./not-found.tsx, a post-specific one). TypeScript knows it never
    // returns, so `post` is narrowed to `PostDetail` below.
    notFound();
  }

  return (
    <article className="space-y-8">
      <header>
        <p className="text-sm text-foreground/50">{formatDate(post.publishedAt)}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{post.title}</h1>
        {/* 📘 Day 4 homework #6: this post's tags are already in `post.tags`.
            No extra query, no promise, no Suspense, no Client Component. */}
        <ul className="mt-3 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <li key={tag} className="rounded-full bg-foreground/5 px-2 py-0.5 text-xs text-foreground/60">
              <Link href={`/tags/${tag}`} className="hover:underline">
                #{tag}
              </Link>
            </li>
          ))}
        </ul>
      </header>

      <div className="space-y-4 leading-7 text-foreground/80">
        {post.content.split('\n\n').map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>

      {/* 📘 A Client Component island inside a Server Component page.
          Only this button's JS is sent to the browser. */}
      <LikeButton initialLikes={post.likes} />

      {/* 📘 Day 2: SEQUENTIAL data. We can only fetch the author AFTER we know
          post.authorId. That dependency is unavoidable, but it doesn't have to
          block the article: the author gets its own <Suspense> boundary, so the
          post content shows first and the author card streams in ~500ms later. */}
      <Suspense fallback={<AuthorCardSkeleton />}>
        <AuthorCard authorId={post.authorId} />
      </Suspense>

      <Suspense fallback={null}>
        <RelatedPosts slug={post.slug} />
      </Suspense>
    </article>
  );
}
