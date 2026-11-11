// 📘 Day 4: a SEGMENT-level not-found.tsx. When notFound() is called anywhere in
// /posts/[slug], Next.js renders the CLOSEST not-found.tsx: this one, not app/not-found.tsx.
// It renders inside posts/layout.tsx, so the sidebar and Scratchpad stay.
//
// A 404 page is a dead end unless you give people somewhere to go. This one is
// an async Server Component that suggests real posts. Its data is cached
// ('use cache' in the DAL), so it's prerendered like everything else.
//
// Note: the ROOT app/not-found.tsx also handles URLs that match no route at all
// (like /totally/unknown). Segment-level ones like this only run when notFound()
// is called inside their segment.
import type { Metadata } from 'next';
import Link from 'next/link';
import { getPublishedPosts } from '@/data/posts';
import { baseOpenGraph } from '@/lib/site';

// 📘 Day 5: the tab title for a missing post: "Post not found | DevNotes".
// Next.js only uses it when the page's generateMetadata calls notFound()
// (see loadPost in page.tsx).
//
// 📘 Day 6: without `openGraph`, Next.js points this 404's og:image at
// ./opengraph-image.tsx for the missing slug, a picture that is itself a 404
// (measured). The site-wide picture from baseOpenGraph replaces it.
export const metadata: Metadata = {
  title: 'Post not found',
  openGraph: { ...baseOpenGraph },
};

export default async function PostNotFound() {
  const posts = await getPublishedPosts();

  return (
    <div>
      <p className="text-sm font-medium text-blue-600">404</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">This post doesn&apos;t exist</h1>
      <p className="mt-3 text-foreground/60">
        It may have been unpublished, or the link has a typo. Here&apos;s what we have instead:
      </p>
      <ul className="mt-6 space-y-2">
        {posts.slice(0, 3).map((post) => (
          <li key={post.slug}>
            <Link href={`/posts/${post.slug}`} className="text-blue-600 hover:underline">
              {post.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
