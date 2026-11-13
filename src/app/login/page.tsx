// 📘 Day 9: the login page itself is fully STATIC (○). It doesn't read cookies,
// so it's made at build time. Only the form's action touches the session.
import type { Metadata } from 'next';
import { LoginForm } from './login-form';

export const metadata: Metadata = {
  title: 'Log in',
  // 📘 Day 5: a login page has nothing for Google. Keep it out of search results.
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-sm space-y-6 py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Author login</h1>
        <p className="mt-1 text-sm text-foreground/60">For DevNotes authors. Demo password: devnotes-demo</p>
      </div>
      <LoginForm />
    </div>
  );
}
