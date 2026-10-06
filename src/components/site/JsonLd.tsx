/** Emits schema.org JSON-LD. `<` is escaped so content can never close the script tag. */
export default function JsonLd({ data }: { data: Record<string, unknown>[] }) {
  if (data.length === 0) return null;
  return (
    <>
      {data.map((item, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(item).replace(/</g, '\\u003c') }} />
      ))}
    </>
  );
}
