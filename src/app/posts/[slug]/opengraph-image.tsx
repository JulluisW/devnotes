// 📘 Day 6: each post gets its OWN preview picture, at
// /posts/<slug>/opengraph-image, with the title, author, date and tags drawn
// on it. Same idea as generateMetadata (Day 5): it receives the post's `slug`,
// loads the post from the cached DAL, and builds the result. Here the result is
// a PNG instead of <meta> tags.
//
// The post page's generateMetadata points og:image at this URL.
import { ImageResponse } from 'next/og';
import { OgCard } from '@/components/og-card';
import { getAuthor } from '@/data/authors';
import { getPostBySlug, getPublishedPosts } from '@/data/posts';
import { formatDate } from '@/lib/format';
import { ogImageSize } from '@/lib/site';

// 📘 This image file is its OWN route, separate from page.tsx. It does NOT reuse
// the page's generateStaticParams. Without this function, the build listed it
// as ƒ: the picture was drawn again on every request (measured: 1.3 s and
// 2 DB queries on the first one). With it, one PNG per post is made during
// `next build` (listed as ●) and served as a file (measured: 12 ms).
export async function generateStaticParams() {
  const posts = await getPublishedPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  // A missing post's page is a 404, so its picture is a 404 too.
  if (!post) return new Response('Not found', { status: 404 });

  const author = await getAuthor(post.authorId);
  const footer = [author?.name, formatDate(post.publishedAt), post.tags.map((tag) => `#${tag}`).join(' ')]
    .filter(Boolean)
    .join('  ·  ');

  return new ImageResponse(<OgCard title={post.title} footer={footer} />, ogImageSize);
}
