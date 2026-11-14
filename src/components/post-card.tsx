import Image from 'next/image';
import Link from 'next/link';
import { ViewTransition } from 'react';
import type { PostSummary } from '@/data/posts';
import { formatDate } from '@/lib/format';

// 📘 Day 2: `import type` is erased at compile time. This component imports
// only the TYPE from the server-only DAL, so it's still safe to render anywhere.
export function PostCard({ post }: { post: PostSummary }) {
  return (
    <article className="flex gap-5 rounded-lg border border-foreground/10 p-5 transition-colors hover:border-foreground/25">
      <div className="min-w-0 flex-1">
        <p className="text-xs text-foreground/50">
          {formatDate(post.publishedAt)} ·{' '}
          <Link href={`/authors/${post.author.id}`} className="hover:text-foreground hover:underline">
            {post.author.name}
          </Link>
        </p>
        <h2 className="mt-1 text-lg font-semibold">
          {/* 📘 Typed routes understand template literals: `/posts/${string}`
              matches the /posts/[slug] route. */}
          <Link href={`/posts/${post.slug}`} className="hover:underline">
            {/* 📘 Day 11: VIEW TRANSITION. The post page wraps its <h1> in a
                <ViewTransition> with the SAME name. When you click, the browser
                moves this title into the heading's place instead of swapping
                pages in one jump. */}
            <ViewTransition name={`post-title-${post.slug}`} share="morph" default="none">
              <span className="inline-block">{post.title}</span>
            </ViewTransition>
          </Link>
        </h2>
        <p className="mt-2 text-sm text-foreground/70">{post.excerpt}</p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <li key={tag} className="rounded-full bg-foreground/5 px-2 py-0.5 text-xs text-foreground/60">
              <Link href={`/tags/${tag}`} className="hover:underline">
                #{tag}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      {/* 📘 Day 11: next/image. The file is 1600×900, but this box is only
          160×90, so Next.js serves a small copy (WebP, 1x and 2x).
          No `preload` here: these cards are below the fold, so the default
          loading="lazy" is right. They only download when you scroll near them.
          alt="" because the picture is decorative (the title is right next to it). */}
      <Image
        src={post.cover}
        alt=""
        width={160}
        height={90}
        className="hidden h-[90px] w-[160px] shrink-0 rounded-md object-cover sm:block"
      />
    </article>
  );
}
