// 📘 Day 1: A folder (`about`) + a page.tsx = the "/about" route.
// No data, no interactivity, so this is pure static HTML at build time.
export default function AboutPage() {
  return (
    <article className="max-w-2xl space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">About DevNotes</h1>
      <p className="text-foreground/70">
        DevNotes is a practice project for mastering the Next.js App Router with
        TypeScript. Each lesson adds a real feature, from file-based routing to
        caching, SEO, Server Actions and authentication.
      </p>
      <p className="text-foreground/70">
        The lesson notes live in the <code className="font-mono">lessons/</code>{" "}
        folder of the repository.
      </p>
    </article>
  );
}
