// 📘 Day 6: JSON-LD = a block of JSON hidden in the page that describes the
// content to Google in a fixed vocabulary (schema.org): "this is a BlogPosting,
// its headline is…, its author is a Person named…, it was published on…".
// Visitors never see it. Google can use it for richer search results.
//
// It's a plain <script> tag (not next/script): it's data, not code to run.
//
// ⚠️ Why the .replace(): the data comes from the database. If a post title
// contained "</script>", the browser would end the script tag there, and the
// rest of the title would be treated as HTML. That's an XSS hole. Replacing
// every "<" with its escaped form < makes that impossible, and JSON
// readers still see a normal "<".
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}
