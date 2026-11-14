// 📘 Day 12: the LIST of environment variables DevNotes needs, and their rules.
// Kept separate from env.ts (which reads process.env) so tests can check the
// rules with made-up values (src/lib/env-schema.test.ts).
import { z } from 'zod';

export const envSchema = z.object({
  // The public address, used in canonical URLs, Open Graph, the sitemap and RSS.
  SITE_URL: z.url().default('http://localhost:3005'),
  // The webhook password shared with the CMS (Day 8). Short secrets are easy to guess.
  CMS_WEBHOOK_SECRET: z.string().min(16, 'must be at least 16 characters'),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const problems = result.error.issues.map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`).join('\n');
    throw new Error(
      `Invalid environment variables:\n${problems}\nCopy .env.example to .env.local and fill it in.`,
    );
  }
  return result.data;
}
