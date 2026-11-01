type StructuredDataProps = { data: Record<string, unknown> };

/** JSON-LD must not allow user-controlled text to close its script element. */
export default function StructuredData({ data }: StructuredDataProps) {
  const json = JSON.stringify(data).replace(/[<>&]/g, (character) => {
    const escapes: Record<string, string> = {
      "<": "\\u003c",
      ">": "\\u003e",
      "&": "\\u0026",
    };
    return escapes[character];
  });

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
