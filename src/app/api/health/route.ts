// 📘 Day 12: a HEALTH CHECK. Hosting platforms and uptime monitors call this URL
// every few seconds: 200 = "this server is alive, keep sending visitors".
import { connection } from 'next/server';

export async function GET() {
  // 📘 Without this line, the build made this route ○ (static): the JSON was
  // created ONCE at build time, and every check got the same old answer, even
  // with the server half broken (measured). connection() means "run on every
  // request", which is the whole point of a health check.
  await connection();

  return Response.json(
    { status: 'ok', uptimeSeconds: Math.round(process.uptime()) },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
