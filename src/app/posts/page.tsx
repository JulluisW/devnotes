import { PostCard } from "@/components/post-card";
import { getAllPosts } from "@/lib/posts";

export default function PostsPage() {
  const posts = getAllPosts();

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">All posts</h1>
      <p className="mt-2 text-foreground/60">{posts.length} articles so far.</p>
      <div className="mt-8 grid gap-4">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </div>
  );
}
