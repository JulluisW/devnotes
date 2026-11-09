// 📘 Day 1: [slug] is a DYNAMIC segment. /posts/anything matches this file,
// and the matched value arrives in `params`.
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { AuthorCard } from '@/components/author-card';
import { LikeButton } from '@/components/like-button';
import { RelatedPosts } from '@/components/related-posts';
import { AuthorCardSkeleton, PostSkeleton } from '@/components/skeletons';
import { getPostBySlug, getPostsByTag, getPublishedPosts } from '@/data/posts';
import { formatDate } from '@/lib/format';
import { ClientComponent } from './ClientComponent';

// 📘 generateStaticParams runs at BUILD time and tells Next.js which slugs
// exist, so each post is prerendered to static HTML (great for SEO and speed).
// This replaces getStaticPaths from the Pages Router.
// 📘 Day 2: it can be async. Drafts aren't returned by the DAL, so they're never prerendered.
export async function generateStaticParams() {
  const posts = await getPublishedPosts();
  return posts.map((post) => ({ slug: post.slug }));
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
  const post = await getPostBySlug(slug);

  // 📘 notFound() throws, stops rendering, and shows the nearest not-found.tsx.
  // TypeScript knows it never returns, so `post` is narrowed to `PostDetail` below.
  if (!post) notFound();

  const tags = getPostsByTag(post.tags[0]); // ⏳ fetches in parallel with <AuthorCard> below

  return (
    <article className="space-y-8">
      <header>
        <p className="text-sm text-foreground/50">{formatDate(post.publishedAt)}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{post.title}</h1>
      </header>

      <div className="space-y-4 leading-7 text-foreground/80">
        {post.content.split('\n\n').map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>

      {/* 📘 A Client Component island inside a Server Component page.
          Only this button's JS is sent to the browser. */}
      <LikeButton initialLikes={post.likes} />

      <Suspense fallback={<div>Loading...</div>}>
        <ClientComponent promise={tags} />
      </Suspense>

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
