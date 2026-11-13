'use client';

import { useActionState } from 'react';
import { loginAction, type LoginState } from './actions';

const input =
  'w-full rounded-md border border-foreground/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 aria-invalid:border-red-500';

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, {} as LoginState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium">
          Email
        </label>
        <input id="email" name="email" type="email" autoComplete="username" defaultValue={state.email} aria-invalid={errors.email ? true : undefined} className={input} />
        {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email[0]}</p>}
      </div>
      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium">
          Password
        </label>
        <input id="password" name="password" type="password" autoComplete="current-password" aria-invalid={errors.password ? true : undefined} className={input} />
        {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password[0]}</p>}
      </div>
      {state.error && (
        <p aria-live="polite" className="text-sm text-red-500">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="w-full rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50">
        {pending ? 'Logging in…' : 'Log in'}
      </button>
    </form>
  );
}
