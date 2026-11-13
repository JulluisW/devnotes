// 📘 Day 9: log in and log out. Both are Server Actions, because only actions
// (and Route Handlers) are allowed to SET cookies.
'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { checkCredentials } from '@/data/auth';
import { createSession, deleteSession } from '@/lib/session';

const loginSchema = z.object({
  email: z.email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
});

export type LoginState = {
  error?: string;
  fieldErrors?: { email?: string[]; password?: string[] };
  email?: string; // refills the email input after an error (Day 7 trap). Never send the password back.
};

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '');
  const parsed = loginSchema.safeParse({ email, password: formData.get('password') });
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors, email };

  const userId = await checkCredentials(parsed.data.email, parsed.data.password);
  // 📘 The SAME message for "no such email" and "wrong password". Two different
  // messages would tell an attacker which emails have accounts.
  if (!userId) return { error: 'Email or password is wrong.', email };

  await createSession(userId); // creates the session row + sets the cookie
  redirect('/dashboard'); // throws, so nothing after this line runs
}

export async function logoutAction(): Promise<void> {
  await deleteSession();
  redirect('/');
}
