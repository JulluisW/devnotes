import { PostListSkeleton } from '@/components/skeletons';

// 📘 Day 10: this slot's own loading state (see @stats/loading.tsx).
export default function CommentsLoading() {
  return <PostListSkeleton count={2} />;
}
