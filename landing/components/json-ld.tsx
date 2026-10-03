// JSON-LD is data, not executable code, so a native <script> is used rather
// than next/script. "<" is escaped so CMS text can't close the tag early.
export default function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
