// 📘 Day 9 homework #3 (Luis), reviewed.
// A second private page. proxy.ts needed no change: its matcher
// '/dashboard/:path*' already covers /dashboard/settings.
//
// Same shape as the dashboard: a static heading (instant) + <Suspense> around
// the part that reads the cookie. Without the <Suspense>, `next build` fails
// (Cache Components: cookies read outside a boundary).
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { logoutAction } from '@/app/login/actions';
import { PostListSkeleton } from '@/components/skeletons';
import { requireUser } from '@/data/auth';

export const metadata: Metadata = {
  title: 'Settings',
  robots: { index: false }, // private pages don't belong in Google
};

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      <Suspense fallback={<PostListSkeleton count={1} />}>
        <Settings />
      </Suspense>
    </div>
  );
}

async function Settings() {
  // 📘 requireUser(), not getCurrentUser(). With getCurrentUser(), a visitor
  // with an expired or made-up cookie (which gets past proxy.ts) would see
  // this page with an empty name instead of being sent to /login.
  const user = await requireUser();

  return (
    <div className="flex items-center justify-between rounded-lg border border-foreground/10 p-4">
      <p className="text-sm">
        Settings for <span className="font-medium">{user.name}</span>
      </p>
      <form action={logoutAction}>
        <button type="submit" className="text-sm text-foreground/60 hover:underline">
          Log out
        </button>
      </form>
    </div>
  );
}
