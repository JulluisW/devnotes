# Day 9: Auth & Proxy (who is asking, and are they allowed?)

**In one sentence:** authors can now **log in**, see a private **dashboard** with their posts (drafts included), and delete comments on **their own** posts only. Nobody else can, not even by sending a hand-made POST.

Branch: `day-09-auth-proxy` (from `day-08-route-handlers`).

> 🔑 **Try it:** go to `/login` and log in as `maya@devnotes.internal`, `rafael@devnotes.internal` or `sora@devnotes.internal`. The password for all three is **`devnotes-demo`** (it's also shown on the login page).
>
> 💾 Sessions live in the server's memory, like the rest of the fake DB. **Restarting the server logs everyone out.**

---

## ⭐ Must know (4 things)

| # | What | File | One-line job |
|---|---|---|---|
| 1 | Session cookie | `src/lib/session.ts` | how the server remembers "this browser is Maya" |
| 2 | Auth checks in the DAL | `src/data/auth.ts`, `src/data/comments.ts` | "who is asking?" and "are they allowed?", answered next to the data |
| 3 | Private pages | `app/dashboard/page.tsx` | reading the cookie means `<Suspense>` and a ◐ page |
| 4 | Proxy | `src/proxy.ts` | a fast first filter that runs before the page |

Everything after the "Details" heading is **OK to skip for now**.

What's new in the app:
- `/login`: the login form
- `/dashboard`: your posts (with drafts, likes and comment counts), the comments on your posts with **Delete** buttons, and **Log out**
- a **Dashboard** link in the header
- the Delete buttons on public post pages are gone. They moved to the dashboard.

---

## 1. Cookies and sessions: how the server remembers you

**The problem:** HTTP has no memory. Every request arrives on its own. Without help, the server can't tell that the request for `/dashboard` comes from the same person who just logged in.

**A cookie** is a small value that the server asks the browser to store. The browser then **sends it back automatically with every request** to that site.

**Login, step by step** (`loginAction` → `createSession`):

| Step | Where | What happens |
|---|---|---|
| 1 | browser | POST with the email + password (a Server Action) |
| 2 | server | `checkCredentials`: find the author by email, compare the password with the saved **hash** |
| 3 | server | create a session row: `{ id: '<64 random characters>', userId: 'maya', expiresAt: <in 7 days> }` |
| 4 | server → browser | `Set-Cookie: devnotes_session=<that random id>` + redirect to `/dashboard` |
| 5 | every request after that | the browser sends `devnotes_session=…`, and the server looks up the id: "that's Maya" |

**The cookie is only a random ticket number.** It doesn't contain "maya". The server keeps the list of valid tickets. **Log out** deletes the ticket on the server **and** the cookie in the browser, so a copied cookie stops working right away.

**The cookie options** (`src/lib/session.ts`):

| Option | What it does | Why |
|---|---|---|
| `httpOnly: true` | JavaScript in the page **can't read** it | if an attacker injects a script (XSS), they still can't steal the session. **Measured:** after login, `document.cookie` doesn't contain `devnotes_session` |
| `secure` | only sent over https (in production) | nobody on the café Wi-Fi can read it. Browsers make an exception for `http://localhost` |
| `sameSite: 'lax'` | not sent with POSTs coming from **other** sites | another site can't make your browser submit a form to DevNotes as you (that attack is called CSRF) |
| `expires` | the browser deletes it after 7 days | sessions don't live forever |
| `path: '/'` | sent with every URL on the site | |

**Passwords are stored as a hash** (`src/lib/password.ts`), never as text. A hash is a one-way scramble: at login, we hash what the user typed and compare the two hashes.

**Same error message for both mistakes** (measured): a wrong password and an unknown email both say "Email or password is wrong.". Different messages would tell an attacker which emails have accounts. The email input is refilled after an error (the Day 7 trick); the password never is.

- **Who can set cookies?** Only Server Actions, Route Handlers and proxy. A page can only **read** them, because it's already streaming when it runs.

## 2. Auth checks belong in the DAL

**`src/data/auth.ts`** answers "who is asking?":
```ts
getCurrentUser()  // → { id: 'maya', name: 'Maya Chen' }, or null
requireUser()     // → the user, or redirect('/login')
```

**"Are they allowed?" sits next to the data.** Comment deletion (`src/data/comments.ts`):
```ts
export async function deleteComment(postSlug: string, id: number) {
  const user = await getCurrentUser();
  const post = await db.posts.findBySlug(postSlug);
  if (!user || !post || post.authorId !== user.id) return 'forbidden';  // ← the rule
  …
}
```

**Why not just hide the button?** Because the button is only UI. Measured on a production build:

| Who | How | Result |
|---|---|---|
| logged out | hand-made POST to `deleteCommentAction` with `curl` | refused (sent to `/login`), comment still there |
| **Rafael** (logged in) | hand-made POST from his browser for a comment on **Maya's** post | `200`, but **nothing deleted**. The terminal shows no `comments.delete` |
| Maya | the Delete button on her dashboard | deleted. The public post page shows "No comments yet" (the `comments:<slug>` tag, Day 7) |

Rafael's request got past everything except the DAL check. **That's why the rule lives in the DAL:** every caller, from every page, action or API, hits the same check.

- **The action checks too**, at a coarser level: `deleteCommentAction` calls `requireUser()` first ("logged in at all?"). The DAL then checks "is it **your** post?". Two layers, and neither depends on the button.
- **The dashboard data** (`src/data/dashboard.ts`) has **no `userId` argument**. It takes the user from the session. There's no way to ask for someone else's dashboard.
- **⚠️ Never `'use cache'` for "the current user".** `'use cache'` saves one result **for everyone** (Day 3), so Maya's dashboard would be shown to Rafael. `getCurrentUser` uses `React.cache` instead, which lasts only for one request.

## 3. Private pages: `<Suspense>` and ◐

A page that reads the cookie depends on **who's visiting**, so it can't be made at build time (there's no visitor at build time).

```tsx
export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>                                  {/* static shell: instant */}
      <Suspense fallback={<PostListSkeleton count={2} />}>
        <Dashboard />                                     {/* reads the cookie: per visitor */}
      </Suspense>
    </div>
  );
}
```

- **With Cache Components, reading cookies outside `<Suspense>` fails the build.** The boundary marks where "per visitor" starts.
- **Measured build table:**
  ```
  ├ ◐ /dashboard           ← static shell + a per-visitor part
  ├ ○ /login               ← the form is static; only its action touches the session
  ƒ Proxy (Middleware)
  ```
  Every public page (posts, tags, authors…) is **still ○ or ◐ as before**.
- **That's why the header has a plain "Dashboard" link,** not "Hi Maya / Log in". The header is in the root layout, on every page. Reading the cookie there would make **every** page depend on the visitor, and none could be made at build time. For a blog, keeping the public pages static is worth more than a greeting.

## 4. `proxy.ts`: a fast first filter

`src/proxy.ts` runs **before** a request reaches a page (it was called "middleware" before Next.js 16). `matcher` limits it to `/dashboard`:

```ts
export function proxy(request: NextRequest) {
  if (!request.cookies.has('devnotes_session')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.next();
}
export const config = { matcher: ['/dashboard/:path*'] };
```

**Measured:**

| Request | Proxy | Page | Visitor gets |
|---|---|---|---|
| no cookie | redirects | **never runs** | `307 → /login` |
| fake cookie `devnotes_session=made-up` | lets it through (a cookie exists) | `requireUser()` finds no such session → `redirect('/login')` | `200`, then the browser goes to `/login` |
| after Log out | redirects (the cookie is gone) | never runs | `307 → /login` |
| real session | lets it through | renders the dashboard | the dashboard |

- **Proxy only checks that the cookie exists.** It doesn't look the session up, for two reasons:
  - it runs on many requests (prefetches too), so it must be fast
  - the docs say proxy shouldn't rely on the app's shared modules, and our session list is in the app's memory
- **So proxy is not the security.** The fake cookie got past it. The real check is `requireUser()` in the DAL. Proxy just saves a render for the common "not logged in at all" case.
- **The fake-cookie row returns `200`, not `307`:** that's Day 4 again. The page had already started streaming (status sent) when `requireUser()` redirected, so the redirect happens in the browser.

---

## Details (OK to skip for now)

- **Why the delete got slower (≈4 s, measured):** every check is a DB call, and our fake DB is slow on purpose. The action checks the session (`requireUser`), then the DAL checks it again, then the re-render checks it once more. `React.cache` only removes repeats **while rendering**, not inside a Server Action, so the terminal shows the session lookup twice for the action alone. A real DB answers these in ~1 ms.
- **Cookies are per host, not per port.** `localhost:3000` and `localhost:3005` share cookies. But the session list lives in each server's memory, so a cookie from one server is unknown to the other: you're logged out there.
- **Restart = everyone logged out.** The cookie survives in the browser, but the server's session list is empty after a restart. That's the fake-cookie row in the proxy table (homework #2).
- **Stateless sessions** (the other common design): put `{ userId, expiresAt }` **into** the cookie, encrypted or signed (libraries: `jose`, `iron-session`). No session table is needed, but you can't log out a stolen cookie before it expires. We used **database sessions** because they're easier to picture, and logout really works.
- **`'use cache: private'`:** a cache variant that **can** read cookies and keeps the result in the browser only. The docs use it for the current user, so authenticated pages can be prefetched. `React.cache` is enough for DevNotes.
- **Never redirect `/login` → `/dashboard` in proxy just because a cookie exists.** An expired cookie would bounce the visitor forever: proxy sends them to `/dashboard` (a cookie exists), the page sends them back to `/login` (the session is invalid), proxy sends them to `/dashboard` again…
- **Auth libraries** (Auth.js, Better Auth, Clerk, …) do sign-up, password reset, "Log in with Google" and so on. They all follow the same model as today: a cookie, a session, and checks in your DAL.
- **Likes are still anonymous.** "One like per user" would need visitor accounts, not just author logins.

---

## Cheat sheet

| I want… | Write… | Where |
|---|---|---|
| log someone in | check the password hash → `createSession(userId)` → `redirect()` | a Server Action |
| log out | `deleteSession()` → `redirect('/')` | a Server Action (`<form action={logoutAction}>`) |
| know who's asking | `await getCurrentUser()` (or `null`) | DAL, pages, actions |
| require a login | `await requireUser()` (redirects to `/login`) | DAL, pages, actions |
| allow only the owner | `if (post.authorId !== user.id) return 'forbidden'` | **the DAL**, next to the data |
| a private page | read the user **inside `<Suspense>`** | `page.tsx` |
| send logged-out visitors away early | `request.cookies.has(...)` → `NextResponse.redirect` + `matcher` | `src/proxy.ts` |
| store a password | `hashPassword()` (scrypt), never the text | `src/lib/password.ts` |
| cookie options | `httpOnly`, `secure`, `sameSite: 'lax'`, `expires`, `path: '/'` | `src/lib/session.ts` |
| ❌ cache the current user | never `'use cache'`: use `React.cache` | |
| ❌ read the cookie in the root layout | makes every page per-visitor | |

---

## 📝 Homework

Short ones. **Write your prediction before you check.** For the tools: **DevTools** opens with `Cmd + Option + I` in Chrome.

1. **Look at your cookie.** Log in as Maya at `localhost:3005/login`.
   a. Open DevTools → **Application** tab → **Cookies** → `http://localhost:3005`. Find `devnotes_session`. Write down its **HttpOnly**, **SameSite** and **Expires** values.
   b. Open the **Console** tab, type `document.cookie` and press Enter. Is `devnotes_session` in the output? Why?
2. **Restart (predict, then check).** While logged in, stop your server (`Ctrl + C`) and start it again with `npx next start -p 3005`. Predict before you click:
   a. Is the cookie still in DevTools?
   b. What happens when you open `/dashboard`, and **which layer** (proxy or `requireUser`) sends you to `/login`?
3. **A new private page (small coding task).** Create `src/app/dashboard/settings/page.tsx` that shows "Settings for Maya Chen" (the logged-in user's name). Steps:
   - copy the shape of `app/dashboard/page.tsx`: a static `<h1>` + `<Suspense>` + an async component inside it
   - in that component: `const user = await requireUser();` and render `user.name`

   Then answer: did you have to change `proxy.ts` for `/dashboard/settings`? Why or why not? (Look at the `matcher`.)
   *Bonus:* remove the `<Suspense>` around your component and run `npm run build`. What happens?
4. **Theory.** Rafael's hand-made request for Maya's comment got status `200`. Was the comment deleted? Which line of code stopped it, and why wouldn't hiding the Delete button have been enough?

---

## ✅ Homework review

| # | Your answer | Result |
|---|---|---|
| 1a | HttpOnly ✓, SameSite Lax, Expires 7 days later | ✅ Right |
| 1b | `document.cookie` is `''` because of `httpOnly` | ✅ Right, and the right reason |
| 2a | The cookie stays, but you're sent to `/login`. "Different hashing/session code?" | 🟡 Right result. The reason is simpler, see below |
| 2b | `requireUser` redirects, because proxy only checks that the cookie exists | ✅ Right |
| 3 | Settings page; no proxy change thanks to the matcher; the build fails without Suspense | ✅ Right answers. One fix in the code |
| 4 | The `authorId !== user.id` line stops it | ✅ Right line. Your "what about another cookie" worry is answered below |

### #2a: what the restart actually wipes

You were close ("the restarted program will have different session code"). It's not the hashing. It's **memory**:

| | Before the restart | After the restart |
|---|---|---|
| browser | cookie `devnotes_session=abc123…` | **same cookie**, still there |
| server's session list (in memory) | `[{ id: 'abc123…', userId: 'maya' }]` | **`[]` (empty)**: memory is wiped when a process stops |

The browser shows ticket `abc123…`, and the server has never heard of it. `readSessionUserId()` returns `null`, so `requireUser()` redirects to `/login`. A real database survives restarts, so real users wouldn't be logged out.

### #3: `requireUser()`, not `getCurrentUser()`

Your page used `getCurrentUser()`, which returns `null` for "not logged in" **without redirecting**. A visitor with an expired or made-up cookie gets past proxy (proxy only checks that a cookie exists), so with your version they would see the Settings page with an **empty name** instead of being sent to `/login`. Nothing private leaked here, but on a page with real settings it would matter.

**Rule:** on a private page, use **`requireUser()`**. Use `getCurrentUser()` only where "not logged in" is a normal case, like showing "Log in" vs "Hi Maya".

Also fixed: the title and heading said "Dashboard" (copied), and a copied comment said "no second session lookup" when it's the first. The page now shows "Settings for Maya Chen".

### #4: "What if someone uses another cookie?"

Good instinct to ask. There are three cases:

| The attacker sends… | The server thinks they are… | Result |
|---|---|---|
| **their own** cookie (Rafael) | Rafael | the `authorId !== user.id` line → `forbidden`. **Measured: nothing deleted** |
| a **made-up** cookie | nobody (the id isn't in the session list) | `user` is `null` → `forbidden` |
| **Maya's real** cookie, stolen | **Maya** | ✅ allowed. To the server, whoever holds the ticket **is** Maya |

So the code is secure. The weak point is the third case: **keeping the cookie from being stolen**. That's exactly what the cookie options are for:
- `httpOnly`: a malicious script can't read it (your #1b: `document.cookie` was `''`)
- `secure`: it's never sent over plain http, so nobody can read it off the network
- `sameSite: 'lax'`: other sites can't make your browser use it in a POST
- `expires` + **Log out deletes the session**: a stolen ticket stops working

And the part of the question you skipped: **hiding the button isn't enough**, because the button is only HTML. Rafael's request didn't use any button; he sent the POST himself. Only a check on the server, here in the DAL, can stop that.
