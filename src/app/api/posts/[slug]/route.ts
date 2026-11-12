// 📘 Day 8: GET /api/posts/<slug>, one post as JSON.
// A dynamic segment works exactly like in pages: [slug] in the folder name,
// and the value arrives in `params` (here in the second argument, the "context").
import { getPostBySlug, getPublishedPosts } from '@/data/posts';
import { absoluteUrl } from '@/lib/site';

// 📘 Same as the post page and its picture (Day 6): list the slugs so each
// response is made at build time (●), instead of on the first request.
export async function generateStaticParams() {
  const posts = await getPublishedPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

// 📘 RouteContext<'/api/posts/[slug]'> is generated from the folder structure,
// like PageProps. ctx.params is a Promise<{ slug: string }>.
export async function GET(_request: Request, ctx: RouteContext<'/api/posts/[slug]'>) {
  const { slug } = await ctx.params;
  const post = await getPostBySlug(slug); // cached, tags: posts + post:<slug>

  // 📘 An API must say "not found" with the STATUS CODE, not only in the body.
  // Programs check `response.status`, they don't read your error text.
  if (!post) {
    return Response.json({ error: 'Post not found' }, { status: 404 });
  }

  // 📘 likes are included. A like calls updateTag('post:<slug>') (Day 7), and
  // that tag is on getPostBySlug, so this JSON updates too. One tag, every place.
  return Response.json({ ...post, url: absoluteUrl(`/posts/${post.slug}`) });
}
