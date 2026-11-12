// 📘 Day 1: [slug] is a DYNAMIC segment. /posts/anything matches this file,
// and the matched value arrives in `params`.
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound, permanentRedirect } from 'next/navigation';
import { AuthorCard } from '@/components/author-card';
import { Comments } from '@/components/comments';
import { LikeButton } from '@/components/like-button';
import { RelatedPosts } from '@/components/related-posts';
import { AuthorCardSkeleton, LinkListSkeleton, PostSkeleton } from '@/components/skeletons';
import Link from 'next/link';
import { getAuthor } from '@/data/authors';
import { getPostBySlug, getPublishedPosts, getRenamedPostSlug, type PostDetail } from '@/data/posts';
import { formatDate } from '@/lib/format';
import { absoluteUrl, baseOpenGraph, ogImageSize } from '@/lib/site';
import { JsonLd } from '@/components/json-ld';

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

// 📘 Day 4: EXPECTED errors are not exceptions. A missing post is a normal
// outcome, so we handle it with intent instead of letting something crash:
//   - the slug was renamed → permanentRedirect() = 308, old links keep their SEO value
//   - it never existed     → notFound() = 404 + the nearest not-found.tsx
// Both work by THROWING a special error that Next.js catches. Never call them
// inside a try/catch, or your catch swallows the redirect (Day 4 homework #3).
//
// 📘 Day 5: this used to be inside <PostContent>. It's a helper now because
// generateMetadata (below) needs the same "the post, or a 404, or a redirect"
// logic. It never returns null: notFound() and permanentRedirect() stop the
// function, so callers always get a real post.
async function loadPost(slug: string): Promise<PostDetail> {
  const post = await getPostBySlug(slug);
  if (post) return post;

  const currentSlug = await getRenamedPostSlug(slug);
  if (currentSlug) permanentRedirect(`/posts/${currentSlug}`);
  notFound();
}

// 📘 Day 5: generateMetadata builds the <title> and <meta> tags from data.
// Use it when the tags depend on the URL (which post?) or on the database.
// It gets the same `params` as the page.
//
// Loading the post here AND in <PostContent> is still only one DB query:
// getPostBySlug has 'use cache' (Day 3), so the second call reads the saved copy.
//
// Why loadPost() and not `if (!post) return {}`? Next.js only uses the title from
// ./not-found.tsx when notFound() is called HERE. With `return {}`, a missing post
// showed the home page's title in the tab.
//
// ensureStatic = 'navigation' (above) covers this function too. It has to work at
// build time, so it can't use cookies() or uncached data.
export async function generateMetadata({ params }: PageProps<'/posts/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const post = await loadPost(slug);
  const author = await getAuthor(post.authorId);
  const url = `/posts/${post.slug}`;

  return {
    title: post.title, // → "Why Server Components Changed Everything | DevNotes"
    description: post.excerpt, // the grey text Google may show under the blue link
    authors: author ? [{ name: author.name, url: `/authors/${author.id}` }] : [],
    alternates: { canonical: url }, // this post's official address
    // 📘 This object REPLACES the layout's openGraph (the two aren't combined).
    // `...baseOpenGraph` copies siteName and locale back in. Without it, posts had
    // no og:site_name or og:locale (measured).
    openGraph: {
      ...baseOpenGraph,
      // 📘 Day 6: this post's own picture (./opengraph-image.tsx) instead of the
      // site-wide one from baseOpenGraph. X/Twitter copies it, and switches to
      // the large card automatically.
      images: [{ url: `/posts/${post.slug}/opengraph-image`, ...ogImageSize, alt: post.title }],
      type: 'article', // 'article' also outputs the date, author and tags below
      url,
      publishedTime: post.publishedAt,
      authors: author ? [author.name] : [],
      tags: post.tags,
    },
  };
}

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
  // 📘 Returns the post, or throws: 308 for a renamed slug, 404 (→ ./not-found.tsx) otherwise.
  const post = await loadPost(slug);

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
          Only this button's JS is sent to the browser.
          📘 Day 7: it now gets the slug (WHICH post to like), and the count. */}
      <LikeButton slug={post.slug} likes={post.likes} />

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

      {/* 📘 Day 7: comments have their own cache entry (tag `comments:<slug>`)
          and their own <Suspense>, so the article never waits for them. */}
      <Suspense fallback={<LinkListSkeleton count={2} />}>
        <Comments slug={post.slug} />
      </Suspense>

      {/* 📘 Day 6: it needs the author's name, so it waits for getAuthor. It has
          its own <Suspense> so the article doesn't wait for it (same idea as the
          author card above). */}
      <Suspense fallback={null}>
        <PostJsonLd post={post} />
      </Suspense>
    </article>
  );
}

// 📘 Day 6: describes this post to Google as a schema.org "BlogPosting".
// Every URL in it must be a full URL, hence absoluteUrl().
async function PostJsonLd({ post }: { post: PostDetail }) {
  const author = await getAuthor(post.authorId); // cached: same entry generateMetadata used

  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.excerpt,
        datePublished: post.publishedAt,
        url: absoluteUrl(`/posts/${post.slug}`),
        image: absoluteUrl(`/posts/${post.slug}/opengraph-image`),
        keywords: post.tags,
        author: author
          ? { '@type': 'Person', name: author.name, url: absoluteUrl(`/authors/${author.id}`) }
          : undefined,
      }}
    />
  );
}
