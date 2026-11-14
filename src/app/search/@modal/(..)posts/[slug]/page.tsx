// 📘 Day 10: an INTERCEPTING ROUTE. The folder name `(..)posts/[slug]` means:
// "when someone on /search clicks a link to /posts/<slug>, render THIS file in the
// @modal slot instead of going to the real post page".
//   (.)  = same level   (..) = one level up   (...) = from the app root
// Levels are URL segments. @modal doesn't count, so (..) goes from /search up to
// the root, then into posts/[slug].
//
// What happens:
//   click a result on /search   → the URL becomes /posts/<slug>, this preview opens
//                                 on top of the results (the results stay mounted)
//   Back button / ✕ / Esc       → router.back(): the URL is /search?… again, modal gone
//   refresh, or open the link   → NO interception: the real post page renders
//   in a new tab
// Interception only happens for client-side navigations that START on /search
// (or below it). Links to posts on every other page work as before.
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Modal } from '@/components/modal';
import { PostSkeleton } from '@/components/skeletons';
import { getAuthor } from '@/data/authors';
import { getPostBySlug, getPublishedPosts } from '@/data/posts';
import { formatDate } from '@/lib/format';

// 📘 The address bar shows /posts/<slug>, so the tab title should match. Without
// this, the tab showed the site's default title (measured).
export async function generateMetadata({ params }: PageProps<'/posts/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  return { title: post?.title ?? 'Post not found' };
}

// 📘 The modal is its OWN route, so it doesn't share posts/[slug]/page.tsx's
// generateStaticParams (same trap as the OG image on Day 6).
// Measured without it: `next build` FAILED. With no known slugs, the header's
// <NavLink> (usePathname) has no URL to work with at build time.
// With it, one preview per post is prerendered at build time.
export async function generateStaticParams() {
  const posts = await getPublishedPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

// 📘 Typed as the route it intercepts: the params are the same ({ slug }).
export default function PostPreviewModal({ params }: PageProps<'/posts/[slug]'>) {
  return (
    <Modal>
      {/* 📘 A post added after the build has no prerendered preview yet. This
          fallback shows while its preview loads. */}
      <Suspense fallback={<PostSkeleton />}>
        <PostPreview params={params} />
      </Suspense>
    </Modal>
  );
}

async function PostPreview({ params }: Pick<PageProps<'/posts/[slug]'>, 'params'>) {
  const { slug } = await params;
  const post = await getPostBySlug(slug); // cached: the same entry the post page uses
  if (!post) return <p className="text-sm text-foreground/60">This post doesn&apos;t exist anymore.</p>;
  const author = await getAuthor(post.authorId);

  return (
    <article>
      <p className="text-xs text-foreground/50">
        {formatDate(post.publishedAt)} · {author?.name ?? 'Unknown author'} · ♥ {post.likes}
      </p>
      <h2 className="mt-1 text-2xl font-bold tracking-tight">{post.title}</h2>
      <p className="mt-3 text-foreground/70">{post.excerpt}</p>
      <p className="mt-3 text-xs text-foreground/50">{post.tags.map((tag) => `#${tag}`).join('  ')}</p>
      {/* 📘 A plain <a>, not <Link>. The address bar ALREADY shows /posts/<slug>.
          Measured with a <Link> here: clicking it was intercepted AGAIN, and the
          modal just stayed open. A plain <a> does a full page load, and full
          loads never intercept, so you land on the real post page. */}
      <a href={`/posts/${post.slug}`} className="mt-6 inline-block text-sm font-medium text-blue-600 hover:underline">
        Read the full post →
      </a>
    </article>
  );
}
