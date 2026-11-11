// 📘 Day 6: the design of DevNotes' link-preview pictures (1200 × 630 px,
// the size Facebook, LinkedIn, Slack and X all expect).
// app/opengraph-image.tsx and app/posts/[slug]/opengraph-image.tsx both use it.
//
// This JSX is NOT shown in a browser. ImageResponse turns it into a PNG file on
// the server. That means a few rules differ from normal React:
//   - inline `style={{ }}` only: no Tailwind classes, no CSS files
//   - only flexbox layouts (no grid), and every <div> with more than one child
//     needs display: 'flex'
//   - the font is Geist, which Next.js ships for ImageResponse (same as the site)
export function OgCard({ title, footer }: { title: string; footer: string }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 80,
        background: '#0a0a0a',
        color: '#ededed',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 36, color: '#60a5fa' }}>
        <div style={{ width: 20, height: 20, borderRadius: 10, background: '#60a5fa' }} />
        DevNotes
      </div>
      <div style={{ display: 'flex', fontSize: 72, lineHeight: 1.15, letterSpacing: -2 }}>{title}</div>
      <div style={{ display: 'flex', fontSize: 30, color: '#a3a3a3' }}>{footer}</div>
    </div>
  );
}
