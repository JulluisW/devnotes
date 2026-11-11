// 📘 Day 6: a file named opengraph-image becomes a URL that returns a PICTURE:
// this one is /opengraph-image. It's the site-wide picture for link-preview
// cards. app/posts/[slug]/opengraph-image.tsx makes one picture per post.
//
// Which picture a page USES is set in its metadata: `images` in baseOpenGraph
// (src/lib/site.ts) points every page to this one.
//
// It's drawn once, during `next build`, and saved as a PNG file. Visitors and
// Slack get the saved file; nothing is drawn per request.
import { ImageResponse } from 'next/og';
import { OgCard } from '@/components/og-card';
import { ogImageSize } from '@/lib/site';

export default function Image() {
  return new ImageResponse(
    <OgCard title="Learn Next.js by building it." footer="Routing · Data · Caching · SEO · Auth, one day at a time" />,
    ogImageSize,
  );
}
