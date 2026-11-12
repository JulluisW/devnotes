// 📘 Day 8: the RSS feed at /feed.xml.
// RSS is an XML list of your latest posts. Feed readers (Feedly, NetNewsWire,
// Slack's /feed command, newsletter tools) check it regularly and show new posts
// to subscribers. Next.js has no special file for RSS (unlike sitemap.ts), so we
// write a normal Route Handler that returns XML.
//
// The folder is named "feed.xml", so the URL is /feed.xml. A dot in a folder name is fine.
import { getPublishedPosts } from '@/data/posts';
import { absoluteUrl, site } from '@/lib/site';

// 📘 Post titles are text from the database. A title like "Tips & Tricks <2026>"
// would break the XML, so every value goes through this first.
function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

// 📘 Cached like /api/posts: it only reads cached DAL functions, so it's made at
// build time (○). A new post or a title change from the CMS refreshes it through
// the `posts` tag.
export async function GET() {
  const posts = await getPublishedPosts(); // newest first, drafts already removed

  const items = posts
    .map(
      (post) => `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${absoluteUrl(`/posts/${post.slug}`)}</link>
      <guid isPermaLink="true">${absoluteUrl(`/posts/${post.slug}`)}</guid>
      <description>${escapeXml(post.excerpt)}</description>
      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
      <dc:creator>${escapeXml(post.author.name)}</dc:creator>
${post.tags.map((tag) => `      <category>${escapeXml(tag)}</category>`).join('\n')}
    </item>`,
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(site.name)}</title>
    <link>${absoluteUrl('/')}</link>
    <description>${escapeXml(site.description)}</description>
    <language>en-us</language>
${items}
  </channel>
</rss>`;

  // 📘 The Content-Type header tells the reader "this is an RSS feed", not HTML.
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
